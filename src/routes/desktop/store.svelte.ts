// store.svelte.ts
import { SvelteDate, SvelteURL, SvelteSet } from 'svelte/reactivity';
import appListData from './list.json';

export interface AppInstance {
	title: string;
	icon: string;
	path: string;
	instanceId: number;
}

export interface DesktopTab {
	id: number;
	name: string;
	splitRatioX: number;
	splitRatioY: number;
	apps: AppInstance[];
}

export const DesktopEngine = $state({
	isLoading: false,
	isSidebarOpen: false,
	isSplitMenuOpen: false,
	searchQuery: '',
	currentTime: '',
	currentDate: '',
	versionNumber: 'Avero OS v2.5',
	desktops: [] as DesktopTab[],
	activeDesktopId: null as number | null,
	focusedAppId: null as number | null,
	draggedTabIndex: null as number | null,
	dragOverTabIndex: null as number | null,
	appList: appListData,

	// Track open accordion sections using Svelte's reactive Set implementation
	expandedDesktopIds: new SvelteSet<number>(),

	get sortedAppList() {
		return [...this.appList].sort((a, b) => a.title.localeCompare(b.title));
	},

	get otherDesktops() {
		return this.desktops.filter((d: DesktopTab) => d.id !== this.activeDesktopId);
	},

	toggleSidebar() {
		this.isSidebarOpen = !this.isSidebarOpen;
	},

	toggleAccordion(id: number) {
		if (this.expandedDesktopIds.has(id)) {
			this.expandedDesktopIds.delete(id);
		} else {
			this.expandedDesktopIds.add(id);
		}
	},

	launchNewDesktop(app: (typeof appListData)[0]) {
		const id = Date.now();
		// Normalize path if it starts with relative dots like "../"
		const cleanPath = app.path.replace(/^\.\.\//, '/');

		this.desktops.push({
			id,
			name: app.title,
			splitRatioX: 50,
			splitRatioY: 50,
			apps: [{ ...app, path: cleanPath, instanceId: id }]
		});
		this.activeDesktopId = id;
		this.focusedAppId = id;
		this.isSidebarOpen = false;
	},

	handleSearchSubmit() {
		const query = this.searchQuery.trim();
		if (!query) return;

		const localMatch = this.sortedAppList.find(
			(app) => app.title.toLowerCase() === query.toLowerCase()
		);
		if (localMatch) {
			this.launchNewDesktop(localMatch);
			this.searchQuery = '';
			return;
		}

		const isUrlPattern =
			/^https?:\/\//i.test(query) || (query.includes('.') && !query.includes(' '));
		if (isUrlPattern) {
			const targetUrl = /^https?:\/\//i.test(query) ? query : `https://${query}`;
			let targetTitle: string;
			try {
				const parsed = new SvelteURL(targetUrl);
				targetTitle = parsed.hostname.replace('www.', '');
			} catch {
				targetTitle = 'Web Browser';
			}

			const id = Date.now();
			this.desktops.push({
				id,
				name: targetTitle,
				splitRatioX: 50,
				splitRatioY: 50,
				apps: [{ title: targetTitle, icon: '🌐', path: targetUrl, instanceId: id }]
			});
			this.activeDesktopId = id;
			this.focusedAppId = id;
			this.searchQuery = '';
			this.isSidebarOpen = false;
			return;
		}

		const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`;
		const id = Date.now();
		this.desktops.push({
			id,
			name: `Search: ${query}`,
			splitRatioX: 50,
			splitRatioY: 50,
			apps: [{ title: `Search: ${query}`, icon: '🌐', path: searchUrl, instanceId: id }]
		});
		this.activeDesktopId = id;
		this.focusedAppId = id;
		this.searchQuery = '';
		this.isSidebarOpen = false;
	},

	mergeTabs(sourceId: number, targetId: number) {
		const sIdx = this.desktops.findIndex((d) => d.id === sourceId);
		const tIdx = this.desktops.findIndex((d) => d.id === targetId);
		if (sIdx !== -1 && tIdx !== -1) {
			const source = this.desktops[sIdx];
			const target = this.desktops[tIdx];
			if (target.apps.length + source.apps.length <= 4) {
				target.apps.push(...source.apps);
				target.name = `Split View (${target.apps.length} Tabs)`;
				target.splitRatioX = 50;
				target.splitRatioY = 50;
				this.desktops.splice(sIdx, 1);
				this.activeDesktopId = targetId;
				this.focusedAppId = null;
			}
		}
		this.isSplitMenuOpen = false;
		this.isSidebarOpen = false;
	},

	closeTabDirect(desktopId: number) {
		this.expandedDesktopIds.delete(desktopId);
		this.desktops = this.desktops.filter((d) => d.id !== desktopId);
		if (this.activeDesktopId === desktopId) {
			this.activeDesktopId = this.desktops.length ? this.desktops[0].id : null;
		}
	},

	closeSubTab(desktopId: number, instanceId: number) {
		const desktop = this.desktops.find((d) => d.id === desktopId);
		if (!desktop) return;

		desktop.apps = desktop.apps.filter((a) => a.instanceId !== instanceId);

		if (desktop.apps.length === 0) {
			this.closeTabDirect(desktopId);
		} else if (desktop.apps.length === 1) {
			desktop.name = desktop.apps[0].title;
			if (this.focusedAppId === instanceId) {
				this.focusedAppId = desktop.apps[0].instanceId;
			}
		} else {
			desktop.name = `Split View (${desktop.apps.length} Tabs)`;
			if (this.focusedAppId === instanceId) {
				this.focusedAppId = desktop.apps[0].instanceId;
			}
		}
	},

	smartRefreshTab(desktop: DesktopTab) {
		desktop.apps.forEach((a) => {
			const frame = document.getElementById('frame-' + a.instanceId) as HTMLIFrameElement;
			if (frame) {
				frame.src = String(frame.src);
			}
		});
	},

	updateClock() {
		const now = new SvelteDate();
		this.currentTime = now.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		this.currentDate = now.toISOString().split('T')[0];
	}
});
