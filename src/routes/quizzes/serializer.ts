import type { QuizWorkspaceData } from './types';

export function exportToJsFile(quizWorkspaceData: QuizWorkspaceData): void {
	const structuralDataString = JSON.stringify(quizWorkspaceData, null, 2);
	const fileContentBlock = `const AVERO_QUIZ = ${structuralDataString};`;

	const blob = new Blob([fileContentBlock], { type: 'application/javascript' });
	const downloadUrlPointer = URL.createObjectURL(blob);

	const anchorNode = document.createElement('a');
	anchorNode.href = downloadUrlPointer;
	anchorNode.download = `avero-quiz-${Date.now()}.js`;
	document.body.appendChild(anchorNode);
	anchorNode.click();
	document.body.removeChild(anchorNode);
	URL.revokeObjectURL(downloadUrlPointer);
}

export function importFromJsText(rawFileTextString: string): QuizWorkspaceData | null {
	try {
		const startAssignmentIdx = rawFileTextString.indexOf('const AVERO_QUIZ =');
		if (startAssignmentIdx === -1) {
			throw new Error('Invalid Format Structure: Target tokens missing.');
		}

		const extractionZone = rawFileTextString.substring(startAssignmentIdx);
		let jsonString = extractionZone.replace(/const\s+AVERO_QUIZ\s*=\s*/, '').trim();

		if (jsonString.endsWith(';')) {
			jsonString = jsonString.slice(0, -1).trim();
		}

		return JSON.parse(jsonString) as QuizWorkspaceData;
	} catch (e) {
		console.error('Failed parsing quiz data configuration structure:', e);
		alert('Failed parsing quiz data configuration structure safely. MALFORMED_FILE.');
		return null;
	}
}
