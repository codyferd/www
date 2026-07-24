export interface ChartSettings {
	title: string;
	type: 'time' | 'pie' | 'bar' | 'line' | 'polar' | 'doughnut' | 'area' | 'radar';
	timeLabels: string[];
	showValues: boolean;
	showGrid: boolean;
	smoothLines: boolean;
	theme: 'pitch-black' | 'cyber-neon' | 'emerald-pulse' | 'deep-ocean';
}

export interface ChartDataNode {
	id: number;
	label: string;
	value: number;
	history: number[];
	color: string;
	visible: boolean;
}

export interface ChartTheme {
	bg: string;
	grid: string;
	text: string;
	textSecondary: string;
	accent: string;
}

export const THEMES: Record<ChartSettings['theme'], ChartTheme> = {
	'pitch-black': {
		bg: '#000000',
		grid: '#18181b',
		text: '#f4f4f5',
		textSecondary: '#52525b',
		accent: '#10b981'
	},
	'cyber-neon': {
		bg: '#05050a',
		grid: '#1f1035',
		text: '#fdf4ff',
		textSecondary: '#701a75',
		accent: '#d946ef'
	},
	'emerald-pulse': {
		bg: '#02120b',
		grid: '#062d19',
		text: '#ecfdf5',
		textSecondary: '#047857',
		accent: '#34d399'
	},
	'deep-ocean': {
		bg: '#020617',
		grid: '#1e293b',
		text: '#f1f5f9',
		textSecondary: '#475569',
		accent: '#38bdf8'
	}
};

export const DEFAULT_CHART_SETTINGS = (): ChartSettings => ({
	title: 'Avero Enterprise Cross-Metric Timeline Vectors',
	type: 'time',
	timeLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
	showValues: true,
	showGrid: true,
	smoothLines: true,
	theme: 'pitch-black'
});

export const DEFAULT_NODES = (): ChartDataNode[] => [
	{
		id: 101,
		label: 'Cloud Compute Nodes',
		value: 420,
		history: [110, 240, 310, 420],
		color: '#10b981',
		visible: true
	},
	{
		id: 102,
		label: 'Security Firewall Audits',
		value: 280,
		history: [390, 320, 290, 280],
		color: '#38bdf8',
		visible: true
	},
	{
		id: 103,
		label: 'Data Processing Pipelines',
		value: 190,
		history: [150, 220, 180, 190],
		color: '#f59e0b',
		visible: true
	}
];

// Completely Native JSON Serialization Helpers
export const AveroChartExporter = {
	exportToJSON: (settings: ChartSettings, nodes: ChartDataNode[]) => {
		const payload = {
			app: 'Avero Charts 2.0',
			timestamp: Date.now(),
			settings,
			nodes
		};
		const dataString = JSON.stringify(payload, null, 2);
		const blob = new Blob([dataString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = `avero-chart-${Date.now()}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	},

	importFromJSON: (
		fileText: string
	): { settings: ChartSettings; nodes: ChartDataNode[] } | null => {
		try {
			const parsed = JSON.parse(fileText);
			if (parsed && parsed.settings && Array.isArray(parsed.nodes)) {
				return {
					settings: parsed.settings,
					nodes: parsed.nodes
				};
			}
			throw new Error('Invalid structure properties.');
		} catch (e) {
			console.error('JSON parse failure: ', e);
			alert(
				'Failed to parse visualizer configuration safely. Ensure the file is a valid JSON schema exported by Avero.'
			);
			return null;
		}
	}
};
