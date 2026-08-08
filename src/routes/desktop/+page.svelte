<script lang="ts">
	import { onMount } from 'svelte';
	import { DesktopEngine, type DesktopTab } from './store.svelte';
	import Sidebar from './Sidebar.svelte';

	import backgroundImage from './background.avif';
	import faviconImage from '../favicon.avif';
	import readmeRawContent from '../../../README.md?raw';

	let activeResizingDesktop = $state<DesktopTab | null>(null);
	let resizeDirection = $state<'X' | 'Y' | 'BOTH'>('X');

	import { base } from '$app/paths';

	let startX = 0;
	let startY = 0;
	let containerWidth = 0;
	let containerHeight = 0;
	let initialRatioX = 50;
	let initialRatioY = 50;

	onMount(() => {
		DesktopEngine.updateClock();
		const interval = setInterval(() => DesktopEngine.updateClock(), 1000);

		if (readmeRawContent) {
			const firstLine = readmeRawContent.split('\n')[0] || '';
			DesktopEngine.versionNumber = firstLine.replace(/[#\s]/g, '');
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			// Super / Meta key -> Toggle Sidebar
			if (e.key === 'Meta' && !e.altKey) {
				e.preventDefault();
				DesktopEngine.toggleSidebar();
				return;
			}

			// Alt key alone -> Refresh active app iframe
			if (e.key === 'Alt' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
				e.preventDefault();
				if (DesktopEngine.focusedAppId) {
					const iframe = document.getElementById(
						`frame-${DesktopEngine.focusedAppId}`
					) as HTMLIFrameElement | null;
					if (iframe && iframe.contentWindow) {
						iframe.contentWindow.location.reload();
					}
				}
			}
		};

		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === 'AVERO_OPEN_TAB') {
				const { title, content } = event.data;
				const blob = new Blob([content], { type: 'text/html' });
				const blobUrl = URL.createObjectURL(blob);
				const id = Date.now();
				DesktopEngine.desktops.push({
					id,
					name: title || 'Live Preview',
					splitRatioX: 50,
					splitRatioY: 50,
					apps: [{ title: title || 'Live Preview', icon: '⚡', path: blobUrl, instanceId: id }]
				});
				DesktopEngine.activeDesktopId = id;
				DesktopEngine.focusedAppId = id;
			} else if (event.data?.type === 'AVERO_KEY_DOWN') {
				if (event.data?.key === 'Meta') {
					DesktopEngine.toggleSidebar();
				}
			}
		};

		// Attach keyboard listeners directly to all iframe windows (works for same-origin tabs)
		const attachIframeListeners = () => {
			const iframes = document.querySelectorAll('iframe');
			iframes.forEach((iframe) => {
				try {
					const iframeWin = iframe.contentWindow as
						(Window & { __averoMetaListenerAttached?: boolean }) | null;
					if (iframeWin && !iframeWin.__averoMetaListenerAttached) {
						iframeWin.__averoMetaListenerAttached = true;
						iframeWin.addEventListener('keydown', handleKeyDown);
					}
				} catch {
					// Cross-origin restriction; handled via postMessage
				}
			});
		};

		// Check for newly loaded iframes periodically
		const iframeCheckInterval = setInterval(attachIframeListeners, 1000);

		window.addEventListener('message', handleMessage);
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			clearInterval(interval);
			clearInterval(iframeCheckInterval);
			window.removeEventListener('message', handleMessage);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function startResize(e: MouseEvent, desktop: DesktopTab, direction: 'X' | 'Y' | 'BOTH') {
		e.preventDefault();
		activeResizingDesktop = desktop;
		resizeDirection = direction;

		const target = e.currentTarget as HTMLElement;
		const container = target.parentElement;
		if (!container) return;

		container.classList.add('pointer-events-none', 'select-none');
		startX = e.clientX;
		startY = e.clientY;
		containerWidth = container.clientWidth;
		containerHeight = container.clientHeight;

		initialRatioX = desktop.splitRatioX ?? 50;
		initialRatioY = desktop.splitRatioY ?? 50;

		window.addEventListener('mousemove', handleResize);
		window.addEventListener('mouseup', endResize);
	}

	function handleResize(e: MouseEvent) {
		if (!activeResizingDesktop) return;

		if (resizeDirection === 'X' || resizeDirection === 'BOTH') {
			const deltaX = e.clientX - startX;
			const deltaPercentX = (deltaX / containerWidth) * 100;
			activeResizingDesktop.splitRatioX = Math.max(
				15,
				Math.min(85, Math.round(initialRatioX + deltaPercentX))
			);
		}

		if (resizeDirection === 'Y' || resizeDirection === 'BOTH') {
			const deltaY = e.clientY - startY;
			const deltaPercentY = (deltaY / containerHeight) * 100;
			activeResizingDesktop.splitRatioY = Math.max(
				15,
				Math.min(85, Math.round(initialRatioY + deltaPercentY))
			);
		}
	}

	function endResize() {
		window.removeEventListener('mousemove', handleResize);
		window.removeEventListener('mouseup', endResize);
		activeResizingDesktop = null;
	}

	// Dynamic calculation helper function determining absolute layout coordinates
	function getAppStyles(appsCount: number, index: number, ratioX: number, ratioY: number) {
		if (appsCount === 1) {
			return 'left:6px; top:6px; right:6px; bottom:6px;';
		}
		if (appsCount === 2) {
			if (index === 0) return `left:6px; top:6px; width:calc(${ratioX}% - 9px); bottom:6px;`;
			return `left:calc(${ratioX}% + 3px); top:6px; right:6px; bottom:6px;`;
		}
		if (appsCount === 3) {
			if (index === 0) return `left:6px; top:6px; width:calc(${ratioX}% - 9px); bottom:6px;`;
			if (index === 1)
				return `left:calc(${ratioX}% + 3px); top:6px; right:6px; height:calc(${ratioY}% - 9px);`;
			return `left:calc(${ratioX}% + 3px); top:calc(${ratioY}% + 3px); right:6px; bottom:6px;`;
		}
		// Maximum 4 windows configuration mapping
		if (index === 0)
			return `left:6px; top:6px; width:calc(${ratioX}% - 9px); height:calc(${ratioY}% - 9px);`;
		if (index === 1)
			return `left:calc(${ratioX}% + 3px); top:6px; right:6px; height:calc(${ratioY}% - 9px);`;
		if (index === 2)
			return `left:6px; top:calc(${ratioY}% + 3px); width:calc(${ratioX}% - 9px); bottom:6px;`;
		return `left:calc(${ratioX}% + 3px); top:calc(${ratioY}% + 3px); right:6px; bottom:6px;`;
	}
</script>

<div
	class="relative h-screen w-screen overflow-hidden bg-black font-sans tracking-tight select-none"
	style="background-image: url('{backgroundImage}'); background-size: cover; background-position: center;"
>
	<button
		onclick={() => DesktopEngine.toggleSidebar()}
		class="absolute top-4 left-4 z-200 flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-800 bg-black p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-200 hover:scale-105 hover:border-[#9999FF] hover:shadow-[0_0_25px_rgba(153,153,255,0.4)]"
		title="Open Workspace Menu"
	>
		<img src={faviconImage} alt="Avero Start Logo" class="max-h-full max-w-full object-contain" />
	</button>

	<Sidebar />

	<main class="relative h-full w-full">
		{#each DesktopEngine.desktops as d (d.id)}
			<div
				class="absolute inset-0 box-border h-full w-full {DesktopEngine.activeDesktopId === d.id
					? 'block'
					: 'hidden'} {activeResizingDesktop ? 'pointer-events-none select-none' : ''}"
			>
				{#each d.apps as app, index (app.instanceId)}
					<div
						class="absolute flex flex-col overflow-hidden rounded-xl border bg-black transition-all duration-75
						{DesktopEngine.focusedAppId === app.instanceId
							? 'border-[#9999FF] shadow-[0_0_20px_rgba(153,153,255,0.15)]'
							: 'border-white/5'}"
						style={getAppStyles(d.apps.length, index, d.splitRatioX, d.splitRatioY)}
					>
						{#if DesktopEngine.focusedAppId !== app.instanceId}
							<button
								type="button"
								class="absolute inset-0 z-40 h-full w-full cursor-pointer border-none bg-transparent text-left"
								onmousedown={() => (DesktopEngine.focusedAppId = app.instanceId)}
								aria-label="Focus App"
							></button>
						{/if}
						<div class="relative h-full w-full flex-1 bg-white">
							<iframe
								id="frame-{app.instanceId}"
								src={app.path.startsWith('http') || app.path.startsWith('blob:')
									? app.path
									: `${base}${app.path}`}
								title={app.title}
								class="h-full w-full border-none bg-white {activeResizingDesktop
									? 'pointer-events-none'
									: ''}"
							></iframe>
						</div>
					</div>
				{/each}

				<!-- Resizers -->
				{#if d.apps.length === 2}
					<button
						onmousedown={(e) => startResize(e, d, 'X')}
						class="group absolute top-1.5 bottom-1.5 z-1000 flex w-1.5 cursor-col-resize items-center justify-center bg-transparent transition hover:bg-[#9999FF] hover:shadow-[0_0_10px_#9999FF] active:bg-[#9999FF]"
						style="left: calc({d.splitRatioX}% - 3px);"
						aria-label="Resize layout panes"
					>
						<div class="h-6 w-0.5 rounded-[1px] bg-white/20 group-hover:bg-white"></div>
					</button>
				{/if}

				{#if d.apps.length >= 3}
					<button
						onmousedown={(e) => startResize(e, d, 'X')}
						class="group absolute top-1.5 bottom-1.5 z-40 flex w-1.5 cursor-col-resize items-center justify-center bg-transparent transition hover:bg-[#9999FF] hover:shadow-[0_0_10px_#9999FF]"
						style="left: calc({d.splitRatioX}% - 3px);"
						aria-label="Resize layout columns"
					>
						<div class="h-8 w-0.5 rounded-[1px] bg-white/20 group-hover:bg-white"></div>
					</button>

					<button
						onmousedown={(e) => startResize(e, d, 'Y')}
						class="group absolute right-1.5 left-1.5 z-40 flex h-1.5 cursor-row-resize items-center justify-center bg-transparent transition hover:bg-[#9999FF] hover:shadow-[0_0_10px_#9999FF]"
						style="top: calc({d.splitRatioY}% - 3px);"
						aria-label="Resize layout rows"
					>
						<div class="h-0.5 w-8 rounded-[1px] bg-white/20 group-hover:bg-white"></div>
					</button>

					<button
						onmousedown={(e) => startResize(e, d, 'BOTH')}
						class="absolute z-50 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-md border border-white/20 bg-zinc-950 shadow-xl transition hover:border-[#9999FF] hover:shadow-[0_0_15px_rgba(153,153,255,0.6)] active:scale-90"
						style="left: {d.splitRatioX}%; top: {d.splitRatioY}%;"
						aria-label="Omni-directional layout pin"
					></button>
				{/if}
			</div>
		{/each}
	</main>
</div>
