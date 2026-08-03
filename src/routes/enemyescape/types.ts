export interface GameSettings {
	enemyCount: number;
	speedAccelPerSec: number; // e.g. 0.02 = +2%/s acceleration multiplier
}

export interface GameStats {
	timeAlive: number;
	score: number;
	highScore: number;
	currentEnemySpeed: number;
	gameStarted: boolean;
	gameOver: boolean;
}

export interface GameCallbacks {
	onUpdateStats: (stats: Partial<GameStats>) => void;
	onGameOver: (finalStats: GameStats) => void;
}
