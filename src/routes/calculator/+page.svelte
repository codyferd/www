<script lang="ts">
	import CalculatorUI from './CalculatorUI.svelte';
	import GraphingEngine from './GraphingEngine.svelte';
	import { CONSTANTS, type HistoryItem, type GraphEquation } from './calculator';

	let mode = $state<'scientific' | 'graphing'>('scientific');
	let input = $state<string>('');
	let formula = $state<string>('');
	let history = $state<HistoryItem[]>([]);
	let graphEquations = $state<GraphEquation[]>([]);

	// UI states shared down or triggered from parent
	let activeTab = $state<string>('basic');
	let triggerFocus = $state<number>(0);
	let triggerGraphDraw = $state<number>(0);

	const selectHistory = (exp: string) => {
		input = exp;
		triggerFocus += 1;
	};

	const clearHistory = () => {
		history = [];
	};

	const addEquation = () => {
		// Design System Colors for graphing paths
		const colors = ['#9999FF', '#a855f7', '#00f2fe', '#f43f5e', '#fbbf24', '#10b981'];
		graphEquations.push({
			id: Date.now() + Math.random(),
			text: '',
			color: colors[graphEquations.length % colors.length]
		});
		triggerGraphDraw += 1;
	};

	const removeEquation = (index: number) => {
		graphEquations.splice(index, 1);
		triggerGraphDraw += 1;
	};
</script>

<div
	class="min-h-screen bg-black p-4 font-sans text-zinc-100 antialiased selection:bg-[#9999FF]/20 selection:text-[#9999FF] sm:p-8 md:p-12"
>
	<div class="mx-auto max-w-7xl pt-16">
		<div
			class="mb-8 flex flex-col items-start justify-between gap-6 border-b border-white/5 pb-6 md:flex-row md:items-center"
		>
			<div>
				<h1 class="text-4xl font-black tracking-tighter text-white uppercase italic">
					Avero <span class="text-[#9999FF]">Calculator</span>
				</h1>
				<p class="mt-1 font-mono text-[10px] tracking-widest text-white/40 uppercase">
					Math.js Quantum Processing Unit Loaded
				</p>
			</div>

			<div class="flex rounded-xl border border-white/10 bg-white/2 p-1 backdrop-blur-md">
				<button
					onclick={() => (mode = 'scientific')}
					class="cursor-pointer rounded-lg px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-300 {mode ===
					'scientific'
						? 'bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.25)]'
						: 'text-white/40 hover:text-white'}"
				>
					Scientific
				</button>
				<button
					onclick={() => (mode = 'graphing')}
					class="cursor-pointer rounded-lg px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-300 {mode ===
					'graphing'
						? 'bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.25)]'
						: 'text-white/40 hover:text-white'}"
				>
					Graphing
				</button>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
			<div class="space-y-4 lg:col-span-3">
				<div
					class="flex h-[620px] flex-col rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl transition-all duration-500 hover:bg-white/4"
				>
					<span
						class="mb-4 flex items-center justify-between text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>
						<span class="flex items-center gap-2">
							<span
								class="h-1.5 w-1.5 animate-ping rounded-full bg-[#9999FF] shadow-[0_0_10px_#9999ff]"
							></span>
							{mode === 'scientific' ? 'History & Environment' : 'Mathematical Plots'}
						</span>
						{#if mode === 'scientific' && history.length}
							<button
								onclick={clearHistory}
								class="cursor-pointer text-[9px] tracking-widest text-[#9999FF] uppercase hover:underline"
							>
								Clear
							</button>
						{/if}
					</span>

					{#if mode === 'scientific'}
						<div
							class="grow scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-4 overflow-y-auto pr-1"
						>
							{#if history.length === 0}
								<div
									class="flex h-full items-center justify-center text-center font-mono text-[11px] text-white/30 italic"
								>
									Workspace initialized.<br />No logs computed.
								</div>
							{:else}
								{#each history as h (h.exp + h.res)}
									<button
										onclick={() => selectHistory(h.exp)}
										class="group flex w-full cursor-pointer flex-col justify-between rounded-xl border border-white/5 bg-white/1 p-4 text-left transition duration-300 outline-none hover:border-[#9999FF]/15 hover:bg-white/3"
									>
										<div
											class="truncate font-mono text-[10px] text-white/50 transition-colors group-hover:text-white"
										>
											{h.exp}
										</div>
										<div class="mt-1.5 truncate font-mono text-xs font-black text-[#9999FF]">
											{h.res}
										</div>
									</button>
								{/each}
							{/if}
						</div>
					{:else}
						<div
							class="grow scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-3 overflow-y-auto pr-1"
						>
							{#if graphEquations.length === 0}
								<div class="py-8 text-center font-mono text-[11px] text-white/30 italic">
									No equations assigned.
								</div>
							{:else}
								{#each graphEquations as eq, i (eq.id)}
									<div
										class="rounded-2xl border border-white/5 bg-black/40 p-4 transition duration-300 hover:border-white/10"
									>
										<div class="mb-3 flex items-center justify-between">
											<span
												class="rounded-lg bg-white/5 px-2.5 py-1 text-[9px] font-black tracking-widest"
												style="color: {eq.color}"
											>
												Y{i + 1} = f(x)
											</span>
											<button
												onclick={() => removeEquation(i)}
												class="cursor-pointer text-[10px] text-white/40 transition-colors hover:text-red-400"
											>
												✕
											</button>
										</div>
										<input
											bind:value={eq.text}
											oninput={() => (triggerGraphDraw += 1)}
											class="w-full border-b border-white/10 bg-transparent pb-1 font-mono text-xs text-white transition duration-200 outline-none focus:border-[#9999FF]"
											placeholder="e.g., 2 * x^2 - 4"
										/>
									</div>
								{/each}
							{/if}
							<button
								onclick={addEquation}
								class="w-full cursor-pointer rounded-xl border border-dashed border-white/10 py-3.5 text-[10px] font-black tracking-widest text-white/60 uppercase transition-all duration-300 hover:border-[#9999FF]/40 hover:bg-white/5"
							>
								+ Add Functional Plot
							</button>
						</div>
					{/if}
				</div>
			</div>

			<div class="space-y-6 lg:col-span-9">
				{#if mode === 'scientific'}
					<div class="space-y-6">
						<CalculatorUI
							bind:input
							bind:formula
							bind:history
							bind:activeTab
							{triggerFocus}
							{CONSTANTS}
						/>
					</div>
				{:else}
					<div class="space-y-6">
						<GraphingEngine bind:graphEquations {triggerGraphDraw} />
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
