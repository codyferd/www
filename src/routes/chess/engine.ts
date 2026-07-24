/**
 * Isolated AI Engine Calculations Framework
 */
export async function fetchAiMove(
	fen: string
): Promise<{ from: string; to: string; promotion?: string } | null> {
	try {
		const targetUrl = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=12`;
		const response = await fetch(targetUrl);
		const data = await response.json();

		if (data.success && data.bestmove) {
			const parts: string[] = data.bestmove.split(' ');
			const moveStr: string = parts[1]; // Extract notation token, e.g., "e2e4"

			return {
				from: moveStr.substring(0, 2),
				to: moveStr.substring(2, 4),
				promotion: moveStr.substring(4, 5) || undefined
			};
		}
		return null;
	} catch (e) {
		console.error('Mesh AI Processing Failure:', e);
		return null;
	}
}
