// src/routes/documents/types.ts
export interface DocElement {
	id: number;
	type: 'heading' | 'paragraph' | 'blockquote' | 'image';
	content?: string;
	contentUrl?: string;
	fontSize?: number;
	color?: string;
	align?: 'left' | 'center' | 'right' | 'justify';
	widthPercent?: number;
	radius?: number;
}

export interface DocSettings {
	background: string;
	title: string;
}
