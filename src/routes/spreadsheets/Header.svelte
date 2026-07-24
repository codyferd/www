<script lang="ts">
	import type { CellStore } from './types';

	interface Props {
		activeCellKey: string | null;
		vueMode: boolean;
		cells: CellStore;
		onToggleVueMode: () => void;
		onExport: () => void;
		onImport: () => void;
		onUpdateRawValue: (val: string) => void;
		onToggleStyleAttr: (attr: 'bold') => void;
		onUpdateStyleAttr: (attr: 'color' | 'fontSize', value: string | number) => void;
	}

	let {
		activeCellKey,
		vueMode,
		cells,
		onToggleVueMode,
		onExport,
		onImport,
		onUpdateRawValue,
		onToggleStyleAttr,
		onUpdateStyleAttr
	}: Props = $props();

	let activeCell = $derived(activeCellKey ? cells[activeCellKey] : null);
</script>

<header class="z-30 flex flex-col gap-3 border-b border-white/10 bg-black/80 p-4 backdrop-blur-xl">
	<!-- Top Bar Controls -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<span
				class="bg-linear-to-r from-white via-white to-[#9999FF] bg-clip-text text-xl font-black tracking-wider text-transparent"
			>
				AVERO
			</span>
			<span
				class="rounded-lg border border-[#9999FF]/20 bg-[#9999FF]/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-[#9999FF] uppercase"
			>
				Spreadsheets
			</span>
		</div>

		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={onToggleVueMode}
				class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition-all duration-300 hover:border-[#9999FF]/40 hover:bg-white/10"
			>
				<span>{vueMode ? '👁 Calculated View' : '📝 Sheet Editor'}</span>
			</button>

			<button
				type="button"
				onclick={onExport}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition-all duration-300 hover:border-white/20 hover:bg-white/10"
			>
				Export
			</button>

			<button
				type="button"
				onclick={onImport}
				class="rounded-xl bg-[#9999FF] px-5 py-2 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.2)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.4)]"
			>
				Import
			</button>
		</div>
	</div>

	<!-- Formula & Styling Bar -->
	<div
		class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/2 p-2.5 backdrop-blur-md"
	>
		<div
			class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/60"
		>
			<span class="text-[10px] tracking-wider text-white/40 uppercase">Target:</span>
			<span class="font-bold text-[#9999FF]">{activeCellKey || '--'}</span>
		</div>

		<span class="font-mono text-base font-bold text-[#9999FF]">ƒ<sub>x</sub></span>

		<input
			type="text"
			value={activeCellKey ? activeCell?.raw || '' : ''}
			oninput={(e) => onUpdateRawValue((e.currentTarget as HTMLInputElement).value)}
			disabled={!activeCellKey || vueMode}
			placeholder="Select a cell... Type raw values or call formulas like =SUM(A1:A5) or =AVG(B1:B10)"
			class="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-xs text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/10 disabled:opacity-40"
		/>

		{#if activeCellKey && !vueMode}
			<div class="flex items-center gap-2 border-l border-white/10 pl-3">
				<button
					type="button"
					onclick={() => onToggleStyleAttr('bold')}
					class="rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition-all {activeCell?.bold
						? 'border-[#9999FF]/40 bg-[#9999FF]/20 text-[#9999FF]'
						: 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}"
					title="Toggle Bold Weight"
				>
					B
				</button>

				<input
					type="color"
					value={activeCell?.color || '#ffffff'}
					oninput={(e) => onUpdateStyleAttr('color', (e.currentTarget as HTMLInputElement).value)}
					class="h-7 w-7 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
					title="Cell Text Color"
				/>

				<input
					type="number"
					value={activeCell?.fontSize || 13}
					oninput={(e) =>
						onUpdateStyleAttr(
							'fontSize',
							parseInt((e.currentTarget as HTMLInputElement).value) || 13
						)}
					min="10"
					max="24"
					class="w-12 rounded-lg border border-white/10 bg-white/5 p-1 text-center font-mono text-xs text-white outline-none focus:border-[#9999FF]/50"
					title="Font Size"
				/>
			</div>
		{/if}
	</div>
</header>
