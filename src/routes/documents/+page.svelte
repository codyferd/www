<!-- src/routes/documents/+page.svelte -->
<script lang="ts">
	import { slide } from 'svelte/transition';
	import { DocumentState } from './documentState.svelte';

	const state = new DocumentState();

	function handleExport() {
		const packoutData = {
			settings: state.docSettings,
			elements: state.elements
		};
		const dataString = JSON.stringify(packoutData, null, 2);
		const blob = new Blob([dataString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = `avero-doc-${Date.now()}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	function triggerImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.onchange = (e: Event) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (evt) => {
				try {
					const parsedData = JSON.parse(evt.target?.result as string);
					if (parsedData && parsedData.settings && Array.isArray(parsedData.elements)) {
						state.docSettings = parsedData.settings;
						state.elements = parsedData.elements;
						state.selectedElement = null;
						state.viewMode = false;
					} else {
						alert('Invalid Avero Documents layout setup profile.');
					}
				} catch (err) {
					console.error(err);
					alert('Malformed layout structural metadata parsing execution crash.');
				}
			};
			reader.readAsText(file);
		};
		input.click();
	}

	function autoResizeTextarea(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		target.style.height = 'auto';
		target.style.height = target.scrollHeight + 'px';
	}
</script>

<div
	class="flex h-screen w-screen flex-col overflow-hidden bg-black font-sans tracking-tight text-gray-100 select-none"
>
	<!-- Top Navigation Frame -->
	<header
		class="z-30 flex items-center justify-between border-b border-white/5 bg-zinc-950 px-6 py-3"
	>
		<div class="flex items-center space-x-3">
			<span
				class="bg-linear-to-r from-[#9999FF] to-indigo-400 bg-clip-text text-xl font-black tracking-wider text-transparent"
				>AVERO</span
			>
			<span
				class="rounded bg-white/5 px-2 py-1 text-xs font-bold tracking-widest text-white/50 uppercase"
				>Documents</span
			>
		</div>

		<div class="flex items-center space-x-3">
			<button
				onclick={() => (state.viewMode = !state.viewMode)}
				class="flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wider uppercase transition duration-300
				{state.viewMode
					? 'bg-[#9999FF] text-black shadow-[0_0_25px_rgba(153,153,255,0.35)]'
					: 'border border-white/10 bg-white/5 text-white hover:bg-white/10'}"
			>
				<span>{state.viewMode ? '👁 View Mode Active' : '📝 Standard Editor'}</span>
			</button>
			<button
				onclick={handleExport}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold tracking-wider text-zinc-300 uppercase transition duration-300 hover:bg-white/10"
			>
				Export JSON
			</button>
			<button
				onclick={triggerImport}
				class="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold tracking-wider text-white uppercase transition duration-300 hover:bg-white/15"
			>
				Import
			</button>
		</div>
	</header>

	<div class="relative flex flex-1 overflow-hidden">
		<!-- Sidebar Element List Panel -->
		{#if !state.viewMode}
			<aside
				transition:slide={{ axis: 'x', duration: 250 }}
				class="z-20 flex w-64 flex-col justify-between border-r border-white/5 bg-zinc-950"
			>
				<div
					class="flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-4 overflow-y-auto p-4"
				>
					<div class="flex items-center justify-between">
						<h2 class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
							Document Elements
						</h2>
						<span class="font-mono text-xs text-zinc-600">{state.elements.length} nodes</span>
					</div>

					<div class="space-y-2.5">
						{#each state.elements as el (el.id)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => (state.selectedElement = el)}
								class="group relative flex h-20 cursor-pointer flex-col justify-between rounded-xl border bg-white/1 p-3 transition duration-300
								{state.selectedElement?.id === el.id
									? 'border-[#9999FF] bg-white/3 shadow-[0_0_20px_rgba(153,153,255,0.1)]'
									: 'border-white/5 hover:border-white/10 hover:bg-white/2'}"
							>
								<div class="flex items-start justify-between">
									<span
										class="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase
										{el.type === 'heading'
											? 'bg-amber-950/50 text-amber-400'
											: el.type === 'image'
												? 'bg-blue-950/50 text-blue-400'
												: 'bg-white/5 text-zinc-400'}"
									>
										{el.type}
									</span>
									<button
										onclick={(e) => {
											e.stopPropagation();
											state.deleteElement(el.id);
										}}
										class="p-1 text-xs text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
									>
										✕
									</button>
								</div>
								<div class="mt-1 truncate text-xs font-medium text-zinc-400">
									{el.type === 'image'
										? el.contentUrl
										: el.content || 'Empty element text context...'}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="space-y-2 border-t border-white/5 bg-black/40 p-4">
					<div class="flex justify-between font-mono text-xs text-white/40">
						<span>Words:</span>
						<span class="font-bold text-white">{state.readingMetrics.words}</span>
					</div>
					<div class="flex justify-between font-mono text-xs text-white/40">
						<span>Characters:</span>
						<span class="font-bold text-white">{state.readingMetrics.chars}</span>
					</div>
					<div class="flex justify-between font-mono text-xs text-white/40">
						<span>Read Time:</span>
						<span class="font-bold text-[#9999FF]">~{state.readingMetrics.time} min</span>
					</div>
				</div>
			</aside>
		{/if}

		<!-- Layout View Deck Container -->
		<main
			class="flex flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-col items-center overflow-y-auto bg-zinc-950/40 p-8"
		>
			{#if !state.viewMode}
				<div
					class="z-20 mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-white/5 bg-zinc-950 p-3 shadow-2xl"
				>
					<div class="flex items-center space-x-2 border-r border-white/5 pr-4">
						<button
							onclick={() => state.addElement('heading')}
							class="rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
							>+ Heading</button
						>
						<button
							onclick={() => state.addElement('paragraph')}
							class="rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
							>+ Paragraph</button
						>
						<button
							onclick={() => state.addElement('blockquote')}
							class="rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
							>+ Quote</button
						>
						<button
							onclick={() => state.addElement('image')}
							class="rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-[#9999FF] hover:bg-white/10"
							>+ Image Block</button
						>
					</div>

					<div class="flex items-center space-x-3 text-xs">
						<span class="text-[10px] font-black tracking-wider text-white/40 uppercase"
							>Theme Matrix:</span
						>
						<select
							onchange={(e) => state.applyThemePreset((e.target as HTMLSelectElement).value)}
							class="rounded border border-white/10 bg-zinc-900 p-1 text-xs text-white focus:outline-none"
						>
							<option value="custom">Custom Canvas Color</option>
							<option value="pitch">Pitch Black</option>
							<option value="cyber">Cyberpunk Amber</option>
							<option value="ocean">Deep Ocean</option>
							<option value="nordic">Nordic Frost</option>
						</select>
						<input
							type="color"
							bind:value={state.docSettings.background}
							class="h-6 w-6 cursor-pointer rounded border border-white/10 bg-transparent"
						/>
					</div>
				</div>

				{#if state.selectedElement}
					<div
						class="z-20 mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-white/5 bg-zinc-950 p-3 text-xs shadow-2xl"
					>
						<span class="font-mono text-[10px] font-black tracking-wider text-white/40 uppercase"
							>{state.selectedElement.type} Attributes</span
						>

						{#if state.selectedElement.type !== 'image'}
							<div class="flex items-center space-x-3 border-l border-white/5 pl-4">
								<label class="text-zinc-400" for="font-size-input">Font Size (px):</label>
								<input
									id="font-size-input"
									type="number"
									bind:value={state.selectedElement.fontSize}
									class="w-14 rounded border border-white/10 bg-zinc-900 px-1.5 py-1 text-center text-white focus:outline-none"
								/>

								<label class="text-zinc-400" for="element-color-input">Color:</label>
								<input
									id="element-color-input"
									type="color"
									bind:value={state.selectedElement.color}
									class="h-6 w-6 cursor-pointer rounded border border-white/10 bg-transparent"
								/>

								<label class="text-zinc-400" for="alignment-select">Alignment:</label>
								<select
									id="alignment-select"
									bind:value={state.selectedElement.align}
									class="rounded border border-white/10 bg-zinc-900 p-1 text-white focus:outline-none"
								>
									<option value="left">Left</option>
									<option value="center">Center</option>
									<option value="right">Right</option>
									<option value="justify">Justify</option>
								</select>
							</div>
						{/if}

						{#if state.selectedElement.type === 'image'}
							<div class="flex items-center space-x-3 border-l border-white/5 pl-4">
								<label class="text-zinc-400" for="display-width-input">Display Width (%):</label>
								<input
									id="display-width-input"
									type="number"
									bind:value={state.selectedElement.widthPercent}
									min="10"
									max="100"
									class="w-14 rounded border border-white/10 bg-zinc-900 px-1.5 py-1 text-center text-white focus:outline-none"
								/>

								<label class="text-zinc-400" for="rounded-radius-input">Radius (px):</label>
								<input
									id="rounded-radius-input"
									type="number"
									bind:value={state.selectedElement.radius}
									min="0"
									max="50"
									class="w-14 rounded border border-white/10 bg-zinc-900 px-1.5 py-1 text-center text-white focus:outline-none"
								/>
							</div>
						{/if}

						<div class="flex items-center space-x-1.5 border-l border-white/5 pl-4">
							<button
								onclick={() => state.moveElement(state.selectedElement!.id, 'up')}
								class="rounded bg-white/5 p-1 px-2 text-zinc-400 hover:bg-white/10"
								title="Move Section Up">▲</button
							>
							<button
								onclick={() => state.moveElement(state.selectedElement!.id, 'down')}
								class="rounded bg-white/5 p-1 px-2 text-zinc-400 hover:bg-white/10"
								title="Move Section Down">▼</button
							>
							<button
								onclick={() => state.duplicateElement(state.selectedElement!)}
								class="rounded border border-white/5 bg-white/5 p-1 px-2 text-indigo-400 hover:bg-white/10"
								title="Clone Element">📋 Duplicate</button
							>
						</div>

						<button
							onclick={() => state.deleteElement(state.selectedElement!.id)}
							class="rounded-lg border border-red-900/40 bg-red-950/40 px-2 py-1 text-red-400 transition hover:bg-red-900/60"
						>
							Delete Node
						</button>
					</div>
				{/if}
			{:else}
				<div
					class="mb-4 flex w-[816px] items-center justify-between rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-4 py-2 font-mono text-xs tracking-wide text-emerald-400"
				>
					<span class="animate-pulse"
						>⚡ VIEW MODE ACTIVE: Displaying live direct dynamic node output parameters. inputs
						locked.</span
					>
					<button
						onclick={() => (state.viewMode = false)}
						class="rounded bg-emerald-900/40 px-2 py-1 font-bold text-white hover:bg-emerald-800"
					>
						Return to Editor
					</button>
				</div>
			{/if}

			<!-- Render Display Board Sheet Canvas -->
			<div
				style:background-color={state.docSettings.background}
				class="flex min-h-[1056px] w-[816px] flex-col space-y-4 rounded-2xl border border-white/5 p-16 shadow-[0_24px_60px_rgba(0,0,0,0.8)] transition-all duration-300"
			>
				{#each state.elements as el (el.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						onclick={(e) => {
							e.stopPropagation();
							if (!state.viewMode) state.selectedElement = el;
						}}
						style:text-align={el.align || 'left'}
						class="group relative w-full rounded-lg border border-transparent p-2 transition-all
						{!state.viewMode && state.selectedElement?.id === el.id ? 'border-white/10 bg-white/2' : ''}
						{!state.viewMode ? 'cursor-pointer hover:border-dashed hover:border-white/10' : ''}"
					>
						{#if el.type === 'heading'}
							{#if state.viewMode}
								<div
									style:font-size="{el.fontSize}px"
									style:color={el.color || '#ffffff'}
									class="w-full font-sans font-bold tracking-tight whitespace-pre-wrap"
								>
									{el.content}
								</div>
							{:else}
								<input
									bind:value={el.content}
									style:font-size="{el.fontSize}px"
									style:color={el.color || '#ffffff'}
									class="m-0 w-full border-b border-transparent bg-transparent p-0 font-sans font-bold tracking-tight focus:border-white/20 focus:outline-none"
									placeholder="Heading Level Block Title"
								/>
							{/if}
						{:else if el.type === 'paragraph'}
							{#if state.viewMode}
								<div
									style:font-size="{el.fontSize}px"
									style:color={el.color || '#a1a1aa'}
									class="w-full text-justify font-sans leading-relaxed whitespace-pre-wrap"
								>
									{el.content}
								</div>
							{:else}
								<textarea
									bind:value={el.content}
									style:font-size="{el.fontSize}px"
									style:color={el.color || '#a1a1aa'}
									oninput={autoResizeTextarea}
									class="m-0 w-full resize-none overflow-hidden border-b border-transparent bg-transparent p-0 font-sans leading-relaxed focus:border-white/20 focus:outline-none"
									rows="2"
									placeholder="Start writing regular workspace documentation body text..."
								></textarea>
							{/if}
						{:else if el.type === 'blockquote'}
							<div class="my-2 border-l-4 border-[#9999FF] pl-4 italic">
								{#if state.viewMode}
									<div
										style:font-size="{el.fontSize}px"
										style:color={el.color || '#d1d1d6'}
										class="w-full font-mono whitespace-pre-wrap"
									>
										{el.content}
									</div>
								{:else}
									<textarea
										bind:value={el.content}
										style:font-size="{el.fontSize}px"
										style:color={el.color || '#d1d1d6'}
										oninput={autoResizeTextarea}
										class="m-0 w-full resize-none overflow-hidden border-b border-transparent bg-transparent p-0 font-mono focus:border-white/20 focus:outline-none"
										rows="1"
										placeholder="Callout emphasis block content standard quote container..."
									></textarea>
								{/if}
							</div>
						{:else if el.type === 'image'}
							<div class="flex flex-col items-center py-2">
								<div style:width="{el.widthPercent || 80}%" class="relative">
									<img
										src={el.contentUrl}
										style:border-radius="{el.radius || 8}px"
										class="h-auto w-full border border-white/10 object-cover shadow-2xl transition-all"
										alt="Avero Embedded Document Asset"
									/>
								</div>
								{#if !state.viewMode}
									<div
										class="mt-2 w-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
									>
										<input
											type="text"
											bind:value={el.contentUrl}
											class="w-full rounded border border-white/5 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-500 focus:text-zinc-200 focus:outline-none"
											placeholder="Provide image CDN source link location..."
										/>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</main>
	</div>
</div>
