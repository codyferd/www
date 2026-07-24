export interface FileNode {
	name: string;
	kind: 'file' | 'directory';
	handle: FileSystemHandle;
	children?: FileNode[];
}

export interface Tab {
	id: string;
	name: string;
	content: string;
	handle: FileSystemFileHandle | null;
	isDirty: boolean;
}

export interface TerminalLog {
	type: 'info' | 'error';
	msg: string;
}

/**
 * Escapes HTML characters for syntax highlighting
 */
export function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Performs single-pass lexical highlighting for JS/TS code snippets
 */
export function highlightCode(code: string): string {
	if (!code) return '\n';

	const tokenRegex =
		/(?<comment>\/\/.*$)|(?<string>(['"`])(?:\\.|[^\\])*?)|(?<keyword>\b(const|let|var|function|return|if|else|for|while|import|export|class|new|await|async|yield|switch|case|break|continue|default|try|catch|finally)\b)|(?<bool>\b(true|false|null|undefined)\b)|(?<number>\b\d+\b)/gm;

	let lastIndex = 0;
	let htmlResult = '';

	let match: RegExpExecArray | null;
	while ((match = tokenRegex.exec(code)) !== null) {
		if (match.index > lastIndex) {
			htmlResult += escapeHtml(code.substring(lastIndex, match.index));
		}
		const groups = match.groups || {};
		const totalMatch = match[0];

		if (groups.comment) {
			htmlResult += `<span class="text-emerald-500/80 italic">${escapeHtml(totalMatch)}</span>`;
		} else if (groups.string) {
			htmlResult += `<span class="text-amber-300/90">${escapeHtml(totalMatch)}</span>`;
		} else if (groups.keyword) {
			htmlResult += `<span class="text-[#9999FF] font-bold">${totalMatch}</span>`;
		} else if (groups.bool) {
			htmlResult += `<span class="text-[#9999FF]">${totalMatch}</span>`;
		} else if (groups.number) {
			htmlResult += `<span class="text-purple-300">${totalMatch}</span>`;
		} else {
			htmlResult += escapeHtml(totalMatch);
		}

		lastIndex = tokenRegex.lastIndex;
	}

	if (lastIndex < code.length) {
		htmlResult += escapeHtml(code.substring(lastIndex));
	}

	return htmlResult + '\n';
}

/**
 * Recursively scans directory handles provided by File System Access API
 */
export async function scanDirectory(handle: FileSystemDirectoryHandle): Promise<FileNode> {
	const node: FileNode = {
		name: handle.name,
		kind: 'directory',
		handle,
		children: []
	};

	for await (const entry of handle.values()) {
		if (entry.kind === 'directory') {
			node.children?.push(await scanDirectory(entry as FileSystemDirectoryHandle));
		} else {
			node.children?.push({
				name: entry.name,
				kind: 'file',
				handle: entry
			});
		}
	}

	node.children?.sort(
		(a, b) =>
			(b.kind === 'directory' ? 1 : -1) - (a.kind === 'directory' ? 1 : -1) ||
			a.name.localeCompare(b.name)
	);

	return node;
}
