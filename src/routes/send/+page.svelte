<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		roomCodeInput,
		localPeerId,
		textBuffer,
		isNodeActive,
		activeConnections,
		transferHistory,
		initMesh,
		disconnectPipeline,
		dispatchTextBuffer,
		pipelineFileArray
	} from './sendEngine';
	import { copyTextToClipboard } from './types';

	let isDragging = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let folderInput = $state<HTMLInputElement | null>(null);
	let copyStatusMap = $state<Record<string, boolean>>({});

	const handleCopy = async (id: string, text?: string) => {
		if (!text) return;
		const success = await copyTextToClipboard(text);
		if (success) {
			copyStatusMap[id] = true;
			setTimeout(() => {
				copyStatusMap[id] = false;
			}, 1000);
		}
	};

	const extractClipboard = async () => {
		try {
			if (navigator.clipboard && navigator.clipboard.readText) {
				const str = await navigator.clipboard.readText();
				if (str) textBuffer.set(str);
			}
		} catch {
			// Mobile clipboard permission denied
		}
	};

	const handleShareOrDownload = async (item: {
		url?: string;
		name: string;
		payload?: string;
		type: string;
	}) => {
		if (item.type === 'text' && item.payload) {
			if (navigator.share) {
				try {
					await navigator.share({ text: item.payload });
					return;
				} catch {
					// Fallback to copy
				}
			}
			return;
		}

		if (item.url) {
			const a = document.createElement('a');
			a.href = item.url;
			a.download = item.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	};

	const handleFileSelect = (e: Event) => {
		const target = e.target as HTMLInputElement;
		if (target.files) pipelineFileArray(target.files);
		target.value = '';
	};

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		isDragging = false;
		if ($isNodeActive && e.dataTransfer?.files) {
			pipelineFileArray(e.dataTransfer.files);
		}
	};

	onDestroy(() => {
		disconnectPipeline();
	});
</script>

<div
	class="mx-auto max-w-4xl space-y-4 bg-black p-3 font-sans text-white select-none sm:space-y-6 sm:p-6 md:p-8"
>
	<!-- Header HUD -->
	<header
		class="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/2 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:px-6"
	>
		<div class="flex items-center justify-between sm:justify-start sm:gap-3">
			<div class="flex items-center gap-2">
				<span
					class="h-2 w-2 rounded-full {$isNodeActive ? 'animate-ping bg-[#9999FF]' : 'bg-white/20'}"
				></span>
				<h1 class="text-xs font-black tracking-widest text-white uppercase">AVERO_SEND</h1>
			</div>
			{#if $isNodeActive}
				<span
					class="rounded border border-[#9999FF]/20 bg-[#9999FF]/10 px-2 py-0.5 text-[9px] font-bold tracking-widest text-[#9999FF] uppercase"
				>
					Mesh Active
				</span>
			{/if}
		</div>

		<div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
			<input
				type="text"
				bind:value={$roomCodeInput}
				disabled={$isNodeActive}
				placeholder="ROOM CODE"
				aria-label="Room Code"
				class="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 font-mono text-sm font-bold tracking-widest text-[#9999FF] uppercase transition outline-none focus:border-[#9999FF]/50 disabled:opacity-50 sm:w-44 sm:py-2 sm:text-xs"
			/>

			{#if !$isNodeActive}
				<button
					type="button"
					onclick={initMesh}
					disabled={!$roomCodeInput.trim()}
					class="w-full rounded-xl border border-[#9999FF]/30 bg-[#9999FF] px-6 py-2.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all hover:bg-[#8888EE] active:scale-95 disabled:opacity-30 sm:w-auto sm:py-2"
				>
					Join Vector
				</button>
			{:else}
				<button
					type="button"
					onclick={disconnectPipeline}
					class="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold tracking-wider text-red-400 uppercase transition hover:bg-red-500/20 active:scale-95 sm:w-auto sm:py-2"
				>
					Disconnect
				</button>
			{/if}
		</div>
	</header>

	<!-- System Overview -->
	{#if $isNodeActive}
		<details class="group rounded-2xl border border-white/5 bg-white/1 text-[10px] transition">
			<summary
				class="flex cursor-pointer items-center justify-between px-4 py-3 font-bold text-white/50 hover:text-white/80 sm:px-6"
			>
				<span>[ SYSTEM MESH OVERVIEW ]</span>
				<span>{$activeConnections.length} Peers Connected</span>
			</summary>
			<div class="space-y-3 border-t border-white/5 px-4 pt-3 pb-4 sm:px-6">
				<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
					<span class="text-white/40">Local Matrix Footprint ID:</span>
					<span
						class="self-start rounded border border-white/10 bg-black px-2 py-0.5 font-mono text-white/80 select-all sm:self-auto"
						>{$localPeerId}</span
					>
				</div>
				<div class="space-y-1">
					<div class="font-bold text-white/40">Active Vector Connections:</div>
					<div class="flex flex-wrap gap-1.5">
						{#if $activeConnections.length === 0}
							<span class="text-white/30 italic">Searching for nodes in this vector range...</span>
						{/if}
						{#each $activeConnections as conn (conn.peer)}
							<span
								class="inline-flex items-center rounded border border-white/10 bg-black px-2 py-0.5 font-mono text-white/60"
							>
								{conn.peer}
							</span>
						{/each}
					</div>
				</div>
			</div>
		</details>

		<!-- Drop Area & Text Broadcast -->
		<div
			class="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-white/2 backdrop-blur-xl sm:rounded-[28px] md:grid-cols-2"
		>
			<div
				ondragover={(e) => {
					e.preventDefault();
					isDragging = true;
				}}
				ondragleave={(e) => {
					e.preventDefault();
					isDragging = false;
				}}
				ondrop={handleDrop}
				role="region"
				aria-label="Asset drop zone"
				class="flex flex-col items-center justify-center p-6 text-center transition sm:p-8 {isDragging
					? 'bg-[#9999FF]/10'
					: ''}"
			>
				<div class="mb-2 text-2xl text-[#9999FF]">⎘</div>
				<div class="text-xs font-bold text-white">Tap or Drop Assets</div>
				<div class="mt-1 max-w-50 text-[9px] text-white/40">
					Supports multi-file arrays, images, and documents.
				</div>

				<div class="mt-4 flex gap-2">
					<button
						type="button"
						onclick={() => fileInput?.click()}
						class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold text-white uppercase transition hover:border-[#9999FF]/40 hover:bg-white/10 active:scale-95"
					>
						Select Files
					</button>
					<button
						type="button"
						onclick={() => folderInput?.click()}
						class="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold text-white uppercase transition hover:border-[#9999FF]/40 hover:bg-white/10 active:scale-95 sm:inline-block"
					>
						Directory
					</button>
				</div>
				<input
					type="file"
					bind:this={fileInput}
					multiple
					class="hidden"
					onchange={handleFileSelect}
				/>
				<input
					type="file"
					bind:this={folderInput}
					multiple
					webkitdirectory
					class="hidden"
					onchange={handleFileSelect}
				/>
			</div>

			<div
				class="flex flex-col space-y-3 border-t border-white/10 p-4 sm:p-6 md:border-t-0 md:border-l"
			>
				<textarea
					bind:value={$textBuffer}
					placeholder="Type or paste text string to broadcast..."
					aria-label="Text message buffer"
					class="min-h-24 w-full flex-1 resize-none rounded-2xl border border-white/10 bg-white/3 p-3.5 text-xs text-white placeholder-white/30 transition outline-none focus:border-[#9999FF]/50"
				></textarea>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={extractClipboard}
						class="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-[9px] font-bold text-white/70 uppercase transition hover:text-white active:scale-95"
					>
						Clipboard
					</button>
					<button
						type="button"
						onclick={dispatchTextBuffer}
						disabled={!$textBuffer.trim()}
						class="flex-1 rounded-xl bg-[#9999FF] py-2 text-[9px] font-bold tracking-wider text-black uppercase transition hover:bg-[#8888EE] active:scale-95 disabled:opacity-20"
					>
						Broadcast Text
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Log Stream Matrix -->
	<main
		class="space-y-4 rounded-2xl border border-white/10 bg-white/2 p-4 backdrop-blur-xl sm:rounded-[28px] sm:p-6"
	>
		<div
			class="flex items-center justify-between border-b border-white/10 pb-3 text-[10px] font-bold tracking-widest text-white/40 uppercase"
		>
			<span>Transmission Log Stream</span>
			<span>{$transferHistory.length} Items</span>
		</div>

		{#if $transferHistory.length === 0}
			<div class="flex h-32 flex-col items-center justify-center text-center text-white/30">
				<div class="text-xs font-bold tracking-widest uppercase">Channel Dormant</div>
				<p class="mt-1 text-[9px]">Initialize a room vector path to share real-time assets.</p>
			</div>
		{:else}
			<div
				class="max-h-80 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-2 overflow-y-auto pr-1"
			>
				{#each $transferHistory as item (item.id)}
					<div
						class="flex flex-col justify-between gap-2 rounded-xl border border-white/5 bg-white/1 p-3 text-xs transition hover:border-[#9999FF]/30 sm:flex-row sm:items-center sm:gap-4 sm:px-4"
					>
						<div class="flex items-center gap-3 overflow-hidden">
							<span class="font-bold text-white/40">{item.type === 'text' ? 'TXT' : 'BIN'}</span>
							<div class="truncate">
								<span
									class="mr-2 text-[9px] font-bold tracking-wider uppercase {item.direction ===
									'out'
										? 'text-[#9999FF]'
										: 'text-emerald-400'}"
								>
									{item.direction === 'out' ? '→ SENT' : '← RECV'}
								</span>
								<span class="truncate font-mono font-bold text-white" title={item.name}>
									{item.name}
								</span>
							</div>
						</div>

						<div class="flex items-center justify-between gap-3 sm:justify-end">
							<span class="font-mono text-[9px] tracking-wider text-white/40">
								{item.meta}
							</span>
							{#if item.type === 'text'}
								<button
									type="button"
									onclick={() => handleCopy(item.id, item.payload)}
									class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-bold text-white/80 uppercase transition hover:border-[#9999FF]/40 active:scale-95"
								>
									{copyStatusMap[item.id] ? 'COPIED' : 'Copy'}
								</button>
							{:else}
								<button
									type="button"
									onclick={() => handleShareOrDownload(item)}
									class="rounded-lg border border-[#9999FF]/30 bg-[#9999FF]/10 px-3 py-1.5 text-[9px] font-bold text-[#9999FF] uppercase transition hover:bg-[#9999FF]/20 active:scale-95"
								>
									Save File
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>
