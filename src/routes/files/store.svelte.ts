declare global {
	interface Window {
		showDirectoryPicker(options?: {
			mode?: 'read' | 'readwrite';
			startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
		}): Promise<FileSystemDirectoryHandle>;
	}
}

export interface FileEntry {
	name: string;
	kind: 'file' | 'directory';
	handle: FileSystemFileHandle | FileSystemDirectoryHandle;
	size?: string;
	extension?: string;
	isDragTarget?: boolean;
}

export interface ClipboardState {
	item: FileEntry | null;
	mode: 'copy' | 'cut' | null;
	sourceFolderHandle: FileSystemDirectoryHandle | null;
}

export interface ModalState {
	show: boolean;
	title: string;
	message: string;
	type: 'prompt' | 'confirm';
	input: string;
	onConfirm: ((input: string) => void) | null;
}

export const fileIconRegistry: Record<string, string> = {
	txt: '📄',
	doc: '📘',
	docx: '📘',
	pdf: '📕',
	md: '📝',
	log: '📋',
	js: '📜',
	ts: '⚙️',
	html: '🌐',
	css: '🎨',
	py: '🐍',
	json: '🔧',
	png: '🖼️',
	jpg: '🖼️',
	jpeg: '🖼️',
	gif: '🎞️',
	svg: '📐',
	mp3: '🎵',
	mp4: '🎬',
	zip: '📦',
	rar: '📦',
	exe: '⚡',
	sh: '🐚'
};

class FilesEngine {
	// Reactive States
	rootHandle = $state<FileSystemDirectoryHandle | null>(null);
	pathStack = $state<FileSystemDirectoryHandle[]>([]);
	breadcrumbs = $state<string[]>(['System']);
	currentFiles = $state<FileEntry[]>([]);
	searchQuery = $state<string>('');
	selectedFile = $state<FileEntry | null>(null);
	draggedItem = $state<FileEntry | null>(null);

	previewUrl = $state<string | null>(null);
	previewName = $state<string | null>(null);

	clipboard = $state<ClipboardState>({ item: null, mode: null, sourceFolderHandle: null });
	modal = $state<ModalState>({
		show: false,
		title: '',
		message: '',
		type: 'prompt',
		input: '',
		onConfirm: null
	});

	// Derivations
	currentHandle = $derived(this.pathStack[this.pathStack.length - 1] || null);

	filteredFiles = $derived(
		this.searchQuery
			? this.currentFiles.filter((f) =>
					f.name.toLowerCase().includes(this.searchQuery.toLowerCase())
				)
			: this.currentFiles
	);

	metrics = $derived({
		directories: this.currentFiles.filter((f) => f.kind === 'directory').length,
		files: this.currentFiles.filter((f) => f.kind === 'file').length
	});

	// Core API Actions
	async initFileSystem() {
		try {
			const handle = await window.showDirectoryPicker();
			this.rootHandle = handle;
			this.pathStack = [handle];
			await this.loadFiles(handle);
		} catch (err) {
			console.warn('Drive Mount Authorization Rejected', err);
		}
	}

	async loadFiles(handle: FileSystemDirectoryHandle) {
		const files: FileEntry[] = [];
		this.closePreview();

		for await (const entry of handle.values()) {
			let sizeString = '--';
			let ext = '';

			if (entry.kind === 'file') {
				const fileData = await entry.getFile();
				ext = fileData.name.split('.').pop()?.toLowerCase() || '';
				const bytes = fileData.size;
				sizeString =
					bytes < 1024
						? `${bytes} B`
						: bytes < 1048576
							? `${(bytes / 1024).toFixed(1)} KB`
							: `${(bytes / 1048576).toFixed(1)} MB`;
			}

			files.push({
				name: entry.name,
				kind: entry.kind,
				handle: entry,
				size: sizeString,
				extension: ext,
				isDragTarget: false
			});
		}

		this.currentFiles = files.sort(
			(a, b) =>
				(b.kind === 'directory' ? 1 : 0) - (a.kind === 'directory' ? 1 : 0) ||
				a.name.localeCompare(b.name)
		);
	}

	async handleOpen(file: FileEntry) {
		if (file.kind === 'directory') {
			this.breadcrumbs.push(file.name);
			this.pathStack.push(file.handle as FileSystemDirectoryHandle);
			await this.loadFiles(file.handle as FileSystemDirectoryHandle);
			this.selectedFile = null;
		} else {
			await this.generateFilePreview(file);
		}
	}

	async generateFilePreview(file: FileEntry) {
		this.closePreview();
		const nativeFile = await (file.handle as FileSystemFileHandle).getFile();
		if (nativeFile.type.startsWith('image/')) {
			this.previewUrl = URL.createObjectURL(nativeFile);
			this.previewName = file.name;
		}
	}

	closePreview() {
		if (this.previewUrl) {
			URL.revokeObjectURL(this.previewUrl);
			this.previewUrl = null;
			this.previewName = null;
		}
	}

	async goBack() {
		if (this.pathStack.length > 1) {
			this.pathStack.pop();
			this.breadcrumbs.pop();
			await this.loadFiles(this.currentHandle);
			this.selectedFile = null;
		}
	}

	async jumpTo(index: number) {
		this.pathStack = this.pathStack.slice(0, index + 1);
		this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
		await this.loadFiles(this.currentHandle);
		this.selectedFile = null;
	}

	openModal(
		title: string,
		message: string,
		type: 'prompt' | 'confirm',
		onConfirm: (input: string) => void,
		defaultInput = ''
	) {
		this.modal = { show: true, title, message, type, input: defaultInput, onConfirm };
	}

	confirmModal() {
		if (this.modal.onConfirm) this.modal.onConfirm(this.modal.input);
		this.modal.show = false;
	}

	createNew(type: 'file' | 'directory') {
		this.openModal(
			`Create Matrix ${type}`,
			`Specify operational system label identity:`,
			'prompt',
			async (name) => {
				if (!name || !this.currentHandle) return;
				try {
					if (type === 'file') {
						await this.currentHandle.getFileHandle(name, { create: true });
					} else {
						await this.currentHandle.getDirectoryHandle(name, { create: true });
					}
					await this.loadFiles(this.currentHandle);
				} catch {
					alert(`Conflict parameter matched standard entity.`);
				}
			}
		);
	}

	renameItem() {
		if (!this.selectedFile || !this.currentHandle) return;
		const originalItem = this.selectedFile;

		this.openModal(
			'Rename Identifier Schema',
			`Specify new label assignment for "${originalItem.name}":`,
			'prompt',
			async (newName) => {
				if (!newName || newName === originalItem.name || !this.currentHandle) return;
				try {
					if (originalItem.kind === 'file') {
						const originFile = await (originalItem.handle as FileSystemFileHandle).getFile();
						const newFileHandle = await this.currentHandle.getFileHandle(newName, { create: true });
						const writer = await newFileHandle.createWritable();
						await writer.write(originFile);
						await writer.close();
					} else {
						// Directory handles cannot be renamed directly via native Web API targets yet; deep clone allocation mapping is needed
						const newDirHandle = await this.currentHandle.getDirectoryHandle(newName, {
							create: true
						});
						await this.deepCopyDirectory(
							originalItem.handle as FileSystemDirectoryHandle,
							newDirHandle
						);
					}

					await this.currentHandle.removeEntry(originalItem.name, { recursive: true });
					this.selectedFile = null;
					await this.loadFiles(this.currentHandle);
				} catch (err) {
					console.error('Renaming system mapping fault', err);
					alert('Failed rewriting system identifier branch.');
				}
			},
			originalItem.name
		);
	}

	async deleteItem() {
		if (!this.selectedFile || !this.currentHandle) return;
		const name = this.selectedFile.name;
		this.openModal(
			'Purge Absolute Path Block',
			`Irreversibly erase allocation map tracking nodes for "${name}"?`,
			'confirm',
			async () => {
				if (!this.currentHandle) return;
				await this.currentHandle.removeEntry(name, { recursive: true });
				this.selectedFile = null;
				await this.loadFiles(this.currentHandle);
			}
		);
	}

	copyItem() {
		if (this.selectedFile)
			this.clipboard = {
				item: this.selectedFile,
				mode: 'copy',
				sourceFolderHandle: this.currentHandle
			};
	}

	cutItem() {
		if (this.selectedFile)
			this.clipboard = {
				item: this.selectedFile,
				mode: 'cut',
				sourceFolderHandle: this.currentHandle
			};
	}

	async pasteItem() {
		const { item, mode, sourceFolderHandle } = this.clipboard;
		if (!item || !this.currentHandle) return;

		try {
			if (item.kind === 'file') {
				const fileData = await (item.handle as FileSystemFileHandle).getFile();
				const newHandle = await this.currentHandle.getFileHandle(item.name, { create: true });
				const writable = await newHandle.createWritable();
				await writable.write(fileData);
				await writable.close();
			} else {
				// Deep directory structural copy execution
				const targetDirHandle = await this.currentHandle.getDirectoryHandle(item.name, {
					create: true
				});
				await this.deepCopyDirectory(item.handle as FileSystemDirectoryHandle, targetDirHandle);
			}

			if (mode === 'cut' && sourceFolderHandle) {
				await sourceFolderHandle.removeEntry(item.name, { recursive: true });
			}

			await this.loadFiles(this.currentHandle);
			this.clipboard = { item: null, mode: null, sourceFolderHandle: null };
		} catch (err) {
			console.error('Paste pipeline drop error', err);
			alert('Duplicate binary parameters matches core root targeting paths.');
		}
	}

	// Recursive execution engine for full folder migrations
	private async deepCopyDirectory(
		source: FileSystemDirectoryHandle,
		destination: FileSystemDirectoryHandle
	) {
		for await (const entry of source.values()) {
			if (entry.kind === 'file') {
				const file = await entry.getFile();
				const newFileHandle = await destination.getFileHandle(entry.name, { create: true });
				const writer = await newFileHandle.createWritable();
				await writer.write(file);
				await writer.close();
			} else if (entry.kind === 'directory') {
				const newDirHandle = await destination.getDirectoryHandle(entry.name, { create: true });
				await this.deepCopyDirectory(entry, newDirHandle);
			}
		}
	}
}

export const filesEngine = new FilesEngine();
