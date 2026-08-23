<script lang="ts">
	import ChartCanvas from './ChartCanvas.svelte';
	import {
		AveroChartExporter,
		DEFAULT_CHART_SETTINGS,
		DEFAULT_NODES,
		type ChartSettings,
		type ChartDataNode
	} from './charts';

	let presentationMode = $state<boolean>(false);
	let settings = $state<ChartSettings>(DEFAULT_CHART_SETTINGS());
	let nodes = $state<ChartDataNode[]>(DEFAULT_NODES());

	const chartTypes: { value: ChartSettings['type']; label: string; icon: string }[] = [
		{ value: 'time', label: 'Time Timeline', icon: '⏳' },
		{ value: 'area', label: 'Area Flow', icon: '🌊' },
		{ value: 'pie', label: 'Pie Vector', icon: '🍕' },
		{ value: 'doughnut', label: 'Doughnut Ring', icon: '🍩' },
		{ value: 'bar', label: 'Bar Matrix', icon: '📊' },
		{ value: 'line', label: 'Line Trace', icon: '📈' },
		{ value: 'polar', label: 'Polar Grid', icon: '🎯' },
		{ value: 'radar', label: 'Radar Spider', icon: '🕸' }
	];

	const addNewNode = () => {
		const colors = [
			'#9999FF', // Base Brand Lavender
			'#B280FF',
			'#80B2FF',
			'#E0B0FF',
			'#7070FF',
			'#C8A2C8',
			'#DCD0FF'
		];
		const randomColor = colors[Math.floor(Math.random() * colors.length)];

		nodes.push({
			id: Date.now() + Math.random(),
			label: 'Global Metric Cluster',
			value: Math.floor(Math.random() * 200) + 100,
			history: [
				Math.floor(Math.random() * 300) + 50,
				Math.floor(Math.random() * 300) + 50,
				Math.floor(Math.random() * 300) + 50,
				Math.floor(Math.random() * 300) + 50
			],
			color: randomColor,
			visible: true
		});
	};

	const deleteNode = (id: number) => {
		nodes = nodes.filter((node) => node.id !== id);
	};

	const saveAsImage = () => {
		const sourceCanvas = document.querySelector('canvas') as HTMLCanvasElement;
		if (!sourceCanvas) return;

		const exportCanvas = document.createElement('canvas');
		exportCanvas.width = sourceCanvas.width + 40;
		exportCanvas.height = sourceCanvas.height + 100;
		const ctx = exportCanvas.getContext('2d');
		if (!ctx) return;

		// Standard Pitch Black canvas export
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

		// Render Title onto exported image using brand typography
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 16px ui-sans-serif, system-ui';
		ctx.textAlign = 'center';
		ctx.fillText(settings.title || 'Untitled Dataset Report', exportCanvas.width / 2, 35);

		ctx.drawImage(sourceCanvas, 20, 60);

		const url = exportCanvas.toDataURL('image/png');
		const link = document.createElement('a');
		link.href = url;
		link.download = `avero-chart-capture-${Date.now()}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleExport = () => {
		AveroChartExporter.exportToJSON(settings, nodes);
	};

	const triggerImport = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (evt) => {
				const text = evt.target?.result as string;
				const parsed = AveroChartExporter.importFromJSON(text);
				if (parsed) {
					settings = parsed.settings;
					nodes = parsed.nodes;
					presentationMode = false;
				}
			};
			reader.readAsText(file);
		};
		input.click();
	};
</script>

<div
	class="flex h-screen flex-col overflow-hidden bg-black font-sans tracking-tight text-white select-none"
>
	<!-- Minimalist Clean Header -->
	<header class="z-30 flex items-center justify-between border-b border-white/5 bg-black px-6 py-4">
		<div class="flex items-center space-x-3">
			<span class="text-xl font-black tracking-[0.25em] text-white">AVERO</span>
			<span
				class="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-[#9999FF] uppercase"
			>
				CHARTS v2
			</span>
		</div>

		<div class="flex items-center space-x-2">
			<button
				onclick={() => (presentationMode = !presentationMode)}
				class="flex items-center space-x-2 rounded-xl border px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 {presentationMode
					? 'bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.25)]'
					: 'border-white/10 bg-white/5 text-white hover:border-[#9999FF]/30'}"
			>
				<span>{presentationMode ? '👁 Presenting' : '📝 Editor Mode'}</span>
			</button>

			<button
				onclick={saveAsImage}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition duration-300 hover:bg-white/10"
			>
				📸 Save PNG
			</button>

			<button
				onclick={handleExport}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition duration-300 hover:bg-white/10"
			>
				Export JSON
			</button>

			<button
				onclick={triggerImport}
				class="rounded-xl bg-[#9999FF] px-4 py-2 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
			>
				Import JSON
			</button>
		</div>
	</header>

	<div class="relative flex flex-1 overflow-hidden">
		{#if !presentationMode}
			<!-- Sidebar Controls Panel -->
			<aside class="z-20 flex w-80 flex-col justify-between border-r border-white/5 bg-black">
				<div
					class="flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-4 overflow-y-auto p-4"
				>
					<!-- Workspace Settings -->
					<div class="space-y-2">
						<h2 class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
							Workspace Properties
						</h2>
						<input
							type="text"
							bind:value={settings.title}
							placeholder="Workspace Title..."
							class="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-xs text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_20px_rgba(153,153,255,0.1)]"
						/>
					</div>

					<!-- Custom Selector Theme -->
					<div class="space-y-2">
						<h2 class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
							Theme Mode
						</h2>
						<select
							bind:value={settings.theme}
							class="w-full cursor-pointer rounded-xl border border-white/10 bg-black px-4 py-2.5 text-[11px] font-black tracking-wider text-white uppercase transition duration-300 outline-none hover:border-[#9999FF]/40"
						>
							<option value="pitch-black" class="bg-black">Pitch Black Standard</option>
							<option value="cyber-neon" class="bg-black">Cyber Neon</option>
							<option value="emerald-pulse" class="bg-black">Emerald Pulse</option>
							<option value="deep-ocean" class="bg-black">Deep Ocean</option>
						</select>
					</div>

					<hr class="border-white/5" />

					<!-- Visualization Grid Selector -->
					<div class="space-y-2">
						<h3 class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
							Visualization Architecture
						</h3>
						<div class="grid grid-cols-2 gap-2">
							{#each chartTypes as type (type.value)}
								<button
									onclick={() => (settings.type = type.value)}
									class="flex flex-col items-center justify-center space-y-1.5 rounded-xl border p-2.5 text-center transition-all duration-300 {settings.type ===
									type.value
										? 'border-[#9999FF] bg-[#9999FF]/10 text-[#9999FF] shadow-[0_0_15px_rgba(153,153,255,0.1)]'
										: 'border-white/5 bg-white/1 text-white/60 hover:border-white/20 hover:text-white'}"
								>
									<span class="text-base">{type.icon}</span>
									<span class="text-[9px] leading-none font-black tracking-wider uppercase"
										>{type.label}</span
									>
								</button>
							{/each}
						</div>
					</div>

					<!-- Glass Toggles Card -->
					<div
						class="space-y-2.5 rounded-2xl border border-white/5 bg-white/2 p-4 transition duration-300 hover:border-[#9999FF]/15"
					>
						<h3 class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
							Visualizer Toggles
						</h3>
						<div class="flex flex-col space-y-2 text-xs">
							<label
								class="flex cursor-pointer items-center space-x-2 text-white/70 transition hover:text-white"
							>
								<input
									type="checkbox"
									bind:checked={settings.showGrid}
									class="rounded border-white/10 bg-black accent-[#9999FF]"
								/>
								<span class="font-semibold tracking-tight">Display Background Grid</span>
							</label>
							<label
								class="flex cursor-pointer items-center space-x-2 text-white/70 transition hover:text-white"
							>
								<input
									type="checkbox"
									bind:checked={settings.showValues}
									class="rounded border-white/10 bg-black accent-[#9999FF]"
								/>
								<span class="font-semibold tracking-tight">Render Node Values</span>
							</label>
							<label
								class="flex cursor-pointer items-center space-x-2 text-white/70 transition hover:text-white"
							>
								<input
									type="checkbox"
									bind:checked={settings.smoothLines}
									class="rounded border-white/10 bg-black accent-[#9999FF]"
								/>
								<span class="font-semibold tracking-tight">Smooth Bezier Lines</span>
							</label>
						</div>
					</div>

					<hr class="border-white/5" />

					<!-- Metrics Series Controller -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<h3 class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
								Metric Data Series
							</h3>
							<button
								onclick={addNewNode}
								class="text-[11px] font-bold text-[#9999FF] hover:underline"
							>
								+ Add Entry
							</button>
						</div>

						<!-- Custom Scrollable Data Rows -->
						<div
							class="max-h-75 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-3 overflow-y-auto pr-2"
						>
							{#each nodes as node (node.id)}
								<div
									class="group relative flex flex-col space-y-2 rounded-xl border border-white/5 bg-white/2 p-3 transition duration-300 hover:border-[#9999FF]/20"
								>
									<div class="flex items-center space-x-2">
										<input
											type="checkbox"
											bind:checked={node.visible}
											class="accent-[#9999FF]"
											title="Toggle visibility"
										/>
										<input
											type="color"
											bind:value={node.color}
											class="h-5 w-5 cursor-pointer rounded border border-white/10 bg-transparent"
										/>
										<input
											type="text"
											bind:value={node.label}
											placeholder="Series Label"
											class="flex-1 rounded-lg border border-white/10 bg-black px-2 py-1 text-[11px] text-white transition focus:border-[#9999FF]/50 focus:outline-none"
										/>
										<button
											onclick={() => deleteNode(node.id)}
											class="pl-1 text-base font-bold text-white/40 transition hover:text-[#9999FF]"
											title="Delete Entry"
										>
											&times;
										</button>
									</div>

									{#if !(settings.type === 'time' || settings.type === 'area')}
										<div class="flex items-center justify-between border-t border-white/5 pt-1.5">
											<span class="text-[9px] font-black tracking-widest text-white/40 uppercase"
												>Scalar Input:</span
											>
											<input
												type="number"
												bind:value={node.value}
												placeholder="0"
												class="w-20 rounded-lg border border-white/10 bg-black px-1.5 py-1 text-center text-[11px] text-white transition focus:border-[#9999FF]/50 focus:outline-none"
											/>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Telemetry Status Panel Footer -->
				<div
					class="space-y-2 border-t border-white/5 bg-black p-4 font-sans text-[11px] text-white/50"
				>
					<div class="flex justify-between">
						<span>ACTIVE VECTORS:</span>
						<span class="font-bold text-white">
							{nodes.filter((n) => n.visible).length} / {nodes.length} Segments
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span>WORKSPACE SYSTEM:</span>
						<div class="flex items-center gap-1.5">
							<span
								class="h-1.5 w-1.5 animate-ping rounded-full bg-[#9999FF] shadow-[0_0_10px_#9999FF]"
							></span>
							<span class="font-black tracking-wider text-[#9999FF] uppercase"
								>{settings.type} ENGINE</span
							>
						</div>
					</div>
				</div>
			</aside>
		{/if}

		<!-- Graphic Editor Workspace Viewport -->
		<main
			class="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-black p-6"
		>
			<!-- Integrated Glass Frame for canvas -->
			<div
				class="flex w-full max-w-4xl flex-col space-y-6 rounded-[28px] border border-white/10 bg-white/2 p-8 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4 md:p-10"
			>
				<div class="space-y-1 text-center">
					<h2 class="text-xl font-black tracking-wide text-white">
						{settings.title || 'Untitled Dataset Report'}
					</h2>
					<p class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase">
						Avero Visualizer Workspace Pattern &bull; {settings.type} engine
					</p>
				</div>

				<!-- Interactive Core Chart Canvas -->
				<div class="flex w-full flex-1 items-center justify-center">
					<ChartCanvas {settings} {nodes} />
				</div>

				<!-- Legend Matrix Row Elements -->
				<div
					class="flex w-full flex-wrap items-center justify-center gap-4 rounded-2xl border border-white/5 bg-white/1 px-4 py-3"
				>
					{#each nodes as node (node.id)}
						{#if node.visible}
							<div class="flex items-center space-x-2 font-sans text-xs">
								<span
									class="inline-block h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
									style="background-color: {node.color}; color: {node.color};"
								></span>
								<span class="font-semibold text-white/70">{node.label || 'Unnamed'}</span>
								<span class="font-black text-[#9999FF]">
									{settings.type === 'time' || settings.type === 'area'
										? `[${node.history.join(', ')}]`
										: `(${node.value || 0})`}
								</span>
							</div>
						{/if}
					{:else}
						<div class="text-xs text-white/30 italic">
							No dataset inputs populated in workspace matrix.
						</div>
					{/each}
				</div>
			</div>
		</main>
	</div>
</div>

<style>
	/* Scrollbar customization matching brand identity */
	::-webkit-scrollbar {
		width: 4px;
		height: 4px;
	}
	::-webkit-scrollbar-track {
		background: #000000;
	}
	::-webkit-scrollbar-thumb {
		background: rgba(153, 153, 255, 0.2);
		border-radius: 99px;
	}
	::-webkit-scrollbar-thumb:hover {
		background: rgba(153, 153, 255, 0.5);
	}
</style>
