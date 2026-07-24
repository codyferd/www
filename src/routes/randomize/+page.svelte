<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';

	type Tab = 'number' | 'list' | 'utility';
	let activeTab = $state<Tab>('number');
	let isRolling = $state(false);
	let copiedKey = $state<string | null>(null);

	// Helper for timed animations
	function runRoll(action: () => void) {
		isRolling = true;
		action();
		setTimeout(() => (isRolling = false), 200);
	}

	function copyToClipboard(text: string, key: string) {
		if (!text) return;
		navigator.clipboard.writeText(text);
		copiedKey = key;
		setTimeout(() => (copiedKey = null), 1500);
	}

	// --- Numbers ---
	let numMin = $state(1);
	let numMax = $state(100);
	let numCount = $state(1);
	let numResults = $state<number[]>([42]);

	function generateNumbers() {
		if (numMin > numMax) [numMin, numMax] = [numMax, numMin];
		numCount = Math.max(1, Math.min(50, numCount));

		runRoll(() => {
			const range = numMax - numMin + 1;
			const res: number[] = [];
			if (numCount > range) {
				for (let i = 0; i < numCount; i++) res.push(Math.floor(Math.random() * range) + numMin);
			} else {
				const pool = new SvelteSet<number>();
				while (pool.size < numCount) pool.add(Math.floor(Math.random() * range) + numMin);
				res.push(...pool);
			}
			numResults = res.sort((a, b) => a - b);
		});
	}

	// --- Weighted List ---
	interface ListItem {
		id: number;
		name: string;
		weight: number;
	}
	let newItemName = $state('');
	let newItemWeight = $state(1);
	let listResult = $state('');
	let listItems = $state<ListItem[]>([
		{ id: 1, name: 'Option Alpha', weight: 5 },
		{ id: 2, name: 'Option Beta', weight: 3 },
		{ id: 3, name: 'Option Gamma', weight: 2 }
	]);

	let totalWeight = $derived(listItems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0));
	let getProb = (w: number) => (totalWeight ? ((w / totalWeight) * 100).toFixed(1) : '0.0');

	function addListItem() {
		const name = newItemName.trim();
		if (!name) return;
		listItems.push({ id: Date.now(), name, weight: Math.max(1, Number(newItemWeight) || 1) });
		newItemName = '';
		newItemWeight = 1;
	}

	function pickOutcome() {
		if (!listItems.length) return;
		runRoll(() => {
			let pt = Math.random() * totalWeight;
			let selected = listItems.at(-1)!.name;
			for (const item of listItems) {
				if ((pt -= item.weight) <= 0) {
					selected = item.name;
					break;
				}
			}
			listResult = selected;
		});
	}

	function shuffleItems() {
		for (let i = listItems.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[listItems[i], listItems[j]] = [listItems[j], listItems[i]];
		}
	}

	function loadPreset(preset: 'binary' | 'priorities') {
		listItems =
			preset === 'binary'
				? [
						{ id: 1, name: 'Yes', weight: 10 },
						{ id: 2, name: 'No', weight: 10 },
						{ id: 3, name: 'Maybe', weight: 3 }
					]
				: [
						{ id: 1, name: 'High Priority', weight: 1 },
						{ id: 2, name: 'Medium Routine', weight: 4 },
						{ id: 3, name: 'Low Backlog', weight: 8 }
					];
		listResult = '';
	}

	// --- Utilities ---
	let coinResult = $state<'HEADS' | 'TAILS'>('HEADS');
	let diceResult = $state(6);
	const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
	let diceEmoji = $derived(diceEmojis[diceResult - 1] || '⚅');

	let rpgModifier = $state(0);
	let rpgRollResult = $state('');
	let tokenConfig = $state({ length: 16, uppercase: true, numbers: true, specials: false });
	let tokenStringOutput = $state('');

	function rollRpg(sides: number) {
		const roll = Math.floor(Math.random() * sides) + 1;
		const mod = Number(rpgModifier) || 0;
		rpgRollResult = `D${sides}: ${roll} ${mod >= 0 ? '+' : ''}${mod} = Total ${roll + mod}`;
	}

	function generateToken() {
		let alpha = 'abcdefghijklmnopqrstuvwxyz';
		if (tokenConfig.uppercase) alpha += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		if (tokenConfig.numbers) alpha += '0123456789';
		if (tokenConfig.specials) alpha += '!@#$%^&*()_+-=[]{}|;:,.<>?';

		const length = Math.max(4, Math.min(64, Number(tokenConfig.length) || 16));
		tokenStringOutput = Array.from(
			{ length },
			() => alpha[Math.floor(Math.random() * alpha.length)]
		).join('');
	}
</script>

<div class="min-h-screen overflow-y-auto bg-black p-4 font-sans text-white select-none md:p-8">
	<div class="mx-auto max-w-2xl space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-white/10 pb-5">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9999FF]/20 bg-[#9999FF]/10 text-xl text-[#9999FF]"
				>
					🎲
				</div>
				<div>
					<h1 class="text-base font-bold tracking-tight">Avero Randomizer Matrix</h1>
					<p class="text-xs text-white/40">Advanced stochastic generation engine</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
				</span>
				<span class="font-mono text-[10px] tracking-widest text-white/30 uppercase">LIVE</span>
			</div>
		</div>

		<!-- Nav Tabs -->
		<div
			class="grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/2 p-1.5 backdrop-blur-md"
		>
			{#each ['number', 'list', 'utility'] as tab (tab)}
				<button
					onclick={() => (activeTab = tab as Tab)}
					class="rounded-xl py-2.5 text-xs font-bold tracking-wider capitalize transition-all {activeTab ===
					tab
						? 'bg-[#9999FF] font-extrabold text-black shadow-[0_0_20px_rgba(153,153,255,0.25)]'
						: 'text-white/40 hover:bg-white/5 hover:text-white'}"
				>
					{tab === 'number' ? 'Numbers' : tab === 'list' ? 'Weighted List' : 'Quick Tools'}
				</button>
			{/each}
		</div>

		<!-- Main Panel -->
		<main
			class="rounded-[28px] border border-white/10 bg-white/2 p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-[#9999FF]/20"
		>
			{#if activeTab === 'number'}
				<div class="space-y-5">
					<div class="grid grid-cols-3 gap-3">
						<div>
							<label
								id="lbl-min"
								for="num-min"
								class="mb-2 block text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
								>Min Bound</label
							>
							<input
								id="num-min"
								type="number"
								bind:value={numMin}
								class="w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-xs outline-none focus:border-[#9999FF]/50"
							/>
						</div>
						<div>
							<label
								id="lbl-max"
								for="num-max"
								class="mb-2 block text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
								>Max Bound</label
							>
							<input
								id="num-max"
								type="number"
								bind:value={numMax}
								class="w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-xs outline-none focus:border-[#9999FF]/50"
							/>
						</div>
						<div>
							<label
								id="lbl-count"
								for="num-count"
								class="mb-2 block text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
								>Quantity</label
							>
							<input
								id="num-count"
								type="number"
								min="1"
								max="50"
								bind:value={numCount}
								class="w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-xs outline-none focus:border-[#9999FF]/50"
							/>
						</div>
					</div>

					<button
						onclick={generateNumbers}
						class="w-full rounded-xl bg-[#9999FF] py-3.5 text-xs font-extrabold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition hover:bg-[#8888EE] active:scale-[0.99]"
					>
						Roll Random Sequence
					</button>

					<div
						class="flex min-h-35 flex-col items-center justify-center rounded-2xl border border-white/5 bg-black/60 p-6"
					>
						<div class="mb-3 flex w-full items-center justify-between">
							<span class="text-[10px] font-black tracking-[0.25em] text-white/30 uppercase"
								>Generated Value Outputs</span
							>
							{#if numResults.length}
								<button
									onclick={() => copyToClipboard(numResults.join(', '), 'num')}
									class="text-[10px] font-bold text-[#9999FF] uppercase hover:underline"
								>
									{copiedKey === 'num' ? 'Copied!' : 'Copy All'}
								</button>
							{/if}
						</div>
						<div class="flex max-w-full flex-wrap justify-center gap-2.5">
							{#each numResults as num, idx (idx)}
								<div
									class="rounded-xl border border-white/10 bg-white/3 px-4 py-2 text-2xl font-black text-[#9999FF] transition-all {isRolling
										? 'scale-95 opacity-50'
										: ''}"
								>
									{num}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else if activeTab === 'list'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<p class="text-xs text-white/50">Modify weight distribution parameters:</p>
						<div class="flex gap-2">
							<button
								onclick={() => loadPreset('binary')}
								class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition hover:text-white"
								>Yes/No</button
							>
							<button
								onclick={() => loadPreset('priorities')}
								class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition hover:text-white"
								>Priority</button
							>
						</div>
					</div>

					<div class="flex gap-2">
						<input
							type="text"
							placeholder="Outcome label..."
							bind:value={newItemName}
							onkeydown={(e) => e.key === 'Enter' && addListItem()}
							class="flex-1 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-xs outline-none focus:border-[#9999FF]/50"
						/>
						<input
							type="number"
							min="1"
							placeholder="Weight"
							bind:value={newItemWeight}
							class="w-20 rounded-xl border border-white/10 bg-white/3 px-2 py-2 text-center text-xs outline-none focus:border-[#9999FF]/50"
						/>
						<button
							onclick={addListItem}
							class="rounded-xl bg-white/10 px-4 text-xs font-bold transition hover:bg-white/20"
							>+</button
						>
					</div>

					<div class="max-h-47.5 overflow-hidden overflow-y-auto rounded-xl border border-white/10">
						<table class="w-full border-collapse text-left">
							<thead>
								<tr
									class="border-b border-white/10 bg-black/80 text-[9px] tracking-widest text-white/40 uppercase"
								>
									<th class="p-2.5 pl-3">Item Label</th>
									<th class="w-24 p-2.5 text-center">Weight</th>
									<th class="w-20 p-2.5 text-center">Probability</th>
									<th class="w-10 p-2.5 text-center"></th>
								</tr>
							</thead>
							<tbody class="divide-y divide-white/5 text-xs">
								{#each listItems as item, idx (item.id)}
									<tr class="transition hover:bg-white/2">
										<td class="p-2 pl-3 font-medium text-white/90">{item.name}</td>
										<td class="p-2 text-center">
											<input
												type="number"
												min="1"
												bind:value={item.weight}
												class="w-16 rounded-lg border border-white/10 bg-black/60 py-1 text-center text-xs outline-none focus:border-[#9999FF]/50"
											/>
										</td>
										<td class="p-2 text-center font-mono text-[11px] text-white/40"
											>{getProb(item.weight)}%</td
										>
										<td class="p-2 text-center">
											<button
												onclick={() => listItems.splice(idx, 1)}
												class="text-white/20 transition hover:text-red-400">✕</button
											>
										</td>
									</tr>
								{:else}
									<tr
										><td colspan="4" class="p-6 text-center text-xs text-white/30 italic"
											>No entries loaded</td
										></tr
									>
								{/each}
							</tbody>
						</table>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<button
							onclick={pickOutcome}
							disabled={!listItems.length}
							class="rounded-xl bg-[#9999FF] py-3 text-xs font-extrabold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition hover:bg-[#8888EE] active:scale-[0.99] disabled:opacity-30"
						>
							Execute Selection
						</button>
						<button
							onclick={shuffleItems}
							disabled={!listItems.length}
							class="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold tracking-wider uppercase transition hover:bg-white/10 active:scale-[0.99] disabled:opacity-30"
						>
							Shuffle Array
						</button>
					</div>

					<div
						class="flex min-h-22.5 flex-col items-center justify-center rounded-2xl border border-white/5 bg-black/60 p-5"
					>
						<span class="mb-1 text-[10px] font-black tracking-[0.25em] text-white/30 uppercase"
							>Evaluated Selection</span
						>
						<div
							class="text-xl font-black tracking-wide text-[#9999FF] transition-all {isRolling
								? 'scale-95 opacity-30'
								: 'scale-100 opacity-100'}"
						>
							{listResult || '—'}
						</div>
					</div>
				</div>
			{:else if activeTab === 'utility'}
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-3">
						<div
							class="flex flex-col items-center space-y-3 rounded-2xl border border-white/5 bg-white/1 p-4"
						>
							<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
								>Coin Flip</span
							>
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full border border-[#9999FF]/30 bg-white/3 text-xs font-black text-[#9999FF] transition-transform {isRolling
									? 'scale-90 rotate-180'
									: ''}"
							>
								{coinResult}
							</div>
							<button
								onclick={() =>
									runRoll(() => (coinResult = Math.random() < 0.5 ? 'HEADS' : 'TAILS'))}
								class="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold tracking-wider uppercase transition hover:bg-white/10"
								>Flip</button
							>
						</div>

						<div
							class="flex flex-col items-center space-y-3 rounded-2xl border border-white/5 bg-white/1 p-4"
						>
							<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
								>Standard D6</span
							>
							<div
								class="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#9999FF]/30 bg-white/3 text-3xl transition-transform {isRolling
									? 'scale-90 opacity-50'
									: ''}"
							>
								{diceEmoji}
							</div>
							<button
								onclick={() => runRoll(() => (diceResult = Math.floor(Math.random() * 6) + 1))}
								class="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold tracking-wider uppercase transition hover:bg-white/10"
								>Roll</button
							>
						</div>
					</div>

					<!-- Polyhedral RPG -->
					<div class="space-y-3 rounded-2xl border border-white/5 bg-white/1 p-4">
						<div class="flex items-center justify-between">
							<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
								>Polyhedral Multi-Die</span
							>
							<div class="flex items-center gap-2">
								<label
									id="lbl-rpg-mod"
									for="rpg-mod"
									class="text-[9px] font-bold tracking-widest text-white/30 uppercase">Mod</label
								>
								<input
									id="rpg-mod"
									type="number"
									bind:value={rpgModifier}
									class="w-12 rounded-lg border border-white/10 bg-black/60 px-1.5 py-0.5 text-center text-xs outline-none focus:border-[#9999FF]/50"
								/>
							</div>
						</div>
						<div class="grid grid-cols-5 gap-2">
							{#each [4, 8, 10, 12, 20] as sides (sides)}
								<button
									onclick={() => rollRpg(sides)}
									class="rounded-xl border border-white/10 bg-white/3 py-2 text-xs font-black text-[#9999FF] transition hover:border-[#9999FF]/40 hover:bg-[#9999FF]/10"
								>
									D{sides}
								</button>
							{/each}
						</div>
						{#if rpgRollResult}
							<div class="pt-1 text-center font-mono text-xs text-white/50">{rpgRollResult}</div>
						{/if}
					</div>

					<!-- Token Generator -->
					<div class="space-y-3 rounded-2xl border border-white/5 bg-white/1 p-4">
						<span class="block text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>Token Generator</span
						>
						<div class="flex items-center justify-between gap-4">
							<div class="flex items-center gap-3">
								<label class="flex cursor-pointer items-center gap-1.5 text-xs text-white/60">
									<input
										type="checkbox"
										bind:checked={tokenConfig.uppercase}
										class="accent-[#9999FF]"
									/> A-Z
								</label>
								<label class="flex cursor-pointer items-center gap-1.5 text-xs text-white/60">
									<input
										type="checkbox"
										bind:checked={tokenConfig.numbers}
										class="accent-[#9999FF]"
									/> 0-9
								</label>
								<label class="flex cursor-pointer items-center gap-1.5 text-xs text-white/60">
									<input
										type="checkbox"
										bind:checked={tokenConfig.specials}
										class="accent-[#9999FF]"
									/> !@#
								</label>
							</div>
							<div class="flex items-center gap-1.5">
								<label
									id="lbl-token-len"
									for="token-len"
									class="text-[9px] font-bold text-white/30 uppercase">Len</label
								>
								<input
									id="token-len"
									type="number"
									min="4"
									max="64"
									bind:value={tokenConfig.length}
									class="w-12 rounded-lg border border-white/10 bg-black/60 px-1.5 py-0.5 text-center text-xs outline-none focus:border-[#9999FF]/50"
								/>
							</div>
						</div>
						<div class="flex gap-2">
							<div
								class="flex min-h-9 flex-1 items-center truncate rounded-xl border border-white/5 bg-black/60 px-3 py-2 font-mono text-xs tracking-wider text-[#9999FF]"
							>
								{tokenStringOutput || 'Generate token sequence...'}
							</div>
							<button
								onclick={generateToken}
								class="rounded-xl bg-white/10 px-4 text-xs font-bold tracking-wider uppercase transition hover:bg-white/20"
								>Gen</button
							>
							{#if tokenStringOutput}
								<button
									onclick={() => copyToClipboard(tokenStringOutput, 'token')}
									class="rounded-xl border border-[#9999FF]/30 bg-[#9999FF]/10 px-3 text-xs font-bold tracking-wider text-[#9999FF] uppercase transition hover:bg-[#9999FF]/20"
								>
									{copiedKey === 'token' ? '✓' : 'Copy'}
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</main>
	</div>
</div>
