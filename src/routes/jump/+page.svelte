<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { DEFAULTS, THEMES, PRESETS, FIELDS } from './game.config';
	import { createMainGameScene } from './game.engine';
	import type Phaser from 'phaser';

	// --- Svelte 5 Reactive States (Runes) ---
	let gameState = $state('start'); // 'start' | 'playing' | 'paused' | 'gameover'
	let score = $state(0);
	let high = $state(0);
	let currentView = $state(''); // '' | 'tuning' | 'style'
	let btn = $state({ u: false, d: false });

	let settings = $state<typeof DEFAULTS>({ ...DEFAULTS });
	let gameInstance: Phaser.Game | null = null;

	// --- Core Game Synchronization Bridge ---
	const runtimeBridge = {
		get gameState() {
			return gameState;
		},
		set gameState(val) {
			gameState = val;
		},
		get settings() {
			return settings;
		},
		get btn() {
			return btn;
		},
		addPoint() {
			score++;
		}
	};

	// --- Persistent LocalStorage Sync Logic ---
	$effect(() => {
		if (typeof window !== 'undefined') {
			high = Number(localStorage.getItem('averojump_hi')) || 0;
			const savedCfg = localStorage.getItem('averojump_cfg');
			if (savedCfg) {
				try {
					settings = JSON.parse(savedCfg);
				} catch {
					settings = { ...DEFAULTS };
				}
			}
		}
	});

	$effect(() => {
		if (score > high) {
			high = score;
			localStorage.setItem('averojump_hi', String(high));
		}
	});

	$effect(() => {
		localStorage.setItem('averojump_cfg', JSON.stringify(settings));
	});

	// --- UI Methods & Action Controllers ---
	function triggerSceneRefresh() {
		if (!gameInstance) return;
		const mainGame = gameInstance.scene.getScene('MainGame') as Phaser.Scene & {
			updateTextures?: () => void;
		};
		if (mainGame && typeof mainGame.updateTextures === 'function') {
			mainGame.updateTextures();
		}
	}

	function applyPresetTheme(themeKey: string) {
		settings.colors = { ...THEMES[themeKey as keyof typeof THEMES] } as typeof settings.colors;
		triggerSceneRefresh();
	}

	function applyConfigPreset(presetKey: string) {
		settings = {
			...settings,
			...JSON.parse(JSON.stringify(PRESETS[presetKey as keyof typeof PRESETS]))
		};
		triggerSceneRefresh();
	}

	function handlePrimaryAction() {
		if (gameState === 'paused') {
			gameState = 'playing';
			gameInstance?.scene.resume('MainGame');
		} else {
			score = 0;
			gameState = 'playing';
			const mainGame = gameInstance?.scene.getScene('MainGame');
			if (mainGame) mainGame.scene.restart();
		}
	}

	function togglePauseState() {
		if (gameState === 'playing') {
			gameState = 'paused';
			gameInstance?.scene.pause('MainGame');
		} else {
			handlePrimaryAction();
		}
	}

	// --- Native Mount Bootstrap Pipeline ---
	function purgeEngineConfiguration() {
		localStorage.removeItem('averojump_cfg');
		if (typeof window !== 'undefined') window.location.reload();
	}

	onMount(async () => {
		const PhaserModule = (await import('phaser')).default;
		const MainGameScene = createMainGameScene(PhaserModule, runtimeBridge);

		gameInstance = new PhaserModule.Game({
			type: PhaserModule.AUTO,
			parent: 'game-canvas-mount',
			width: 2000,
			height: 1000,
			scale: {
				mode: PhaserModule.Scale.FIT,
				autoCenter: PhaserModule.Scale.CENTER_BOTH
			},
			physics: { default: 'arcade' },
			scene: MainGameScene
		});

		gameInstance.registry.set('bus', runtimeBridge);

		window.addEventListener('pointerup', () => {
			btn.u = btn.d = false;
		});
	});

	onDestroy(() => {
		if (gameInstance) {
			gameInstance.destroy(true);
		}
	});
</script>

<div
	class="flex h-screen w-screen items-center justify-center overflow-hidden bg-black font-sans tracking-tight text-slate-200 antialiased"
>
	<!-- Adaptive Aspect Container - Scales dynamically to max height/width geometry bounds -->
	<div
		class="relative aspect-2/1 h-full max-h-screen w-full max-w-[100vw] overflow-hidden border border-white/10 bg-white/2 p-2 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-500 md:p-4"
	>
		<!-- Native Mount Node Target -->
		<div id="game-canvas-mount" class="h-full w-full overflow-hidden rounded-2xl bg-black"></div>

		<!-- Fully De-Coupled Svelte HUD & Configuration Overlay -->
		<div
			class="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 select-none"
		>
			<div
				class="absolute right-6 bottom-4 font-mono text-[9px] font-bold tracking-[0.3em] text-white uppercase opacity-20"
			>
				AVERO PIPELINE V1.4 // RUNES
			</div>

			<!-- Start / Pause / GameOver Core Modals Panel Layout -->
			{#if gameState !== 'playing'}
				<div
					class="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md transition-all duration-300"
				>
					<div
						class="mx-4 flex max-h-[90vh] w-full max-w-sm scrollbar-none flex-col items-center gap-4 overflow-y-auto rounded-4xl border border-white/12 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl"
					>
						<h1 class="font-mono text-2xl font-black tracking-tighter text-white uppercase">
							Avero <span class="text-[#9999FF]">Jump</span>
						</h1>

						{#if gameState !== 'start'}
							<div class="w-full rounded-xl border border-white/5 bg-white/5 py-3 text-center">
								<p class="text-sm font-black tracking-widest text-red-500 uppercase">
									Pipeline Terminated
								</p>
								<p class="mt-1 font-mono text-3xl font-black tracking-tight text-white">{score}</p>
							</div>
						{/if}

						<button
							onclick={handlePrimaryAction}
							class="w-full rounded-xl bg-[#9999FF] px-6 py-3.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
						>
							{gameState === 'paused' ? 'Resume Engine Pipeline' : 'Initialize Execution'}
						</button>

						<div class="grid w-full grid-cols-2 gap-2">
							<button
								onclick={() => (currentView = currentView === 'tuning' ? '' : 'tuning')}
								class="{currentView === 'tuning'
									? 'bg-white text-black'
									: 'bg-white/5 text-white hover:bg-white/10'} rounded-lg border border-white/5 p-2 text-[10px] font-bold tracking-wider uppercase transition-all"
							>
								[ System Tuning ]
							</button>
							<button
								onclick={() => (currentView = currentView === 'style' ? '' : 'style')}
								class="{currentView === 'style'
									? 'bg-white text-black'
									: 'bg-white/5 text-white hover:bg-white/10'} rounded-lg border border-white/5 p-2 text-[10px] font-bold tracking-wider uppercase transition-all"
							>
								[ Aesthetic Node ]
							</button>
						</div>

						<!-- Mechanics Parameters Custom Tuning Field Array -->
						{#if currentView === 'tuning'}
							<div
								class="flex w-full flex-col gap-3 rounded-xl border border-white/5 bg-white/5 p-4 transition-all duration-300"
							>
								<div class="mb-1 grid grid-cols-4 gap-1">
									{#each Object.keys(PRESETS) as nodeKey (nodeKey)}
										<button
											onclick={() => applyConfigPreset(nodeKey)}
											class="truncate rounded border border-white/5 bg-white/5 p-1 font-mono text-[8px] tracking-tighter text-zinc-400 uppercase hover:bg-white/10"
										>
											{nodeKey}
										</button>
									{/each}
								</div>
								<div
									class="flex h-[180px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-col gap-2 overflow-y-auto pr-1"
								>
									{#each FIELDS as field (field.k)}
										<div class="flex flex-col rounded-lg border border-white/5 bg-black/40 p-2">
											<div
												class="mb-1 flex justify-between font-mono text-[9px] font-bold tracking-wider uppercase"
											>
												<span class="text-zinc-500">{field.n}</span>
												<span class="text-[#9999FF]"
													>{settings[field.k as keyof typeof settings]}</span
												>
											</div>
											<input
												type="range"
												bind:value={settings[field.k as keyof typeof settings]}
												min={field.min}
												max={field.max}
												oninput={triggerSceneRefresh}
												class="w-full accent-[#9999FF]"
											/>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Vector Graphics Texture Swapper Core Matrix -->
						{#if currentView === 'style'}
							<div
								class="flex w-full flex-col gap-3 rounded-xl border border-white/5 bg-white/5 p-4 transition-all duration-300"
							>
								<div class="mb-1 grid grid-cols-3 gap-1">
									{#each Object.keys(THEMES) as themeKey (themeKey)}
										<button
											onclick={() => applyPresetTheme(themeKey)}
											class="rounded border border-white/5 bg-white/5 p-1 font-mono text-[9px] text-zinc-400 uppercase hover:bg-white/10"
										>
											{themeKey}
										</button>
									{/each}
								</div>
								<div class="grid grid-cols-2 gap-2">
									{#each Object.keys(settings.colors) as colorProperty (colorProperty)}
										<div
											class="flex items-center justify-between rounded-lg border border-white/5 bg-black/40 p-1.5"
										>
											<span
												class="pl-1 font-mono text-[8px] font-bold tracking-widest text-zinc-500 uppercase"
												>{colorProperty}</span
											>
											<input
												type="color"
												bind:value={settings.colors[colorProperty as keyof typeof settings.colors]}
												oninput={triggerSceneRefresh}
												class="h-5 w-5 cursor-pointer overflow-hidden rounded border-0 bg-transparent"
											/>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<button
							onclick={purgeEngineConfiguration}
							class="mt-1 font-mono text-[9px] font-bold tracking-widest uppercase opacity-30 transition-all hover:text-red-400 hover:opacity-100"
						>
							// Reset Matrix Registry
						</button>
					</div>
				</div>
			{/if}

			<!-- Live Core Active Match Telemetry Frame -->
			{#if gameState === 'playing'}
				<div class="pointer-events-none flex w-full items-start justify-between">
					<div
						class="flex items-baseline gap-4 rounded-2xl border border-white/5 bg-black/40 p-4 font-mono shadow-xl backdrop-blur-md"
					>
						<div>
							<span
								class="mb-1 block text-[9px] leading-none font-bold tracking-widest text-zinc-500 uppercase"
								>Live Telemetry</span
							>
							<span class="text-3xl font-black tracking-tighter text-white">{score}</span>
						</div>
						<div class="border-l border-white/10 pl-4">
							<span
								class="mb-1 block text-[9px] leading-none font-bold tracking-widest text-zinc-500 uppercase"
								>Record High</span
							>
							<span class="text-sm font-bold text-[#9999FF]">{high}</span>
						</div>
					</div>

					<button
						onclick={togglePauseState}
						aria-label="Pause game"
						class="pointer-events-auto rounded-xl border border-white/5 bg-black/40 p-3.5 text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/10 active:scale-90"
					>
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
						</svg>
					</button>
				</div>
			{/if}

			<!-- Tactile Input Controller Trackpad Nodes -->
			{#if gameState === 'playing'}
				<div class="pointer-events-auto mb-2 ml-2 flex gap-4 self-start">
					<button
						onpointerdown={() => (btn.u = true)}
						onpointerup={() => (btn.u = false)}
						ontouchstart={(e) => {
							e.preventDefault();
							btn.u = true;
						}}
						ontouchend={(e) => {
							e.preventDefault();
							btn.u = false;
						}}
						aria-label="Move up"
						class="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-md transition-all select-none active:border-[#9999FF]/40 active:bg-[#9999FF]/20"
					>
						<svg
							class="h-6 w-6 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="3"
						>
							<path d="M5 15l7-7 7 7" />
						</svg>
					</button>
					<button
						onpointerdown={() => (btn.d = true)}
						onpointerup={() => (btn.d = false)}
						ontouchstart={(e) => {
							e.preventDefault();
							btn.d = true;
						}}
						ontouchend={(e) => {
							e.preventDefault();
							btn.d = false;
						}}
						aria-label="Move down"
						class="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-md transition-all select-none active:border-[#9999FF]/40 active:bg-[#9999FF]/20"
					>
						<svg
							class="h-6 w-6 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="3"
						>
							<path d="M19 9l-7 7-7-7" />
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Prevent defaults overriding absolute vector viewport maps */
	:global(canvas) {
		max-width: 100% !important;
		max-height: 100% !important;
		object-fit: contain;
	}
</style>
