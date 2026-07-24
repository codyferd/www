<script lang="ts">
	import { onMount } from 'svelte';
	import Canvas from './Canvas.svelte';
	import {
		tools,
		currentTool,
		brushColor,
		brushSize,
		brushOpacity,
		textContent,
		layers,
		activeLayerId,
		zoomScale,
		canvasSize,
		createLayer,
		historyStack,
		redoStack,
		canUndo,
		canRedo,
		type ToolId
	} from './stores';

	let canvasComponent: Canvas;
	let imageInput: HTMLInputElement;

	onMount(() => {
		if ($layers.length === 0) {
			const initial = createLayer('Background Layer');
			layers.set([initial]);
			activeLayerId.set(initial.id);
		}
	});

	function handleUndo() {
		if (!$canUndo) return;
		const currentSnapshot = canvasComponent.captureState();
		redoStack.update((r) => [...r, JSON.stringify(currentSnapshot)]);

		historyStack.update((h) => {
			const target = JSON.parse(h[h.length - 1]);
			canvasComponent.restoreState(target);
			return h.slice(0, -1);
		});
	}

	function handleRedo() {
		if (!$canRedo) return;
		const currentSnapshot = canvasComponent.captureState();
		historyStack.update((h) => [...h, JSON.stringify(currentSnapshot)]);

		redoStack.update((r) => {
			const target = JSON.parse(r[r.length - 1]);
			canvasComponent.restoreState(target);
			return r.slice(0, -1);
		});
	}

	function addLayer() {
		const layer = createLayer();
		layers.update((l) => [...l, layer]);
		activeLayerId.set(layer.id);
	}

	function toggleVisibility(id: string) {
		layers.update((list) => list.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
	}

	function deleteLayer(id: string) {
		if ($layers.length <= 1) return;
		layers.update((list) => list.filter((l) => l.id !== id));
		if ($activeLayerId === id) {
			activeLayerId.set($layers[$layers.length - 1].id);
		}
	}

	function moveLayer(index: number, dir: 'up' | 'down') {
		layers.update((list) => {
			const next = [...list];
			const targetIdx = dir === 'up' ? index + 1 : index - 1;
			if (targetIdx >= 0 && targetIdx < next.length) {
				[next[index], next[targetIdx]] = [next[targetIdx], next[index]];
			}
			return next;
		});
	}

	function handleImageImport(e: Event) {
		const files = (e.target as HTMLInputElement).files;
		if (!files || !files[0]) return;

		const file = files[0];
		const reader = new FileReader();

		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				// Save current state to history before adding image layer
				if (canvasComponent) {
					historyStack.update((h) => [...h, JSON.stringify(canvasComponent.captureState())]);
					redoStack.set([]);
				}

				// Create new layer for the imported image
				const layerName = file.name.replace(/\.[^/.]+$/, '');
				const newLayer = createLayer(layerName);

				layers.update((list) => [...list, newLayer]);
				activeLayerId.set(newLayer.id);

				// Draw the imported image onto the newly created layer canvas
				setTimeout(() => {
					const el = document.getElementById(`layer-canvas-${newLayer.id}`) as HTMLCanvasElement;
					if (el) {
						const ctx = el.getContext('2d');
						if (ctx) {
							// Fit image proportionally onto canvas
							const hRatio = $canvasSize.width / img.width;
							const vRatio = $canvasSize.height / img.height;
							const ratio = Math.min(hRatio, vRatio, 1);
							const centerShiftX = ($canvasSize.width - img.width * ratio) / 2;
							const centerShiftY = ($canvasSize.height - img.height * ratio) / 2;

							ctx.drawImage(
								img,
								0,
								0,
								img.width,
								img.height,
								centerShiftX,
								centerShiftY,
								img.width * ratio,
								img.height * ratio
							);
							newLayer.dataUrl = el.toDataURL();
						}
					}
				}, 50);
			};
			img.src = event.target?.result as string;
		};

		reader.readAsDataURL(file);
		// Reset file input value so same file can be imported again if needed
		(e.target as HTMLInputElement).value = '';
	}
</script>

<div
	class="flex h-screen w-screen flex-col overflow-hidden bg-black font-sans text-white select-none"
>
	<!-- Top Navigation Header -->
	<header
		class="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-white/2 px-6 backdrop-blur-md"
	>
		<div class="flex items-center space-x-3">
			<span class="text-lg font-black tracking-wider text-[#9999FF]">AVERO</span>
			<span
				class="rounded-full border border-[#9999FF]/20 bg-[#9999FF]/10 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-[#9999FF] uppercase"
				>Paint</span
			>
			<div class="ml-4 flex items-center gap-2">
				<div class="h-2 w-2 animate-ping rounded-full bg-emerald-500"></div>
				<span class="text-[10px] font-bold tracking-wider text-white/40 uppercase"
					>Engine Ready</span
				>
			</div>
		</div>

		<!-- Action Toolbar -->
		<div class="flex items-center space-x-2">
			<button
				onclick={handleUndo}
				disabled={!$canUndo}
				class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold transition hover:border-[#9999FF]/40 hover:bg-white/10 disabled:opacity-30"
				title="Undo"
			>
				⟲ Undo
			</button>
			<button
				onclick={handleRedo}
				disabled={!$canRedo}
				class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold transition hover:border-[#9999FF]/40 hover:bg-white/10 disabled:opacity-30"
				title="Redo"
			>
				⟳ Redo
			</button>

			<div class="mx-1 h-4 w-px bg-white/10"></div>

			<button
				onclick={() => imageInput.click()}
				class="rounded-xl border border-[#9999FF]/30 bg-[#9999FF]/10 px-3 py-1.5 text-xs font-bold text-[#9999FF] transition hover:bg-[#9999FF]/20"
			>
				Import Image
			</button>
			<input
				type="file"
				bind:this={imageInput}
				accept="image/*"
				onchange={handleImageImport}
				class="hidden"
			/>

			<button
				onclick={() => canvasComponent.exportMergedPNG()}
				class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold transition hover:border-[#9999FF]/40 hover:bg-white/10"
			>
				Export PNG
			</button>
		</div>
	</header>

	<!-- Workspace Body -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Left Tools Sidebar -->
		<aside
			class="flex w-20 shrink-0 flex-col items-center justify-between border-r border-white/10 bg-white/2 p-3 backdrop-blur-md"
		>
			<div class="flex w-full flex-col gap-2 overflow-y-auto">
				{#each tools as tool (tool.id)}
					<button
						onclick={() => currentTool.set(tool.id as ToolId)}
						class="flex aspect-square w-full flex-col items-center justify-center rounded-2xl border transition-all duration-300 {$currentTool ===
						tool.id
							? 'border-[#9999FF] bg-[#9999FF]/15 text-[#9999FF] shadow-[0_0_15px_rgba(153,153,255,0.2)]'
							: 'border-white/5 bg-white/2 text-white/60 hover:border-[#9999FF]/30 hover:bg-white/5'}"
						title={tool.name}
					>
						<span class="text-lg">{tool.icon}</span>
						<span class="mt-0.5 text-[9px] font-black tracking-tight uppercase opacity-70"
							>{tool.id}</span
						>
					</button>
				{/each}
			</div>

			<!-- Color Selector -->
			<div
				class="relative flex aspect-square w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-1"
			>
				<input
					type="color"
					bind:value={$brushColor}
					class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
				/>
				<div
					class="h-full w-full rounded-xl border border-white/20 shadow-inner"
					style="background-color: {$brushColor}"
				></div>
			</div>
		</aside>

		<!-- Main Canvas Frame -->
		<main
			class="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-black/90 p-4"
		>
			<!-- Tool Adjustments Bar -->
			<div
				class="absolute top-4 left-4 z-20 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/4 px-4 py-2.5 shadow-lg backdrop-blur-md"
			>
				<div class="flex items-center gap-2 text-xs">
					<span class="text-[10px] font-black tracking-wider text-white/40 uppercase">Size</span>
					<input
						type="range"
						min="1"
						max="100"
						bind:value={$brushSize}
						class="w-20 accent-[#9999FF]"
					/>
					<span class="w-5 font-mono text-[10px] text-white/70">{$brushSize}px</span>
				</div>

				<div class="h-3 w-px bg-white/10"></div>

				<div class="flex items-center gap-2 text-xs">
					<span class="text-[10px] font-black tracking-wider text-white/40 uppercase">Opacity</span>
					<input
						type="range"
						min="1"
						max="100"
						bind:value={$brushOpacity}
						class="w-16 accent-[#9999FF]"
					/>
					<span class="w-7 font-mono text-[10px] text-white/70">{$brushOpacity}%</span>
				</div>

				{#if $currentTool === 'text'}
					<div class="h-3 w-px bg-white/10"></div>
					<input
						type="text"
						bind:value={$textContent}
						placeholder="Enter text..."
						class="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs outline-none focus:border-[#9999FF]/50"
					/>
				{/if}

				<div class="h-3 w-px bg-white/10"></div>

				<div class="flex items-center gap-2 text-xs">
					<span class="text-[10px] font-black tracking-wider text-white/40 uppercase">Zoom</span>
					<button
						onclick={() => zoomScale.update((z) => Math.max(0.2, z - 0.1))}
						class="px-1 text-white/60 hover:text-white">-</button
					>
					<span class="font-mono text-[10px] text-[#9999FF]">{Math.round($zoomScale * 100)}%</span>
					<button
						onclick={() => zoomScale.update((z) => Math.min(3, z + 0.1))}
						class="px-1 text-white/60 hover:text-white">+</button
					>
				</div>
			</div>

			<!-- Canvas View Container -->
			<Canvas bind:this={canvasComponent} />
		</main>

		<!-- Right Layers Panel -->
		<aside
			class="flex w-64 shrink-0 flex-col justify-between border-l border-white/10 bg-white/2 p-4 backdrop-blur-md"
		>
			<div class="flex flex-col space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">Layers</span
					>
					<button
						onclick={addLayer}
						class="rounded-lg border border-[#9999FF]/30 bg-[#9999FF]/10 px-2.5 py-1 text-[10px] font-bold text-[#9999FF] transition hover:bg-[#9999FF]/20"
					>
						+ Add Layer
					</button>
				</div>

				<!-- Layer Item List -->
				<div class="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
					{#each [...$layers].reverse() as layer, reverseIdx (layer.id)}
						{@const actualIdx = $layers.length - 1 - reverseIdx}
						<button
							type="button"
							onclick={() => activeLayerId.set(layer.id)}
							class="flex w-full cursor-pointer items-center justify-between rounded-xl border p-2.5 text-left transition duration-200 {$activeLayerId ===
							layer.id
								? 'border-[#9999FF] bg-[#9999FF]/10 shadow-[0_0_15px_rgba(153,153,255,0.1)]'
								: 'border-white/5 bg-white/2 hover:border-white/20'}"
						>
							<div class="flex items-center gap-2 overflow-hidden">
								<span
									role="button"
									tabindex="0"
									onclick={(e) => {
										e.stopPropagation();
										toggleVisibility(layer.id);
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.stopPropagation();
											toggleVisibility(layer.id);
										}
									}}
									class="cursor-pointer text-xs text-white/50 hover:text-white"
								>
									{layer.visible ? '👁️' : '🕶️'}
								</span>
								<span class="truncate text-xs font-semibold text-white/80">{layer.name}</span>
							</div>

							<div class="flex items-center gap-1">
								<span
									role="button"
									tabindex="0"
									onclick={(e) => {
										e.stopPropagation();
										moveLayer(actualIdx, 'up');
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.stopPropagation();
											moveLayer(actualIdx, 'up');
										}
									}}
									class="cursor-pointer rounded bg-white/5 px-1 text-[10px] text-white/40 hover:text-white"
									>▲</span
								>
								<span
									role="button"
									tabindex="0"
									onclick={(e) => {
										e.stopPropagation();
										moveLayer(actualIdx, 'down');
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.stopPropagation();
											moveLayer(actualIdx, 'down');
										}
									}}
									class="cursor-pointer rounded bg-white/5 px-1 text-[10px] text-white/40 hover:text-white"
									>▼</span
								>
								<span
									role="button"
									tabindex="0"
									onclick={(e) => {
										e.stopPropagation();
										deleteLayer(layer.id);
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.stopPropagation();
											deleteLayer(layer.id);
										}
									}}
									class="ml-1 cursor-pointer text-xs text-red-400/60 hover:text-red-400">✕</span
								>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Quick Metrics Footer -->
			<div
				class="mt-auto flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-4 transition duration-300 hover:border-[#9999FF]/20"
			>
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>Active Stack</span
				>
				<span class="mt-1 text-xl font-black text-white">
					{$layers.length} <span class="ml-1 text-xs font-light text-white/45">Layers</span>
				</span>
				<div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
					<div
						class="h-full bg-[#9999FF]"
						style="width: {Math.min(100, $layers.length * 20)}%"
					></div>
				</div>
			</div>
		</aside>
	</div>
</div>
