<script lang="ts">
	import type { Note } from './types';

	interface Props {
		note: Note;
		ontogglepin: (id: string) => void;
		ontogglearchive: (id: string) => void;
		ondelete: (id: string) => void;
		ontoggleitem: (noteId: string, itemId: string) => void;
		onaddquickitem: (noteId: string, text: string) => void;
		onremoveitem: (noteId: string, itemId: string) => void;
	}

	let {
		note,
		ontogglepin,
		ontogglearchive,
		ondelete,
		ontoggleitem,
		onaddquickitem,
		onremoveitem
	}: Props = $props();

	let doneCount = $derived(note.items.filter((i) => i.completed).length);
</script>

<div
	class="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/2 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#9999FF]/30 hover:bg-white/4 hover:shadow-[0_0_25px_rgba(153,153,255,0.1)]"
>
	<div>
		<!-- Header -->
		<div class="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
			<div class="flex items-center gap-2">
				<span
					class="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#9999FF] uppercase"
				>
					{note.type}
				</span>
				{#if note.pinned}
					<span class="text-xs text-amber-300" title="Pinned">📌</span>
				{/if}
			</div>

			<!-- Controls -->
			<div
				class="flex items-center gap-1 opacity-80 transition duration-300 group-hover:opacity-100"
			>
				<button
					onclick={() => ontogglepin(note.id)}
					class="p-1 text-xs text-white/40 hover:text-white"
					title={note.pinned ? 'Unpin' : 'Pin to top'}
				>
					📌
				</button>
				<button
					onclick={() => ontogglearchive(note.id)}
					class="p-1 text-xs text-white/40 hover:text-white"
					title={note.archived ? 'Unarchive' : 'Archive'}
				>
					📥
				</button>
				<button
					onclick={() => ondelete(note.id)}
					class="p-1 text-xs text-white/40 hover:text-red-400"
					title="Delete"
				>
					🗑
				</button>
			</div>
		</div>

		<!-- Title -->
		<h3
			class="mt-4 text-base font-bold text-white transition duration-300 group-hover:text-[#9999FF]"
		>
			{note.title}
		</h3>

		<!-- Body -->
		{#if note.type === 'note'}
			<p class="mt-3 line-clamp-6 text-xs leading-relaxed whitespace-pre-wrap text-white/70">
				{note.content}
			</p>
		{:else}
			<div
				class="mt-4 max-h-60 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-2 overflow-y-auto pr-1"
			>
				{#each note.items as item (item.id)}
					<div class="flex items-center justify-between gap-2 text-xs">
						<label class="flex flex-1 cursor-pointer items-center gap-2 select-none">
							<input
								type="checkbox"
								checked={item.completed}
								onchange={() => ontoggleitem(note.id, item.id)}
								class="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 accent-[#9999FF] focus:ring-0"
							/>
							<span class={item.completed ? 'text-white/30 line-through' : 'text-white/80'}>
								{item.text}
							</span>
						</label>
						<button
							onclick={() => onremoveitem(note.id, item.id)}
							class="text-[10px] text-white/20 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
						>
							✕
						</button>
					</div>
				{/each}
			</div>

			<div class="mt-4 border-t border-white/5 pt-3">
				<input
					type="text"
					placeholder="+ Quick add item & press Enter"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							const target = e.target as HTMLInputElement;
							onaddquickitem(note.id, target.value);
							target.value = '';
						}
					}}
					class="w-full bg-transparent text-xs text-white/80 placeholder-white/20 outline-none focus:placeholder-white/40"
				/>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<div
		class="mt-6 flex items-center justify-between border-t border-white/5 pt-3 font-mono text-[10px] text-white/30"
	>
		<span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
		{#if note.type === 'checklist' && note.items.length > 0}
			<span class="font-bold text-[#9999FF]">
				{doneCount}/{note.items.length} Done
			</span>
		{/if}
	</div>
</div>
