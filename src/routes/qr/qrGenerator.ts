import QRCode from 'qrcode';
import type { CorrectionLevel } from './types';

export async function generateQRDataUrl(
	text: string,
	size: number,
	level: CorrectionLevel
): Promise<string> {
	if (!text.trim()) return '';

	try {
		return await QRCode.toDataURL(text, {
			width: size,
			margin: 1,
			errorCorrectionLevel: level,
			color: {
				dark: '#000000',
				light: '#ffffff'
			}
		});
	} catch (err) {
		console.error('Failed to generate QR code:', err);
		return '';
	}
}

export function downloadQRCode(dataUrl: string, filename = 'avero-qr.png'): void {
	if (!dataUrl) return;

	const link = document.createElement('a');
	link.download = filename;
	link.href = dataUrl;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
