import { Peer, type DataConnection } from 'peerjs';

export interface MeshMove {
	from: string;
	to: string;
}

interface MeshCallbacks {
	onStatus: (status: string) => void;
	onStarted: () => void;
	onRemoteMove: (move: MeshMove) => void;
	onKick: (message: string) => void;
}

interface MeshMovePacket {
	type: 'MOVE';
	move: MeshMove;
}

interface MeshSystemPacket {
	type: 'SYSTEM_REJECT';
	reason: 'ROOM_FULL';
}

type MeshNetworkPacket = MeshMovePacket | MeshSystemPacket;

class MeshSystem {
	private peer: Peer | null = null;
	private conn: DataConnection | null = null;

	public state = $state({
		isMesh: false,
		myColor: 'w' as 'w' | 'b'
	});

	// Host a game and wait for someone to join
	initHost(roomId: string, callbacks: MeshCallbacks) {
		this.cleanup();
		callbacks.onStatus('Registering Room...');

		this.peer = new Peer(roomId);
		this.state.myColor = 'w';

		this.peer.on('open', () => {
			callbacks.onStatus('Waiting for Opponent...');
		});

		this.peer.on('connection', (incomingConn) => {
			// Gatekeeper: If we already have a live player connected, reject any subsequent peers
			if (this.conn && this.state.isMesh) {
				incomingConn.on('open', () => {
					const rejectPacket: MeshSystemPacket = { type: 'SYSTEM_REJECT', reason: 'ROOM_FULL' };
					incomingConn.send(rejectPacket);
					// Give the packet a split second to flush over the wire before closing
					setTimeout(() => incomingConn.close(), 100);
				});
				return;
			}

			// Accept the first connection
			this.conn = incomingConn;
			this.setupConnectionListeners(callbacks);
		});

		this.peer.on('error', (err) => {
			if (err.type === 'unavailable-id') {
				callbacks.onKick('Room name taken. Try another room.');
			} else {
				callbacks.onKick(`Connection error: ${err.type}`);
			}
		});
	}

	// Join a game hosted by another player
	initJoin(roomId: string, callbacks: MeshCallbacks) {
		this.cleanup();
		callbacks.onStatus('Locating Host...');

		this.peer = new Peer();
		this.state.myColor = 'b';

		this.peer.on('open', () => {
			this.conn = this.peer!.connect(roomId);
			this.setupConnectionListeners(callbacks);
		});

		this.peer.on('error', () => {
			callbacks.onKick('Could not find host or connection failed.');
		});
	}

	private setupConnectionListeners(callbacks: MeshCallbacks) {
		if (!this.conn) return;

		this.conn.on('open', () => {
			this.state.isMesh = true;
			callbacks.onStatus('Connected');
			callbacks.onStarted();
		});

		this.conn.on('data', (rawPackets) => {
			const data = rawPackets as MeshNetworkPacket;
			if (!data) return;

			// Handle regular moves
			if (data.type === 'MOVE') {
				callbacks.onRemoteMove(data.move);
			}

			// Handle systemic rejection rules sent by the host
			if (data.type === 'SYSTEM_REJECT' && data.reason === 'ROOM_FULL') {
				callbacks.onKick('This game room is full.');
				this.cleanup();
			}
		});

		this.conn.on('close', () => {
			// Only trigger kick message if we were actually active in a game
			if (this.state.isMesh) {
				callbacks.onKick('Opponent disconnected.');
			}
			this.cleanup();
		});
	}

	// Transmit your moves across the WebRTC tunnel
	sendMove(move: MeshMove) {
		if (this.conn && this.conn.open) {
			const packet: MeshMovePacket = { type: 'MOVE', move };
			this.conn.send(packet);
		}
	}

	// Tear down connections cleanly when game exits
	cleanup() {
		this.state.isMesh = false;
		if (this.conn) {
			this.conn.close();
			this.conn = null;
		}
		if (this.peer) {
			this.peer.destroy();
			this.peer = null;
		}
	}
}

export const Mesh = new MeshSystem();
