export const CELL_COUNT = 30;
export const BASE_RESOLUTION = 600;

export interface Point {
	x: number;
	y: number;
}

export class SnakeEngine {
	// Reactive Svelte 5 Runes
	score = $state(0);
	highScore = $state(0);
	isRunning = $state(false);
	isGameOver = $state(false);

	private snake: Point[] = [];
	private food: Point = { x: 0, y: 0 };
	private velocity: Point = { x: 1, y: 0 };
	private nextVelocity: Point = { x: 1, y: 0 };
	private gameIntervalId: ReturnType<typeof setInterval> | null = null;
	private ctx: CanvasRenderingContext2D | null = null;
	private canvas: HTMLCanvasElement | null = null;
	private arenaWrapper: HTMLElement | null = null;

	init(canvasEl: HTMLCanvasElement, wrapperEl: HTMLElement) {
		this.canvas = canvasEl;
		this.arenaWrapper = wrapperEl;
		this.ctx = canvasEl.getContext('2d');

		// Delayed frame sizing check to guarantee wrapper layout bounds are computed
		requestAnimationFrame(() => {
			this.handleResize();
		});
	}

	startSimulation() {
		this.score = 0;
		this.isRunning = true;
		this.isGameOver = false;

		this.snake = [
			{ x: 15, y: 15 },
			{ x: 14, y: 15 },
			{ x: 13, y: 15 }
		];

		this.velocity = { x: 1, y: 0 };
		this.nextVelocity = { x: 1, y: 0 };

		this.spawnFood();

		if (this.gameIntervalId) clearInterval(this.gameIntervalId);
		this.handleResize();
		this.gameIntervalId = setInterval(() => this.updateTick(), 120);
	}

	terminateSimulation() {
		this.isRunning = false;
		this.isGameOver = true;
		if (this.gameIntervalId) {
			clearInterval(this.gameIntervalId);
			this.gameIntervalId = null;
		}
	}

	handleInput(keyString: string) {
		let command = keyString;
		if (command === 'KeyW') command = 'ArrowUp';
		if (command === 'KeyS') command = 'ArrowDown';
		if (command === 'KeyA') command = 'ArrowLeft';
		if (command === 'KeyD') command = 'ArrowRight';

		switch (command) {
			case 'ArrowUp':
				if (this.velocity.y !== 1 && this.snake[1]?.y !== this.snake[0].y - 1)
					this.nextVelocity = { x: 0, y: -1 };
				break;
			case 'ArrowDown':
				if (this.velocity.y !== -1 && this.snake[1]?.y !== this.snake[0].y + 1)
					this.nextVelocity = { x: 0, y: 1 };
				break;
			case 'ArrowLeft':
				if (this.velocity.x !== 1 && this.snake[1]?.x !== this.snake[0].x - 1)
					this.nextVelocity = { x: -1, y: 0 };
				break;
			case 'ArrowRight':
				if (this.velocity.x !== -1 && this.snake[1]?.x !== this.snake[0].x + 1)
					this.nextVelocity = { x: 1, y: 0 };
				break;
		}
	}

	handleResize = () => {
		if (!this.arenaWrapper || !this.canvas) return;

		const availableWidth = this.arenaWrapper.clientWidth;
		const availableHeight = this.arenaWrapper.clientHeight;
		let minEdgeBound = Math.min(availableWidth, availableHeight);

		if (minEdgeBound < 180) minEdgeBound = 180;

		this.canvas.width = BASE_RESOLUTION;
		this.canvas.height = BASE_RESOLUTION;

		const renderSize = `${minEdgeBound - 8}px`;
		this.canvas.style.width = renderSize;
		this.canvas.style.height = renderSize;

		if (this.canvas.parentElement) {
			this.canvas.parentElement.style.width = `${minEdgeBound}px`;
			this.canvas.parentElement.style.height = `${minEdgeBound}px`;
		}

		this.renderGrid();
	};

	private spawnFood() {
		while (true) {
			const rx = Math.floor(Math.random() * CELL_COUNT);
			const ry = Math.floor(Math.random() * CELL_COUNT);

			const occupied = this.snake.some((s) => s.x === rx && s.y === ry);
			if (!occupied) {
				this.food = { x: rx, y: ry };
				break;
			}
		}
	}

	private updateTick() {
		if (!this.isRunning) return;

		this.velocity = { ...this.nextVelocity };
		const head = { x: this.snake[0].x + this.velocity.x, y: this.snake[0].y + this.velocity.y };

		// Wall collision
		if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
			this.terminateSimulation();
			return;
		}

		// Self collision
		for (let i = 0; i < this.snake.length; i++) {
			if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
				this.terminateSimulation();
				return;
			}
		}

		this.snake.unshift(head);

		// Food collision
		if (head.x === this.food.x && head.y === this.food.y) {
			this.score += 10;
			if (this.score > this.highScore) {
				this.highScore = this.score;
			}
			this.spawnFood();
		} else {
			this.snake.pop();
		}

		this.renderGrid();
	}

	private renderGrid() {
		if (!this.ctx || !this.canvas) return;

		const blockSize = BASE_RESOLUTION / CELL_COUNT;
		this.ctx.clearRect(0, 0, BASE_RESOLUTION, BASE_RESOLUTION);

		// Food (Accent Node)
		this.ctx.fillStyle = '#9999FF';
		this.ctx.shadowColor = 'rgba(153, 153, 255, 0.5)';
		this.ctx.shadowBlur = 8;
		this.ctx.fillRect(
			this.food.x * blockSize + 1,
			this.food.y * blockSize + 1,
			blockSize - 2,
			blockSize - 2
		);

		// Snake Body
		this.ctx.shadowBlur = 0;
		this.snake.forEach((segment, index) => {
			this.ctx!.fillStyle = index === 0 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
			this.ctx!.fillRect(
				segment.x * blockSize + 1,
				segment.y * blockSize + 1,
				blockSize - 2,
				blockSize - 2
			);
		});
	}

	destroy() {
		if (this.gameIntervalId) clearInterval(this.gameIntervalId);
	}
}
