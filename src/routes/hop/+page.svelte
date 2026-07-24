<script lang="ts">
	import { onMount } from 'svelte';
	import {
		gameState,
		score,
		highScore,
		speedMultiplier,
		configMatrix,
		formatScore
	} from './stores';
	import GameCanvas from './GameCanvas.svelte';

	let gameCanvasRef = $state<GameCanvas | null>(null);

	function handleKeyDown(e: KeyboardEvent) {
		if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
			e.preventDefault();
			if ($gameState === 'RUNNING') {
				gameCanvasRef?.triggerJump();
			} else {
				gameCanvasRef?.startEngineCycle();
			}
		}
	}

	function handleInputTap(e: TouchEvent | MouseEvent) {
		if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input'))
			return;

		if ($gameState === 'RUNNING') {
			gameCanvasRef?.triggerJump();
		} else {
			gameCanvasRef?.startEngineCycle();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<div
	class="flex min-h-screen scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent items-center justify-center overflow-y-auto bg-black p-4 font-sans tracking-tight text-white antialiased md:p-12"
>
	<!-- Canvas Outer Wrapper Frame -->
	<div
		class="w-full max-w-5xl rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4"
	>
		<!-- Interactive Node Header Core HUD -->
		<header
			class="mb-6 flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
		>
			<div>
				<h1 class="text-2xl leading-none font-black tracking-tighter uppercase sm:text-3xl">
					Avero <span class="text-[#9999FF]">Hop</span>
				</h1>
				<p
					class="mt-2 flex items-center gap-2 text-[9px] font-black tracking-[0.25em] text-white/40 uppercase"
				>
					{#if $gameState === 'RUNNING'}
						<span class="h-2 w-2 animate-ping rounded-full bg-emerald-500"></span>
						<span class="text-emerald-400">Quantum Stream Active</span>
					{:else}
						<span class="h-2 w-2 rounded-full bg-zinc-600"></span>
						Telemetry Standby
					{/if}
				</p>
			</div>

			<!-- Dynamic Metrics Node Grid Layout -->
			<div
				class="flex gap-4 rounded-xl border border-white/5 bg-black p-3 font-mono text-xs font-bold shadow-inner backdrop-blur-md"
			>
				<div class="text-zinc-500">
					HI <span class="text-zinc-200">{formatScore($highScore)}</span>
				</div>
				<div class="text-[#9999FF]">
					SCORE <span class="text-white">{formatScore($score)}</span>
				</div>
				{#if $speedMultiplier > 1}
					<div class="animate-pulse text-emerald-400">x{$speedMultiplier.toFixed(1)}</div>
				{/if}
			</div>
		</header>

		<!-- Viewport System Housing -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div onmousedown={handleInputTap} ontouchstart={handleInputTap} class="relative w-full">
			<GameCanvas bind:this={gameCanvasRef}>
				<!-- System Inactive UI Screen Overlay Layout -->
				{#if $gameState === 'START'}
					<div
						class="absolute inset-0 z-10 flex animate-[fadeIn_0.2s_ease-out] flex-col items-center justify-center bg-black/80 p-4 text-center backdrop-blur-md"
					>
						<div class="mb-2 animate-bounce text-3xl">⚡</div>
						<h2 class="text-sm font-black tracking-widest text-white uppercase">
							System Ready for Injection
						</h2>
						<p class="mt-2 mb-6 hidden max-w-xs text-[11px] leading-relaxed text-zinc-400 sm:block">
							Press <span
								class="rounded border border-white/10 bg-zinc-900 px-1.5 py-0.5 font-mono text-white shadow-md"
								>SPACE</span
							> or click viewscreen to hop structural obstacles.
						</p>
						<p class="mt-2 mb-6 max-w-xs text-[11px] leading-relaxed text-zinc-400 sm:hidden">
							Tap viewport console to clear incoming obstacles.
						</p>
						<button
							onclick={() => gameCanvasRef?.startEngineCycle()}
							class="rounded-xl bg-[#9999FF] px-8 py-3 text-xs font-black tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.2)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.45)]"
						>
							Initialize Stream
						</button>
					</div>
				{/if}

				<!-- System Terminal Impact Screen Overlay Layout -->
				{#if $gameState === 'GAMEOVER'}
					<div
						class="absolute inset-0 z-10 flex animate-[fadeIn_0.2s_ease-out] flex-col items-center justify-center bg-black/90 p-4 text-center backdrop-blur-md"
					>
						<div class="mb-2 font-mono text-lg font-black tracking-[0.3em] text-red-500 uppercase">
							CRITICAL IMPACT DETECTED
						</div>
						<p class="mb-6 font-mono text-xs tracking-wide text-zinc-400">
							Matrix velocity terminated at <span class="font-bold text-white"
								>{Math.floor($score)}</span
							> units
						</p>
						<button
							onclick={() => gameCanvasRef?.startEngineCycle()}
							class="rounded-xl bg-white px-8 py-3 text-xs font-black tracking-wider text-black uppercase shadow-xl transition-all duration-300 hover:bg-zinc-200"
						>
							Restart Cycle
						</button>
					</div>
				{/if}
			</GameCanvas>
		</div>

		<!-- Hardware System Calibration Console Sliders Deck -->
		<div
			class="mt-6 grid w-full grid-cols-1 gap-6 rounded-2xl border border-white/5 bg-white/1 p-5 md:grid-cols-3"
		>
			<div class="flex flex-col gap-2">
				<div
					class="flex items-center justify-between font-mono text-[10px] font-black tracking-wider text-white/40 uppercase"
				>
					<span>Hurdle Max Height Matrix</span>
					<span class="font-bold text-[#9999FF]">{$configMatrix.height}px</span>
				</div>
				<input
					type="range"
					min="20"
					max="80"
					step="1"
					bind:value={$configMatrix.height}
					class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/5 accent-[#9999FF] focus:outline-none"
				/>
			</div>
			<div class="flex flex-col gap-2">
				<div
					class="flex items-center justify-between font-mono text-[10px] font-black tracking-wider text-white/40 uppercase"
				>
					<span>Structural Randomization Scale</span>
					<span class="font-bold text-[#9999FF]">{$configMatrix.randomness}%</span>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					step="5"
					bind:value={$configMatrix.randomness}
					class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/5 accent-[#9999FF] focus:outline-none"
				/>
			</div>
			<div class="flex flex-col gap-2">
				<div
					class="flex items-center justify-between font-mono text-[10px] font-black tracking-wider text-white/40 uppercase"
				>
					<span>Hurdle Frequency Spread</span>
					<span class="font-bold text-[#9999FF]">{$configMatrix.intervalSpread}%</span>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					step="5"
					bind:value={$configMatrix.intervalSpread}
					class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/5 accent-[#9999FF] focus:outline-none"
				/>
			</div>
		</div>

		<footer
			class="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[9px] font-bold tracking-widest text-white/30 uppercase"
		>
			<span>[SPACE / UP / TAP VIEWSCREEN] HOP</span>
			<span>•</span>
			<span>PROGRESSIVE VELOCITY COUPLING ENFORCED</span>
		</footer>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.99);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #9999ff;
		cursor: pointer;
		box-shadow: 0 0 10px rgba(153, 153, 255, 0.8);
		transition: transform 0.1s ease;
	}
	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}
	input[type='range']::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border: none;
		border-radius: 50%;
		background: #9999ff;
		cursor: pointer;
		box-shadow: 0 0 10px rgba(153, 153, 255, 0.8);
	}
</style>
