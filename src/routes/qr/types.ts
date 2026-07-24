export type CorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QROptions {
	text: string;
	size: number;
	level: CorrectionLevel;
}
