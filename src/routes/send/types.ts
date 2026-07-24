import type { DataConnection } from 'peerjs';

export interface DataPacket {
	id: string;
	type: 'text' | 'file';
	name: string;
	payload: string | ArrayBuffer;
	mime?: string;
	meta: string;
	targetRoomId?: string;
	forwardedFrom?: string;
	chunkIndex?: number;
	totalChunks?: number;
}

export interface ActiveConnection {
	peer: string;
	conn: DataConnection;
}

export interface TransferHistoryItem {
	id: string;
	type: 'text' | 'file';
	direction: 'in' | 'out';
	peer: string;
	name: string;
	payload?: string;
	meta: string;
	url?: string;
}

export const formatBytes = (bytes: number): string => {
	if (!bytes) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
	try {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}

		// Mobile legacy copy fallback
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.opacity = '0';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		const successful = document.execCommand('copy');
		document.body.removeChild(textArea);
		return successful;
	} catch {
		return false;
	}
};
