<script lang="ts">
	import {
		ELEMENTS,
		CATEGORIES,
		HEATMAP_METRICS,
		getElementState,
		getHeatmapOpacity,
		type ElementData,
		type ElementCategory,
		type HeatmapMetric
	} from './elementData';

	// Navigation & View Modes
	let searchQuery = $state('');
	let selectedCategory = $state<ElementCategory | 'all'>('all');
	let activeTab = $state<'table' | 'heatmap' | 'compare'>('table');

	// Interactive States
	let activeElement = $state<ElementData | null>(null);
	let compareA = $state<ElementData | null>(ELEMENTS[0]); // Hydrogen
	let compareB = $state<ElementData | null>(ELEMENTS[5]); // Carbon

	// Thermal Simulation
	let tempKelvin = $state(298); // Room Temp ~ 25 °C
	let activeHeatmap = $state<HeatmapMetric>('electronegativity');

	// Derived calculations
	let filteredElements = $derived(
		ELEMENTS.filter((el) => {
			const matchesSearch =
				el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
				el.number.toString() === searchQuery.trim();
			const matchesCategory = selectedCategory === 'all' || el.category === selectedCategory;
			return matchesSearch && matchesCategory;
		})
	);

	let filteredSet = $derived(new Set(filteredElements.map((e) => e.number)));

	function tempCelsius(k: number) {
		return Math.round(k - 273.15);
	}

	function selectForCompare(el: ElementData) {
		if (compareA?.number === el.number) return;
		if (!compareA || compareB) {
			compareA = el;
			compareB = null;
		} else {
			compareB = el;
		}
	}
</script>

<div
	class="min-h-screen bg-black p-4 font-sans text-white selection:bg-[#9999FF]/30 selection:text-[#9999FF] md:p-8"
>
	<!-- Top Bar / Header -->
	<header
		class="mx-auto mb-8 flex max-w-7xl flex-col items-start justify-between gap-4 md:flex-row md:items-center"
	>
		<div>
			<div class="flex items-center gap-3">
				<div class="h-3 w-3 rounded-full bg-[#9999FF] shadow-[0_0_12px_#9999FF]"></div>
				<h1 class="text-3xl font-black tracking-tight text-white">
					AVERO <span class="text-[#9999FF]">ELEMENTS</span>
				</h1>
			</div>
			<p class="mt-1 font-mono text-xs text-white/40">
				ADVANCED PERIODIC TABLE & THERMODYNAMIC EXPLORER
			</p>
		</div>

		<!-- View Switcher -->
		<div
			class="flex items-center rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-md"
		>
			<button
				onclick={() => (activeTab = 'table')}
				class="rounded-xl px-5 py-2 text-xs font-bold uppercase transition-all duration-300 {activeTab ===
				'table'
					? 'bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.3)]'
					: 'text-white/60 hover:text-white'}"
			>
				Standard Grid
			</button>
			<button
				onclick={() => (activeTab = 'heatmap')}
				class="rounded-xl px-5 py-2 text-xs font-bold uppercase transition-all duration-300 {activeTab ===
				'heatmap'
					? 'bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.3)]'
					: 'text-white/60 hover:text-white'}"
			>
				Property Heatmap
			</button>
			<button
				onclick={() => (activeTab = 'compare')}
				class="rounded-xl px-5 py-2 text-xs font-bold uppercase transition-all duration-300 {activeTab ===
				'compare'
					? 'bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.3)]'
					: 'text-white/60 hover:text-white'}"
			>
				Compare Elements
			</button>
		</div>
	</header>

	<main class="mx-auto max-w-7xl space-y-6">
		<!-- Global Controls Panel -->
		<div
			class="space-y-6 rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20"
		>
			<div class="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
				<!-- Search -->
				<div class="relative">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search by name, symbol, atomic #..."
						class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-3.5 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
					/>
					{#if searchQuery}
						<button
							onclick={() => (searchQuery = '')}
							class="absolute top-3.5 right-4 text-xs text-white/40 hover:text-white">CLEAR</button
						>
					{/if}
				</div>

				<!-- Temperature Slider Controls -->
				<div
					class="flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-white/2 p-3 px-5 md:col-span-2 md:flex-row"
				>
					<div class="flex min-w-35 items-center gap-2">
						<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>TEMP SIM</span
						>
						<span class="font-mono text-sm font-bold text-[#9999FF]">{tempKelvin} K</span>
						<span class="font-mono text-xs text-white/40">({tempCelsius(tempKelvin)}°C)</span>
					</div>
					<input
						type="range"
						min="0"
						max="6000"
						step="10"
						bind:value={tempKelvin}
						class="w-full cursor-pointer accent-[#9999FF]"
					/>
					<div class="flex gap-1 font-mono text-[10px]">
						<button
							onclick={() => (tempKelvin = 0)}
							class="rounded bg-white/5 px-2 py-1 hover:bg-white/10">0K</button
						>
						<button
							onclick={() => (tempKelvin = 298)}
							class="rounded bg-white/5 px-2 py-1 hover:bg-white/10">298K</button
						>
						<button
							onclick={() => (tempKelvin = 373)}
							class="rounded bg-white/5 px-2 py-1 hover:bg-white/10">373K</button
						>
						<button
							onclick={() => (tempKelvin = 5000)}
							class="rounded bg-white/5 px-2 py-1 hover:bg-white/10">5000K</button
						>
					</div>
				</div>
			</div>

			<!-- Category Legend Filter -->
			<div class="flex flex-wrap items-center gap-2 border-t border-white/5 pt-2">
				<button
					onclick={() => (selectedCategory = 'all')}
					class="rounded-xl px-3 py-1.5 text-xs font-bold transition duration-300 {selectedCategory ===
					'all'
						? 'bg-white text-black'
						: 'bg-white/5 text-white/60 hover:bg-white/10'}"
				>
					ALL ({ELEMENTS.length})
				</button>
				{#each Object.values(CATEGORIES) as cat (cat)}
					<button
						onclick={() => (selectedCategory = selectedCategory === cat.id ? 'all' : cat.id)}
						class="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition duration-300 {cat.border} {cat.text} {selectedCategory ===
						cat.id
							? 'bg-white/15 shadow-[0_0_15px_rgba(153,153,255,0.2)]'
							: 'bg-white/2 hover:bg-white/5'}"
					>
						<span class="h-2 w-2 rounded-full {cat.color}"></span>
						{cat.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- VIEW 1: STANDARD PERIODIC TABLE GRID -->
		{#if activeTab === 'table'}
			<div
				class="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-x-auto rounded-[28px] border border-white/10 bg-white/2 p-4 backdrop-blur-xl md:p-6"
			>
				<div class="grid min-w-245 grid-cols-18 gap-1.5">
					{#each ELEMENTS as el (el)}
						{@const isMatch = filteredSet.has(el.number)}
						{@const state = getElementState(el, tempKelvin)}
						{@const cat = CATEGORIES[el.category]}
						<button
							style="grid-column: {el.col}; grid-row: {el.row};"
							onclick={() => (activeElement = el)}
							class="group relative flex aspect-square flex-col justify-between rounded-xl border p-1.5 text-left transition-all duration-300
								{cat.border} {cat.color}
								{isMatch
								? 'scale-100 opacity-100 hover:z-20 hover:scale-110 hover:border-[#9999FF] hover:shadow-[0_0_20px_rgba(153,153,255,0.4)]'
								: 'scale-95 opacity-20'}
								{activeElement?.number === el.number ? 'bg-white/20 ring-2 ring-[#9999FF]' : ''}"
						>
							<div class="flex items-start justify-between font-mono text-[9px] leading-none">
								<span class="text-white/40">{el.number}</span>
								<!-- Thermal state marker -->
								<span
									class="h-1.5 w-1.5 rounded-full
									{state === 'solid'
										? 'bg-white/40'
										: state === 'liquid'
											? 'animate-pulse bg-blue-400'
											: state === 'gas'
												? 'bg-rose-400'
												: 'bg-transparent'}"
									title="State: {state}"
								></span>
							</div>

							<div class="my-auto text-center">
								<span
									class="text-base font-black tracking-tight text-white transition group-hover:text-[#9999FF]"
									>{el.symbol}</span
								>
								<p class="max-w-full truncate text-[9px] font-medium text-white/70">{el.name}</p>
							</div>

							<div class="truncate text-center font-mono text-[8px] text-white/40">
								{el.mass.toFixed(2)}
							</div>
						</button>
					{/each}

					<!-- Spacer labels for Lanthanides/Actinides -->
					<div
						style="grid-column: 3; grid-row: 6;"
						class="flex items-center justify-center rounded-xl border border-dashed border-sky-400/20 text-[10px] font-bold text-sky-400/60"
					>
						57-71
					</div>
					<div
						style="grid-column: 3; grid-row: 7;"
						class="flex items-center justify-center rounded-xl border border-dashed border-pink-400/20 text-[10px] font-bold text-pink-400/60"
					>
						89-103
					</div>
				</div>
			</div>
		{/if}

		<!-- VIEW 2: PROPERTY HEATMAP -->
		<!-- VIEW 2: PROPERTY HEATMAP -->
		{#if activeTab === 'heatmap'}
			{@const metricInfo = HEATMAP_METRICS.find((m) => m.id === activeHeatmap)}
			<div class="space-y-6">
				<!-- Heatmap metric selector -->
				<div class="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/2 p-4">
					{#each HEATMAP_METRICS as metric (metric)}
						<button
							onclick={() => (activeHeatmap = metric.id)}
							class="rounded-xl px-4 py-2 text-xs font-bold uppercase transition duration-300 {activeHeatmap ===
							metric.id
								? 'bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.3)]'
								: 'bg-white/5 text-white/60 hover:bg-white/10'}"
						>
							{metric.label} ({metric.unit})
						</button>
					{/each}
				</div>

				<div
					class="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-x-auto rounded-[28px] border border-white/10 bg-white/2 p-4 backdrop-blur-xl md:p-6"
				>
					<div class="grid min-w-245 grid-cols-18 gap-1.5">
						{#each ELEMENTS as el (el)}
							{@const val = el[activeHeatmap]}
							{@const opacity = metricInfo
								? getHeatmapOpacity(val, metricInfo.min, metricInfo.max)
								: 0}
							<button
								style="grid-column: {el.col}; grid-row: {el.row};"
								onclick={() => (activeElement = el)}
								class="relative flex aspect-square flex-col justify-between rounded-xl border border-white/10 p-1.5 transition-all duration-300 hover:z-20 hover:scale-110 hover:border-[#9999FF]"
							>
								<!-- Heatmap Overlay -->
								<div
									class="pointer-events-none absolute inset-0 rounded-xl bg-[#9999FF] transition-opacity duration-500"
									style="opacity: {opacity}"
								></div>

								<div class="relative z-10 flex justify-between font-mono text-[8px] text-white/50">
									<span>{el.number}</span>
								</div>

								<div class="relative z-10 text-center">
									<span class="text-sm font-black text-white">{el.symbol}</span>
									<p class="mt-0.5 font-mono text-[9px] font-bold text-white/90">
										{val !== null ? val : 'N/A'}
									</p>
								</div>
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- VIEW 3: ELEMENT COMPARISON -->
		{#if activeTab === 'compare'}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Element A -->
				<div
					class="space-y-6 rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl"
				>
					<div class="flex items-center justify-between border-b border-white/10 pb-4">
						<span class="font-mono text-xs text-white/40">SLOT A</span>
						<select
							class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#9999FF] outline-none"
							onchange={(e) => {
								const num = parseInt(e.currentTarget.value);
								compareA = ELEMENTS.find((x) => x.number === num) || null;
							}}
						>
							{#each ELEMENTS as el (el)}
								<option value={el.number} selected={compareA?.number === el.number}
									>{el.number}. {el.name} ({el.symbol})</option
								>
							{/each}
						</select>
					</div>

					{#if compareA}
						<div class="space-y-4">
							<div class="flex items-center gap-4">
								<div
									class="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#9999FF]/50 bg-[#9999FF]/20 text-2xl font-black text-[#9999FF]"
								>
									{compareA.symbol}
								</div>
								<div>
									<h3 class="text-2xl font-black text-white">{compareA.name}</h3>
									<span class="text-xs tracking-widest text-white/50 uppercase"
										>{CATEGORIES[compareA.category].label}</span
									>
								</div>
							</div>

							<p
								class="rounded-xl border border-white/5 bg-white/2 p-4 text-xs leading-relaxed text-white/70"
							>
								{compareA.summary}
							</p>

							<div class="grid grid-cols-2 gap-3">
								<div class="flex flex-col rounded-2xl border border-white/5 bg-white/1 p-4">
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Atomic Mass</span
									>
									<span class="mt-1 text-xl font-black text-white"
										>{compareA.mass} <span class="text-xs font-light text-white/45">u</span></span
									>
								</div>
								<div class="flex flex-col rounded-2xl border border-white/5 bg-white/1 p-4">
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Electronegativity</span
									>
									<span class="mt-1 text-xl font-black text-[#9999FF]"
										>{compareA.electronegativity ?? 'N/A'}</span
									>
								</div>
								<div class="flex flex-col rounded-2xl border border-white/5 bg-white/1 p-4">
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Melting Point</span
									>
									<span class="mt-1 text-xl font-black text-white"
										>{compareA.melt ?? 'N/A'}
										<span class="text-xs font-light text-white/45">K</span></span
									>
								</div>
								<div class="flex flex-col rounded-2xl border border-white/5 bg-white/1 p-4">
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Boiling Point</span
									>
									<span class="mt-1 text-xl font-black text-white"
										>{compareA.boil ?? 'N/A'}
										<span class="text-xs font-light text-white/45">K</span></span
									>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Element B -->
				<div
					class="space-y-6 rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl"
				>
					<div class="flex items-center justify-between border-b border-white/10 pb-4">
						<span class="font-mono text-xs text-white/40">SLOT B</span>
						<select
							class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#9999FF] outline-none"
							onchange={(e) => {
								const num = parseInt(e.currentTarget.value);
								compareB = ELEMENTS.find((x) => x.number === num) || null;
							}}
						>
							{#each ELEMENTS as el (el)}
								<option value={el.number} selected={compareB?.number === el.number}
									>{el.number}. {el.name} ({el.symbol})</option
								>
							{/each}
						</select>
					</div>

					{#if compareB}
						<div class="space-y-4">
							<div class="flex items-center gap-4">
								<div
									class="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#9999FF]/50 bg-[#9999FF]/20 text-2xl font-black text-[#9999FF]"
								>
									{compareB.symbol}
								</div>
								<div>
									<h3 class="text-2xl font-black text-white">{compareB.name}</h3>
									<span class="text-xs tracking-widest text-white/50 uppercase"
										>{CATEGORIES[compareB.category].label}</span
									>
								</div>
							</div>

							<p
								class="rounded-xl border border-white/5 bg-white/2 p-4 text-xs leading-relaxed text-white/70"
							>
								{compareB.summary}
							</p>

							<div class="grid grid-cols-2 gap-3">
								<div class="flex flex-col rounded-2xl border border-white/5 bg-white/1 p-4">
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Atomic Mass</span
									>
									<span class="mt-1 text-xl font-black text-white"
										>{compareB.mass} <span class="text-xs font-light text-white/45">u</span></span
									>
								</div>
								<div class="flex flex-col rounded-2xl border border-white/5 bg-white/1 p-4">
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Electronegativity</span
									>
									<span class="mt-1 text-xl font-black text-[#9999FF]"
										>{compareB.electronegativity ?? 'N/A'}</span
									>
								</div>
								<div class="flex flex-col rounded-2xl border border-white/5 bg-white/1 p-4">
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Melting Point</span
									>
									<span class="mt-1 text-xl font-black text-white"
										>{compareB.melt ?? 'N/A'}
										<span class="text-xs font-light text-white/45">K</span></span
									>
								</div>
								<div class="flex flex-col rounded-2xl border border-white/5 bg-white/1 p-4">
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Boiling Point</span
									>
									<span class="mt-1 text-xl font-black text-white"
										>{compareB.boil ?? 'N/A'}
										<span class="text-xs font-light text-white/45">K</span></span
									>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</main>

	<!-- ELEMENT DETAIL MODAL -->
	{#if activeElement}
		{@const cat = CATEGORIES[activeElement.category]}
		{@const state = getElementState(activeElement, tempKelvin)}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
		>
			<div
				class="relative w-full max-w-2xl space-y-6 rounded-[28px] border border-[#9999FF]/30 bg-black/90 p-6 shadow-[0_0_50px_rgba(153,153,255,0.2)] md:p-8"
			>
				<!-- Close Button -->
				<button
					onclick={() => (activeElement = null)}
					class="absolute top-6 right-6 rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
				>
					✕
				</button>

				<!-- Header Info -->
				<div class="flex items-start gap-6 border-b border-white/10 pb-6">
					<div
						class="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-[#9999FF] bg-[#9999FF]/10 text-center shadow-[0_0_20px_rgba(153,153,255,0.2)]"
					>
						<span class="text-3xl font-black text-white">{activeElement.symbol}</span>
						<span class="mt-1 font-mono text-[10px] text-[#9999FF]">#{activeElement.number}</span>
					</div>

					<div class="space-y-1">
						<h2 class="text-3xl font-black text-white">{activeElement.name}</h2>
						<p class="text-xs font-semibold tracking-wider text-[#9999FF] uppercase">{cat.label}</p>
						<p class="font-mono text-xs text-white/50">Discovered: {activeElement.discoveryYear}</p>
					</div>
				</div>

				<p class="text-sm leading-relaxed text-white/80">{activeElement.summary}</p>

				<!-- Grid of Metrics -->
				<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
					<div
						class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/2 p-4"
					>
						<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>Atomic Mass</span
						>
						<span class="mt-2 text-xl font-black text-white"
							>{activeElement.mass} <span class="text-xs text-white/40">u</span></span
						>
					</div>

					<div
						class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/2 p-4"
					>
						<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>Config</span
						>
						<span class="mt-2 truncate font-mono text-sm font-bold text-[#9999FF]"
							>{activeElement.electronConfig}</span
						>
					</div>

					<div
						class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/2 p-4"
					>
						<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>State @ {tempKelvin}K</span
						>
						<span class="mt-2 text-lg font-black text-white uppercase">{state}</span>
					</div>

					<div
						class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/2 p-4"
					>
						<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>Density</span
						>
						<span class="mt-2 text-xl font-black text-white">{activeElement.density ?? 'N/A'}</span>
					</div>

					<div
						class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/2 p-4"
					>
						<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>Melting Point</span
						>
						<span class="mt-2 text-xl font-black text-white"
							>{activeElement.melt ? `${activeElement.melt} K` : 'N/A'}</span
						>
					</div>

					<div
						class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/2 p-4"
					>
						<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>Boiling Point</span
						>
						<span class="mt-2 text-xl font-black text-white"
							>{activeElement.boil ? `${activeElement.boil} K` : 'N/A'}</span
						>
					</div>
				</div>

				<div class="flex justify-end border-t border-white/10 pt-4">
					<button
						onclick={() => {
							if (activeElement) selectForCompare(activeElement);
							activeTab = 'compare';
							activeElement = null;
						}}
						title="Compare Elements"
					></button>
				</div>
			</div>
		</div>
	{/if}
</div>
