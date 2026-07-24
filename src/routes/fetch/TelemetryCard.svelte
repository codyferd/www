<script lang="ts">
	import { type Snippet } from 'svelte';

	interface Props {
		title: string;
		children?: Snippet;
	}

	let { title, children }: Props = $props();
</script>

<div
	class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6 backdrop-blur-md transition duration-300 hover:border-[#9999FF]/20"
>
	<div class="mb-4 flex items-center gap-2 border-b border-white/3 pb-2">
		<span class="font-mono text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
			>{title}</span
		>
	</div>
	<div class="flex-1 space-y-1">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
