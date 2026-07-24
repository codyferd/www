<script lang="ts">
	interface MediaItem {
		name: string;
		path: string;
		extension: string;
		category: 'IMAGE' | 'VIDEO';
		url: string;
	}

	interface Props {
		items: MediaItem[];
		onSelect: (item: MediaItem) => void;
	}

	let { items, onSelect }: Props = $props();
</script>

<main
	class="grid scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent grid-cols-2 gap-6 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
>
	{#each items as item (item.url)}
		<div
			onclick={() => onSelect(item)}
			onkeydown={(e) => e.key === 'Enter' && onSelect(item)}
			role="button"
			tabindex="0"
			class="group cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-black shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-[#9999FF]/30"
		>
			<!-- Aspect Ratio Core Visual Wrapper Frame -->
			<div
				class="relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-white/5 bg-white/1"
			>
				{#if item.category === 'IMAGE'}
					<img
						src={item.url}
						loading="lazy"
						class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
						alt={item.name}
					/>
				{:else if item.category === 'VIDEO'}
					<div class="relative h-full w-full">
						<video
							src={item.url}
							class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
							muted
						></video>
						<div
							class="absolute right-3 bottom-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/80 text-[10px] text-[#9999FF] shadow-lg"
						>
							▶
						</div>
					</div>
				{/if}
			</div>

			<!-- Metadata Information Panel footer -->
			<div class="flex items-center justify-between bg-white/1 p-4">
				<span
					class="truncate pr-2 text-xs font-bold text-white/80 transition-colors group-hover:text-white"
				>
					{item.name}
				</span>
				<span
					class="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase opacity-30"
				>
					{item.extension}
				</span>
			</div>
		</div>
	{/each}
</main>
