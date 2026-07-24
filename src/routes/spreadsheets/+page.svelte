<script lang="ts">
	import Header from './Header.svelte';
	import type { CellStore, SheetSettings } from './types';
	import { evaluateCellOutput, exportSheetToJson, parseSheetJson } from './formulaEngine';

	let vueMode = $state(false);
	let activeCellKey = $state<string | null>(null);

	let sheetSettings = $state<SheetSettings>({
		title: 'Avero Master Operational Ledger',
		columnWidth: 130
	});

	let cols = $state(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
	let rows = $state(20);
	let cells = $state<CellStore>({});

	function initCellNode(key: string) {
		if (!cells[key]) {
			cells[key] = { raw: '', bold: false, color: '#ffffff', fontSize: 13 };
		}
	}

	function mutateCellValue(key: string, value: string) {
		initCellNode(key);
		cells[key].raw = value;
	}

	function updateActiveCellRawValue(val: string) {
		if (activeCellKey) mutateCellValue(activeCellKey, val);
	}

	function toggleStyleAttr(attribute: 'bold') {
		if (!activeCellKey) return;
		initCellNode(activeCellKey);
		cells[activeCellKey][attribute] = !cells[activeCellKey][attribute];
	}

	function updateStyleAttr(attribute: 'color' | 'fontSize', value: string | number) {
		if (!activeCellKey) return;
		initCellNode(activeCellKey);
		cells[activeCellKey][attribute] = value as never;
	}

	function clearEntireSheet() {
		if (confirm('Are you certain you want to purge all entries in this workbook?')) {
			cells = {};
			activeCellKey = null;
		}
	}

	function updateColumnCount(targetCount: number) {
		let count = Math.max(1, Math.min(26, targetCount || 1));
		cols = Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
	}

	function handleExport() {
		exportSheetToJson({
			settings: sheetSettings,
			dimensions: { rows, colsCount: cols.length },
			cells
		});
	}

	function triggerImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.onchange = (e) => {
			const target = e.target as HTMLInputElement;
			const file = target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (evt) => {
				const content = evt.target?.result as string;
				const parsed = parseSheetJson(content);
				if (parsed && parsed.settings && parsed.cells) {
					sheetSettings = parsed.settings;
					cells = parsed.cells;
					if (parsed.dimensions) {
						rows = parsed.dimensions.rows || 20;
						updateColumnCount(parsed.dimensions.colsCount || 8);
					}
					activeCellKey = null;
					vueMode = false;
				} else {
					alert('Failed parsing configuration profile. Invalid format.');
				}
			};
			reader.readAsText(file);
		};
		input.click();
	}

	function getCellInlineStyles(key: string): string {
		const cell = cells[key];
		if (!cell) return '';
		const bold = cell.bold ? 'font-weight: bold;' : 'font-weight: normal;';
		const color = `color: ${cell.color || '#ffffff'};`;
		const size = `font-size: ${cell.fontSize || 13}px;`;
		return `${bold} ${color} ${size}`;
	}

	let populatedCount = $derived(Object.keys(cells).filter((k) => cells[k]?.raw?.trim()).length);
</script>

<div class="flex h-screen flex-col bg-black text-white select-none">
	<Header
		{activeCellKey}
		{vueMode}
		{cells}
		onToggleVueMode={() => (vueMode = !vueMode)}
		onExport={handleExport}
		onImport={triggerImport}
		onUpdateRawValue={updateActiveCellRawValue}
		onToggleStyleAttr={toggleStyleAttr}
		onUpdateStyleAttr={updateStyleAttr}
	/>

	<div class="flex flex-1 overflow-hidden">
		<!-- Sidebar Drawer -->
		{#if !vueMode}
			<aside
				class="z-20 flex w-72 flex-col justify-between border-r border-white/10 bg-white/1 p-5 backdrop-blur-xl"
			>
				<div class="space-y-6">
					<div class="space-y-2">
						<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>Active Workbook</span
						>
						<input
							type="text"
							bind:value={sheetSettings.title}
							class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white transition duration-300 outline-none focus:border-[#9999FF]/50 focus:shadow-[0_0_20px_rgba(153,153,255,0.15)]"
						/>
					</div>

					<hr class="border-white/5" />

					<!-- Metrics Cards -->
					<div class="space-y-3">
						<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>Global Options</span
						>

						<div
							class="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 p-3 transition hover:border-[#9999FF]/20"
						>
							<span class="text-xs text-white/60">Total Rows</span>
							<input
								type="number"
								bind:value={rows}
								min="1"
								max="100"
								class="w-16 rounded-lg border border-white/10 bg-black p-1 text-center font-mono text-xs text-white outline-none focus:border-[#9999FF]/50"
							/>
						</div>

						<div
							class="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 p-3 transition hover:border-[#9999FF]/20"
						>
							<span class="text-xs text-white/60">Total Columns</span>
							<input
								type="number"
								value={cols.length}
								oninput={(e) =>
									updateColumnCount(parseInt((e.currentTarget as HTMLInputElement).value))}
								min="1"
								max="26"
								class="w-16 rounded-lg border border-white/10 bg-black p-1 text-center font-mono text-xs text-white outline-none focus:border-[#9999FF]/50"
							/>
						</div>

						<div
							class="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 p-3 transition hover:border-[#9999FF]/20"
						>
							<span class="text-xs text-white/60">Column Width</span>
							<input
								type="number"
								bind:value={sheetSettings.columnWidth}
								min="80"
								max="220"
								class="w-16 rounded-lg border border-white/10 bg-black p-1 text-center font-mono text-xs text-white outline-none focus:border-[#9999FF]/50"
							/>
						</div>
					</div>

					<button
						type="button"
						onclick={clearEntireSheet}
						class="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 font-mono text-xs font-bold tracking-wider text-red-400 uppercase transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/20"
					>
						🧼 Purge Workbook
					</button>
				</div>

				<!-- Telemetry Footer -->
				<div
					class="space-y-1.5 rounded-xl border border-white/5 bg-white/2 p-3 font-mono text-[11px] text-white/40"
				>
					<div class="flex justify-between">
						<span>Populated Nodes:</span>
						<span class="font-bold text-[#9999FF]">{populatedCount} cells</span>
					</div>
					<div class="flex justify-between">
						<span>Grid Dimensions:</span>
						<span class="font-bold text-white/70">{cols.length}W × {rows}H</span>
					</div>
				</div>
			</aside>
		{/if}

		<!-- Interactive Grid Body -->
		<main
			class="relative flex flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-col overflow-auto bg-black p-6"
		>
			<div
				class="flex-1 overflow-auto rounded-[28px] border border-white/10 bg-white/1 p-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
			>
				<table class="w-full table-fixed border-collapse text-left font-sans">
					<thead>
						<tr class="border-b border-white/10 bg-black">
							<th
								class="sticky top-0 left-0 z-20 w-12 border-r border-white/10 bg-black p-2 text-center font-mono text-[10px] font-black tracking-widest text-white/40 uppercase"
								>#</th
							>
							{#each cols as col (col)}
								<th
									style="width: {sheetSettings.columnWidth}px;"
									class="sticky top-0 z-10 border-r border-white/10 bg-black p-2 text-center font-mono text-xs font-bold text-white/70"
								>
									{col}
								</th>
							{/each}
						</tr>
					</thead>

					<tbody>
						{#each Array.from({ length: rows }, (_, i) => i + 1) as rowNum (rowNum)}
							<tr class="border-b border-white/5 transition-colors hover:bg-white/2">
								<td
									class="sticky left-0 z-10 border-r border-white/10 bg-black text-center font-mono text-xs font-medium text-white/40"
								>
									{rowNum}
								</td>

								{#each cols as col (col)}
									{@const cellKey = col + rowNum}
									{@const isSelected = activeCellKey === cellKey}

									<!-- Cell Container -->
									<td
										onclick={() => (activeCellKey = cellKey)}
										class="relative border-r border-white/5 p-0 transition-all {isSelected
											? 'z-10 bg-[#9999FF]/10 ring-1 ring-[#9999FF]/60'
											: ''}"
									>
										{#if vueMode}
											<div
												style={getCellInlineStyles(cellKey)}
												class="min-h-9 w-full truncate overflow-hidden px-3 py-2 font-mono text-xs select-text"
											>
												{evaluateCellOutput(cellKey, cells)}
											</div>
										{:else}
											<input
												type="text"
												value={cells[cellKey]?.raw || ''}
												oninput={(e) =>
													mutateCellValue(cellKey, (e.currentTarget as HTMLInputElement).value)}
												onfocus={() => (activeCellKey = cellKey)}
												style={getCellInlineStyles(cellKey)}
												class="h-full min-h-9 w-full border-b border-transparent bg-transparent px-3 py-2 font-mono text-xs text-white transition duration-150 outline-none focus:border-[#9999FF]/50"
												placeholder=""
											/>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</main>
	</div>
</div>
