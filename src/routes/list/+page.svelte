<script lang="ts">
	import { onMount } from 'svelte';
	import type { Note, AveroListState } from './types';
	import NoteCard from './NoteCard.svelte';
	import CreateItemForm from './CreateItemForm.svelte';

	const LOCAL_STORAGE_KEY = 'avero_list_data_v1';

	let notes = $state<Note[]>([]);
	let activeTab = $state<'active' | 'archived'>('active');
	let filterType = $state<'all' | 'checklist' | 'note'>('all');
	let searchQuery = $state('');
	let isCreating = $state(false);
	let statusMessage = $state<string | null>(null);
	let fileInputRef = $state<HTMLInputElement | null>(null);

	onMount(() => {
		const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved) as AveroListState;
				if (parsed?.notes) notes = parsed.notes;
			} catch (e) {
				console.error('Failed to parse saved data', e);
			}
		} else {
			notes = [
				{
					id: 'demo-1',
					title: '🚀 Launch Avero App',
					type: 'checklist',
					content: '',
					items: [
						{ id: 'item-1', text: 'Set up tokens', completed: true },
						{ id: 'item-2', text: 'JSON Export', completed: true }
					],
					pinned: true,
					archived: false,
					createdAt: Date.now(),
					updatedAt: Date.now()
				},
				{
					id: 'demo-2',
					title: '💡 Design Ideas',
					type: 'note',
					content: 'Pitch black base with lavender accents.',
					items: [],
					pinned: false,
					archived: false,
					createdAt: Date.now(),
					updatedAt: Date.now()
				}
			];
		}
	});

	$effect(() => {
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ version: '1.0.0', notes }));
	});

	// Metrics
	let activeNotesCount = $derived(notes.filter((n) => !n.archived).length);
	let archivedNotesCount = $derived(notes.filter((n) => n.archived).length);
	let activeChecklists = $derived(notes.filter((n) => !n.archived && n.type === 'checklist'));
	let totalChecklistItems = $derived(
		activeChecklists.reduce((acc, note) => acc + note.items.length, 0)
	);
	let completedChecklistItems = $derived(
		activeChecklists.reduce((acc, note) => acc + note.items.filter((i) => i.completed).length, 0)
	);
	let completionPct = $derived(
		totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 0
	);

	// Filtering
	let filteredNotes = $derived(
		notes
			.filter((note) => {
				const isArchived = activeTab === 'archived' ? note.archived : !note.archived;
				const isType = filterType === 'all' || note.type === filterType;
				const q = searchQuery.trim().toLowerCase();
				const isSearch =
					!q ||
					note.title.toLowerCase().includes(q) ||
					note.content.toLowerCase().includes(q) ||
					note.items.some((i) => i.text.toLowerCase().includes(q));
				return isArchived && isType && isSearch;
			})
			.sort((a, b) => (a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : b.updatedAt - a.updatedAt))
	);

	function toast(msg: string) {
		statusMessage = msg;
		setTimeout(() => (statusMessage = null), 3000);
	}

	function createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'pinned' | 'archived'>) {
		const now = Date.now();
		notes = [
			{
				...data,
				id: `note-${now}`,
				pinned: false,
				archived: false,
				createdAt: now,
				updatedAt: now
			},
			...notes
		];
		isCreating = false;
		toast('Item created');
	}

	function updateNote(id: string, updater: (n: Note) => Note) {
		notes = notes.map((n) => (n.id === id ? updater(n) : n));
	}

	function exportDataJSON() {
		const dataStr =
			'data:text/json;charset=utf-8,' +
			encodeURIComponent(JSON.stringify({ version: '1.0.0', notes }, null, 2));
		const a = document.createElement('a');
		a.href = dataStr;
		a.download = `avero_export_${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		toast('Exported JSON');
	}

	function importDataJSON(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (evt) => {
			try {
				const parsed = JSON.parse(evt.target?.result as string) as AveroListState;
				if (parsed?.notes) {
					notes = parsed.notes;
					toast(`Imported ${parsed.notes.length} notes`);
				}
			} catch {
				alert('Invalid JSON file.');
			}
			if (fileInputRef) fileInputRef.value = '';
		};
		reader.readAsText(file);
	}
</script>

<svelte:head><title>Avero List</title></svelte:head>

<div
	class="min-h-screen w-full bg-black font-sans tracking-tight text-white selection:bg-[#9999FF]/30"
>
	<header class="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#9999FF]/30 bg-[#9999FF]/10 text-xl font-black text-[#9999FF]"
				>
					✓
				</div>
				<div>
					<h1 class="text-lg font-black tracking-wider uppercase">Avero List</h1>
					<div class="flex items-center gap-2">
						<span class="h-2 w-2 animate-ping rounded-full bg-emerald-500"></span><span
							class="text-[10px] font-bold tracking-widest text-white/40 uppercase"
							>Ecosystem Active</span
						>
					</div>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<input
					type="file"
					accept=".json"
					bind:this={fileInputRef}
					onchange={importDataJSON}
					class="hidden"
				/>
				<button
					onclick={() => fileInputRef?.click()}
					class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-wider text-white/80 uppercase hover:bg-white/10"
					>Import JSON</button
				>
				<button
					onclick={exportDataJSON}
					class="rounded-xl bg-[#9999FF] px-5 py-2 text-xs font-bold tracking-wider text-black uppercase hover:bg-[#8888EE]"
					>Export JSON</button
				>
			</div>
		</div>
	</header>

	{#if statusMessage}
		<div
			class="fixed top-20 right-6 z-50 rounded-2xl border border-[#9999FF]/40 bg-black/90 px-6 py-3 text-xs font-bold text-[#9999FF] backdrop-blur-xl"
		>
			✨ {statusMessage}
		</div>
	{/if}

	<main class="mx-auto max-w-7xl px-4 py-8 md:px-8">
		<div class="rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl md:p-10">
			<!-- Dashboard Metrics -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6">
					<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
						>Active Items</span
					>
					<span class="mt-2 text-3xl font-black"
						>{activeNotesCount} <span class="text-sm font-light text-white/45">items</span></span
					>
					<div class="mt-4 h-1 w-full rounded-full bg-white/5">
						<div class="h-full w-full bg-[#9999FF]"></div>
					</div>
				</div>

				<div class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6">
					<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
						>Completion</span
					>
					<span class="mt-2 text-3xl font-black"
						>{completionPct}%
						<span class="text-sm font-light text-white/45"
							>({completedChecklistItems}/{totalChecklistItems})</span
						></span
					>
					<div class="mt-4 h-1 w-full rounded-full bg-white/5">
						<div class="h-full bg-[#9999FF]" style="width: {completionPct}%"></div>
					</div>
				</div>

				<div class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6">
					<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
						>Archived</span
					>
					<span class="mt-2 text-3xl font-black"
						>{archivedNotesCount} <span class="text-sm font-light text-white/45">items</span></span
					>
					<div class="mt-4 h-1 w-full rounded-full bg-white/5">
						<div class="h-full w-full bg-white/20"></div>
					</div>
				</div>

				<div
					class="flex flex-col justify-between rounded-2xl border border-[#9999FF]/20 bg-[#9999FF]/5 p-6"
				>
					<span class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
						>Create Item</span
					>
					<button
						onclick={() => (isCreating = true)}
						class="group mt-2 flex items-center justify-between text-left text-sm font-bold"
					>
						<span>+ Add Note / Checklist</span>
						<span class="text-xl text-[#9999FF] transition group-hover:translate-x-1">→</span>
					</button>
					<div class="mt-4 h-1 w-full rounded-full bg-[#9999FF]/20">
						<div class="h-full w-full bg-[#9999FF]"></div>
					</div>
				</div>
			</div>

			<!-- Filters & Search -->
			<div
				class="mt-8 flex flex-col gap-4 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between"
			>
				<div class="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
					<button
						onclick={() => (activeTab = 'active')}
						class="rounded-xl px-5 py-2 text-xs font-bold uppercase transition {activeTab ===
						'active'
							? 'bg-[#9999FF] text-black'
							: 'text-white/60'}">Active ({activeNotesCount})</button
					>
					<button
						onclick={() => (activeTab = 'archived')}
						class="rounded-xl px-5 py-2 text-xs font-bold uppercase transition {activeTab ===
						'archived'
							? 'bg-[#9999FF] text-black'
							: 'text-white/60'}">Archive ({archivedNotesCount})</button
					>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					{#each ['all', 'checklist', 'note'] as type (type)}
						<button
							onclick={() => (filterType = type as typeof filterType)}
							class="rounded-xl border px-4 py-2 text-xs font-bold uppercase transition {filterType ===
							type
								? 'border-[#9999FF]/60 bg-[#9999FF]/10 text-[#9999FF]'
								: 'border-white/5 bg-white/5 text-white/50'}">{type}</button
						>
					{/each}
				</div>

				<div class="relative min-w-65">
					<input
						type="text"
						placeholder="Search..."
						bind:value={searchQuery}
						class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#9999FF]/50"
					/>
					{#if searchQuery}<button
							onclick={() => (searchQuery = '')}
							class="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-white/40 hover:text-white"
							>✕</button
						>{/if}
				</div>
			</div>

			{#if isCreating}
				<CreateItemForm oncreate={createNote} oncancel={() => (isCreating = false)} />
			{/if}

			<!-- Grid -->
			<div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredNotes as note (note.id)}
					<NoteCard
						{note}
						ontogglepin={(id) => updateNote(id, (n) => ({ ...n, pinned: !n.pinned }))}
						ontogglearchive={(id) => {
							updateNote(id, (n) => ({ ...n, archived: !n.archived }));
							toast('Status updated');
						}}
						ondelete={(id) => {
							if (confirm('Delete item?')) {
								notes = notes.filter((n) => n.id !== id);
								toast('Deleted');
							}
						}}
						ontoggleitem={(nId, iId) =>
							updateNote(nId, (n) => ({
								...n,
								items: n.items.map((i) => (i.id === iId ? { ...i, completed: !i.completed } : i)),
								updatedAt: Date.now()
							}))}
						onaddquickitem={(nId, txt) =>
							updateNote(nId, (n) => ({
								...n,
								items: [...n.items, { id: `item-${Date.now()}`, text: txt, completed: false }],
								updatedAt: Date.now()
							}))}
						onremoveitem={(nId, iId) =>
							updateNote(nId, (n) => ({
								...n,
								items: n.items.filter((i) => i.id !== iId),
								updatedAt: Date.now()
							}))}
					/>
				{:else}
					<div class="col-span-full py-16 text-center text-white/40">No items found</div>
				{/each}
			</div>
		</div>
	</main>
</div>
