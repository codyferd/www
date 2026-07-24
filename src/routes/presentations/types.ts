export type ElementType = 'text' | 'image' | 'shape';

export interface SlideElement {
	id: number;
	type: ElementType;
	content?: string;
	top: number;
	left: number;
	width?: number;
	height?: number;
	fontSize?: number;
	color?: string;
	radius?: number;
	zIndex: number;
}

export interface Slide {
	id: number;
	background: string;
	elements: SlideElement[];
}

export interface DragOffset {
	x: number;
	y: number;
}
