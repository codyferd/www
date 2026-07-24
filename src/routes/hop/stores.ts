import { writable } from 'svelte/store';

export type GameState = 'START' | 'RUNNING' | 'GAMEOVER';

export interface GameConfig {
	height: number;
	randomness: number;
	intervalSpread: number;
}

// Game State Engine Loops
export const gameState = writable<GameState>('START');
export const score = writable<number>(0);
export const highScore = writable<number>(0);
export const speedMultiplier = writable<number>(1.0);

// Global Hardware Slider Presets
export const configMatrix = writable<GameConfig>({
	height: 36,
	randomness: 50,
	intervalSpread: 40
});

// Structural Helper Formatting Matrix
export function formatScore(val: number): string {
	return String(Math.floor(val)).padStart(5, '0');
}
