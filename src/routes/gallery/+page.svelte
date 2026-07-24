<script lang="ts">
	import { onDestroy } from 'svelte';
	import MediaGrid from './MediaGrid.svelte';
	import Lightbox from './Lightbox.svelte';

	interface MediaItem {
		name: string;
		path: string;
		extension: string;
		category: 'IMAGE' | 'VIDEO';
		url: string;
	}

	let mediaItems = $state<MediaItem[]>([]);
	let activeFilter = $state<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
	let activeLightboxItem = $state<MediaItem | null>(null);
	let fileInput: HTMLInputElement;

	// Computed state tracking context
	let filteredItems = $derived(
		activeFilter === 'ALL'
			? mediaItems
			: mediaItems.filter((item) => item.category === activeFilter)
	);

	function clearCurrentMediaBatch() {
		mediaItems.forEach((item) => URL.revokeObjectURL(item.url));
		mediaItems = [];
	}

	function handleDirectoryScan(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files) return;

		clearCurrentMediaBatch();
		const parsedBatch: MediaItem[] = [];
		const files = Array.from(target.files);

		files.forEach((file) => {
			const path = file.webkitRelativePath || file.name;
			const extension = file.name.split('.').pop()?.toLowerCase() || '';
			let category: 'IMAGE' | 'VIDEO' | null = null;

			if (file.type.startsWith('image/')) {
				category = 'IMAGE';
			} else if (file.type.startsWith('video/')) {
				category = 'VIDEO';
			}

			if (category) {
				parsedBatch.push({
					name: file.name,
					path: path,
					extension: extension,
					category: category,
					url: URL.createObjectURL(file)
				});
			}
		});

		mediaItems = parsedBatch.sort((a, b) => a.name.localeCompare(b.name));
	}

	function openLightbox(item: MediaItem) {
		activeLightboxItem = item;
		document.body.style.overflow = 'hidden';
	}

	function closeLightbox() {
		activeLightboxItem = null;
		document.body.style.overflow = '';
	}

	onDestroy(() => {
		clearCurrentMediaBatch();
	});
</script>

<div
	class="min-h-screen bg-black p-6 font-sans tracking-tight text-white selection:bg-[#9999FF]/30 md:p-12"
>
	<!-- Canvas Wrapper -->
	<div
		class="flex min-h-[80vh] flex-col rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4 md:p-12"
	>
		<!-- Top Navigation HUD -->
		<header
			class="mb-10 flex flex-col items-start justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center"
		>
			<div>
				<h1 class="text-2xl leading-none font-black tracking-tighter text-white uppercase italic">
					Avero <span class="text-[#9999FF]">Gallery</span>
				</h1>
				<p
					class="mt-2 flex items-center gap-2 text-[9px] font-black tracking-[0.25em] text-white/40 uppercase"
				>
					{#if mediaItems.length > 0}
						<span class="h-2 w-2 animate-ping rounded-full bg-emerald-500"></span>
						Indexed Matrix // {mediaItems.length} Objects Loaded
					{:else}
						Local Storage Hub // Standby
					{/if}
				</p>
			</div>

			<div class="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
				<!-- Filter Protocol Switches -->
				{#if mediaItems.length > 0}
					<div class="flex gap-1 rounded-full border border-white/10 bg-white/3 p-1">
						{#each ['ALL', 'IMAGE', 'VIDEO'] as const as filterType (filterType)}
							<button
								onclick={() => (activeFilter = filterType)}
								class="rounded-full px-4 py-2 text-[10px] font-black uppercase transition-all duration-200 {activeFilter ===
								filterType
									? 'bg-[#9999FF] text-black shadow-[0_0_15px_rgba(153,153,255,0.25)]'
									: 'bg-transparent text-white/40 hover:text-white'}"
							>
								{filterType === 'ALL' ? 'All' : filterType + 's'}
							</button>
						{/each}
					</div>
				{/if}

				<!-- Directory Input Trigger -->
				<button
					onclick={() => fileInput.click()}
					class="rounded-xl bg-[#9999FF] px-6 py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
				>
					Scan Directory
				</button>
			</div>
		</header>

		<!-- Native Hidden Directory Selector Input Wrapper -->
		<input
			type="file"
			bind:this={fileInput}
			class="hidden"
			multiple
			onchange={handleDirectoryScan}
			webkitdirectory={true}
		/>

		<!-- Dynamic Workspace Area Switcher -->
		{#if mediaItems.length === 0}
			<!-- Workspace Placeholder State -->
			<div
				onclick={() => fileInput.click()}
				onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
				role="button"
				tabindex="0"
				class="group flex min-h-[50vh] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/0.5 transition-all duration-300 hover:border-[#9999FF]/30 hover:bg-white/1"
			>
				<div
					class="mb-6 h-16 w-16 animate-[spin_30s_linear_infinite] rounded-full border-2 border-dashed border-white/10 group-hover:border-[#9999FF]/40"
				></div>
				<p
					class="mb-4 px-4 text-center text-xs font-black tracking-[0.5em] text-white/30 uppercase transition-colors group-hover:text-white/50"
				>
					No Data Stream Connected
				</p>
				<span
					class="rounded-lg border border-[#9999FF]/20 bg-[#9999FF]/5 px-4 py-2 text-[10px] font-bold tracking-wider text-[#9999FF]/70 uppercase"
				>
					Select System Folder
				</span>
			</div>
		{:else}
			<MediaGrid items={filteredItems} onSelect={openLightbox} />
		{/if}
	</div>
</div>

{#if activeLightboxItem}
	<Lightbox item={activeLightboxItem} onClose={closeLightbox} />
{/if}
