<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Game Engine Configuration Types
	interface Tile {
		id: string;
		value: number;
		row: number;
		col: number;
		isMerged?: boolean;
		isSpawned?: boolean;
	}

	// Svelte 5 Reactive State Management
	let gridSize = $state(4);
	let score = $state(0);
	let isGameOver = $state(false);
	let tiles = $state<Tile[]>([]);
	let tileIdCounter = 0;

	// Responsive Board UI Geometries
	let gameContainerElement = $state<HTMLElement | null>(null);
	let containerWidth = $state(400);

	// Multi-touch Tracking Matrix Vectors
	let touchStartX = 0;
	let touchStartY = 0;

	// Grid configuration mapping matrix
	const gridOptions = [3, 4, 5, 6];

	/**
	 * Core Game Engine Initializer
	 */
	function initializeGame() {
		score = 0;
		isGameOver = false;
		tiles = [];
		tileIdCounter = 0;

		spawnRandomTile();
		spawnRandomTile();
	}

	/**
	 * Autonomous Tile Spawner Agent
	 */
	function spawnRandomTile() {
		// Gather all logically open block coordinate positions
		const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
		const emptyCoordinates: { row: number; col: number }[] = [];

		for (let r = 0; r < gridSize; r++) {
			for (let c = 0; c < gridSize; c++) {
				if (!occupied.has(`${r},${c}`)) {
					emptyCoordinates.push({ row: r, col: c });
				}
			}
		}

		if (emptyCoordinates.length > 0) {
			const selection = emptyCoordinates[Math.floor(Math.random() * emptyCoordinates.length)];
			const value = Math.random() < 0.9 ? 2 : 4;

			tiles = [
				...tiles,
				{
					id: `tile-${tileIdCounter++}`,
					value,
					row: selection.row,
					col: selection.col,
					isSpawned: true
				}
			];
		}
	}

	/**
	 * Vector Translation Shifter Core Matrix Processor
	 */
	function handleMove(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') {
		if (isGameOver) return;

		let hasMoved = false;
		let combinedScoreGained = 0;

		// Clear status states flags before starting structural shifting routines
		tiles = tiles.map((t) => ({ ...t, isMerged: false, isSpawned: false }));

		// Group current tiles along spatial operational axes vectors
		for (let i = 0; i < gridSize; i++) {
			// Extract parallel vectors lines dynamically depending on path orientations
			let lineTiles = tiles.filter((t) => {
				return direction === 'LEFT' || direction === 'RIGHT' ? t.row === i : t.col === i;
			});

			// Order the elements correctly relative to movement vector target coordinates
			lineTiles.sort((a, b) => {
				if (direction === 'LEFT') return a.col - b.col;
				if (direction === 'RIGHT') return b.col - a.col;
				if (direction === 'UP') return a.row - b.row;
				return b.row - a.row;
			});

			// Build output structural array transformations
			const lineSize = lineTiles.length;
			let targetIndex = 0;

			for (let j = 0; j < lineSize; j++) {
				const currentTile = lineTiles[j];
				const nextTile = lineTiles[j + 1];

				// If identical adjacent value match is detected, execute vector merge collapse
				if (nextTile && currentTile.value === nextTile.value) {
					const mergedValue = currentTile.value * 2;
					combinedScoreGained += mergedValue;

					// Target merge position update parameters
					const targetRow =
						direction === 'UP' || direction === 'DOWN'
							? direction === 'UP'
								? targetIndex
								: gridSize - 1 - targetIndex
							: i;
					const targetCol =
						direction === 'LEFT' || direction === 'RIGHT'
							? direction === 'LEFT'
								? targetIndex
								: gridSize - 1 - targetIndex
							: i;

					// Mutate current tile coordinates directly to animate smooth visual slides
					currentTile.row = targetRow;
					currentTile.col = targetCol;
					currentTile.value = mergedValue;
					currentTile.isMerged = true;

					// Point disappearing node over the active anchor position before dropping
					nextTile.row = targetRow;
					nextTile.col = targetCol;

					// Splice out the dead secondary identity frame
					tiles = tiles.filter((t) => t.id !== nextTile.id);

					hasMoved = true;
					j++; // Step past processing context sequence item
				} else {
					// Clean linear compression positioning update without value adjustments
					const targetRow =
						direction === 'UP' || direction === 'DOWN'
							? direction === 'UP'
								? targetIndex
								: gridSize - 1 - targetIndex
							: i;
					const targetCol =
						direction === 'LEFT' || direction === 'RIGHT'
							? direction === 'LEFT'
								? targetIndex
								: gridSize - 1 - targetIndex
							: i;

					if (currentTile.row !== targetRow || currentTile.col !== targetCol) {
						currentTile.row = targetRow;
						currentTile.col = targetCol;
						hasMoved = true;
					}
				}
				targetIndex++;
			}
		}

		if (hasMoved) {
			score += combinedScoreGained;
			spawnRandomTile();
			evaluateGameStatus();
		}
	}

	/**
	 * Scanner Evaluator for Terminal Game States
	 */
	function evaluateGameStatus() {
		// Board must be fully populated
		if (tiles.length < gridSize * gridSize) return;

		// Build quick analytical lookup coordinate matrix
		const lookup = Array(gridSize)
			.fill(null)
			.map(() => Array(gridSize).fill(0));
		tiles.forEach((t) => (lookup[t.row][t.col] = t.value));

		// Check internal horizontal adjacent merging pathways
		for (let r = 0; r < gridSize; r++) {
			for (let c = 0; c < gridSize - 1; c++) {
				if (lookup[r][c] === lookup[r][c + 1]) return;
			}
		}

		// Check internal vertical adjacent merging pathways
		for (let c = 0; c < gridSize; c++) {
			for (let r = 0; r < gridSize - 1; r++) {
				if (lookup[r][c] === lookup[r + 1][c]) return;
			}
		}

		// No available movement pathways remain
		isGameOver = true;
	}

	// Keyboard Interface Events Core Hook Binding Handles
	function handleKeyDown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowUp':
			case 'w':
			case 'W':
				e.preventDefault();
				handleMove('UP');
				break;
			case 'ArrowDown':
			case 's':
			case 'S':
				e.preventDefault();
				handleMove('DOWN');
				break;
			case 'ArrowLeft':
			case 'a':
			case 'A':
				e.preventDefault();
				handleMove('LEFT');
				break;
			case 'ArrowRight':
			case 'd':
			case 'D':
				e.preventDefault();
				handleMove('RIGHT');
				break;
		}
	}

	// Dynamic layout computing tracker hook
	function updateBounds() {
		if (gameContainerElement) {
			containerWidth = gameContainerElement.getBoundingClientRect().width;
		}
	}

	onMount(() => {
		initializeGame();
		updateBounds();
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('resize', updateBounds);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('resize', updateBounds);
		}
	});

	// Mobile Touch Interface Handlers
	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!touchStartX || !touchStartY) return;

		const deltaX = e.changedTouches[0].clientX - touchStartX;
		const deltaY = e.changedTouches[0].clientY - touchStartY;
		const gestureThreshold = 40;

		if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > gestureThreshold) {
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				handleMove(deltaX > 0 ? 'RIGHT' : 'LEFT');
			} else {
				handleMove(deltaY > 0 ? 'DOWN' : 'UP');
			}
		}
		touchStartX = 0;
		touchStartY = 0;
	}

	// Dynamic Layout Computed Constants
	const cellPadding = 8;
	const cellSize = $derived(
		(containerWidth - cellPadding * 2 - cellPadding * (gridSize - 1)) / gridSize
	);
</script>

<div
	class="flex min-h-screen w-full scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-col justify-between overflow-y-auto bg-black p-4 font-sans text-white select-none md:p-8"
>
	<!-- App Core Header Panel -->
	<header class="mx-auto flex w-full max-w-md flex-col gap-4">
		<div class="flex items-center justify-between">
			<h1 class="text-3xl font-black tracking-tighter uppercase italic">
				Avero <span class="text-[#9999FF]">Merge</span>
			</h1>

			<!-- Avero Metric Scoring Output Widget -->
			<div
				class="flex min-w-[90px] flex-col justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-right shadow-[0_0_20px_rgba(153,153,255,0.05)]"
			>
				<span class="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">Score</span>
				<span class="text-xl font-black text-[#9999FF]">{score}</span>
			</div>
		</div>

		<!-- Control System Tuning Parameter Board Bar -->
		<div
			class="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 p-3 backdrop-blur-md"
		>
			<div class="flex items-center gap-2">
				<label
					for="grid-select"
					class="text-[10px] font-black tracking-wider text-white/40 uppercase">Grid Matrix:</label
				>
				<select
					id="grid-select"
					bind:value={gridSize}
					onchange={initializeGame}
					class="cursor-pointer rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs font-bold text-white transition outline-none focus:border-[#9999FF]"
				>
					{#each gridOptions as opt (opt)}
						<option value={opt}>{opt} x {opt}</option>
					{/each}
				</select>
			</div>

			<button
				onclick={initializeGame}
				class="rounded-lg bg-[#9999FF] px-4 py-2 text-[10px] font-black tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)] active:scale-95"
			>
				Restart
			</button>
		</div>
	</header>

	<!-- Main Canvas Matrix Frame Viewport Container -->
	<main class="flex w-full grow items-center justify-center py-6">
		<div
			bind:this={gameContainerElement}
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
			role="grid"
			tabindex="0"
			aria-label="Avero puzzle board matrix layout grid workspace"
			class="relative box-border aspect-square w-full max-w-[400px] touch-none rounded-[24px] border border-white/10 bg-white/1 p-[8px] shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl transition focus:border-[#9999FF]/50 focus:outline-none"
			style="display: grid; gap: {cellPadding}px; grid-template-columns: repeat({gridSize}, 1fr); grid-template-rows: repeat({gridSize}, 1fr);"
		>
			<!-- Dynamic Background Slot Placeholders Layout Stack -->
			{#each [...Array(gridSize * gridSize).keys()] as cellIndex (cellIndex)}
				<div
					class="h-full w-full rounded-xl border border-white/1 bg-white/2 shadow-[inset_0_0_12px_rgba(0,0,0,0.85)]"
				></div>
			{/each}

			<!-- Runtime Rendered Interactive Dynamic Floating Block Entities Stack -->
			{#each tiles as tile (tile.id)}
				<div
					class="tile-node absolute flex items-center justify-center rounded-xl border font-black shadow-lg transition-all duration-100 ease-out
						{tile.isSpawned ? 'tile-spawn' : ''} 
						{tile.isMerged ? 'tile-merge' : ''}
						{tile.value <= 2048 ? `tile-${tile.value}` : 'tile-super'}"
					style="
						width: {cellSize}px; 
						height: {cellSize}px; 
						left: {cellPadding + tile.col * (cellSize + cellPadding)}px; 
						top: {cellPadding + tile.row * (cellSize + cellPadding)}px;
					"
				>
					{tile.value}
				</div>
			{/each}
		</div>
	</main>

	<!-- Dynamic Modal Terminal Status State Interaction Layer Overlay -->
	{#if isGameOver}
		<div
			class="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 p-6 text-center backdrop-blur-md"
		>
			<h2 class="text-4xl font-black tracking-tighter text-white uppercase italic">GAME OVER</h2>
			<p class="max-w-xs text-xs tracking-wide text-white/40 uppercase">
				The Avero grid matrix space is saturated with no remaining operational merge trajectories.
			</p>
			<button
				onclick={initializeGame}
				class="rounded-xl bg-[#9999FF] px-6 py-3 text-xs font-black tracking-widest text-black uppercase shadow-[0_0_30px_rgba(153,153,255,0.4)] transition-all duration-300 hover:bg-[#8888EE] active:scale-95"
			>
				Try Again
			</button>
		</div>
	{/if}

	<!-- App Explanatory Sub-Footer Navigation Interface Context Label -->
	<footer
		class="mx-auto w-full max-w-md pb-2 text-center text-[9px] font-black tracking-[0.2em] text-white/30 uppercase"
	>
		Swipe grid array or execute WASD / Keyboard Arrow directions to shift paths
	</footer>
</div>

<style>
	/* Dynamic Native Frame Render Transformation Nodes CSS Rules mapping tokens directly */
	.tile-node {
		font-family: 'Inter', system-ui, sans-serif;
		border: 1px solid rgba(255, 255, 255, 0.08);
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
	}

	/* Animators Hook Classes execution */
	.tile-spawn {
		animation: spawnPulse 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	.tile-merge {
		animation: mergePop 0.14s ease-in-out;
	}

	@keyframes spawnPulse {
		0% {
			transform: scale(0.6);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	@keyframes mergePop {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.15);
			box-shadow: 0 0 25px rgba(153, 153, 255, 0.6);
			border-color: #9999ff;
		}
		100% {
			transform: scale(1);
		}
	}

	/* Aesthetic Level Tier Grading Mapping Color Palettes Rules matching Avero Specification guidelines */
	.tile-2 {
		background: #111115;
		color: #a1a1aa;
		font-size: 1.75rem;
	}
	.tile-4 {
		background: #1c1c24;
		color: #f4f4f5;
		font-size: 1.75rem;
	}
	.tile-8 {
		background: #1e1b4b;
		color: #e0e7ff;
		font-size: 1.75rem;
		border-color: rgba(153, 153, 255, 0.2);
	}
	.tile-16 {
		background: #312e81;
		color: #ffffff;
		font-size: 1.75rem;
		border-color: rgba(153, 153, 255, 0.3);
	}
	.tile-32 {
		background: #3730a3;
		color: #ffffff;
		font-size: 1.75rem;
	}
	.tile-64 {
		background: #4338ca;
		color: #ffffff;
		font-size: 1.75rem;
	}
	.tile-128 {
		background: #4f46e5;
		color: #ffffff;
		font-size: 1.5rem;
		box-shadow: 0 0 15px rgba(153, 153, 255, 0.2);
	}
	.tile-256 {
		background: #6366f1;
		color: #ffffff;
		font-size: 1.5rem;
		box-shadow: 0 0 20px rgba(153, 153, 255, 0.3);
	}
	.tile-512 {
		background: #818cf8;
		color: #ffffff;
		font-size: 1.5rem;
		box-shadow: 0 0 25px rgba(153, 153, 255, 0.4);
	}
	.tile-1024 {
		background: #a5b4fc;
		color: #000000;
		font-size: 1.25rem;
		box-shadow: 0 0 30px rgba(153, 153, 255, 0.6);
	}
	.tile-2048 {
		background: #9999ff;
		color: #000000;
		font-size: 1.25rem;
		box-shadow: 0 0 35px rgba(153, 153, 255, 0.8);
	}
	.tile-super {
		background: #e0e7ff;
		color: #000000;
		font-size: 1.1rem;
		box-shadow: 0 0 45px #ffffff;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.animate-fade-in {
		animation: fadeIn 0.2s ease-out forwards;
	}
</style>
