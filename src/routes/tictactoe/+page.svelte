<script lang="ts">
	// Types & Interfaces
	type Mark = 'X' | 'O' | null;

	interface MatchHistoryItem {
		round: number;
		opening: string;
		winnerName: string;
		strategy: string;
	}

	// Game Configuration & State (Svelte 5 Runes)
	let gameStarted = $state(false);
	let showLearn = $state(false);
	let totalRounds = $state(2);
	let currentRound = $state(1);

	let scores = $state({ P1: 0, P2: 0 });
	let matchHistory = $state<MatchHistoryItem[]>([]);

	let board = $state<Mark[]>(Array(9).fill(null));
	let moves = $state<number[]>([]);
	let winner = $state<Mark>(null);
	let roundStrategy = $state<string | null>(null);
	let isXNext = $state(true);

	// Derived Calculations
	const isP1TurnToStartX = $derived(currentRound % 2 !== 0);

	const types = ['x', 'y', 'x', 'y', 'z', 'y', 'x', 'y', 'x'];
	const openingMap: Record<string, string> = {
		xx: 'Indian',
		xy: 'Chinese',
		xz: 'American',
		yx: 'Indonesian',
		yy: 'Pakistani',
		yz: 'Nigerian',
		zx: 'Brazilian',
		zy: 'Bangladeshi'
	};

	const openingName = $derived.by(() => {
		if (moves.length < 2) return null;
		const key = types[moves[0]] + types[moves[1]];
		return openingMap[key] || 'Standard';
	});

	const isDraw = $derived(!winner && !board.includes(null));

	// Helper Logic
	function getStrategy(winChar: 'X' | 'O'): string {
		const pMoves = moves.filter((_, idx) => idx % 2 === (winChar === 'X' ? 0 : 1));
		const label = winChar === 'X' ? 'Gambit' : 'Victory';
		if (!pMoves.includes(4)) return `Perimeter ${label}`;
		if (pMoves.length === 3) return `Easy ${label}`;
		return `Precision ${label}`;
	}

	function playCell(i: number) {
		if (board[i] || winner) return;

		const char: 'X' | 'O' = isXNext ? 'X' : 'O';
		board[i] = char;
		moves.push(i);

		const winPaths = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8], // Rows
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8], // Columns
			[0, 4, 8],
			[2, 4, 6] // Diagonals
		];

		for (const path of winPaths) {
			if (path.every((p) => board[p] === char)) {
				winner = char;
				roundStrategy = getStrategy(char);
				const isP1 = (char === 'X' && isP1TurnToStartX) || (char === 'O' && !isP1TurnToStartX);
				if (isP1) {
					scores.P1++;
				} else {
					scores.P2++;
				}
				return;
			}
		}

		if (!board.includes(null)) {
			scores.P1 += 0.5;
			scores.P2 += 0.5;
		}

		isXNext = !isXNext;
	}

	function nextRound() {
		let winnerName = 'Draw';
		if (winner) {
			const isP1 = (winner === 'X' && isP1TurnToStartX) || (winner === 'O' && !isP1TurnToStartX);
			winnerName = isP1 ? 'P1' : 'P2';
		}

		matchHistory.push({
			round: currentRound,
			opening: openingName || 'Standard',
			strategy: roundStrategy || 'Stalemate',
			winnerName
		});

		if (currentRound >= totalRounds) {
			// Complete Reset
			gameStarted = false;
			currentRound = 1;
			scores = { P1: 0, P2: 0 };
			matchHistory = [];
			resetBoard();
			return;
		}

		resetBoard();
		currentRound++;
		isXNext = true;
	}

	function resetBoard() {
		board = Array(9).fill(null);
		moves = [];
		winner = null;
		roundStrategy = null;
	}
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-black p-4 font-sans text-white md:p-8"
>
	<!-- Central App Canvas -->
	<div
		class="w-full max-w-4xl space-y-8 rounded-[28px] border border-white/10 bg-white/2 p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 md:p-10"
	>
		<!-- App Header -->
		<div
			class="flex flex-col items-start justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center"
		>
			<div>
				<h1 class="font-sans text-2xl font-black tracking-tight text-white uppercase">
					Avero TicTacToe
				</h1>
				<p class="mt-1 font-mono text-xs text-white/40">
					Balanced Strategic Matrix & Counter-Play Engine
				</p>
			</div>

			<div class="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
				<span
					class="h-2.5 w-2.5 rounded-full {gameStarted
						? 'animate-ping bg-[#9999FF]'
						: 'bg-white/20'}"
				></span>
				<span class="font-mono text-[10px] font-bold tracking-widest text-white/60 uppercase">
					{gameStarted ? `Round ${currentRound} / ${totalRounds}` : 'System Standby'}
				</span>
			</div>
		</div>

		<!-- Configuration View (Match Setup) -->
		{#if !gameStarted}
			<div class="mx-auto max-w-md space-y-8 py-6 text-center">
				<div class="space-y-2">
					<span class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
						>Balanced Tournament Mode</span
					>
					<h2 class="text-xl font-bold text-white">Select Match Length</h2>
					<p class="text-xs text-white/40">
						Alternating dynamic starting positions guarantee competitive fairness across all match
						lengths.
					</p>
				</div>

				<!-- Round Selector Buttons -->
				<div class="flex flex-wrap justify-center gap-2">
					{#each [1, 2, 4, 6, 10] as n (n)}
						<button
							onclick={() => (totalRounds = n)}
							class="h-12 w-12 rounded-2xl border font-mono text-sm font-bold transition-all duration-300 {totalRounds ===
							n
								? 'border-[#9999FF] bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.4)]'
								: 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'}"
						>
							{n}
						</button>
					{/each}
				</div>

				<div class="space-y-3 pt-4">
					<button
						onclick={() => (gameStarted = true)}
						class="w-full rounded-2xl bg-[#9999FF] px-6 py-4 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
					>
						Initialize Match
					</button>

					<button
						onclick={() => (showLearn = true)}
						class="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-mono text-xs font-bold text-white/60 uppercase transition duration-300 hover:border-[#9999FF]/30 hover:bg-white/10"
					>
						Theory Center
					</button>
				</div>
			</div>
		{:else}
			<!-- Game Layout -->
			<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
				<!-- Left Play Zone -->
				<div class="flex flex-col items-center space-y-6 lg:col-span-7">
					<!-- Opening & Strategy Status Bar -->
					<div class="flex min-h-13 flex-col items-center justify-center space-y-2 text-center">
						{#if openingName}
							<div
								class="rounded-full border border-[#9999FF]/30 bg-[#9999FF]/10 px-4 py-1.5 text-[10px] font-black tracking-widest text-[#9999FF] uppercase shadow-[0_0_15px_rgba(153,153,255,0.15)]"
							>
								{openingName} OPENING
							</div>
						{/if}
						{#if winner && roundStrategy}
							<div
								class="animate-pulse font-mono text-[11px] font-black tracking-widest text-amber-400 uppercase"
							>
								★ {roundStrategy}
							</div>
						{:else if isDraw}
							<div class="font-mono text-[11px] font-black tracking-widest text-white/60 uppercase">
								Stalemate Reached
							</div>
						{/if}
					</div>

					<!-- 3x3 Grid Matrix -->
					<div class="grid aspect-square w-full max-w-[320px] grid-cols-3 gap-3">
						{#each board as val, i (i)}
							<button
								onclick={() => playCell(i)}
								disabled={!!val || !!winner || isDraw}
								class="flex items-center justify-center rounded-2xl border border-white/10 bg-white/2 text-3xl font-black transition-all duration-300 hover:border-[#9999FF]/30 hover:bg-white/5 active:scale-95 disabled:cursor-default {val ===
								'X'
									? 'border-[#9999FF]/40 bg-[#9999FF]/5 text-[#9999FF] shadow-[0_0_20px_rgba(153,153,255,0.25)]'
									: ''} {val === 'O'
									? 'border-rose-500/40 bg-rose-500/5 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
									: ''}"
							>
								{val || ''}
							</button>
						{/each}
					</div>

					<!-- Scoreboard Controls -->
					<div class="w-full max-w-[320px] space-y-4">
						<div class="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-center">
							<div class="rounded-2xl border border-white/5 bg-white/1 p-3">
								<span class="block text-[9px] font-black tracking-widest text-white/40 uppercase"
									>P1 Score</span
								>
								<span class="font-mono text-2xl font-black text-white">{scores.P1}</span>
							</div>
							<div class="rounded-2xl border border-white/5 bg-white/1 p-3">
								<span class="block text-[9px] font-black tracking-widest text-white/40 uppercase"
									>P2 Score</span
								>
								<span class="font-mono text-2xl font-black text-white">{scores.P2}</span>
							</div>
						</div>

						{#if winner || isDraw}
							<button
								onclick={nextRound}
								class="w-full rounded-2xl bg-[#9999FF] px-6 py-3.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_0_25px_rgba(153,153,255,0.3)] transition-all duration-300 hover:bg-[#8888EE]"
							>
								{currentRound >= totalRounds ? 'Finish Session' : 'Next Round'}
							</button>
						{/if}
					</div>
				</div>

				<!-- Right Tactical History Sidebar -->
				<div class="space-y-4 rounded-2xl border border-white/5 bg-white/1 p-5 lg:col-span-5">
					<div class="flex items-center justify-between border-b border-white/5 pb-3">
						<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
							>Tactical Log</span
						>
						<span class="font-mono text-[10px] text-[#9999FF]">{matchHistory.length} Matches</span>
					</div>

					<div
						class="max-h-75 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-3 overflow-y-auto pr-1 lg:max-h-90"
					>
						{#if matchHistory.length === 0}
							<div class="py-8 text-center font-mono text-xs text-white/30 italic">
								Awaiting match data...
							</div>
						{:else}
							{#each matchHistory.slice().reverse() as h (h.round)}
								<div
									class="space-y-1 rounded-xl border border-white/5 bg-white/2 p-3 text-xs transition duration-300 hover:border-[#9999FF]/20"
								>
									<div class="flex items-center justify-between">
										<span class="font-mono font-bold text-[#9999FF]">R{h.round}: {h.opening}</span>
										<span class="rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/70"
											>{h.winnerName}</span
										>
									</div>
									<p class="font-mono text-[10px] text-white/40">Strategy: {h.strategy}</p>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Theory Center Modal -->
	{#if showLearn}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
		>
			<div
				class="w-full max-w-xl space-y-6 rounded-[28px] border border-white/10 bg-white/4 p-6 shadow-2xl sm:p-8"
			>
				<div class="space-y-2 text-center">
					<span class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
						>Avero Strategic Matrix</span
					>
					<h2 class="text-2xl font-black tracking-tight text-white uppercase">Theory Center</h2>
				</div>

				<div class="space-y-4 border-l-2 border-[#9999FF] pl-4">
					<span class="block text-[10px] font-black tracking-widest text-[#9999FF] uppercase"
						>Optimal Counter-Play Rules</span
					>
					<div class="space-y-2 font-mono text-xs">
						<div class="rounded-xl border border-white/5 bg-white/5 p-3">
							<b class="text-[#9999FF]">vs Corner:</b> Take Center immediately to deny traps.
						</div>
						<div class="rounded-xl border border-white/5 bg-white/5 p-3">
							<b class="text-[#9999FF]">vs Side:</b> Take Center to neutralize potential splits.
						</div>
						<div class="rounded-xl border border-white/5 bg-white/5 p-3">
							<b class="text-[#9999FF]">vs Center:</b> Take Corner to set up secondary gambits.
						</div>
					</div>
				</div>

				<button
					onclick={() => (showLearn = false)}
					class="w-full rounded-2xl bg-[#9999FF] px-6 py-4 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE]"
				>
					Return to Engine
				</button>
			</div>
		</div>
	{/if}
</div>
