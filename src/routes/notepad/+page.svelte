<script lang="ts">
	import { tick } from 'svelte';
	import {
		scanDirectory,
		highlightCode,
		type FileNode,
		type Tab,
		type TerminalLog
	} from './helpers';

	// Svelte 5 Reactive State Runes
	let openTabs = $state<Tab[]>([]);
	let currentTabId = $state<string | null>(null);

	let sidebarWidth = $state<number>(240);
	let isResizing = $state<boolean>(false);

	let cursorLine = $state<number>(1);
	let cursorCol = $state<number>(1);

	let projectTree = $state<FileNode[]>([]);
	let showTerminal = $state<boolean>(false);
	let terminalOutput = $state<TerminalLog[]>([]);

	let editorRef = $state<HTMLTextAreaElement | null>(null);
	let syntaxRef = $state<HTMLPreElement | null>(null);

	// Derived State Runes
	const activeTab = $derived(openTabs.find((t) => t.id === currentTabId) ?? null);
	const content = $derived(activeTab ? activeTab.content : '');
	const isDirty = $derived(activeTab ? activeTab.isDirty : false);
	const lineCount = $derived(content ? content.split('\n').length : 1);
	const highlightedContent = $derived(highlightCode(content));

	// Synchronize content input from editor surface
	function updateContent(newVal: string) {
		if (activeTab) {
			activeTab.content = newVal;
			activeTab.isDirty = true;
		}
	}

	function trackCursor() {
		if (!editorRef) return;
		const textBeforeCursor = editorRef.value.substring(0, editorRef.selectionStart);
		const lines = textBeforeCursor.split('\n');
		cursorLine = lines.length;
		cursorCol = lines[lines.length - 1].length + 1;
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		updateContent(target.value);
		trackCursor();
	}

	function handleTab(e: KeyboardEvent) {
		if (!editorRef || e.key !== 'Tab') return;
		e.preventDefault();

		const start = editorRef.selectionStart;
		const end = editorRef.selectionEnd;
		const val = content;

		const updated = val.substring(0, start) + '    ' + val.substring(end);
		updateContent(updated);

		tick().then(() => {
			if (editorRef) {
				editorRef.selectionStart = editorRef.selectionEnd = start + 4;
				trackCursor();
			}
		});
	}

	function syncScroll() {
		if (editorRef && syntaxRef) {
			syntaxRef.scrollTop = editorRef.scrollTop;
			syntaxRef.scrollLeft = editorRef.scrollLeft;
		}
	}

	function startSidebarDrag(e: MouseEvent) {
		e.preventDefault();
		isResizing = true;
		const startWidth = sidebarWidth;
		const startX = e.clientX;

		const onMouseMove = (moveEvent: MouseEvent) => {
			const deltaX = moveEvent.clientX - startX;
			sidebarWidth = Math.max(160, Math.min(500, startWidth + deltaX));
		};

		const onMouseUp = () => {
			isResizing = false;
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	async function selectFileByHandle(handle: FileSystemFileHandle) {
		const existing = openTabs.find((t) => t.handle && t.handle.name === handle.name);
		if (existing) {
			switchTab(existing.id);
			return;
		}
		try {
			const file = await handle.getFile();
			const fileText = await file.text();
			const newId = Date.now().toString();

			openTabs.push({
				id: newId,
				name: handle.name,
				content: fileText,
				handle,
				isDirty: false
			});

			switchTab(newId);
		} catch (err) {
			console.error('Failed reading file stream handle:', err);
		}
	}

	function switchTab(id: string) {
		currentTabId = id;
		tick().then(() => {
			trackCursor();
			editorRef?.focus();
		});
	}

	function closeTab(id: string) {
		const index = openTabs.findIndex((t) => t.id === id);
		if (index === -1) return;

		openTabs.splice(index, 1);
		if (currentTabId === id) {
			currentTabId = openTabs.length ? openTabs[Math.max(0, index - 1)].id : null;
		}
	}

	async function openFolder() {
		try {
			const windowWithPicker = window as unknown as {
				showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
			};
			const dirHandle = await windowWithPicker.showDirectoryPicker();
			projectTree = [await scanDirectory(dirHandle)];
		} catch (e) {
			console.warn('Folder selection aborted or unsupported:', e);
		}
	}

	async function openFile() {
		try {
			const windowWithPicker = window as unknown as {
				showOpenFilePicker: () => Promise<[FileSystemFileHandle]>;
			};
			const [handle] = await windowWithPicker.showOpenFilePicker();
			await selectFileByHandle(handle);
		} catch (e) {
			console.warn('File selection aborted:', e);
		}
	}

	async function saveFile() {
		if (!activeTab) return;
		try {
			if (!activeTab.handle) {
				const windowWithPicker = window as unknown as {
					showSaveFilePicker: (options?: unknown) => Promise<FileSystemFileHandle>;
				};
				const newHandle = await windowWithPicker.showSaveFilePicker({
					suggestedName: activeTab.name || 'untitled.js'
				});
				activeTab.handle = newHandle;
				activeTab.name = newHandle.name;
			}
			const writable = await activeTab.handle.createWritable();
			await writable.write(content);
			await writable.close();
			activeTab.isDirty = false;
		} catch (e) {
			console.error('Error committing file state:', e);
		}
	}

	function runCode() {
		showTerminal = true;
		const originalLog = console.log;
		try {
			console.log = (m: unknown) => {
				terminalOutput.push({ type: 'info', msg: String(m) });
			};
			const fn = new Function(content);
			fn();
		} catch (err) {
			terminalOutput.push({
				type: 'error',
				msg: err instanceof Error ? err.message : String(err)
			});
		} finally {
			console.log = originalLog;
		}
	}

	// Recursive Directory Explorer Snippet Component
	let openFolders = $state<Record<string, boolean>>({});
	function toggleFolder(path: string) {
		openFolders[path] = !openFolders[path];
	}
</script>

{#snippet treeNode(node: FileNode, pathPrefix: string)}
	{@const currentPath = `${pathPrefix}/${node.name}`}
	<div class="select-none">
		{#if node.kind === 'directory'}
			<button
				type="button"
				onclick={() => toggleFolder(currentPath)}
				class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-white/70 transition hover:bg-white/5 hover:text-white"
			>
				<span class="w-4 text-xs opacity-50">{openFolders[currentPath] ? '📂' : '📁'}</span>
				<span class="truncate font-mono">{node.name}</span>
			</button>
			{#if openFolders[currentPath] && node.children}
				<div class="ml-3 border-l border-white/10 pl-1">
					{#each node.children as child (child.name)}
						{@render treeNode(child, currentPath)}
					{/each}
				</div>
			{/if}
		{:else}
			<button
				type="button"
				onclick={() => selectFileByHandle(node.handle as FileSystemFileHandle)}
				class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-white/70 transition hover:bg-white/5 hover:text-white"
			>
				<span class="w-4 text-xs opacity-50">📄</span>
				<span class="truncate font-mono">{node.name}</span>
			</button>
		{/if}
	</div>
{/snippet}

<div
	class="flex h-screen w-full flex-col bg-black font-sans tracking-tight text-white select-none {isResizing
		? 'cursor-col-resize select-none'
		: ''}"
>
	<!-- Top Navigation System Header -->
	<header
		class="z-50 flex items-center justify-between border-b border-white/10 bg-black/80 px-4 py-2.5 backdrop-blur-xl"
	>
		<div class="flex items-center gap-4">
			<div
				class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#9999FF] font-black text-black italic shadow-[0_0_15px_rgba(153,153,255,0.4)]"
			>
				A
			</div>
			<span class="mr-2 text-xs font-black tracking-widest text-[#9999FF] uppercase">Avero IDE</span
			>
			<nav class="flex items-center gap-1">
				<button
					onclick={openFile}
					class="rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/80 uppercase transition duration-200 hover:border-[#9999FF]/30 hover:bg-white/10 hover:text-white"
				>
					Open File
				</button>
				<button
					onclick={openFolder}
					class="rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/80 uppercase transition duration-200 hover:border-[#9999FF]/30 hover:bg-white/10 hover:text-white"
				>
					Open Folder
				</button>
				<button
					onclick={saveFile}
					class="rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase transition duration-200 hover:border-[#9999FF]/30 hover:bg-white/10 {isDirty
						? 'text-[#9999FF]'
						: 'text-white/80'}"
				>
					Save
				</button>
				<div class="mx-2 h-4 w-px bg-white/10"></div>
				<button
					onclick={runCode}
					class="rounded-xl bg-[#9999FF] px-3.5 py-1.5 text-[10px] font-extrabold tracking-wider text-black uppercase shadow-[0_0_15px_rgba(153,153,255,0.2)] transition duration-200 hover:bg-[#8888EE]"
				>
					▶ Run
				</button>
			</nav>
		</div>

		<div class="flex items-center gap-4">
			<button
				onclick={() => (showTerminal = !showTerminal)}
				class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/60 transition hover:border-[#9999FF]/30 hover:text-white"
			>
				TERM
			</button>
		</div>
	</header>

	<!-- Main Workbench Body -->
	<main class="flex grow overflow-hidden">
		<!-- Left Sidebar Directory Explorer -->
		<aside
			style="width: {sidebarWidth}px"
			class="flex shrink-0 flex-col border-r border-white/10 bg-white/1"
		>
			<div class="flex items-center justify-between border-b border-white/5 p-3">
				<span class="text-[9px] font-black tracking-widest text-white/40 uppercase">Explorer</span>
			</div>
			<div
				class="grow scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-y-auto p-2"
			>
				{#if projectTree.length === 0}
					<div class="p-4 text-center text-xs text-white/30">
						No workspace loaded.<br />Click <span class="text-white/60">Open Folder</span> to explore
						directory trees.
					</div>
				{:else}
					{#each projectTree as rootNode (rootNode.name)}
						{@render treeNode(rootNode, '')}
					{/each}
				{/if}
			</div>
		</aside>

		<!-- Sidebar Resizer Splitter Bar -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onmousedown={startSidebarDrag}
			class="w-1 cursor-col-resize bg-white/5 transition hover:bg-[#9999FF]"
		></div>

		<!-- Workspace / Code Viewport Surface -->
		<div class="relative flex grow flex-col overflow-hidden bg-[#050505]">
			<!-- File Tabs Header Bar -->
			<div class="flex scrollbar-none overflow-x-auto border-b border-white/10 bg-black/40">
				{#each openTabs as tab (tab.id)}
					<button
						type="button"
						onclick={() => switchTab(tab.id)}
						class="group flex items-center gap-2 border-r border-white/5 px-4 py-2 font-mono text-xs transition duration-200 {currentTabId ===
						tab.id
							? 'border-b-2 border-b-[#9999FF] bg-white/4 text-[#9999FF]'
							: 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white'}"
					>
						<span>{tab.name}</span>
						{#if tab.isDirty}
							<span class="text-[8px] text-[#9999FF]">●</span>
						{/if}
						<span
							role="button"
							tabindex="0"
							onclick={(e) => {
								e.stopPropagation();
								closeTab(tab.id);
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.stopPropagation();
									closeTab(tab.id);
								}
							}}
							class="ml-1 text-white/30 transition hover:text-red-400"
						>
							×
						</span>
					</button>
				{/each}
			</div>

			<!-- Blank State Backdrop -->
			{#if !currentTabId}
				<div class="flex grow flex-col items-center justify-center font-mono text-xs text-white/20">
					<p class="text-sm font-bold text-white/30">No Workspace Buffer Stream Selected</p>
					<p class="mt-1 text-[10px]">
						Open a file from the Explorer or create a new tab buffer to start editing
					</p>
				</div>
			{/if}

			<!-- Editor Core Viewport -->
			{#if currentTabId}
				<div class="flex grow overflow-hidden">
					<!-- Line Counter Strip -->
					<div
						class="w-12 shrink-0 border-r border-white/5 bg-black/20 pt-6 pr-3 text-right font-mono text-[10px] text-white/20 select-none"
					>
						{#each Array.from(Array(lineCount).keys()) as lineNum (lineNum)}
							<div>{lineNum + 1}</div>
						{/each}
					</div>

					<!-- Synchronized Dual-Layer Editor Buffer -->
					<div class="relative grow overflow-hidden bg-[#050505]">
						<!-- Syntax Highlighted Underlay -->
						<pre
							bind:this={syntaxRef}
							class="pointer-events-none absolute inset-0 box-border overflow-hidden p-6 font-mono text-sm leading-relaxed whitespace-pre tab-4 text-slate-300">{highlightedContent}</pre>

						<!-- Raw Text Input Overlay -->
						<textarea
							bind:this={editorRef}
							value={content}
							oninput={handleInput}
							onscroll={syncScroll}
							onkeydown={handleTab}
							onkeyup={trackCursor}
							onclick={trackCursor}
							spellcheck="false"
							class="absolute inset-0 box-border h-full w-full resize-none border-none bg-transparent p-6 font-mono text-sm leading-relaxed whitespace-pre tab-4 text-transparent caret-[#9999FF] outline-none selection:bg-[#9999FF]/20"
						></textarea>
					</div>
				</div>
			{/if}

			<!-- Interactive Output Terminal Drawer -->
			{#if showTerminal}
				<div class="flex h-48 shrink-0 flex-col border-t border-white/10 bg-[#080808]">
					<div
						class="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-1.5"
					>
						<span class="text-[9px] font-black tracking-widest text-white/40 uppercase"
							>Output Console</span
						>
						<button
							onclick={() => (terminalOutput = [])}
							class="text-[9px] font-bold text-white/40 uppercase transition hover:text-white"
						>
							Clear
						</button>
					</div>
					<div
						class="grow scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-1.5 overflow-y-auto p-4 font-mono text-xs"
					>
						{#if terminalOutput.length === 0}
							<div class="text-white/20">Execution output and logs will appear here...</div>
						{/if}
						{#each terminalOutput as log, i (i)}
							<div class={log.type === 'error' ? 'text-red-400' : 'text-[#9999FF]'}>
								<span class="opacity-40">&gt;&gt;</span>
								{log.msg}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</main>

	<!-- Footer Status Bar -->
	<footer
		class="z-50 flex items-center justify-between bg-[#9999FF] px-4 py-1 font-mono text-[10px] font-black text-black select-none"
	>
		<div class="flex gap-4">
			<span>Ln {cursorLine}, Col {cursorCol}</span>
			<span>Workspace Active Buffers: {openTabs.length}</span>
		</div>
		<div class="flex items-center gap-2">
			<span>{isDirty ? 'Modified' : 'Synced'}</span>
			<div class="h-2 w-2 rounded-full bg-black {isDirty ? 'animate-ping bg-amber-400' : ''}"></div>
		</div>
	</footer>
</div>
