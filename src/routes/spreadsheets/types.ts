export interface CellData {
	raw: string;
	bold?: boolean;
	color?: string;
	fontSize?: number;
}

export interface CellStore {
	[key: string]: CellData;
}

export interface SheetSettings {
	title: string;
	columnWidth: number;
}

export interface SheetExportPayload {
	settings: SheetSettings;
	dimensions: {
		rows: number;
		colsCount: number;
	};
	cells: CellStore;
}
