<script lang="ts">
	import type { ParsedNote } from './types';

	let { note, index, isActive }: { note: ParsedNote; index: number; isActive: boolean } = $props();
</script>

<div
	class="flex min-w-15 flex-col justify-center rounded-xl border p-2 text-center transition-all duration-200 {isActive
		? 'scale-105 border-[#9999FF] bg-[#9999FF]/20 text-white shadow-[0_0_20px_rgba(153,153,255,0.3)]'
		: 'border-white/10 bg-white/2 text-white/60 hover:border-white/20'} {note.isRest
		? 'opacity-40'
		: ''}"
>
	<span class="font-mono text-[9px] font-black tracking-wider text-white/30">#{index + 1}</span>
	<div
		class="mt-0.5 font-mono text-xs font-extrabold {note.isRest ? 'text-amber-400' : 'text-white'}"
	>
		{note.isRest ? 'REST' : note.name}
	</div>
	<div class="mt-1 space-y-0.5 font-mono text-[8px]">
		{#if !note.isRest && note.flagDisplay}
			<span class="block font-bold text-[#9999FF]">{note.flagDisplay}</span>
		{/if}
		{#if note.volMultiplier !== 1}
			<span class="block text-emerald-400">V:{Math.round(note.volMultiplier * 10)}</span>
		{/if}
		{#if note.durMultiplier !== 1}
			<span class="block text-sky-400">D:x{note.durMultiplier}</span>
		{/if}
	</div>
</div>
