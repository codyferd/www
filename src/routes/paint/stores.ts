import { writable, derived, get } from 'svelte/store';

export interface Layer {
	id: string;
	name: string;
	visible: boolean;
	dataUrl: string;
}

export type ToolId =
	'brush' | 'line' | 'rect' | 'ellipse' | 'bucket' | 'pipette' | 'eraser' | 'text';

export const tools = [
	{ id: 'brush', name: 'Brush', icon: '🖌️' },
	{ id: 'line', name: 'Line', icon: '📏' },
	{ id: 'rect', name: 'Rectangle', icon: '⬜' },
	{ id: 'ellipse', name: 'Ellipse', icon: '⭕' },
	{ id: 'bucket', name: 'Bucket', icon: '🪣' },
	{ id: 'pipette', name: 'Picker', icon: '🧪' },
	{ id: 'eraser', name: 'Eraser', icon: '🧽' },
	{ id: 'text', name: 'Text', icon: '🔤' }
];

export const currentTool = writable<ToolId>('brush');
export const brushColor = writable<string>('#9999FF');
export const brushSize = writable<number>(8);
export const brushOpacity = writable<number>(100);
export const textContent = writable<string>('Avero');

export const canvasSize = writable({ width: 800, height: 600 });
export const layers = writable<Layer[]>([]);
export const activeLayerId = writable<string | null>(null);

export const zoomScale = writable<number>(1);
export const panOffset = writable({ x: 0, y: 0 });

// History management
export const historyStack = writable<string[]>([]);
export const redoStack = writable<string[]>([]);

export const canUndo = derived(historyStack, ($h) => $h.length > 0);
export const canRedo = derived(redoStack, ($r) => $r.length > 0);

export function pushHistory(snapshot: Layer[]) {
	historyStack.update((h) => {
		const updated = [...h, JSON.stringify(snapshot)];
		return updated.length > 20 ? updated.slice(1) : updated;
	});
	redoStack.set([]);
}

export function createLayer(name?: string): Layer {
	const currentLayers = get(layers);
	return {
		id: 'layer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
		name: name || `Layer ${currentLayers.length + 1}`,
		visible: true,
		dataUrl: ''
	};
}

export function exportProjectJSON() {
	const currentLayers = get(layers);
	const size = get(canvasSize);
	const data = {
		version: '1.0',
		app: 'Avero Paint',
		timestamp: Date.now(),
		canvasSize: size,
		layers: currentLayers
	};
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `avero-paint-${Date.now()}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export function importProjectJSON(file: File): Promise<void> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target?.result as string);
				if (data.layers && Array.isArray(data.layers)) {
					if (data.canvasSize) canvasSize.set(data.canvasSize);
					layers.set(data.layers);
					if (data.layers.length > 0) {
						activeLayerId.set(data.layers[data.layers.length - 1].id);
					}
					historyStack.set([]);
					redoStack.set([]);
					resolve();
				} else {
					reject(new Error('Invalid project structure'));
				}
			} catch (err) {
				reject(err);
			}
		};
		reader.readAsText(file);
	});
}
