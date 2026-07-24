export const DEFAULTS = {
	gapSize: 160,
	enemyIntensity: 0,
	extremity: 40,
	speedStep: 0,
	baseSpeed: 500,
	birdSize: 32,
	pipeWidth: 60,
	gravity: 0,
	colors: { bird: '#f1c40f', pipe: '#2ecc71', enemy: '#ff4444', bg: '#000000' }
};

export const THEMES: Record<string, Record<string, string>> = {
	classic: { bird: '#f1c40f', pipe: '#2ecc71', enemy: '#ff4444', bg: '#000000' },
	neon: { bird: '#00ffff', pipe: '#ff00ff', enemy: '#ffff00', bg: '#1a0033' },
	dark: { bird: '#ffffff', pipe: '#444444', enemy: '#ff0000', bg: '#000000' },
	synth: { bird: '#ff0080', pipe: '#00ffcc', enemy: '#ffffff', bg: '#110022' },
	cyberpunk: { bird: '#fcee0a', pipe: '#00f0ff', enemy: '#ff0055', bg: '#03020d' },
	retroGamer: { bird: '#00ff00', pipe: '#888888', enemy: '#ffaa00', bg: '#111122' },
	pastel: { bird: '#ffb7b2', pipe: '#b5e2fa', enemy: '#ffdac1', bg: '#f1f2f6' },
	mono: { bird: '#ffffff', pipe: '#aaaaaa', enemy: '#555555', bg: '#222222' },
	inferno: { bird: '#ffcc00', pipe: '#ff6600', enemy: '#330000', bg: '#1a0500' }
};

export const PRESETS: Record<string, Partial<typeof DEFAULTS>> = {
	Classic: DEFAULTS,
	Zen: {
		gapSize: 250,
		extremity: 20,
		speedStep: 0,
		enemyIntensity: 0,
		baseSpeed: 350,
		birdSize: 32,
		pipeWidth: 50,
		gravity: 0
	},
	Chaos: {
		gapSize: 160,
		extremity: 75,
		speedStep: 20,
		enemyIntensity: 50,
		baseSpeed: 550,
		birdSize: 32,
		pipeWidth: 70,
		gravity: 0
	},
	Hard: {
		gapSize: 120,
		extremity: 80,
		speedStep: 30,
		enemyIntensity: 80,
		baseSpeed: 650,
		birdSize: 36,
		pipeWidth: 80,
		gravity: 0
	},
	'Cyber-Flap': {
		gapSize: 180,
		extremity: 40,
		speedStep: 40,
		enemyIntensity: 90,
		baseSpeed: 750,
		birdSize: 20,
		pipeWidth: 40,
		gravity: 0
	},
	Titan: {
		gapSize: 380,
		extremity: 90,
		speedStep: 15,
		enemyIntensity: 20,
		baseSpeed: 400,
		birdSize: 64,
		pipeWidth: 140,
		gravity: 0
	},
	Glider: {
		gapSize: 220,
		extremity: 30,
		speedStep: 5,
		enemyIntensity: 0,
		baseSpeed: 450,
		birdSize: 28,
		pipeWidth: 55,
		gravity: 350
	},
	'Heavy Drop': {
		gapSize: 260,
		extremity: 70,
		speedStep: 25,
		enemyIntensity: 40,
		baseSpeed: 500,
		birdSize: 32,
		pipeWidth: 65,
		gravity: 1100
	}
};

export const FIELDS = [
	{ n: 'Gap Clearance', k: 'gapSize', min: 100, max: 400 },
	{ n: 'Aggro Intensity', k: 'enemyIntensity', min: 0, max: 100 },
	{ n: 'Drift Deviation', k: 'extremity', min: 0, max: 100 },
	{ n: 'Speed Progression', k: 'speedStep', min: 0, max: 100 },
	{ n: 'Base Speed Velocity', k: 'baseSpeed', min: 200, max: 800 },
	{ n: 'Player Node Size', k: 'birdSize', min: 16, max: 64 },
	{ n: 'Pipe Column Width', k: 'pipeWidth', min: 30, max: 150 },
	{ n: 'Gravity Float Mod', k: 'gravity', min: 0, max: 1500 }
] as const;
