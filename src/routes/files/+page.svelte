<script lang="ts">
	import { filesEngine, fileIconRegistry, type FileEntry } from './store.svelte';

	// Inline local modal reference target logic
	let modalInputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (filesEngine.modal.show && filesEngine.modal.type === 'prompt') {
			setTimeout(() => modalInputEl?.focus(), 50);
		}
	});

	function getIcon(name: string, extension?: string): string {
		if (!extension) {
			const components = name.split('.');
			if (components.length <= 1) return '📄';
			extension = components.pop()?.toLowerCase() || '';
		}
		return fileIconRegistry[extension] || '📄';
	}

	// Drag & Drop Handlers explicitly utilizing the typed FileEntry schema
	function onDragStart(e: DragEvent, file: FileEntry) {
		filesEngine.draggedItem = file;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', file.name);
		}
	}

	function onDragOver(e: DragEvent, file: FileEntry) {
		e.preventDefault();
		if (
			file.kind === 'directory' &&
			filesEngine.draggedItem &&
			filesEngine.draggedItem.name !== file.name
		) {
			file.isDragTarget = true;
			if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		}
	}

	function onDragLeave(file: FileEntry) {
		file.isDragTarget = false;
	}

	async function onDrop(e: DragEvent, targetFolder: FileEntry) {
		e.preventDefault();
		targetFolder.isDragTarget = false;
		const item = filesEngine.draggedItem;

		if (
			!item ||
			targetFolder.kind !== 'directory' ||
			item.name === targetFolder.name ||
			!filesEngine.currentHandle
		)
			return;

		try {
			if (item.kind === 'file') {
				const originFile = await (item.handle as FileSystemFileHandle).getFile();
				const destDir = await filesEngine.currentHandle.getDirectoryHandle(targetFolder.name);
				const destFile = await destDir.getFileHandle(item.name, { create: true });

				const writer = await destFile.createWritable();
				await writer.write(originFile);
				await writer.close();

				await filesEngine.currentHandle.removeEntry(item.name);
				await filesEngine.loadFiles(filesEngine.currentHandle);
			}
		} catch (err) {
			console.error('I/O Allocation system drop fault', err);
		} finally {
			filesEngine.draggedItem = null;
		}
	}
</script>

<div
	class="flex h-screen w-screen flex-col overflow-hidden bg-black font-sans tracking-tight text-white/90 selection:bg-[#9999FF]/30 selection:text-white"
>
	<!-- Structural Header Bar -->
	<header
		class="z-20 flex items-center justify-between border-b border-white/10 bg-white/1 p-4 shadow-xl backdrop-blur-md"
	>
		<div class="flex items-center gap-4">
			<button
				onclick={() => filesEngine.goBack()}
				disabled={filesEngine.pathStack.length <= 1}
				class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-mono text-lg transition-all hover:border-[#9999FF]/40 hover:bg-white/10 disabled:opacity-10 disabled:hover:border-white/10 disabled:hover:bg-white/5"
			>
				←
			</button>

			<div
				class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-white/50 uppercase"
			>
				{#each filesEngine.breadcrumbs as part, i (i)}
					<button
						onclick={() => filesEngine.jumpTo(i)}
						class="transition-colors hover:text-[#9999FF]"
					>
						{part}
					</button>
					{#if i < filesEngine.breadcrumbs.length - 1}
						<span class="opacity-30">/</span>
					{/if}
				{/each}
			</div>
		</div>

		<div class="flex items-center gap-3">
			{#if filesEngine.rootHandle}
				<div
					class="flex items-center gap-1 rounded-xl border border-white/5 bg-white/2 p-1 shadow-[0_0_15px_rgba(153,153,255,0.03)]"
				>
					<button
						onclick={() => filesEngine.createNew('file')}
						class="flex h-8 items-center justify-center rounded-lg px-2 text-xs hover:bg-white/5 hover:text-[#9999FF]"
						title="New File">📄+</button
					>
					<button
						onclick={() => filesEngine.createNew('directory')}
						class="flex h-8 items-center justify-center rounded-lg px-2 text-xs hover:bg-white/5 hover:text-[#9999FF]"
						title="New Folder">📂+</button
					>
					<div class="mx-1 h-4 w-px bg-white/10"></div>
					<button
						onclick={() => filesEngine.copyItem()}
						disabled={!filesEngine.selectedFile}
						class="flex h-8 items-center justify-center rounded-lg px-2 text-xs hover:bg-white/5 disabled:opacity-25"
						title="Copy">📋</button
					>
					<button
						onclick={() => filesEngine.cutItem()}
						disabled={!filesEngine.selectedFile}
						class="flex h-8 items-center justify-center rounded-lg px-2 text-xs hover:bg-white/5 disabled:opacity-25"
						title="Cut">✂️</button
					>
					<button
						onclick={() => filesEngine.renameItem()}
						disabled={!filesEngine.selectedFile}
						class="flex h-8 items-center justify-center rounded-lg px-2 text-xs text-amber-400 hover:bg-white/5 disabled:opacity-25"
						title="Rename">✏️</button
					>
					<button
						onclick={() => filesEngine.pasteItem()}
						disabled={!filesEngine.clipboard.item}
						class="flex h-8 items-center justify-center rounded-lg px-2 text-xs hover:bg-white/5 disabled:opacity-25"
						title="Paste">📥</button
					>
					<button
						onclick={() => filesEngine.deleteItem()}
						disabled={!filesEngine.selectedFile}
						class="flex h-8 items-center justify-center rounded-lg px-2 text-xs text-red-400 hover:bg-white/5 disabled:opacity-25"
						title="Delete">🗑️</button
					>
				</div>
			{:else}
				<button
					onclick={() => filesEngine.initFileSystem()}
					class="rounded-xl bg-[#9999FF] px-5 py-2 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
				>
					Mount Drive Gateway
				</button>
			{/if}

			<input
				type="text"
				bind:value={filesEngine.searchQuery}
				placeholder="Search allocation matrix..."
				class="w-48 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white placeholder-white/30 transition-all duration-300 outline-none focus:w-56 focus:border-[#9999FF]/50 focus:bg-white/10 focus:shadow-[0_0_25px_rgba(153,153,255,0.1)]"
			/>
		</div>
	</header>

	<!-- Main Workspace Split Panel -->
	<main class="flex grow overflow-hidden">
		<!-- Sidebar Architecture -->
		<aside
			class="hidden w-60 flex-col gap-6 border-r border-white/5 bg-[#030303] p-5 select-none md:flex"
		>
			<div>
				<h3 class="mb-4 text-[9px] font-black tracking-[0.2em] text-white/30 uppercase">
					System Infrastructure
				</h3>
				<div class="space-y-1">
					<button
						onclick={() => filesEngine.rootHandle && filesEngine.jumpTo(0)}
						class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-medium transition-all duration-200 hover:bg-white/5 {filesEngine
							.breadcrumbs.length === 1
							? 'bg-[#9999FF]/10 font-bold text-[#9999FF]'
							: 'text-white/70'}"
					>
						<span class="text-sm">🏠</span> Core Gateway Root
					</button>
				</div>
			</div>

			<!-- Dynamic Metrics Monitors -->
			<div>
				<h3 class="mb-3 text-[9px] font-black tracking-[0.2em] text-white/30 uppercase">
					Storage Vectors
				</h3>
				<div class="grid grid-cols-2 gap-3">
					<div class="rounded-xl border border-white/5 bg-white/1 p-3">
						<span class="block text-[8px] font-bold tracking-wider text-white/40 uppercase"
							>Directories</span
						>
						<span class="text-lg font-black text-white">{filesEngine.metrics.directories}</span>
					</div>
					<div class="rounded-xl border border-white/5 bg-white/1 p-3">
						<span class="block text-[8px] font-bold tracking-wider text-white/40 uppercase"
							>Data Files</span
						>
						<span class="text-lg font-black text-white">{filesEngine.metrics.files}</span>
					</div>
				</div>
			</div>

			{#if filesEngine.previewUrl}
				<!-- Image Live Preview Panel Feature Extension -->
				<div
					class="mt-auto overflow-hidden rounded-2xl border border-[#9999FF]/20 bg-white/2 p-3 shadow-[0_0_20px_rgba(153,153,255,0.05)]"
				>
					<div class="mb-2 flex items-center justify-between">
						<span class="text-[8px] font-black tracking-wider text-[#9999FF] uppercase"
							>Asset Preview</span
						>
						<button
							onclick={() => filesEngine.closePreview()}
							class="text-xs text-white/40 hover:text-white">✕</button
						>
					</div>
					<img
						src={filesEngine.previewUrl}
						alt={filesEngine.previewName}
						class="max-h-36 w-full rounded-lg border border-white/5 bg-black/40 object-contain"
					/>
					<span class="mt-2 block truncate text-center text-[10px] text-white/50"
						>{filesEngine.previewName}</span
					>
				</div>
			{:else}
				<div
					class="mt-auto rounded-2xl border border-white/5 bg-white/1 p-4 text-[10px] leading-relaxed text-white/40"
				>
					<span class="mb-1 block font-bold text-[#9999FF]">💡 System Node Trace</span>
					Relocate target elements safely using active viewport pointer arrays over directory blocks.
				</div>
			{/if}
		</aside>

		<!-- Content View Matrix Grid -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onclick={(e) => e.target === e.currentTarget && (filesEngine.selectedFile = null)}
			class="grow scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-y-auto bg-[#050505] p-6"
		>
			{#if !filesEngine.rootHandle}
				<div class="flex h-full flex-col items-center justify-center opacity-30">
					<span class="mb-3 animate-pulse text-5xl">📂</span>
					<p class="font-mono text-[10px] font-black tracking-[0.25em] uppercase">
						Drive Interface Offline
					</p>
				</div>
			{:else if filesEngine.filteredFiles.length === 0}
				<div class="flex h-full flex-col items-center justify-center opacity-25">
					<p class="font-mono text-xs">No target items matching structural criteria</p>
				</div>
			{:else}
				<div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
					{#each filesEngine.filteredFiles as file (file.name)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							ondblclick={() => filesEngine.handleOpen(file)}
							onclick={() => (filesEngine.selectedFile = file)}
							draggable="true"
							ondragstart={(e) => onDragStart(e, file)}
							ondragover={(e) => onDragOver(e, file)}
							ondragleave={() => onDragLeave(file)}
							ondrop={(e) => onDrop(e, file)}
							class="group flex cursor-pointer flex-col items-center rounded-2xl border p-4 transition-all duration-300 select-none
								{filesEngine.selectedFile?.name === file.name
								? 'border-[#9999FF]/40 bg-[#9999FF]/10 shadow-[0_0_15px_rgba(153,153,255,0.1)]'
								: 'border-white/5 bg-white/1 hover:border-white/10 hover:bg-white/3'}
								{file.isDragTarget && file.kind === 'directory'
								? 'scale-105 border-dashed border-[#9999FF] bg-[#9999FF]/20'
								: ''}"
						>
							<div
								class="relative flex h-14 w-14 items-center justify-center text-4xl transition-transform duration-300 group-hover:scale-110"
							>
								{#if file.kind === 'directory'}
									📂
								{:else}
									{getIcon(file.name, file.extension)}
								{/if}
							</div>

							<span
								class="mt-3 w-full truncate text-center text-xs font-medium tracking-tight text-white/80"
								title={file.name}
							>
								{file.name}
							</span>

							<span class="mt-1 font-mono text-[9px] opacity-30">
								{file.size}
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</main>

	<!-- Footer Metadata Bar -->
	<footer
		class="z-20 flex items-center justify-between border-t border-white/5 bg-[#090909] px-5 py-2.5 text-[9px] font-bold tracking-wider text-white/40 uppercase"
	>
		<div class="flex gap-5">
			<span>Structures Active: {filesEngine.filteredFiles.length}</span>
			{#if filesEngine.selectedFile}
				<span class="text-[#9999FF]"
					>{filesEngine.selectedFile.kind === 'directory'
						? 'SCOPE MATRIX LAYER'
						: 'BINARY TARGET INSTANCE'}</span
				>
			{/if}
			{#if filesEngine.clipboard.item}
				<span class="animate-pulse text-emerald-400 italic"
					>Buffer: Allocated [{filesEngine.clipboard.mode}]</span
				>
			{/if}
		</div>
		{#if filesEngine.selectedFile}
			<div class="truncate text-[#9999FF]">
				Focused ID: {filesEngine.selectedFile.name}
			</div>
		{/if}
	</footer>

	<!-- System Modals Overlay Component Architecture -->
	{#if filesEngine.modal.show}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			onclick={(e) => e.target === e.currentTarget && (filesEngine.modal.show = false)}
			class="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
		>
			<div
				class="w-full max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black"
			>
				<div class="p-5">
					<h3 class="text-xs font-black tracking-widest text-[#9999FF] uppercase">
						{filesEngine.modal.title}
					</h3>
					<p class="mt-2 text-xs leading-relaxed text-white/60">{filesEngine.modal.message}</p>

					{#if filesEngine.modal.type === 'prompt'}
						<input
							type="text"
							bind:value={filesEngine.modal.input}
							bind:this={modalInputEl}
							onkeyup={(e) => e.key === 'Enter' && filesEngine.confirmModal()}
							class="mt-4 w-full rounded-xl border border-white/10 bg-black p-3 text-xs text-white outline-none focus:border-[#9999FF]/50"
							placeholder="Enter identifier label string..."
							autocomplete="off"
						/>
					{/if}
				</div>

				<div class="flex border-t border-white/5 text-[9px] font-black tracking-widest uppercase">
					<button
						onclick={() => (filesEngine.modal.show = false)}
						class="flex-1 p-3.5 opacity-40 transition-all hover:bg-white/5 hover:opacity-100"
					>
						Cancel
					</button>
					<button
						onclick={() => filesEngine.confirmModal()}
						class="flex-1 border-l border-white/5 bg-[#9999FF]/5 p-3.5 text-[#9999FF] transition-all hover:bg-[#9999FF]/10"
					>
						Execute
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
