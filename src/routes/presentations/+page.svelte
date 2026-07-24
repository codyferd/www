<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { exportPresentation, parsePresentationImport } from './exporter';
	import { createPresentationStore } from './presentationStore.svelte';
	import type { SlideElement } from './types';

	const store = createPresentationStore();

	let isDragging = $state(false);
	let dragTarget = $state<SlideElement | null>(null);
	let dragOffset = $state({ x: 0, y: 0 });

	function handleGlobalKeydowns(event: KeyboardEvent) {
		if (event.key === 'Escape' && store.presentationMode) {
			store.presentationMode = false;
		}
		if (store.presentationMode) {
			if (event.key === 'ArrowRight' || event.key === ' ') {
				store.navigateSlide(1);
			} else if (event.key === 'ArrowLeft') {
				store.navigateSlide(-1);
			}
		}
	}

	function startDrag(event: MouseEvent, element: SlideElement) {
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

		store.selectedElement = element;
		isDragging = true;
		dragTarget = element;

		dragOffset.x = event.clientX - element.left;
		dragOffset.y = event.clientY - element.top;

		window.addEventListener('mousemove', onDrag);
		window.addEventListener('mouseup', stopDrag);
	}

	function onDrag(event: MouseEvent) {
		if (!isDragging || !dragTarget) return;
		dragTarget.left = event.clientX - dragOffset.x;
		dragTarget.top = event.clientY - dragOffset.y;
	}

	function stopDrag() {
		isDragging = false;
		dragTarget = null;
		window.removeEventListener('mousemove', onDrag);
		window.removeEventListener('mouseup', stopDrag);
	}

	function triggerImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json,application/json';

		input.onchange = (e: Event) => {
			const target = e.target as HTMLInputElement;
			const file = target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (evt) => {
				const text = evt.target?.result as string;
				const parsedData = parsePresentationImport(text);
				if (parsedData) {
					store.setSlides(parsedData);
				}
			};
			reader.readAsText(file);
		};
		input.click();
	}

	onMount(() => {
		window.addEventListener('keydown', handleGlobalKeydowns);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleGlobalKeydowns);
	});
</script>

<div
	class="flex h-screen w-screen flex-col overflow-hidden bg-black font-sans text-white select-none"
>
	<!-- Top Navigation Header -->
	{#if !store.presentationMode}
		<header
			class="z-30 flex items-center justify-between border-b border-white/10 bg-black/80 px-6 py-3.5 backdrop-blur-xl"
		>
			<div class="flex items-center gap-3">
				<span class="text-xl font-black tracking-wider text-[#9999FF]">AVERO</span>
				<span
					class="rounded-lg border border-[#9999FF]/20 bg-[#9999FF]/10 px-2.5 py-1 text-[10px] font-black tracking-[0.2em] text-[#9999FF] uppercase"
				>
					Presentations
				</span>
			</div>

			<div class="flex items-center gap-3">
				<button
					onclick={() => {
						store.presentationMode = true;
						store.selectedElement = null;
					}}
					class="flex items-center gap-2 rounded-xl bg-[#9999FF] px-5 py-2.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
				>
					<span>▶ Play Presentation</span>
				</button>
				<button
					onclick={() => exportPresentation(store.slides)}
					class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-[#9999FF]/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(153,153,255,0.15)]"
				>
					Export JSON
				</button>
				<button
					onclick={triggerImport}
					class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition hover:border-white/20 hover:text-white"
				>
					Import JSON
				</button>
			</div>
		</header>
	{/if}

	<div class="relative flex flex-1 overflow-hidden">
		<!-- Left Slide Sidebar -->
		{#if !store.presentationMode}
			<aside
				class="z-20 flex w-64 flex-col justify-between border-r border-white/10 bg-black/90 backdrop-blur-xl"
			>
				<div
					class="flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-4 overflow-y-auto p-4"
				>
					<div class="flex items-center justify-between">
						<h2 class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">Slides</h2>
						<span class="font-mono text-xs text-[#9999FF]">{store.slides.length} total</span>
					</div>

					<div class="space-y-3">
						{#each store.slides as slide, index (slide.id)}
							<div
								role="button"
								tabindex="0"
								onclick={() => (store.currentSlideIndex = index)}
								onkeydown={(e) => e.key === 'Enter' && (store.currentSlideIndex = index)}
								class="group relative flex h-24 cursor-pointer flex-col justify-between rounded-2xl border p-3.5 transition-all duration-300 {store.currentSlideIndex ===
								index
									? 'border-[#9999FF] bg-white/5 shadow-[0_0_20px_rgba(153,153,255,0.15)]'
									: 'border-white/5 bg-white/2 hover:border-[#9999FF]/30 hover:bg-white/4'}"
							>
								<div class="flex items-start justify-between">
									<span class="font-mono text-xs text-white/40">#{index + 1}</span>
									<button
										onclick={(e) => {
											e.stopPropagation();
											store.deleteSlide(index);
										}}
										class="p-1 text-xs text-white/40 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
										title="Delete Slide"
									>
										✕
									</button>
								</div>
								<div class="truncate text-xs font-medium text-white/80">
									{slide.elements[0]?.content || 'Empty Slide'}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="border-t border-white/10 p-4">
					<button
						onclick={store.addSlide}
						class="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold tracking-wider text-white uppercase transition-all duration-300 hover:border-[#9999FF]/40 hover:bg-[#9999FF]/10 hover:text-[#9999FF]"
					>
						+ Add Blank Slide
					</button>
				</div>
			</aside>
		{/if}

		<!-- Main Canvas Area -->
		<main
			class="relative flex flex-1 flex-col items-center justify-center overflow-auto bg-black p-8 transition-all duration-300"
		>
			{#if store.presentationMode}
				<div
					class="pointer-events-none absolute top-4 left-4 z-50 rounded-xl border border-white/10 bg-black/60 px-4 py-2 font-mono text-xs tracking-widest text-white/60 uppercase backdrop-blur-md"
				>
					Press <kbd class="rounded bg-white/10 px-1.5 py-0.5 text-white">ESC</kbd> to exit presentation
				</div>
			{/if}

			<!-- Element Floating Add Toolbar -->
			{#if !store.presentationMode}
				<div
					class="absolute top-4 left-4 z-20 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-xl"
				>
					<div class="flex items-center gap-2 border-r border-white/10 pr-4">
						<button
							onclick={() => store.addElement('text')}
							class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#9999FF]/40 hover:bg-[#9999FF]/10 hover:text-[#9999FF]"
						>
							+ Text
						</button>
						<button
							onclick={() => store.addElement('image')}
							class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#9999FF]/40 hover:bg-[#9999FF]/10 hover:text-[#9999FF]"
						>
							+ Image
						</button>
						<button
							onclick={() => store.addElement('shape')}
							class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#9999FF]/40 hover:bg-[#9999FF]/10 hover:text-[#9999FF]"
						>
							+ Shape
						</button>
					</div>

					{#if store.currentSlide}
						<div class="flex items-center gap-3 text-xs">
							<label
								for="slide-bg-picker"
								class="text-[10px] font-black tracking-widest text-white/40 uppercase"
								>Slide Bg:</label
							>
							<input
								id="slide-bg-picker"
								type="color"
								bind:value={store.currentSlide.background}
								class="h-6 w-6 cursor-pointer border-0 bg-transparent"
							/>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Selected Element Properties Floating Toolbar -->
			{#if store.selectedElement && !store.presentationMode}
				<div
					class="absolute top-4 right-4 z-20 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/80 p-3 text-xs shadow-2xl backdrop-blur-xl"
				>
					<span class="font-mono text-[10px] font-bold tracking-widest text-[#9999FF] uppercase">
						{store.selectedElement.type} Attributes
					</span>

					{#if store.selectedElement.type === 'text'}
						<div class="flex items-center gap-3 border-l border-white/10 pl-4">
							<label for="font-size-input" class="text-white/40">Font Size:</label>
							<input
								id="font-size-input"
								type="number"
								bind:value={store.selectedElement.fontSize}
								class="w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white outline-none focus:border-[#9999FF]"
							/>

							<div class="flex items-center gap-1">
								<label for="box-w-input" class="text-white/40">W:</label>
								<input
									id="box-w-input"
									type="number"
									bind:value={store.selectedElement.width}
									class="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white outline-none focus:border-[#9999FF]"
								/>
							</div>

							<div class="flex items-center gap-1">
								<label for="box-h-input" class="text-white/40">H:</label>
								<input
									id="box-h-input"
									type="number"
									bind:value={store.selectedElement.height}
									class="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white outline-none focus:border-[#9999FF]"
								/>
							</div>

							<label for="text-color-picker" class="text-white/40">Color:</label>
							<input
								id="text-color-picker"
								type="color"
								bind:value={store.selectedElement.color}
								class="h-6 w-6 cursor-pointer border-0 bg-transparent"
							/>
						</div>
					{/if}

					{#if store.selectedElement.type === 'shape'}
						<div class="flex items-center gap-3 border-l border-white/10 pl-4">
							<label for="shape-color-picker" class="text-white/40">Color:</label>
							<input
								id="shape-color-picker"
								type="color"
								bind:value={store.selectedElement.color}
								class="h-6 w-6 cursor-pointer border-0 bg-transparent"
							/>

							<label for="shape-radius-input" class="text-white/40">Radius:</label>
							<input
								id="shape-radius-input"
								type="number"
								bind:value={store.selectedElement.radius}
								class="w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white outline-none focus:border-[#9999FF]"
							/>
						</div>
					{/if}

					<div class="flex items-center gap-1.5 border-l border-white/10 pl-4">
						<button
							onclick={() => store.changeLayer('up')}
							class="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white/60 transition hover:bg-white/10 hover:text-white"
							title="Bring Forward"
						>
							▲
						</button>
						<button
							onclick={() => store.changeLayer('down')}
							class="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white/60 transition hover:bg-white/10 hover:text-white"
							title="Send Backward"
						>
							▼
						</button>
					</div>

					<button
						onclick={store.deleteElement}
						class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-red-400 transition hover:bg-red-500/20"
					>
						Delete
					</button>
				</div>
			{/if}

			<!-- Canvas Container Frame -->
			{#if store.currentSlide}
				<div
					style="background-color: {store.currentSlide.background};"
					class="relative h-135 w-240 overflow-hidden transition-all duration-300 {store.presentationMode
						? 'scale-110 shadow-[0_0_80px_rgba(153,153,255,0.1)]'
						: 'rounded-[28px] border border-white/10 bg-white/2 backdrop-blur-xl hover:border-[#9999FF]/20'}"
				>
					{#each store.currentSlide.elements as el (el.id)}
						<div
							role="button"
							tabindex="0"
							onmousedown={(e) => !store.presentationMode && startDrag(e, el)}
							onclick={(e) => {
								e.stopPropagation();
								if (!store.presentationMode) store.selectedElement = el;
							}}
							onkeydown={(e) =>
								e.key === 'Enter' && !store.presentationMode && (store.selectedElement = el)}
							style="top: {el.top}px; left: {el.left}px; z-index: {el.zIndex || 1};"
							class="group absolute p-2 select-none {!store.presentationMode
								? 'cursor-move border border-transparent hover:border-dashed hover:border-[#9999FF]/50'
								: ''} {store.selectedElement === el && !store.presentationMode
								? 'rounded-xl border border-[#9999FF] shadow-[0_0_15px_rgba(153,153,255,0.3)]'
								: ''}"
						>
							{#if el.type === 'text'}
								<div
									style="font-size: {el.fontSize}px; color: {el.color ||
										'#ffffff'}; width: {el.width}px; height: {el.height
										? el.height + 'px'
										: 'auto'}; overflow: {el.height ? 'hidden' : 'visible'};"
									class="wrap-break-word"
								>
									{#if store.presentationMode}
										<span class="block h-full w-full font-sans whitespace-pre-wrap"
											>{el.content}</span
										>
									{:else}
										<textarea
											bind:value={el.content}
											style="color: {el.color || '#ffffff'};"
											class="h-full w-full resize-none border-b border-transparent bg-transparent font-sans outline-none focus:border-[#9999FF]/50"
										></textarea>
									{/if}
								</div>
							{/if}

							{#if el.type === 'image'}
								<div class="w-64">
									<img
										src={el.content}
										class="pointer-events-none h-auto w-full rounded-xl object-cover shadow-lg"
										alt="Slide asset"
									/>
									{#if !store.presentationMode}
										<input
											type="text"
											bind:value={el.content}
											placeholder="Image URL"
											class="mt-2 w-full rounded-lg border border-white/10 bg-black/80 p-1.5 text-[10px] text-white/60 opacity-0 transition-opacity outline-none group-hover:opacity-100 focus:border-[#9999FF]"
										/>
									{/if}
								</div>
							{/if}

							{#if el.type === 'shape'}
								<div
									style="background-color: {el.color ||
										'#9999FF'}; width: {el.width}px; height: {el.height}px; border-radius: {el.radius ||
										0}px;"
									class="shadow-lg"
								></div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<!-- Bottom Navigation Overlay Dock -->
			{#if store.presentationMode}
				<div
					class="absolute bottom-6 z-50 flex items-center gap-6 rounded-2xl border border-white/10 bg-black/80 px-6 py-3 shadow-2xl backdrop-blur-xl"
				>
					<button
						onclick={() => store.navigateSlide(-1)}
						class="text-xs font-bold text-white/60 transition hover:text-[#9999FF]"
					>
						◀ Prev
					</button>
					<span class="font-mono text-xs text-white/40">
						Slide {store.currentSlideIndex + 1} / {store.slides.length}
					</span>
					<button
						onclick={() => store.navigateSlide(1)}
						class="text-xs font-bold text-white/60 transition hover:text-[#9999FF]"
					>
						Next ▶
					</button>
				</div>
			{/if}
		</main>
	</div>
</div>
