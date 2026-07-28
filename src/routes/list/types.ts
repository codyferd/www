export interface ChecklistItem {
	id: string;
	text: string;
	completed: boolean;
}

export interface Note {
	id: string;
	title: string;
	type: 'checklist' | 'note';
	content: string;
	items: ChecklistItem[];
	pinned: boolean;
	archived: boolean;
	color?: string;
	createdAt: number;
	updatedAt: number;
}

export interface AveroListState {
	version: string;
	notes: Note[];
}
