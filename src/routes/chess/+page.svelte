<script lang="ts">
	import { onMount } from 'svelte';
	import { Chess, type Square, type Piece, type Move } from 'chess.js';
	import { Mesh, type MeshMove } from './mesh.svelte';
	import { fetchAiMove } from './engine';

	const game = new Chess();

	// App Screens & Systems
	let gameStarted = $state(false);
	let lobbyId = $state('');
	let meshStatus = $state('Disconnected');
	let errorToast = $state('');
	let connectionMode = $state('Local');
	let gameOverMessage = $state('');
	let currentOpening = $state('Standard Development');

	// Functional Game Engine States
	let isAiMode = $state(false);
	let isAiThinking = $state(false);
	let boardState = $state<(Piece | null)[][]>(game.board());
	let turn = $state('w');
	let flipped = $state(false);
	let moveHistory = $state<Move[]>([]);
	let captured = $state<{ w: string[]; b: string[] }>({ w: [], b: [] });
	let selected = $state<Square | null>(null);
	let lastMove = $state<{ from: string | null; to: string | null }>({ from: null, to: null });

	// Dynamic computed material balancing
	let evalScore = $derived(50);

	function showToast(msg: string) {
		errorToast = msg;
		setTimeout(() => {
			errorToast = '';
		}, 3000);
	}

	function syncState() {
		boardState = game.board();
		turn = game.turn();
		const rawHistory = game.history({ verbose: true });
		moveHistory = rawHistory;

		// Recompute captured units
		captured = { w: [], b: [] };
		rawHistory.forEach((m) => {
			if (m.captured) {
				const color = m.color === 'w' ? 'b' : 'w';
				captured[color] = [...captured[color], m.captured];
			}
		});

		// Check terminal conditions
		if (game.isGameOver()) {
			if (game.isCheckmate())
				gameOverMessage = `Checkmate! ${turn === 'w' ? 'Black' : 'White'} wins.`;
			else if (game.isDraw()) gameOverMessage = 'Match Drawn!';
			else gameOverMessage = 'Game Over';
		}
	}

	async function triggerAiCounter() {
		if (!isAiMode || turn !== 'b' || game.isGameOver()) return;
		isAiThinking = true;
		const nextMove = await fetchAiMove(game.fen());
		isAiThinking = false;

		if (nextMove) {
			const move = game.move({
				from: nextMove.from,
				to: nextMove.to,
				promotion: nextMove.promotion || 'q'
			});
			if (move) {
				lastMove = { from: nextMove.from, to: nextMove.to };
				syncState();
			}
		} else {
			showToast('AI Engine Timeout');
		}
	}

	// Watcher simulation for reactive turn changes
	$effect(() => {
		if (turn === 'b') {
			setTimeout(triggerAiCounter, 600);
		}
	});

	function formatLobbyId() {
		lobbyId = lobbyId.replace(/\s+/g, '-').toLowerCase();
	}

	function hostMeshGame() {
		if (!lobbyId) return showToast('Room configuration name required');
		connectionMode = 'Host';
		Mesh.initHost(lobbyId, {
			onStatus: (s) => (meshStatus = s),
			onStarted: () => {
				gameStarted = true;
				syncState();
			},
			onRemoteMove: (m: MeshMove) => {
				game.move(m);
				lastMove = m;
				syncState();
			},
			onKick: (msg) => {
				showToast(msg);
				resetGame();
			}
		});
	}

	function joinMeshGame() {
		if (!lobbyId) return showToast('Room configuration name required');
		connectionMode = 'Peer';
		Mesh.initJoin(lobbyId, {
			onStatus: (s) => (meshStatus = s),
			onStarted: () => {
				gameStarted = true;
				flipped = true;
				syncState();
			},
			onRemoteMove: (m: MeshMove) => {
				game.move(m);
				lastMove = m;
				syncState();
			},
			onKick: (msg) => {
				showToast(msg);
				resetGame();
			}
		});
	}

	function initAiGame() {
		isAiMode = true;
		connectionMode = 'VS AI';
		gameStarted = true;
		syncState();
	}
	function initLocalGame() {
		connectionMode = 'Local';
		gameStarted = true;
		syncState();
	}

	function resetGame() {
		game.reset();
		gameStarted = false;
		isAiMode = false;
		gameOverMessage = '';
		flipped = false;
		lastMove = { from: null, to: null };
		selected = null;
		Mesh.cleanup();
		syncState();
	}

	function getSquareName(r: number, c: number): Square {
		return (String.fromCharCode(97 + c) + (8 - r)) as Square;
	}

	function handleSquareClick(r: number, c: number) {
		if (game.isGameOver() || (isAiMode && game.turn() === 'b')) return;

		const sq = getSquareName(r, c);
		const piece = game.get(sq);

		if (Mesh.state.isMesh && game.turn() !== Mesh.state.myColor) return;

		if (selected) {
			try {
				const move = game.move({ from: selected, to: sq, promotion: 'q' });
				if (move) {
					if (Mesh.state.isMesh) Mesh.sendMove({ from: move.from, to: move.to });
					lastMove = { from: move.from, to: move.to };
					syncState();
				}
			} catch {
				// Invalid standard destination click; re-select if own piece clicked instead
				if (piece && piece.color === game.turn()) {
					selected = sq;
				} else {
					selected = null;
				}
			}
			selected = null;
		} else if (piece && piece.color === game.turn()) {
			selected = sq;
		}
	}

	function isLegalMove(r: number, c: number): boolean {
		if (!selected) return false;
		const sq = getSquareName(r, c);
		return game.moves({ square: selected, verbose: true }).some((m) => m.to === sq && !m.captured);
	}

	function isCaptureMove(r: number, c: number): boolean {
		if (!selected) return false;
		const sq = getSquareName(r, c);
		return game.moves({ square: selected, verbose: true }).some((m) => m.to === sq && m.captured);
	}

	function getPieceURL(p: { type: string; color: string }): string {
		return `https://lichess1.org/assets/piece/cburnett/${p.color}${p.type.toUpperCase()}.svg`;
	}

	onMount(() => syncState());
</script>

<div
	class="h-screen w-screen overflow-hidden bg-black font-sans tracking-tight text-slate-300 select-none"
>
	{#if !gameStarted}
		<!-- Avero Aesthetic Modular Canvas Wrapper -->
		<div
			class="flex h-screen items-center justify-center bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-[#9999FF]/5 via-transparent to-transparent p-6"
		>
			<div
				class="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-10 text-center shadow-[0_0_30px_rgba(153,153,255,0.05)] backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20"
			>
				<h1 class="mb-1 text-6xl font-black tracking-tighter text-white uppercase italic">
					Avero Chess
				</h1>
				<p class="mb-8 text-[9px] font-bold tracking-[0.4em] text-[#9999FF] uppercase">
					Strategic Mesh Protocol
				</p>

				<div class="space-y-3">
					<button
						onclick={initLocalGame}
						class="w-full rounded-xl bg-white py-3.5 text-xs font-bold text-black uppercase transition-all hover:scale-[1.01] active:scale-95"
					>
						Local PvP Match
					</button>
					<button
						onclick={initAiGame}
						class="w-full rounded-xl bg-[#9999FF] py-3.5 text-xs font-bold text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)] active:scale-95"
					>
						Play vs AI
					</button>

					<div class="my-5 flex items-center gap-4">
						<div class="h-px grow bg-white/5"></div>
						<span class="text-[8px] font-black tracking-widest text-white/30 uppercase"
							>P2P Node Connection</span
						>
						<div class="h-px grow bg-white/5"></div>
					</div>

					<div class="rounded-2xl border border-white/5 bg-white/5 p-4">
						<input
							bind:value={lobbyId}
							oninput={formatLobbyId}
							placeholder="Mesh Room Name..."
							class="mb-3 w-full rounded-xl border border-white/10 bg-black/60 p-3 text-center font-mono text-xs tracking-wider text-white transition-all outline-none focus:border-[#9999FF]/40"
						/>

						<div class="flex gap-2">
							<button
								onclick={hostMeshGame}
								class="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 text-[10px] font-bold text-white uppercase transition-all hover:border-transparent hover:bg-[#9999FF] hover:text-black"
							>
								Host
							</button>
							<button
								onclick={joinMeshGame}
								class="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 text-[10px] font-bold text-white uppercase transition-all hover:bg-white/10"
							>
								Join
							</button>
						</div>
					</div>
				</div>

				{#if meshStatus}
					<div class="mt-4 flex items-center justify-center gap-2">
						<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></div>
						<p class="font-mono text-[9px] tracking-wider text-white/40 uppercase">{meshStatus}</p>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Main Game Interface Section -->
		<div class="flex h-screen w-screen overflow-hidden bg-black">
			<!-- Glass Panel Sidebar -->
			<aside class="flex w-[280px] flex-col border-r border-white/5 bg-white/5 backdrop-blur-md">
				<div class="border-b border-white/5 p-5">
					<span class="mb-1 block text-[8px] font-black tracking-[0.2em] text-white/40 uppercase"
						>Detected Engine Theory</span
					>
					<div class="flex items-center justify-between gap-2">
						<h2 class="truncate text-xs font-black tracking-wide text-[#9999FF] uppercase">
							{currentOpening}
						</h2>
						{#if isAiThinking}
							<div
								class="h-2 w-2 shrink-0 animate-ping rounded-full bg-[#9999FF]"
								title="AI calculating..."
							></div>
						{/if}
					</div>
				</div>

				<div class="flex grow flex-col overflow-hidden p-5">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-[9px] font-black tracking-widest text-white/30 uppercase"
							>Telemetry Log</span
						>
						<div
							class="rounded-full border border-[#9999FF]/20 bg-[#9999FF]/10 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-[#9999FF] uppercase"
						>
							{connectionMode}
						</div>
					</div>

					<div
						class="grow scrollbar-thin scrollbar-thumb-white/10 space-y-1.5 overflow-x-hidden overflow-y-auto pr-1 text-xs"
					>
						{#each moveHistory as m, i (i)}
							<div
								class="flex items-center gap-3 rounded-xl p-2 transition duration-200 {i % 2 === 0
									? 'bg-white/5'
									: ''}"
							>
								<span class="w-5 text-[9px] font-black text-white/20">{Math.floor(i / 2) + 1}.</span
								>
								<span class="font-mono font-bold {i % 2 === 0 ? 'text-white' : 'text-[#9999FF]'}"
									>{m.san}</span
								>
							</div>
						{/each}
					</div>

					<!-- Material Deficit Displays -->
					<div class="mt-4 space-y-3 border-t border-white/5 pt-4">
						<div>
							<div class="mb-1.5 text-[8px] font-black tracking-wider text-white/40 uppercase">
								Captured White
							</div>
							<div class="flex min-h-[16px] flex-wrap gap-0.5 rounded-lg bg-white/5 p-1">
								{#each captured.w as p, idx (idx)}
									<img
										src={getPieceURL({ type: p, color: 'b' })}
										alt="piece"
										class="h-3.5 w-3.5 opacity-40"
									/>
								{/each}
							</div>
						</div>
						<div>
							<div class="mb-1.5 text-[8px] font-black tracking-wider text-white/40 uppercase">
								Captured Black
							</div>
							<div class="flex min-h-[16px] flex-wrap gap-0.5 rounded-lg bg-white/5 p-1">
								{#each captured.b as p, idx (idx)}
									<img
										src={getPieceURL({ type: p, color: 'w' })}
										alt="piece"
										class="h-3.5 w-3.5 opacity-40"
									/>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</aside>

			<!-- Core Board Section -->
			<main
				class="relative flex grow items-center justify-center bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white/5 to-transparent"
			>
				<!-- Fluid Eval Track -->
				<div
					class="mr-6 flex h-[min(78vh,560px)] w-2 flex-col-reverse overflow-hidden rounded-full bg-white/5"
				>
					<div
						class="w-full bg-white/80 transition-all duration-700"
						style="height: {evalScore}%"
					></div>
				</div>

				<!-- Visual Chess Board Grid -->
				<div
					class="grid aspect-square w-[min(78vh,560px)] grid-cols-8 grid-rows-8 overflow-hidden rounded-2xl border-10 border-white/5 bg-black shadow-[0_25px_70px_rgba(0,0,0,0.8)] transition-transform duration-500 {flipped
						? 'rotate-180'
						: ''}"
				>
					{#each boardState as row, rIdx (rIdx)}
						{#each row as square, sIdx (sIdx)}
							{@const isLight = (rIdx + sIdx) % 2 === 0}
							{@const sqName = getSquareName(rIdx, sIdx)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="relative flex cursor-pointer items-center justify-center transition-colors duration-200
								{isLight ? 'bg-[#ebecd0]' : 'bg-[#779556]'} 
								{selected === sqName ? 'bg-[#9999FF]/60!' : ''} 
								{lastMove.from === sqName || lastMove.to === sqName
									? 'opacity-95 mix-blend-screen ring-2 ring-[#9999FF]/40'
									: ''}"
								onclick={() => handleSquareClick(rIdx, sIdx)}
							>
								<!-- Positional Coordinates Labels -->
								{#if sIdx === 0}
									<span
										class="pointer-events-none absolute top-1 left-1.5 text-[8px] font-black tracking-tighter text-black/30 {flipped
											? 'rotate-180'
											: ''}">{8 - rIdx}</span
									>
								{/if}
								{#if rIdx === 7}
									<span
										class="pointer-events-none absolute right-1.5 bottom-0.5 text-[8px] font-black tracking-tighter text-black/30 {flipped
											? 'rotate-180'
											: ''}">{String.fromCharCode(97 + sIdx)}</span
									>
								{/if}

								{#if isLegalMove(rIdx, sIdx)}
									<div
										class="animate-fade-in pointer-events-none z-20 h-3 w-3 rounded-full bg-black/15"
									></div>
								{/if}
								{#if isCaptureMove(rIdx, sIdx)}
									<div
										class="pointer-events-none absolute z-20 h-[86%] w-[86%] rounded-full border-4 border-black/10"
									></div>
								{/if}

								{#if square}
									<img
										src={getPieceURL(square)}
										alt="Chess Piece"
										class="pointer-events-none z-10 h-[88%] w-[88%] drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] filter select-none {flipped
											? 'rotate-180'
											: ''}"
									/>
								{/if}
							</div>
						{/each}
					{/each}
				</div>

				<!-- Immersive HUD System Controls -->
				<div class="absolute right-6 bottom-6 flex gap-2">
					<button
						onclick={() => (flipped = !flipped)}
						aria-label="Flip chess board view"
						class="rounded-xl border border-white/10 bg-white/5 p-3 text-[#9999FF] transition-all hover:border-[#9999FF]/30 hover:bg-white/10"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								stroke-width="2.5"
								stroke-linecap="round"
							/>
						</svg>
					</button>
					<button
						onclick={resetGame}
						class="rounded-xl border border-red-900/30 bg-red-950/20 px-5 py-3 text-[10px] font-black tracking-wider text-red-400 uppercase transition-all hover:bg-red-900 hover:text-white"
					>
						Exit Node
					</button>
				</div>
			</main>
		</div>
	{/if}

	<!-- Micro System Toasts Notification -->
	{#if errorToast}
		<div
			class="fixed bottom-6 left-1/2 z-1000 -translate-x-1/2 animate-bounce rounded-xl border border-red-700 bg-red-900 px-5 py-2.5 text-xs font-bold tracking-wide text-white shadow-2xl"
		>
			{errorToast}
		</div>
	{/if}

	<!-- Match Complete Modal Backdrop Overlays -->
	{#if gameOverMessage}
		<div
			class="absolute inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
		>
			<div
				class="w-full max-w-sm rounded-4xl border border-white/10 bg-[#050505] p-10 text-center shadow-2xl"
			>
				<h2 class="mb-1 text-2xl font-black tracking-tight text-white uppercase italic">
					Match Concluded
				</h2>
				<p class="mb-6 text-[10px] tracking-widest text-white/40 uppercase">{gameOverMessage}</p>
				<button
					onclick={resetGame}
					class="w-full rounded-xl bg-[#9999FF] py-3.5 text-xs font-bold text-black uppercase transition-all hover:bg-[#8888EE]"
				>
					Return to Node Lobby
				</button>
			</div>
		</div>
	{/if}
</div>
