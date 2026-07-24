// src/routes/documents/documentState.svelte.ts
import type { DocElement, DocSettings } from './types';

export class DocumentState {
	viewMode = $state(false);
	docSettings = $state<DocSettings>({
		background: '#09090b',
		title: 'Avero Document Node Data'
	});
	elements = $state<DocElement[]>([]);
	selectedElement = $state<DocElement | null>(null);

	readingMetrics = $derived.by(() => {
		let words = 0;
		let chars = 0;

		this.elements.forEach((el) => {
			if (el.type !== 'image' && el.content) {
				const cleanedText = el.content.trim();
				if (cleanedText.length > 0) {
					words += cleanedText.split(/\s+/).filter((w) => w.length > 0).length;
					chars += cleanedText.length;
				}
			}
		});

		return {
			words,
			chars,
			time: words === 0 ? 0 : Math.ceil(words / 200)
		};
	});

	addElement(type: DocElement['type']) {
		const id = Date.now();
		const newElement: DocElement = { id, type, align: 'left' };

		if (type === 'heading') {
			newElement.content = 'New Content Section Header';
			newElement.fontSize = 24;
			newElement.color = '#ffffff';
		} else if (type === 'paragraph') {
			newElement.content = 'Click to add block text string information into this node.';
			newElement.fontSize = 15;
			newElement.color = '#a1a1aa';
		} else if (type === 'blockquote') {
			newElement.content = 'High emphasis analytical quote summary point statement.';
			newElement.fontSize = 14;
			newElement.color = '#d1d1d6';
		} else if (type === 'image') {
			newElement.contentUrl = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800';
			newElement.widthPercent = 80;
			newElement.radius = 8;
		}

		this.elements.push(newElement);
		this.selectedElement = newElement;
	}

	deleteElement(id: number) {
		this.elements = this.elements.filter((el) => el.id !== id);
		if (this.selectedElement?.id === id) {
			this.selectedElement = null;
		}
	}

	duplicateElement(element: DocElement) {
		const clonedNode = JSON.parse(JSON.stringify(element));
		clonedNode.id = Date.now();

		const idx = this.elements.findIndex((el) => el.id === element.id);
		if (idx !== -1) {
			this.elements.splice(idx + 1, 0, clonedNode);
			this.selectedElement = clonedNode;
		}
	}

	moveElement(id: number, direction: 'up' | 'down') {
		const currentIdx = this.elements.findIndex((el) => el.id === id);
		if (currentIdx === -1) return;

		const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
		if (targetIdx < 0 || targetIdx >= this.elements.length) return;

		const elementToMove = this.elements[currentIdx];
		this.elements.splice(currentIdx, 1);
		this.elements.splice(targetIdx, 0, elementToMove);
	}

	applyThemePreset(themeKey: string) {
		const palettes: Record<string, { bg: string; fontColor: string; paraColor: string }> = {
			pitch: { bg: '#000000', fontColor: '#ffffff', paraColor: '#a1a1aa' },
			cyber: { bg: '#0c0a09', fontColor: '#f59e0b', paraColor: '#d6d3d1' },
			ocean: { bg: '#020617', fontColor: '#38bdf8', paraColor: '#94a3b8' },
			nordic: { bg: '#0f172a', fontColor: '#e2e8f0', paraColor: '#cbd5e1' }
		};

		if (palettes[themeKey]) {
			const currentPalette = palettes[themeKey];
			this.docSettings.background = currentPalette.bg;

			this.elements.forEach((el) => {
				if (el.type === 'heading') el.color = currentPalette.fontColor;
				if (el.type === 'paragraph') el.color = currentPalette.paraColor;
			});
		}
	}
}
