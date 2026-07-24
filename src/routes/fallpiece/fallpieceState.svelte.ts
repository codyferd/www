// src/routes/fallpiece/fallpieceState.svelte.ts

export const COLS = 10;
export const ROWS = 20;

export const SHAPES = {
	I: [[1, 1, 1, 1]],
	J: [
		[1, 0, 0],
		[1, 1, 1]
	],
	L: [
		[0, 0, 1],
		[1, 1, 1]
	],
	O: [
		[1, 1],
		[1, 1]
	],
	S: [
		[0, 1, 1],
		[1, 1, 0]
	],
	T: [
		[0, 1, 0],
		[1, 1, 1]
	],
	Z: [
		[1, 1, 0],
		[0, 1, 1]
	]
} as const;

// Re-mapped from original hues to Avero's unified styling palette spectrums
export const COLORS = {
	I: '#9999FF', // Primary Neon Lavender
	J: '#7777DD',
	L: '#BBBBFF',
	O: '#EEEEFF',
	S: '#8888EE',
	T: '#6666CC',
	Z: '#AAAAFF'
} as const;

export type PieceType = keyof typeof SHAPES;

export interface Piece {
	pos: { x: number; y: number };
	shape: number[][];
	type: PieceType;
}

export class FallpieceState {
	// Svelte 5 Reactive States
	score = $state(0);
	level = $state(1);
	lines = $state(0);
	running = $state(false);
	gameOver = $state(false);

	grid: (string | 0)[][] = $state([]);
	piece = $state<Piece | null>(null);
	nextPiece = $state<Piece | null>(null);

	// Engine mechanics runtime properties
	blockSize = $state(20);
	private dropCounter = 0;
	private lastTime = 0;
	private animationId = 0;

	// References mapped from components
	gameCanvas = $state<HTMLCanvasElement | null>(null);
	nextCanvas = $state<HTMLCanvasElement | null>(null);
	canvasWrapper = $state<HTMLDivElement | null>(null);

	constructor() {
		this.clearGrid();
	}

	clearGrid() {
		this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
	}

	createPiece(type: PieceType): Piece {
		const shape = SHAPES[type];
		return {
			pos: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 },
			shape: JSON.parse(JSON.stringify(shape)),
			type
		};
	}

	getRandomPieceType(): PieceType {
		const types = 'IJLOSTZ';
		return types[Math.floor(Math.random() * types.length)] as PieceType;
	}

	resetPiece() {
		this.piece = this.nextPiece || this.createPiece(this.getRandomPieceType());
		this.nextPiece = this.createPiece(this.getRandomPieceType());
		this.drawNext();

		if (this.collide(this.piece)) {
			this.running = false;
			this.gameOver = true;
			cancelAnimationFrame(this.animationId);
		}
	}

	collide(p: Piece): boolean {
		for (let y = 0; y < p.shape.length; y++) {
			for (let x = 0; x < p.shape[y].length; x++) {
				if (p.shape[y][x] !== 0) {
					const boardY = y + p.pos.y;
					const boardX = x + p.pos.x;
					if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
					if (boardY >= 0 && this.grid[boardY][boardX] !== 0) return true;
				}
			}
		}
		return false;
	}

	merge() {
		if (!this.piece) return;
		this.piece.shape.forEach((row, y) => {
			row.forEach((value, x) => {
				if (value !== 0 && this.piece) {
					const targetY = y + this.piece.pos.y;
					if (targetY >= 0) {
						this.grid[targetY][x + this.piece.pos.x] = this.piece.type;
					}
				}
			});
		});
	}

	rotate() {
		if (!this.piece) return;
		const matrix = this.piece.shape[0].map((_, i) =>
			this.piece!.shape.map((row) => row[i]).reverse()
		);
		const oldShape = this.piece.shape;
		this.piece.shape = matrix;
		if (this.collide(this.piece)) {
			this.piece.shape = oldShape;
		}
	}

	clearLines() {
		let rowCount = 0;
		for (let y = ROWS - 1; y >= 0; y--) {
			if (this.grid[y].every((value) => value !== 0)) {
				this.grid.splice(y, 1);
				this.grid.unshift(Array(COLS).fill(0));
				rowCount++;
				y++; // Re-evaluate current row offset index index
			}
		}
		if (rowCount > 0) {
			this.lines += rowCount;
			this.score += [0, 100, 300, 500, 800][rowCount] * this.level;
			this.level = Math.floor(this.lines / 10) + 1;
		}
	}

	moveDown() {
		if (!this.piece) return;
		this.piece.pos.y++;
		if (this.collide(this.piece)) {
			this.piece.pos.y--;
			this.merge();
			this.clearLines();
			this.resetPiece();
		}
		this.dropCounter = 0;
	}

	hardDrop() {
		if (!this.piece) return;
		while (!this.collide(this.piece)) {
			this.piece.pos.y++;
		}
		this.piece.pos.y--;
		this.merge();
		this.clearLines();
		this.resetPiece();
		this.draw();
	}

	// Modernized Two-Axis Responsive Canvas Boundary Calculation Logic
	resizeGameCanvas() {
		if (!this.canvasWrapper || !this.gameCanvas) return;

		const parentWidth = this.canvasWrapper.clientWidth;
		const parentHeight = this.canvasWrapper.clientHeight;

		// Determine critical axis boundary point
		const sizeByWidth = parentWidth / COLS;
		const sizeByHeight = parentHeight / ROWS;
		this.blockSize = Math.min(sizeByWidth, sizeByHeight);

		// Constrain dynamic calculations inside high-fidelity mobile bounds
		if (this.blockSize < 12) this.blockSize = 12;
		if (this.blockSize > 32) this.blockSize = 32;

		this.gameCanvas.width = this.blockSize * COLS;
		this.gameCanvas.height = this.blockSize * ROWS;

		const container = this.gameCanvas.parentElement;
		if (container) {
			container.style.width = `${this.gameCanvas.width + 8}px`;
			container.style.height = `${this.gameCanvas.height + 8}px`;
		}

		this.draw();
		this.drawNext();
	}

	drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha = 1) {
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.fillStyle = color;
		ctx.fillRect(
			Math.floor(x * this.blockSize),
			Math.floor(y * this.blockSize),
			Math.ceil(this.blockSize - 1),
			Math.ceil(this.blockSize - 1)
		);
		ctx.restore();
	}

	drawNext() {
		if (!this.nextCanvas || !this.nextPiece) return;
		const ctx = this.nextCanvas.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, 60, 30);

		const pWidth = this.nextPiece.shape[0].length * 8;
		const pHeight = this.nextPiece.shape.length * 8;
		const offsetX = (60 - pWidth) / 2;
		const offsetY = (30 - pHeight) / 2;

		this.nextPiece.shape.forEach((row, y) => {
			row.forEach((val, x) => {
				if (val && this.nextPiece) {
					ctx.fillStyle = COLORS[this.nextPiece.type];
					ctx.fillRect(x * 8 + offsetX, y * 8 + offsetY, 7, 7);
				}
			});
		});
	}

	draw() {
		if (!this.gameCanvas) return;
		const ctx = this.gameCanvas.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);

		// Render locked matrix background blocks
		this.grid.forEach((row, y) =>
			row.forEach((type, x) => {
				if (type) this.drawBlock(ctx, x, y, COLORS[type as PieceType]);
			})
		);

		if (this.piece) {
			// Calculate real-time phantom drop vector path (Ghost Piece Projection)
			const ghost = { ...this.piece, pos: { ...this.piece.pos } };
			while (!this.collide(ghost)) ghost.pos.y++;
			ghost.pos.y--;

			this.piece.shape.forEach((row, y) =>
				row.forEach((v, x) => {
					if (v) this.drawBlock(ctx, x + ghost.pos.x, y + ghost.pos.y, '#ffffff', 0.05);
				})
			);

			// Render live falling active instance
			this.piece.shape.forEach((row, y) =>
				row.forEach((v, x) => {
					if (v && this.piece)
						this.drawBlock(
							ctx,
							x + this.piece.pos.x,
							y + this.piece.pos.y,
							COLORS[this.piece.type]
						);
				})
			);
		}
	}

	updateLoop = (time = 0) => {
		if (!this.running) return;
		const deltaTime = time - this.lastTime;
		this.lastTime = time;
		this.dropCounter += deltaTime;

		const currentDropSpeed = Math.max(40, 1000 - this.level * 60);
		if (this.dropCounter > currentDropSpeed) {
			this.moveDown();
		}

		this.draw();
		this.animationId = requestAnimationFrame(this.updateLoop);
	};

	handleInput(code: string) {
		if (code === 'KeyP') {
			this.running = !this.running;
			if (this.running) {
				this.lastTime = performance.now();
				this.updateLoop(this.lastTime);
			}
			return;
		}

		if (!this.running || !this.piece || this.gameOver) return;

		switch (code) {
			case 'KeyA':
				this.piece.pos.x--;
				if (this.collide(this.piece)) this.piece.pos.x++;
				break;
			case 'KeyD':
				this.piece.pos.x++;
				if (this.collide(this.piece)) this.piece.pos.x--;
				break;
			case 'KeyS':
				this.moveDown();
				break;
			case 'KeyW':
				this.rotate();
				break;
			case 'Space':
				this.hardDrop();
				break;
		}
		this.draw();
	}

	startGame() {
		this.clearGrid();
		this.score = 0;
		this.level = 1;
		this.lines = 0;
		this.gameOver = false;
		this.running = true;

		this.nextPiece = this.createPiece(this.getRandomPieceType());
		this.resetPiece();

		setTimeout(() => {
			this.resizeGameCanvas();
			this.lastTime = performance.now();
			this.updateLoop(this.lastTime);
		}, 0);
	}

	destroy() {
		cancelAnimationFrame(this.animationId);
	}
}
