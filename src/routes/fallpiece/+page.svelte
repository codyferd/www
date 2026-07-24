<!-- src/routes/fallpiece/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { FallpieceState } from './fallpieceState.svelte';

	const engine = new FallpieceState();

	function handleKeyDown(e: KeyboardEvent) {
		// Block workspace offset shifting while playing
		if (['Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
			e.preventDefault();
		}
		engine.handleInput(e.code);
	}

	function triggerTouchInput(code: string) {
		engine.handleInput(code);
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('resize', () => engine.resizeGameCanvas());

		// Initial sizing run injection
		const timer = setTimeout(() => {
			engine.resizeGameCanvas();
		}, 60);

		// This returned function automatically runs when the component is destroyed
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('resize', () => engine.resizeGameCanvas());
			clearTimeout(timer);
			engine.destroy();
		};
	});
</script>

<div
	class="box-border flex h-screen w-screen touch-none flex-col items-center justify-between overflow-hidden bg-black p-3 font-sans tracking-tight text-gray-200 select-none"
>
	<!-- Top Stats Navigation Array Header -->
	<header class="flex w-full max-w-[500px] shrink-0 items-center justify-between px-2 py-1">
		<div class="flex items-center gap-5">
			<div class="flex flex-col">
				<span class="font-mono text-xs font-black tracking-widest text-white uppercase"
					>Fallpiece</span
				>
				<span
					class="mt-0.5 font-mono text-[9px] font-bold tracking-wider text-[#9999FF]/60 uppercase"
					>Matrix v3.2</span
				>
			</div>

			<div class="border-l border-white/10 pl-4 text-left">
				<span class="block font-mono text-[8px] font-bold tracking-widest text-white/40 uppercase"
					>Score</span
				>
				<span class="font-mono text-lg leading-none font-black text-[#9999FF]">{engine.score}</span>
			</div>

			<div class="border-l border-white/10 pl-4 text-left">
				<span class="block font-mono text-[8px] font-bold tracking-widest text-white/40 uppercase"
					>Level</span
				>
				<span class="font-mono text-lg leading-none font-black text-white">{engine.level}</span>
			</div>
		</div>

		<!-- Next Queue Module Block Component -->
		<div
			class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/2 px-3 py-1.5 backdrop-blur-md"
		>
			<span class="font-mono text-[8px] font-black tracking-widest text-white/40 uppercase"
				>Next</span
			>
			<canvas bind:this={engine.nextCanvas} width="60" height="30" class="block opacity-80"
			></canvas>
		</div>
	</header>

	<!-- Interactive Center Game-Loop Workspace Canvas Arena -->
	<main class="flex w-full max-w-[500px] flex-1 items-center justify-center overflow-hidden p-1">
		<div class="flex h-full w-full items-center justify-center" bind:this={engine.canvasWrapper}>
			<div
				class="relative box-border flex items-center justify-center rounded-[24px] border border-white/10 bg-white/2 p-1 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-500 hover:border-[#9999FF]/20"
			>
				<canvas bind:this={engine.gameCanvas} class="block rounded-2xl bg-zinc-950 shadow-inner"
				></canvas>

				<!-- Core Engine State Menu Overlays -->
				{#if !engine.running}
					<div
						class="absolute inset-0 z-50 flex items-center justify-center rounded-[22px] bg-black/85 backdrop-blur-md"
					>
						<div class="px-6 text-center">
							<h2 class="mb-5 font-mono text-xl font-black tracking-wider text-white uppercase">
								{engine.gameOver ? 'Core Terminated' : 'Fallpiece Engine'}
							</h2>
							<button
								onclick={() => engine.startGame()}
								class="rounded-xl bg-[#9999FF] px-6 py-3 text-[10px] font-black tracking-widest text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
							>
								{engine.gameOver ? 'Reboot System' : 'Initialize Matrix'}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</main>

	<!-- Lower Deck Mobile Macro Touch Controls Matrix -->
	<footer class="z-40 mt-2 mb-1 flex w-full max-w-[420px] shrink-0 flex-col gap-2 px-1 font-mono">
		<div class="flex justify-between gap-2">
			<button
				type="button"
				onpointerdown={() => triggerTouchInput('KeyA')}
				class="flex-1 touch-none rounded-xl border border-white/10 bg-white/2 py-3 text-xs font-bold text-white/80 transition-all select-none active:scale-95 active:bg-white/10"
			>
				◀ LEFT [A]
			</button>
			<button
				type="button"
				onpointerdown={() => triggerTouchInput('KeyW')}
				class="flex-1 touch-none rounded-xl border border-white/10 bg-white/2 py-3 text-xs font-bold text-[#9999FF] shadow-[0_0_15px_rgba(153,153,255,0.02)] transition-all select-none active:scale-95 active:bg-[#9999FF]/20"
			>
				🔄 ROTATE [W]
			</button>
			<button
				type="button"
				onpointerdown={() => triggerTouchInput('KeyD')}
				class="flex-1 touch-none rounded-xl border border-white/10 bg-white/2 py-3 text-xs font-bold text-white/80 transition-all select-none active:scale-95 active:bg-white/10"
			>
				RIGHT [D] ▶
			</button>
		</div>
		<div class="flex justify-between gap-2">
			<button
				type="button"
				onpointerdown={() => triggerTouchInput('KeyS')}
				class="flex-1 touch-none rounded-xl border border-white/10 bg-white/2 py-2.5 text-[10px] font-bold text-white/50 uppercase transition-all select-none active:bg-white/10"
			>
				🔽 Soft [S]
			</button>
			<button
				type="button"
				onpointerdown={() => triggerTouchInput('Space')}
				class="flex-[1.6] touch-none rounded-xl border border-[#9999FF]/30 bg-[#9999FF]/10 py-2.5 text-[10px] font-black text-[#9999FF] uppercase shadow-[0_0_20px_rgba(153,153,255,0.05)] transition-all select-none active:bg-[#9999FF]/20"
			>
				💥 Instant Drop [Space]
			</button>
			<button
				type="button"
				onpointerdown={() => triggerTouchInput('KeyP')}
				class="w-14 touch-none rounded-xl border border-white/10 bg-white/2 py-2.5 text-[10px] font-bold text-white/40 transition-all select-none active:bg-white/10"
			>
				{engine.running ? '⏸ PAUSE' : '▶ PLAY'}
			</button>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		overscroll-behavior: none;
	}
</style>
