import { writable, get } from 'svelte/store';
import type { Peer, DataConnection } from 'peerjs';
import {
	type DataPacket,
	type ActiveConnection,
	type TransferHistoryItem,
	formatBytes
} from './types';

export const roomCodeInput = writable<string>('');
export const localPeerId = writable<string>('');
export const textBuffer = writable<string>('');
export const isNodeActive = writable<boolean>(false);
export const activeConnections = writable<ActiveConnection[]>([]);
export const transferHistory = writable<TransferHistoryItem[]>([]);

let peerInstance: Peer | null = null;
let currentIdIndex = 0;
let roomBaseName = '';
const roomPrefix = 'AVERO_SEND_RM_';
const fileChunksMap = new Map<
	string,
	{
		chunks: ArrayBuffer[];
		total: number;
		received: number;
		name: string;
		mime: string;
		meta: string;
	}
>();

const setupConnectionListeners = (conn: DataConnection) => {
	const currentConnections = get(activeConnections);
	if (currentConnections.some((c) => c.peer === conn.peer)) return;

	conn.on('open', () => {
		activeConnections.update((conns) => {
			if (conns.some((c) => c.peer === conn.peer)) return conns;
			return [...conns, { peer: conn.peer, conn }];
		});

		conn.on('data', (unknownData: unknown) => {
			const dataPackage = unknownData as DataPacket & { chunkIndex?: number; totalChunks?: number };
			const room = get(roomCodeInput).trim().toUpperCase();
			if (dataPackage.targetRoomId !== room) return;

			if (dataPackage.totalChunks && dataPackage.totalChunks > 1) {
				handleChunkedData(dataPackage, conn.peer);
			} else {
				processIncomingData(dataPackage, conn.peer);
			}
		});

		const removePeer = () => {
			activeConnections.update((conns) => conns.filter((c) => c.peer !== conn.peer));
		};

		conn.on('close', removePeer);
		conn.on('error', removePeer);
	});
};

const handleChunkedData = (
	dataPackage: DataPacket & { chunkIndex?: number; totalChunks?: number },
	peer: string
) => {
	const { id, chunkIndex, totalChunks, payload, name, mime, meta } = dataPackage;
	if (chunkIndex === undefined || !totalChunks) return;

	if (!fileChunksMap.has(id)) {
		fileChunksMap.set(id, {
			chunks: new Array(totalChunks),
			total: totalChunks,
			received: 0,
			name,
			mime: mime || 'application/octet-stream',
			meta
		});
	}

	const tracker = fileChunksMap.get(id)!;
	tracker.chunks[chunkIndex] = payload as ArrayBuffer;
	tracker.received++;

	if (tracker.received === tracker.total) {
		const fullBlob = new Blob(tracker.chunks, { type: tracker.mime });
		fullBlob.arrayBuffer().then((buffer) => {
			processIncomingData(
				{
					id,
					type: 'file',
					name: tracker.name,
					payload: buffer,
					mime: tracker.mime,
					meta: tracker.meta
				},
				peer
			);
			fileChunksMap.delete(id);
		});
	}
};

const tryConnect = async () => {
	const PeerModule = await import('peerjs');
	const PeerConstructor = PeerModule.default || PeerModule.Peer;

	const attemptId = `${roomBaseName}_${currentIdIndex}`;
	peerInstance = new PeerConstructor(attemptId, {
		debug: 0
	});

	peerInstance.on('open', (id: string) => {
		isNodeActive.set(true);
		localPeerId.set(id);

		peerInstance?.on('connection', (c: DataConnection) => setupConnectionListeners(c));

		// Staggered peer discovery to prevent signaling race conditions on mobile
		setTimeout(() => {
			const maxSearch = Math.max(currentIdIndex + 5, 12);
			for (let i = 0; i < maxSearch; i++) {
				if (i === currentIdIndex) continue;
				const targetId = `${roomBaseName}_${i}`;
				const outboundLink = peerInstance?.connect(targetId, { reliable: true });
				if (outboundLink) setupConnectionListeners(outboundLink);
			}
		}, 300);
	});

	peerInstance.on('error', (err: { type: string; message: string }) => {
		if (err.type === 'unavailable-id') {
			peerInstance?.destroy();
			currentIdIndex++;
			tryConnect();
		} else if (err.type !== 'peer-unavailable') {
			console.error(`Network Protocol Exception: ${err.type}`);
			disconnectPipeline();
		}
	});
};

export const initMesh = (): void => {
	const rawCode = get(roomCodeInput);
	const cleanSlug = rawCode.trim().toUpperCase().replace(/[\s-]/g, '_');
	if (!cleanSlug) return;

	roomBaseName = roomPrefix + cleanSlug;
	currentIdIndex = 0;
	tryConnect();
};

export const disconnectPipeline = (): void => {
	if (peerInstance) {
		peerInstance.destroy();
		peerInstance = null;
	}
	activeConnections.set([]);
	isNodeActive.set(false);
	localPeerId.set('');
	currentIdIndex = 0;
	fileChunksMap.clear();
};

export const relayToAllMeshNodes = (payloadFrame: DataPacket): void => {
	const conns = get(activeConnections);
	const room = get(roomCodeInput).trim().toUpperCase();
	const myId = get(localPeerId);

	conns.forEach(({ conn }) => {
		if (conn.open) {
			conn.send({
				...payloadFrame,
				targetRoomId: room,
				forwardedFrom: myId
			});
		}
	});
};

export const dispatchTextBuffer = (): void => {
	const rawMessage = get(textBuffer).trim();
	if (!rawMessage) return;

	const packetFrame: DataPacket = {
		id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 5),
		type: 'text',
		name: rawMessage.length > 30 ? rawMessage.substring(0, 30) + '...' : rawMessage,
		payload: rawMessage,
		meta: `${rawMessage.length} Chars`
	};

	relayToAllMeshNodes(packetFrame);

	transferHistory.update((history) => [
		{
			id: packetFrame.id,
			type: 'text',
			direction: 'out',
			peer: 'Room Mesh',
			name: packetFrame.name,
			payload: packetFrame.payload as string,
			meta: packetFrame.meta
		},
		...history
	]);

	textBuffer.set('');
};

export const pipelineFileArray = async (files: FileList | File[]): Promise<void> => {
	if (!files || files.length === 0) return;

	const CHUNK_SIZE = 64 * 1024; // 64KB safe chunking for mobile WebRTC buffers

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const cleanFileName = file.webkitRelativePath || file.name;
		const fileId =
			'file_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 5);

		const fileReader = new FileReader();
		fileReader.onload = (event: ProgressEvent<FileReader>) => {
			const bufferData = event.target?.result as ArrayBuffer;
			if (!bufferData) return;

			const totalChunks = Math.ceil(bufferData.byteLength / CHUNK_SIZE);

			if (totalChunks <= 1) {
				const packetFrame: DataPacket = {
					id: fileId,
					type: 'file',
					name: cleanFileName,
					payload: bufferData,
					mime: file.type || 'application/octet-stream',
					meta: formatBytes(file.size)
				};
				relayToAllMeshNodes(packetFrame);
			} else {
				for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
					const start = chunkIdx * CHUNK_SIZE;
					const end = Math.min(start + CHUNK_SIZE, bufferData.byteLength);
					const chunkPayload = bufferData.slice(start, end);

					relayToAllMeshNodes({
						id: fileId,
						type: 'file',
						name: cleanFileName,
						payload: chunkPayload,
						mime: file.type || 'application/octet-stream',
						meta: formatBytes(file.size),
						chunkIndex: chunkIdx,
						totalChunks
					} as DataPacket);
				}
			}

			transferHistory.update((history) => [
				{
					id: fileId,
					type: 'file',
					direction: 'out',
					peer: 'Room Mesh',
					name: cleanFileName,
					meta: formatBytes(file.size),
					url: URL.createObjectURL(new Blob([bufferData], { type: file.type }))
				},
				...history
			]);
		};
		fileReader.readAsArrayBuffer(file);
	}
};

export const processIncomingData = (frame: DataPacket, incomingSourcePeer: string): void => {
	const history = get(transferHistory);
	if (history.some((h) => h.id === frame.id)) return;

	if (frame.type === 'text') {
		transferHistory.update((h) => [
			{
				id: frame.id,
				type: 'text',
				direction: 'in',
				peer: incomingSourcePeer,
				name: frame.name,
				payload: frame.payload as string,
				meta: frame.meta
			},
			...h
		]);
	} else if (frame.type === 'file') {
		const generatedUrl = URL.createObjectURL(
			new Blob([frame.payload as ArrayBuffer], { type: frame.mime })
		);
		transferHistory.update((h) => [
			{
				id: frame.id,
				type: 'file',
				direction: 'in',
				peer: incomingSourcePeer,
				name: frame.name,
				meta: frame.meta,
				url: generatedUrl
			},
			...h
		]);
	}
};
