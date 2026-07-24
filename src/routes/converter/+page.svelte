<!-- src/routes/converter/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Converter, conversionMatrix } from './converter.svelte';

	onMount(() => {
		if (Converter.currentCategory === 'currency') {
			Converter.syncCurrencyRates();
		} else {
			Converter.calculateTransformation(true);
		}
	});

	// Reactively re-run calculations if units drop or swap
	$effect(() => {
		Converter.calculateTransformation(true);
	});
</script>

<div
	class="flex min-h-screen w-full justify-center bg-black font-sans tracking-tight text-white selection:bg-[#9999FF]/30"
>
	<div
		class="max-width-[760px] flex w-full max-w-2xl scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-col gap-6 overflow-y-auto px-6 py-12"
	>
		<!-- Avero Engine Header -->
		<header class="border-b border-white/10 pb-6">
			<div class="flex flex-col">
				<span class="mb-1 text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
					>Avero Matrix Engine v2.5</span
				>
				<h1 class="text-2xl font-black tracking-tight text-white md:text-3xl">
					High-Precision Unit & Currency Converter
				</h1>
			</div>
		</header>

		<!-- Adaptive System Tab Switches -->
		<nav class="flex gap-2 overflow-x-auto border-b border-white/5 pb-3">
			{#each Object.entries(conversionMatrix) as [key, config] (key)}
				<button
					onclick={() => Converter.switchCategory(key)}
					class="tab-btn rounded-xl px-4 py-2.5 text-[10px] font-black tracking-wider whitespace-nowrap uppercase transition-all duration-300
					{Converter.currentCategory === key
						? 'border border-[#9999FF]/30 bg-white/4 text-[#9999FF] shadow-[0_0_20px_rgba(153,153,255,0.1)]'
						: 'border border-transparent bg-transparent text-white/40 hover:bg-white/5 hover:text-white/80'}"
				>
					{config.label}
				</button>
			{/each}
		</nav>

		<!-- Main Transformation Matrix Core -->
		<main
			class="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-white/2 p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4"
		>
			<!-- Input Node Panel -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-2">
					<label
						for="src-val"
						class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
						>Source Value</label
					>
					<input
						id="src-val"
						type="number"
						bind:value={Converter.sourceValue}
						oninput={() => Converter.calculateTransformation(true)}
						class="w-full rounded-[20px] border border-white/10 bg-white/3 px-5 py-3.5 text-base text-white placeholder-white/20 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
						placeholder="0.00"
						step="any"
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label
						for="src-unit"
						class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
						>From Unit</label
					>
					<select
						id="src-unit"
						bind:value={Converter.sourceUnit}
						onchange={() => Converter.calculateTransformation(true)}
						class="w-full cursor-pointer appearance-none rounded-[20px] border border-white/10 bg-white/3 px-5 py-3.5 text-base text-white transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6"
					>
						{#each Object.entries(Converter.currentUnits) as [unitKey, unitConf] (unitKey)}
							<option value={unitKey} class="bg-[#0f0f14] text-white">
								{unitConf.name}
								{unitConf.symbol ? `(${unitConf.symbol})` : ''}
							</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Divider Flow Diagnostics -->
			<div
				class="flex items-center justify-between border-y border-dashed border-white/10 py-3 font-mono text-xs text-white/30"
			>
				<span class="animate-pulse text-base text-[#9999FF]">⇌</span>
				{#if Converter.currentCategory === 'currency'}
					<span class="tracking-wide">
						1 {Converter.sourceUnit} ≈ {Converter.currentExchangeRate.toFixed(4)}
						{Converter.targetUnit}
					</span>
				{:else}
					<span class="text-[9px] font-black tracking-wide text-white/20 uppercase"
						>Normalized SI Baseline Tracking</span
					>
				{/if}
			</div>

			<!-- Output Node Panel -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-2">
					<label
						for="tgt-val"
						class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
						>Target Result</label
					>
					<input
						id="tgt-val"
						type="number"
						bind:value={Converter.targetValue}
						oninput={() => Converter.calculateTransformation(false)}
						class="w-full rounded-[20px] border border-white/10 bg-white/3 px-5 py-3.5 text-base font-medium text-[#9999FF] placeholder-white/20 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
						placeholder="0.00"
						step="any"
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label
						for="tgt-unit"
						class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">To Unit</label
					>
					<select
						id="tgt-unit"
						bind:value={Converter.targetUnit}
						onchange={() => Converter.calculateTransformation(true)}
						class="w-full cursor-pointer appearance-none rounded-[20px] border border-white/10 bg-white/3 px-5 py-3.5 text-base text-white transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6"
					>
						{#each Object.entries(Converter.currentUnits) as [unitKey, unitConf] (unitKey)}
							<option value={unitKey} class="bg-[#0f0f14] text-white">
								{unitConf.name}
								{unitConf.symbol ? `(${unitConf.symbol})` : ''}
							</option>
						{/each}
					</select>
				</div>
			</div>
		</main>

		<!-- Realtime Telemetry Status Footer -->
		{#if Converter.currentCategory === 'currency'}
			<footer class="text-xs transition-all duration-300">
				{#if Converter.currencyApiState.loading}
					<div
						class="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 font-mono text-amber-400"
					>
						<div class="h-2 w-2 animate-ping rounded-full bg-amber-500"></div>
						<span>Connecting real-time international exchange banking telemetry arrays...</span>
					</div>
				{:else if Converter.currencyApiState.error}
					<div
						class="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 font-mono text-rose-400"
					>
						⚠️ Live Matrix Sync Failed: {Converter.currencyApiState.error}. Loaded verified 2026
						anchor seeds.
					</div>
				{:else}
					<div
						class="flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3 font-mono text-emerald-400"
					>
						<div class="h-2 w-2 rounded-full bg-emerald-500"></div>
						<span
							>Realtime data synchronized successfully via European Central Bank open ticker index.</span
						>
					</div>
				{/if}
			</footer>
		{/if}
	</div>
</div>
