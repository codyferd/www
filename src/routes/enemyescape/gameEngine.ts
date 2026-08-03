import Phaser from 'phaser';
import type { GameCallbacks, GameSettings } from './types';

export const TILE_SIZE = 32;

// 25 cols x 19 rows (800 x 608)
// 1 = Wall, 0 = Open Corridor, 2 = Center Spawn Box
// Fully interconnected layout with zero dead-ends
const GRID_MAP = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

export enum Direction {
	NONE = 0,
	UP,
	DOWN,
	LEFT,
	RIGHT
}

interface Point {
	x: number;
	y: number;
}

export class EnemyEscapeScene extends Phaser.Scene {
	private player!: Phaser.GameObjects.Rectangle;
	private enemies: Phaser.GameObjects.Rectangle[] = [];
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private wasdKeys!: {
		W: Phaser.Input.Keyboard.Key;
		A: Phaser.Input.Keyboard.Key;
		S: Phaser.Input.Keyboard.Key;
		D: Phaser.Input.Keyboard.Key;
	};

	private currentDir: Direction = Direction.NONE;
	private nextDir: Direction = Direction.NONE;

	private playerBaseSpeed = 175;
	private settings: GameSettings = { enemyCount: 2, speedAccelPerSec: 0.02 };
	private baseEnemySpeed = 110;
	private currentEnemySpeed = 110;
	private gameTime = 0;
	private score = 0;
	private highScore = 0;
	private isPlaying = false;

	private scoreTimerEvent?: Phaser.Time.TimerEvent;
	private callbacks: GameCallbacks;

	constructor(callbacks: GameCallbacks) {
		super({ key: 'EnemyEscapeScene' });
		this.callbacks = callbacks;
	}

	create() {
		// Draw Wall & Corridor Grid
		const graphics = this.add.graphics();
		for (let r = 0; r < GRID_MAP.length; r++) {
			for (let c = 0; c < GRID_MAP[r].length; c++) {
				const tileType = GRID_MAP[r][c];
				const x = c * TILE_SIZE;
				const y = r * TILE_SIZE;

				if (tileType === 1) {
					graphics.fillStyle(0x18182a, 1);
					graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
					graphics.lineStyle(1, 0x333366, 0.5);
					graphics.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
				} else if (tileType === 2) {
					graphics.fillStyle(0x11081a, 1);
					graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
				} else {
					graphics.fillStyle(0x050508, 1);
					graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
				}
			}
		}

		// Create Player Block
		const startX = 12 * TILE_SIZE + TILE_SIZE / 2;
		const startY = 14 * TILE_SIZE + TILE_SIZE / 2;
		this.player = this.add.rectangle(startX, startY, 22, 22, 0x9999ff);
		this.player.setStrokeStyle(2, 0xffffff);

		// Setup Controls
		if (this.input.keyboard) {
			this.cursors = this.input.keyboard.createCursorKeys();
			this.wasdKeys = {
				W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
				A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
				S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
				D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
			};
		}
	}

	public configureSettings(newSettings: Partial<GameSettings>) {
		this.settings = { ...this.settings, ...newSettings };
		if (this.isPlaying) {
			this.syncEnemyCount();
		}
	}

	public startMatch() {
		this.gameTime = 0;
		this.score = 0;
		this.currentEnemySpeed = this.baseEnemySpeed;
		this.currentDir = Direction.NONE;
		this.nextDir = Direction.NONE;
		this.isPlaying = true;

		// Center player at start position
		this.player.setPosition(12 * TILE_SIZE + 16, 14 * TILE_SIZE + 16);
		this.player.setVisible(true);

		// Remove existing enemies
		this.enemies.forEach((e) => e.destroy());
		this.enemies = [];

		this.syncEnemyCount();

		// Timer loop: 1 second step tick
		this.scoreTimerEvent?.destroy();
		this.scoreTimerEvent = this.time.addEvent({
			delay: 1000,
			callback: () => {
				if (!this.isPlaying) return;
				this.gameTime++;

				// Dynamic multiplier acceleration per second
				this.currentEnemySpeed *= 1 + this.settings.speedAccelPerSec;

				this.score += 10 + Math.floor(this.enemies.length * 5);
				if (this.score > this.highScore) this.highScore = this.score;

				this.callbacks.onUpdateStats({
					timeAlive: this.gameTime,
					score: this.score,
					highScore: this.highScore,
					currentEnemySpeed: Math.round(this.currentEnemySpeed)
				});
			},
			callbackScope: this,
			loop: true
		});

		this.callbacks.onUpdateStats({
			gameStarted: true,
			gameOver: false,
			timeAlive: 0,
			score: 0,
			currentEnemySpeed: Math.round(this.currentEnemySpeed)
		});
	}

	/**
	 * Actively forces the spawned enemy count to strictly match `this.settings.enemyCount`.
	 * Adds or removes enemy game objects dynamically.
	 */
	private syncEnemyCount() {
		const targetCount = Math.max(1, Math.min(20, Math.round(this.settings.enemyCount)));

		// Add enemies if count is below target
		while (this.enemies.length < targetCount) {
			const spawnX = 12 * TILE_SIZE + 16;
			const spawnY = 9 * TILE_SIZE + 16; // Center spawn box
			const enemy = this.add.rectangle(spawnX, spawnY, 20, 20, 0xff4466);
			enemy.setStrokeStyle(2, 0xffaacc);
			this.enemies.push(enemy);
		}

		// Remove enemies if count exceeds target
		while (this.enemies.length > targetCount) {
			const enemy = this.enemies.pop();
			enemy?.destroy();
		}
	}

	update(time: number, delta: number) {
		if (!this.isPlaying) return;

		const dt = delta / 1000;

		// Ensure enemy count actively matches the slider at all times
		this.syncEnemyCount();

		this.captureInput();
		this.updatePlayerMovement(dt);
		this.updateEnemiesBFSPathfinding(dt);
		this.checkCollisions();
	}

	private captureInput() {
		if (this.cursors.left.isDown || this.wasdKeys.A.isDown) this.nextDir = Direction.LEFT;
		else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) this.nextDir = Direction.RIGHT;
		else if (this.cursors.up.isDown || this.wasdKeys.W.isDown) this.nextDir = Direction.UP;
		else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) this.nextDir = Direction.DOWN;
	}

	private updatePlayerMovement(dt: number) {
		const col = Math.floor(this.player.x / TILE_SIZE);
		const row = Math.floor(this.player.y / TILE_SIZE);
		const centerX = col * TILE_SIZE + TILE_SIZE / 2;
		const centerY = row * TILE_SIZE + TILE_SIZE / 2;

		const snapDistance = 6;
		const nearCenter =
			Math.abs(this.player.x - centerX) <= snapDistance &&
			Math.abs(this.player.y - centerY) <= snapDistance;

		// Handle Direction Turn Input
		if (this.nextDir !== Direction.NONE) {
			if (this.isOppositeDirection(this.currentDir, this.nextDir)) {
				this.currentDir = this.nextDir;
			} else if (nearCenter && this.isTileWalkable(col, row, this.nextDir)) {
				this.currentDir = this.nextDir;
				// Auto-snap axis to turn corridor seamlessly
				if (this.nextDir === Direction.UP || this.nextDir === Direction.DOWN)
					this.player.x = centerX;
				if (this.nextDir === Direction.LEFT || this.nextDir === Direction.RIGHT)
					this.player.y = centerY;
			}
		}

		// Move Player
		if (this.currentDir !== Direction.NONE) {
			const step = this.playerBaseSpeed * dt;

			if (this.currentDir === Direction.LEFT) {
				if (!this.isTileWalkable(col, row, Direction.LEFT) && this.player.x - step <= centerX) {
					this.player.x = centerX;
					this.currentDir = Direction.NONE;
				} else {
					this.player.x -= step;
					this.player.y = Phaser.Math.Linear(this.player.y, centerY, 0.4);
				}
			} else if (this.currentDir === Direction.RIGHT) {
				if (!this.isTileWalkable(col, row, Direction.RIGHT) && this.player.x + step >= centerX) {
					this.player.x = centerX;
					this.currentDir = Direction.NONE;
				} else {
					this.player.x += step;
					this.player.y = Phaser.Math.Linear(this.player.y, centerY, 0.4);
				}
			} else if (this.currentDir === Direction.UP) {
				if (!this.isTileWalkable(col, row, Direction.UP) && this.player.y - step <= centerY) {
					this.player.y = centerY;
					this.currentDir = Direction.NONE;
				} else {
					this.player.y -= step;
					this.player.x = Phaser.Math.Linear(this.player.x, centerX, 0.4);
				}
			} else if (this.currentDir === Direction.DOWN) {
				if (!this.isTileWalkable(col, row, Direction.DOWN) && this.player.y + step >= centerY) {
					this.player.y = centerY;
					this.currentDir = Direction.NONE;
				} else {
					this.player.y += step;
					this.player.x = Phaser.Math.Linear(this.player.x, centerX, 0.4);
				}
			}
		}
	}

	private isOppositeDirection(d1: Direction, d2: Direction): boolean {
		return (
			(d1 === Direction.LEFT && d2 === Direction.RIGHT) ||
			(d1 === Direction.RIGHT && d2 === Direction.LEFT) ||
			(d1 === Direction.UP && d2 === Direction.DOWN) ||
			(d1 === Direction.DOWN && d2 === Direction.UP)
		);
	}

	private isTileWalkable(col: number, row: number, dir: Direction): boolean {
		let targetCol = col;
		let targetRow = row;
		if (dir === Direction.LEFT) targetCol--;
		if (dir === Direction.RIGHT) targetCol++;
		if (dir === Direction.UP) targetRow--;
		if (dir === Direction.DOWN) targetRow++;

		if (
			targetRow < 0 ||
			targetRow >= GRID_MAP.length ||
			targetCol < 0 ||
			targetCol >= GRID_MAP[0].length
		) {
			return false;
		}
		return GRID_MAP[targetRow][targetCol] !== 1;
	}

	// BFS Pathfinding for Enemies around Walls
	private updateEnemiesBFSPathfinding(dt: number) {
		const targetCol = Math.floor(this.player.x / TILE_SIZE);
		const targetRow = Math.floor(this.player.y / TILE_SIZE);

		this.enemies.forEach((enemy) => {
			const enemyCol = Math.floor(enemy.x / TILE_SIZE);
			const enemyRow = Math.floor(enemy.y / TILE_SIZE);

			const nextWaypoint = this.findNextBFSWaypoint(enemyCol, enemyRow, targetCol, targetRow);
			const targetX = nextWaypoint.x * TILE_SIZE + TILE_SIZE / 2;
			const targetY = nextWaypoint.y * TILE_SIZE + TILE_SIZE / 2;

			// Move enemy toward tile waypoint smoothly
			const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
			const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetX, targetY);
			const step = this.currentEnemySpeed * dt;

			if (dist <= step) {
				enemy.setPosition(targetX, targetY);
			} else {
				enemy.x += Math.cos(angle) * step;
				enemy.y += Math.sin(angle) * step;
			}
		});
	}

	private findNextBFSWaypoint(
		startCol: number,
		startRow: number,
		targetCol: number,
		targetRow: number
	): Point {
		if (startCol === targetCol && startRow === targetRow) {
			return { x: startCol, y: startRow };
		}

		const queue: Point[] = [{ x: startCol, y: startRow }];
		const visited = new Set<string>();
		const parentMap = new Map<string, Point>();

		visited.add(`${startCol},${startRow}`);

		const dirs = [
			{ x: 0, y: -1 },
			{ x: 0, y: 1 },
			{ x: -1, y: 0 },
			{ x: 1, y: 0 }
		];

		let found = false;

		while (queue.length > 0) {
			const curr = queue.shift()!;
			if (curr.x === targetCol && curr.y === targetRow) {
				found = true;
				break;
			}

			for (const d of dirs) {
				const nx = curr.x + d.x;
				const ny = curr.y + d.y;
				const key = `${nx},${ny}`;

				if (
					ny >= 0 &&
					ny < GRID_MAP.length &&
					nx >= 0 &&
					nx < GRID_MAP[0].length &&
					GRID_MAP[ny][nx] !== 1 &&
					!visited.has(key)
				) {
					visited.add(key);
					parentMap.set(key, curr);
					queue.push({ x: nx, y: ny });
				}
			}
		}

		if (!found) return { x: startCol, y: startRow };

		// Backtrack path to get the immediate next step
		let currKey = `${targetCol},${targetRow}`;
		let currPoint = { x: targetCol, y: targetRow };

		while (parentMap.has(currKey)) {
			const parent = parentMap.get(currKey)!;
			if (parent.x === startCol && parent.y === startRow) {
				return currPoint;
			}
			currPoint = parent;
			currKey = `${parent.x},${parent.y}`;
		}

		return { x: startCol, y: startRow };
	}

	private checkCollisions() {
		const hitBoxDist = 18;
		for (const enemy of this.enemies) {
			const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
			if (dist < hitBoxDist) {
				this.handleGameOver();
				break;
			}
		}
	}

	private handleGameOver() {
		if (!this.isPlaying) return;
		this.isPlaying = false;
		this.scoreTimerEvent?.destroy();

		this.callbacks.onGameOver({
			timeAlive: this.gameTime,
			score: this.score,
			highScore: this.highScore,
			currentEnemySpeed: Math.round(this.currentEnemySpeed),
			gameStarted: true,
			gameOver: true
		});
	}
}

export function createEnemyEscapeGame(
	container: HTMLElement,
	callbacks: GameCallbacks
): { game: Phaser.Game; scene: EnemyEscapeScene } {
	const scene = new EnemyEscapeScene(callbacks);

	const config: Phaser.Types.Core.GameConfig = {
		type: Phaser.AUTO,
		width: 800,
		height: 608,
		parent: container,
		backgroundColor: '#050508',
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH
		},
		scene: [scene]
	};

	const game = new Phaser.Game(config);
	return { game, scene };
}
