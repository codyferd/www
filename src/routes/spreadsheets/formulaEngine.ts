import type { CellStore, SheetExportPayload } from './types';

/**
 * Gathers numeric cell values within a coordinate range (e.g., A1:C5).
 */
export function gatherRangeValues(
	startCol: string,
	startRow: number,
	endCol: string,
	endRow: number,
	cells: CellStore
): number[] {
	const values: number[] = [];
	const minCol = Math.min(startCol.charCodeAt(0), endCol.charCodeAt(0));
	const maxCol = Math.max(startCol.charCodeAt(0), endCol.charCodeAt(0));
	const minRow = Math.min(startRow, endRow);
	const maxRow = Math.max(startRow, endRow);

	for (let c = minCol; c <= maxCol; c++) {
		for (let r = minRow; r <= maxRow; r++) {
			const key = String.fromCharCode(c) + r;
			const rawVal = evaluateCellOutput(key, cells);
			const num = parseFloat(rawVal);
			if (!isNaN(num)) {
				values.push(num);
			}
		}
	}
	return values;
}

/**
 * Parses macro math expressions like SUM(A1:A5), AVG(B2:C10), or cell references like =A1.
 */
export function executeFormulaMath(expression: string, cells: CellStore): string | number {
	const normalized = expression.toUpperCase().trim();

	// Match formulas like SUM(A1:A5) or AVG(B2:C10)
	const operationMatch = normalized.match(
		/^(SUM|AVG)\((([A-Z])([1-9][0-9]?)):(([A-Z])([1-9][0-9]?))\)$/
	);

	if (operationMatch) {
		const command = operationMatch[1];
		const startCol = operationMatch[3];
		const startRow = parseInt(operationMatch[4], 10);
		const endCol = operationMatch[6];
		const endRow = parseInt(operationMatch[7], 10);

		const collectedValues = gatherRangeValues(startCol, startRow, endCol, endRow, cells);

		if (command === 'SUM') {
			return collectedValues.reduce((sum, curr) => sum + curr, 0);
		}
		if (command === 'AVG') {
			if (collectedValues.length === 0) return 0;
			const sum = collectedValues.reduce((s, curr) => s + curr, 0);
			return (sum / collectedValues.length).toFixed(2);
		}
	}

	// Fallback for direct cell reference (e.g., =A1)
	const cellRefMatch = normalized.match(/^([A-Z])([1-9][0-9]?)$/);
	if (cellRefMatch) {
		const targetKey = cellRefMatch[0];
		const evaluated = evaluateCellOutput(targetKey, cells);
		const targetNum = parseFloat(evaluated);
		return isNaN(targetNum) ? evaluated : targetNum;
	}

	return '#INVALID_FORMULA';
}

/**
 * Evaluates the output display value for a cell coordinate.
 */
export function evaluateCellOutput(key: string, cells: CellStore): string {
	const cell = cells[key];
	if (!cell || !cell.raw) return '';

	const formulaString = cell.raw.trim();
	if (formulaString.startsWith('=')) {
		try {
			return String(executeFormulaMath(formulaString.substring(1), cells));
		} catch {
			return '#EXPR_ERR';
		}
	}

	return formulaString;
}

/**
 * Serializes and triggers a download of the active sheet configuration as a .json file.
 */
export function exportSheetToJson(data: SheetExportPayload) {
	const jsonString = JSON.stringify(data, null, 2);
	const blob = new Blob([jsonString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${data.settings.title.toLowerCase().replace(/\s+/g, '-')}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Parses imported JSON sheet configuration payload.
 */
export function parseSheetJson(content: string): SheetExportPayload | null {
	try {
		return JSON.parse(content) as SheetExportPayload;
	} catch (e) {
		console.error('Failed to parse spreadsheet file:', e);
		return null;
	}
}
