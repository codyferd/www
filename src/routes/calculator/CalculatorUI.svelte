<script lang="ts">
	import { tick } from 'svelte';
	import { math, type HistoryItem } from './calculator';

	let {
		input = $bindable(),
		formula = $bindable(),
		history = $bindable(),
		activeTab = $bindable(),
		triggerFocus,
		CONSTANTS
	}: {
		input: string;
		formula: string;
		history: HistoryItem[];
		activeTab: string;
		triggerFocus: number;
		CONSTANTS: Record<string, string>;
	} = $props();

	let termElement = $state<HTMLInputElement | null>(null);

	const focusInput = async () => {
		await tick();
		if (termElement) termElement.focus();
	};

	$effect(() => {
		if (triggerFocus !== undefined) {
			focusInput();
		}
	});

	const add = (v: string) => {
		input += v;
		focusInput();
	};

	const addFunc = (f: string) => {
		input += f + '(';
		focusInput();
	};

	const exec = () => {
		if (!input) return;
		try {
			const res = math.evaluate(input);
			let outStr = '';
			if (res && typeof res.format === 'function') {
				outStr = res.format({ precision: 14 });
			} else {
				outStr = math.format(res, { precision: 14 }).toString();
			}

			formula = input;
			history.unshift({ exp: input, res: outStr });
			input = outStr;
		} catch (err) {
			const errorContext = input;
			input = 'COMPILATION_ERROR';
			formula = err instanceof Error ? err.message : 'Error running evaluation';
			setTimeout(() => {
				if (input === 'COMPILATION_ERROR') {
					input = errorContext;
				}
			}, 1600);
		}
		focusInput();
	};
</script>

<div
	class="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/2 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:bg-white/4"
>
	<input
		bind:value={input}
		onkeyup={(e) => e.key === 'Enter' && exec()}
		bind:this={termElement}
		class="avero-input mb-4 w-full border-b border-white/10 bg-black/40 p-4 font-mono text-5xl font-black tracking-tight text-[#9999FF] transition duration-300 outline-none focus:border-[#9999FF] focus:shadow-[0_0_30px_rgba(153,153,255,0.12)] sm:text-6xl"
		placeholder="0"
	/>
	<div class="mt-2 flex justify-between font-mono text-[10px] tracking-wider text-white/40">
		<span>Formula Stream: <b class="text-white">{formula || 'awaiting_input'}</b></span>
		<div class="flex items-center gap-1.5">
			<span class="h-1.5 w-1.5 animate-ping rounded-full bg-[#9999FF]"></span>
			<span class="font-black text-[#9999FF] uppercase">Math.js Active</span>
		</div>
	</div>

	<div class="mt-8 mb-6 flex flex-wrap gap-2">
		{#each ['basic', 'algebra & calculus', 'matrices & arrays', 'complex & units', 'trig', 'prob'] as t (t)}
			<button
				onclick={() => (activeTab = t)}
				class="cursor-pointer rounded-full border border-white/5 px-4 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all duration-200 {activeTab ===
				t
					? 'border-[#9999FF] bg-[#9999FF]/10 text-[#9999FF]'
					: 'text-white/40 hover:border-white/10 hover:text-white/80'}"
			>
				{t}
			</button>
		{/each}
	</div>

	<div class="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
		{#if activeTab === 'basic'}
			{#each ['sqrt', 'cbrt', 'log', 'log10', 'abs', 'ceil', 'floor', 'sign', 'exp', 'mod', 'nthRoot', 'square'] as f (f)}
				<button onclick={() => addFunc(f)} class="func-btn">{f}</button>
			{/each}
		{/if}
		{#if activeTab === 'algebra & calculus'}
			{#each ['simplify', 'derivative', 'rationalize', 'evaluate', 'factor', 'expand'] as f (f)}
				<button onclick={() => addFunc(f)} class="func-btn border-[#9999FF]/20 text-[#9999FF]">
					{f}
				</button>
			{/each}
		{/if}
		{#if activeTab === 'matrices & arrays'}
			{#each ['matrix', 'det', 'inv', 'transpose', 'ones', 'zeros', 'size', 'trace', 'cross', 'dot'] as f (f)}
				<button onclick={() => addFunc(f)} class="func-btn border-cyan-500/20 text-cyan-400">
					{f}
				</button>
			{/each}
		{/if}
		{#if activeTab === 'complex & units'}
			{#each ['complex', 'conj', 're', 'im', 'arg', 'unit'] as f (f)}
				<button onclick={() => addFunc(f)} class="func-btn border-purple-500/20 text-purple-400">
					{f}
				</button>
			{/each}
		{/if}
		{#if activeTab === 'trig'}
			{#each ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'sec', 'cot', 'csc'] as f (f)}
				<button onclick={() => addFunc(f)} class="func-btn">{f}</button>
			{/each}
		{/if}
		{#if activeTab === 'prob'}
			{#each ['factorial', 'random', 'gamma', 'permutations', 'combinations', 'pickRandom'] as f (f)}
				<button onclick={() => addFunc(f)} class="func-btn">{f}</button>
			{/each}
		{/if}

		<button onclick={() => add('[')} class="func-btn op-btn font-mono">[</button>
		<button onclick={() => add(']')} class="func-btn op-btn font-mono">]</button>
		<button onclick={() => add(', ')} class="func-btn op-btn font-mono">,</button>
		<button onclick={() => add('i')} class="func-btn op-btn font-mono text-[#9999FF]">i</button>
		<button onclick={() => add('(')} class="func-btn op-btn font-mono">(</button>
		<button onclick={() => add(')')} class="func-btn op-btn font-mono">)</button>
		<button onclick={() => add('^')} class="func-btn op-btn">xʸ</button>
		<button onclick={() => add(' in ')} class="func-btn op-btn text-[9px] text-[#9999FF]"
			>to Unit</button
		>
		<button
			onclick={() => (input = '')}
			class="func-btn cursor-pointer border-red-500/20 text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
		>
			AC
		</button>
		<button
			onclick={exec}
			class="col-span-3 cursor-pointer rounded-xl bg-[#9999FF] py-3.5 text-[10px] font-black tracking-widest text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)] active:scale-[0.98] sm:col-span-2 md:col-span-2"
		>
			Execute Matrix
		</button>
	</div>
</div>

<div class="mt-8">
	<div class="mb-4 font-mono text-[10px] tracking-[0.25em] text-white/30 uppercase">
		MathJS Engineering Constants Matrix
	</div>
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		{#each Object.entries(CONSTANTS) as [key, val] (key)}
			<button
				onclick={() => add(key)}
				class="group cursor-pointer rounded-2xl border border-white/5 bg-white/1 p-4 text-left transition-all duration-300 hover:border-[#9999FF]/30 hover:bg-white/3 focus:outline-none"
			>
				<div
					class="font-mono text-[9px] font-black text-white/40 uppercase transition-colors group-hover:text-[#9999FF]"
				>
					{key}
				</div>
				<div class="mt-1 truncate font-mono text-xs text-white/80">{val}</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.func-btn {
		cursor: pointer;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding-top: 0.85rem;
		padding-bottom: 0.85rem;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.65rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		transition: all 0.2s;
	}
	.func-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #ffffff;
		border-color: rgba(255, 255, 255, 0.2);
	}
	.op-btn {
		color: #9999ff;
		border-color: rgba(153, 153, 255, 0.1);
	}
</style>
