<script lang="ts">
	import { onDestroy } from 'svelte';
	import { SnakeEngine } from './snakeEngine.svelte';

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let wrapperEl = $state<HTMLElement | null>(null);

	const engine = new SnakeEngine();

	const handleKeydown = (e: KeyboardEvent) => {
		engine.handleInput(e.code);
	};

	// Initialize canvas context and global listeners when elements bind
	$effect(() => {
		if (canvasEl && wrapperEl) {
			engine.init(canvasEl, wrapperEl);
			window.addEventListener('keydown', handleKeydown);
			window.addEventListener('resize', engine.handleResize);
		}
	});

	onDestroy(() => {
		engine.destroy();
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('resize', engine.handleResize);
		}
	});
</script>

<div
	class="flex h-screen w-screen touch-none flex-col items-center justify-start gap-3 overflow-hidden bg-black p-4 font-sans text-white select-none"
>
	<!-- Top Bar HUD / Metrics Card -->
	<header
		class="flex w-full max-w-xl shrink-0 items-center justify-between rounded-2xl border border-white/10 bg-white/2 px-6 py-3 backdrop-blur-xl transition duration-300 hover:border-[#9999FF]/20"
	>
		<div class="flex flex-col">
			<span class="text-[9px] font-black tracking-[0.25em] text-white/40 uppercase"
				>System Score</span
			>
			<span class="font-mono text-2xl font-black text-[#9999FF]">{engine.score}</span>
		</div>
		<div class="flex flex-col text-right">
			<span class="text-[9px] font-black tracking-[0.25em] text-white/40 uppercase"
				>High Target</span
			>
			<span class="font-mono text-2xl font-black text-white/50">{engine.highScore}</span>
		</div>
	</header>

	<!-- Main Container (Canvas + D-Pad tightly grouped) -->
	<main
		class="flex min-h-0 w-full max-w-xl flex-1 flex-col items-center justify-start gap-3 overflow-hidden"
	>
		<!-- Game Arena Canvas Container -->
		<div
			class="relative flex min-h-0 flex-1 items-center justify-center rounded-[28px] border border-white/10 bg-white/2 p-2 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20"
			bind:this={wrapperEl}
		>
			<canvas bind:this={canvasEl} class="block rounded-2xl bg-black shadow-inner"></canvas>

			{#if !engine.isRunning}
				<div
					class="absolute inset-0 z-50 flex items-center justify-center rounded-[28px] bg-black/90 backdrop-blur-md"
				>
					<div class="px-6 text-center">
						<h2 class="mb-2 text-3xl font-black tracking-tight text-white uppercase md:text-4xl">
							{engine.isGameOver ? 'Matrix Overload' : 'Avero Snake'}
						</h2>
						<p class="mb-8 font-mono text-[10px] tracking-widest text-white/40 uppercase">
							Controls: WASD or Directional Keys
						</p>
						<button
							type="button"
							onclick={() => engine.startSimulation()}
							class="rounded-xl bg-[#9999FF] px-8 py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)] active:scale-95"
						>
							{engine.isGameOver ? 'Re-Initialize' : 'Engage System'}
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Touch D-Pad Controls (Anchored Directly Below Canvas) -->
		<div class="flex w-full max-w-56 shrink-0 flex-col items-center gap-1.5 md:hidden">
			<button
				type="button"
				onmousedown={() => engine.handleInput('ArrowUp')}
				ontouchstart={(e) => {
					e.preventDefault();
					engine.handleInput('ArrowUp');
				}}
				class="w-14 rounded-xl border border-white/10 bg-white/3 py-2.5 text-center font-extrabold text-white/80 transition hover:bg-white/10 active:scale-95 active:bg-white/20"
			>
				▲
			</button>
			<div class="flex w-full justify-between gap-1.5">
				<button
					type="button"
					onmousedown={() => engine.handleInput('ArrowLeft')}
					ontouchstart={(e) => {
						e.preventDefault();
						engine.handleInput('ArrowLeft');
					}}
					class="w-14 rounded-xl border border-white/10 bg-white/3 py-2.5 text-center font-extrabold text-white/80 transition hover:bg-white/10 active:scale-95 active:bg-white/20"
				>
					◀
				</button>
				<button
					type="button"
					onmousedown={() => engine.handleInput('ArrowDown')}
					ontouchstart={(e) => {
						e.preventDefault();
						engine.handleInput('ArrowDown');
					}}
					class="w-14 rounded-xl border border-white/10 bg-white/3 py-2.5 text-center font-extrabold text-white/80 transition hover:bg-white/10 active:scale-95 active:bg-white/20"
				>
					▼
				</button>
				<button
					type="button"
					onmousedown={() => engine.handleInput('ArrowRight')}
					ontouchstart={(e) => {
						e.preventDefault();
						engine.handleInput('ArrowRight');
					}}
					class="w-14 rounded-xl border border-white/10 bg-white/3 py-2.5 text-center font-extrabold text-white/80 transition hover:bg-white/10 active:scale-95 active:bg-white/20"
				>
					▶
				</button>
			</div>
		</div>
	</main>
</div>
