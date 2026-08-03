<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEnemyEscapeGame, EnemyEscapeScene } from './gameEngine';
	import type { GameStats, GameSettings } from './types';

	let gameWrapper = $state<HTMLDivElement | null>(null);
	let gameContainer = $state<HTMLDivElement | null>(null);
	let phaserGame: Phaser.Game | null = null;
	let activeScene: EnemyEscapeScene | null = null;

	let isFullscreen = $state(false);

	let settings = $state<GameSettings>({
		enemyCount: 2,
		speedAccelPerSec: 0.02
	});

	let stats = $state<GameStats>({
		timeAlive: 0,
		score: 0,
		highScore: 0,
		currentEnemySpeed: 110,
		gameStarted: false,
		gameOver: false
	});

	onMount(() => {
		if (gameContainer) {
			const { game, scene } = createEnemyEscapeGame(gameContainer, {
				onUpdateStats: (newStats) => {
					stats = { ...stats, ...newStats };
				},
				onGameOver: (finalStats) => {
					stats = { ...stats, ...finalStats };
				}
			});
			phaserGame = game;
			activeScene = scene;
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange);
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		}
		phaserGame?.destroy(true);
	});

	function handleFullscreenChange() {
		isFullscreen = !!document.fullscreenElement;
		if (phaserGame) {
			setTimeout(() => phaserGame?.scale.refresh(), 100);
		}
	}

	function toggleFullscreen() {
		if (!gameWrapper) return;
		if (!document.fullscreenElement) {
			gameWrapper.requestFullscreen().catch((err) => console.error(err));
		} else {
			document.exitFullscreen().catch((err) => console.error(err));
		}
	}

	function handleSettingsChange() {
		if (activeScene) {
			activeScene.configureSettings(settings);
		}
	}

	function startGame() {
		if (activeScene) {
			activeScene.configureSettings(settings);
			activeScene.startMatch();
		}
	}
</script>

<div
	class="flex min-h-screen w-full flex-col bg-black p-4 font-sans tracking-tight text-white md:p-6"
>
	<!-- Top Navigation -->
	<header
		class="mx-auto mb-4 flex w-full max-w-7xl items-center justify-between border-b border-white/10 pb-4"
	>
		<div class="flex items-center gap-3">
			<div class="h-3 w-3 rounded-full bg-[#9999FF] shadow-[0_0_20px_rgba(153,153,255,0.8)]"></div>
			<h1 class="text-xl font-black tracking-tighter text-[#9999FF] italic">
				ENEMY<span class="text-white">ESCAPE</span>
			</h1>
		</div>

		<div class="flex items-center gap-3">
			<button
				onclick={toggleFullscreen}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:border-[#9999FF]/40 hover:bg-white/10"
			>
				{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen ⛶'}
			</button>
			<div
				class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
			>
				<span class="h-2 w-2 animate-ping rounded-full bg-emerald-500"></span>
				<span class="text-[10px] font-bold text-white uppercase"
					>{stats.gameStarted ? (stats.gameOver ? 'Captured' : 'Escaping') : 'Standby'}</span
				>
			</div>
		</div>
	</header>

	<!-- Main Grid -->
	<main class="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
		<!-- Canvas Display -->
		<div
			bind:this={gameWrapper}
			class="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black p-2 shadow-[0_0_50px_rgba(0,0,0,0.9)] md:p-4"
		>
			<div
				bind:this={gameContainer}
				class="aspect-800/608 w-full max-w-225 overflow-hidden rounded-2xl bg-black"
			></div>

			{#if !stats.gameStarted}
				<div
					class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md"
				>
					<h2 class="mb-2 text-3xl font-black tracking-widest text-white uppercase">
						DYNAMIC PAC-ESCAPE
					</h2>
					<p class="mb-6 max-w-md text-xs text-white/50">
						Glide through maze corridors without getting stuck. Enemies continuously route around
						walls toward you.
					</p>

					<button
						onclick={startGame}
						class="rounded-xl bg-[#9999FF] px-8 py-4 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.25)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_30px_rgba(153,153,255,0.5)]"
					>
						Start Match
					</button>
				</div>
			{/if}

			{#if stats.gameOver}
				<div
					class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md"
				>
					<span class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
						>Intercepted</span
					>
					<h2 class="mt-1 text-4xl font-black text-white uppercase">Game Over</h2>
					<p class="mt-2 text-xs text-white/60">
						Final Score: <strong class="text-[#9999FF]">{stats.score}</strong> | Survived:
						<strong class="text-white">{stats.timeAlive}s</strong>
					</p>

					<button
						onclick={startGame}
						class="mt-6 rounded-xl bg-[#9999FF] px-8 py-4 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.25)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_30px_rgba(153,153,255,0.5)]"
					>
						Play Again
					</button>
				</div>
			{/if}
		</div>

		<!-- Dashboard & Live Controls -->
		<aside class="flex w-full flex-col gap-4 lg:w-80">
			<div class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-5">
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">Score</span>
				<span class="mt-1 text-4xl font-black text-white">{stats.score}</span>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col rounded-2xl border border-white/5 bg-white/5 p-4">
					<span class="text-[9px] font-black tracking-widest text-white/40 uppercase">Time</span>
					<span class="mt-1 text-2xl font-black text-white"
						>{stats.timeAlive}<span class="ml-1 text-xs text-white/40">s</span></span
					>
				</div>
				<div class="flex flex-col rounded-2xl border border-white/5 bg-white/5 p-4">
					<span class="text-[9px] font-black tracking-widest text-white/40 uppercase"
						>Enemy Speed</span
					>
					<span class="mt-1 text-2xl font-black text-[#9999FF]">{stats.currentEnemySpeed}</span>
				</div>
			</div>

			<!-- Dynamic Adjustments Panel -->
			<div class="rounded-2xl border border-white/10 bg-white/2 p-5 backdrop-blur-md">
				<div class="mb-4 flex items-center justify-between">
					<span class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
						>Live Match Tuning</span
					>
					<span class="text-[10px] font-bold text-emerald-400">● Active</span>
				</div>

				<!-- Live Enemy Count Slider -->
				<div class="mb-5 space-y-2">
					<div class="flex justify-between text-xs">
						<span class="text-white/60">Dynamic Enemy Count</span>
						<span class="font-bold text-[#9999FF]">{settings.enemyCount}</span>
					</div>
					<input
						type="range"
						min="1"
						max="15"
						bind:value={settings.enemyCount}
						oninput={handleSettingsChange}
						class="w-full cursor-pointer accent-[#9999FF]"
					/>
				</div>

				<!-- Live Speed Multiplier Slider -->
				<div class="space-y-2">
					<div class="flex justify-between text-xs">
						<span class="text-white/60">Speed Multiplier / sec</span>
						<span class="font-bold text-[#9999FF]"
							>+{Math.round(settings.speedAccelPerSec * 100)}%</span
						>
					</div>
					<input
						type="range"
						min="0.005"
						max="0.08"
						step="0.005"
						bind:value={settings.speedAccelPerSec}
						oninput={handleSettingsChange}
						class="w-full cursor-pointer accent-[#9999FF]"
					/>
				</div>
			</div>

			<div class="space-y-1 rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-white/50">
				<p class="font-bold text-white/80">Movement & Mechanics:</p>
				<p>
					Smooth corridor turning with <span class="text-[#9999FF]">W/A/S/D</span> or
					<span class="text-[#9999FF]">Arrows</span>. Enemies automatically reroute through maze
					paths.
				</p>
			</div>
		</aside>
	</main>
</div>
