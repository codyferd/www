<script lang="ts">
	import type { ChecklistItem, Note } from './types';

	interface Props {
		oncreate: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'pinned' | 'archived'>) => void;
		oncancel: () => void;
	}

	let { oncreate, oncancel }: Props = $props();

	let type = $state<'checklist' | 'note'>('checklist');
	let title = $state('');
	let content = $state('');
	let checklistItems = $state<string[]>(['']);

	function handleSubmit() {
		if (!title.trim()) return;

		let items: ChecklistItem[] = [];
		if (type === 'checklist') {
			items = checklistItems
				.filter((str) => str.trim().length > 0)
				.map((text, idx) => ({
					id: `item-${Date.now()}-${idx}`,
					text: text.trim(),
					completed: false
				}));
		}

		oncreate({ title: title.trim(), type, content: content.trim(), items });
	}
</script>

<div
	class="mt-8 rounded-2xl border border-[#9999FF]/30 bg-black/90 p-6 shadow-[0_0_40px_rgba(153,153,255,0.15)] backdrop-blur-2xl"
>
	<div class="flex items-center justify-between border-b border-white/10 pb-4">
		<h3 class="text-sm font-black tracking-wider text-[#9999FF] uppercase">Create New Item</h3>
		<button onclick={oncancel} class="text-xs font-bold text-white/40 hover:text-white"
			>✕ Cancel</button
		>
	</div>

	<div class="mt-6 space-y-4">
		<div class="flex gap-3">
			<button
				type="button"
				onclick={() => (type = 'checklist')}
				class="flex-1 rounded-xl border py-3 text-xs font-bold tracking-wider uppercase transition duration-300 {type ===
				'checklist'
					? 'border-[#9999FF] bg-[#9999FF]/15 text-[#9999FF]'
					: 'border-white/10 bg-white/5 text-white/50'}"
			>
				✓ Checklist
			</button>
			<button
				type="button"
				onclick={() => (type = 'note')}
				class="flex-1 rounded-xl border py-3 text-xs font-bold tracking-wider uppercase transition duration-300 {type ===
				'note'
					? 'border-[#9999FF] bg-[#9999FF]/15 text-[#9999FF]'
					: 'border-white/10 bg-white/5 text-white/50'}"
			>
				📝 Quick Note
			</button>
		</div>

		<input
			type="text"
			placeholder="Title..."
			bind:value={title}
			class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#9999FF]/50"
		/>

		{#if type === 'note'}
			<textarea
				placeholder="Write your note content here..."
				bind:value={content}
				rows="5"
				class="w-full rounded-[20px] border border-white/10 bg-white/3 p-6 text-sm text-white placeholder-white/30 outline-none focus:border-[#9999FF]/50"
			></textarea>
		{:else}
			<div class="space-y-3">
				<span class="text-[10px] font-black tracking-widest text-white/40 uppercase"
					>Checklist Items</span
				>
				{#each checklistItems, idx (idx)}
					<div class="flex items-center gap-2">
						<span class="font-mono text-xs text-white/30">{idx + 1}.</span>
						<input
							type="text"
							placeholder={`Item ${idx + 1}...`}
							bind:value={checklistItems[idx]}
							class="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#9999FF]/50"
						/>
						{#if checklistItems.length > 1}
							<button
								type="button"
								onclick={() => (checklistItems = checklistItems.filter((_, i) => i !== idx))}
								class="px-2 text-xs font-bold text-red-400 hover:text-red-300">✕</button
							>
						{/if}
					</div>
				{/each}
				<button
					type="button"
					onclick={() => (checklistItems = [...checklistItems, ''])}
					class="mt-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-2 text-xs font-bold tracking-wider text-[#9999FF] uppercase hover:bg-white/10"
					>+ Add Line Item</button
				>
			</div>
		{/if}

		<div class="flex justify-end gap-3 border-t border-white/10 pt-4">
			<button
				type="button"
				onclick={oncancel}
				class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold tracking-wider text-white/70 uppercase hover:bg-white/10"
				>Cancel</button
			>
			<button
				type="button"
				onclick={handleSubmit}
				class="rounded-xl bg-[#9999FF] px-6 py-3 text-xs font-bold tracking-wider text-black uppercase transition hover:bg-[#8888EE]"
				>Save Item</button
			>
		</div>
	</div>
</div>
