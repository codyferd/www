import type { Slide } from './types';

export function exportPresentation(slides: Slide[]): void {
	const dataString = JSON.stringify(slides, null, 2);

	const blob = new Blob([dataString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = `avero-deck-${Date.now()}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function parsePresentationImport(fileText: string): Slide[] | null {
	try {
		const parsed = JSON.parse(fileText);
		if (Array.isArray(parsed)) {
			return parsed as Slide[];
		}
		return null;
	} catch (e) {
		console.error('Failed to parse presentation JSON file:', e);
		alert('Invalid presentation JSON file format.');
		return null;
	}
}
