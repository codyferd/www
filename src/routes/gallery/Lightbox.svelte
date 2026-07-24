<script lang="ts">
	import { onMount } from 'svelte';

	interface MediaItem {
		name: string;
		path: string;
		extension: string;
		category: 'IMAGE' | 'VIDEO';
		url: string;
	}

	interface Props {
		// Omit 'extension' from the item object typing passed down to this component
		item: Omit<MediaItem, 'extension'>;
		onClose: () => void;
	}

	let { item, onClose }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<!-- Immersive Modal Overlay Module -->
<div
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="button"
	tabindex="0"
	class="fixed inset-0 z-50 flex animate-[fadeIn_0.2s_ease-out] flex-col items-center justify-center bg-black/95 p-6 backdrop-blur-md md:p-12"
>
	<!-- Explicit Dismiss Button Frame layout -->
	<button
		class="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-light text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-[#9999FF]"
		onclick={onClose}
		aria-label="Close interactive modal lightbox"
	>
		✕
	</button>

	<!-- Content Visualization Deck Workspace -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="flex max-h-[70vh] max-w-[90%] items-center justify-center"
		onclick={(e) => e.stopPropagation()}
	>
		{#if item.category === 'IMAGE'}
			<img
				src={item.url}
				class="max-h-[70vh] max-w-full rounded-xl border border-white/10 object-contain shadow-[0_25px_60px_rgba(153,153,255,0.05)]"
				alt={item.name}
			/>
		{:else if item.category === 'VIDEO'}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				src={item.url}
				controls
				autoplay
				class="max-h-[70vh] max-w-full rounded-xl border border-white/10 object-contain shadow-[0_25px_60px_rgba(153,153,255,0.05)]"
			></video>
		{/if}
	</div>

	<!-- Textual Metrics & Descriptor Blocks Below Media Frame -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="mt-8 max-w-2xl px-4 text-center" onclick={(e) => e.stopPropagation()}>
		<p class="truncate text-sm font-black tracking-tight text-white">
			{item.name}
		</p>
		<p
			class="mt-2 inline-block rounded-full border border-white/5 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-widest text-white/40 uppercase select-all"
		>
			{item.path}
		</p>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
