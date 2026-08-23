<!-- Sidebar.svelte -->
<script lang="ts">
	import { DesktopEngine } from './store.svelte';

	function handleDragStart(e: DragEvent, index: number) {
		DesktopEngine.draggedTabIndex = index;
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (DesktopEngine.draggedTabIndex !== index) {
			DesktopEngine.dragOverTabIndex = index;
		}
	}

	function handleDrop(index: number) {
		const source = DesktopEngine.draggedTabIndex;
		DesktopEngine.dragOverTabIndex = null;
		DesktopEngine.draggedTabIndex = null;
		if (source === null || source === index) return;

		const moved = DesktopEngine.desktops.splice(source, 1)[0];
		DesktopEngine.desktops.splice(index, 0, moved);
	}
</script>

<nav
	class="absolute top-0 left-0 z-150 flex h-full w-72.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-col border-r border-white/10 bg-black shadow-[20px_0_50px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-in-out {DesktopEngine.isSidebarOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
>
	<!-- Meta Hub -->
	<div class="flex min-h-16 flex-col justify-center border-b border-white/5 pt-5 pr-3.5 pb-3 pl-24">
		<div class="text-sm leading-none font-black tracking-wider text-white">
			{DesktopEngine.currentTime}
		</div>
		<div class="mt-0.5 text-[9px] font-semibold text-zinc-400">{DesktopEngine.currentDate}</div>
		<div
			class="mt-1 font-mono text-[8px] font-bold tracking-wider text-[#9999FF] uppercase opacity-80"
		>
			{DesktopEngine.versionNumber}
		</div>
	</div>

	<!-- Search Input Area -->
	<div class="border-b border-white/5 p-3">
		<form
			onsubmit={(e) => {
				e.preventDefault();
				DesktopEngine.handleSearchSubmit();
			}}
		>
			<input
				type="text"
				bind:value={DesktopEngine.searchQuery}
				placeholder="Search"
				class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-600 transition-all duration-200 outline-none focus:border-[#9999FF] focus:bg-[#9999FF]/5 focus:shadow-[0_0_12px_rgba(153,153,255,0.2)]"
			/>
		</form>
	</div>

	<!-- Split Tab Merger Subpanel -->
	{#if DesktopEngine.isSplitMenuOpen}
		<div class="border-b border-white/5 bg-zinc-900/60 px-4 py-2 transition-all">
			<p class="mb-1 text-[8px] font-black tracking-widest uppercase opacity-30">Merge with Tab</p>
			{#each DesktopEngine.otherDesktops as d (d.id)}
				<button
					onclick={() =>
						DesktopEngine.activeDesktopId &&
						DesktopEngine.mergeTabs(d.id, DesktopEngine.activeDesktopId)}
					class="flex w-full items-center justify-between rounded px-3 py-1.5 text-left text-[11px] text-zinc-400 hover:bg-white/5 hover:text-white"
				>
					<span>{d.name}</span>
					<span class="opacity-40">+</span>
				</button>
			{:else}
				<div class="py-1 text-[10px] text-zinc-600 italic">No other active tabs available</div>
			{/each}
		</div>
	{/if}

	<!-- Active Matrix Section -->
	<div class="pt-3.5 pr-3 pb-1.5 pl-3 text-[9px] font-black tracking-wider text-zinc-500 uppercase">
		Active Tabs Matrix
	</div>

	<div class="flex max-h-80 flex-col gap-1.5 overflow-y-auto px-3" role="list">
		{#each DesktopEngine.desktops as d, idx (d.id)}
			<div class="flex w-full flex-col gap-1">
				<div
					role="listitem"
					draggable="true"
					ondragstart={(e) => handleDragStart(e, idx)}
					ondragover={(e) => handleDragOver(e, idx)}
					ondragleave={() => (DesktopEngine.dragOverTabIndex = null)}
					ondrop={() => handleDrop(idx)}
					class="flex w-full items-center justify-between gap-2 rounded-md border bg-white/2 p-1 transition-all
					{DesktopEngine.activeDesktopId === d.id
						? 'border-[#9999FF] bg-[#9999FF]/10'
						: 'border-white/5 hover:border-white/10 hover:bg-white/5'}
					{DesktopEngine.dragOverTabIndex === idx ? 'border-dashed border-[#9999FF]' : ''}"
				>
					<button
						type="button"
						onclick={() => {
							DesktopEngine.activeDesktopId = d.id;
							if (d.apps.length > 1) {
								DesktopEngine.toggleAccordion(d.id);
							}
						}}
						class="flex flex-1 items-center gap-1.5 truncate px-1 py-1 text-left text-xs font-medium text-zinc-300 outline-none {DesktopEngine.activeDesktopId ===
						d.id
							? 'font-semibold text-white'
							: ''}"
					>
						{#if d.apps.length > 1}
							<span
								class="text-[9px] opacity-40 transition-transform duration-200 {DesktopEngine.expandedDesktopIds.has(
									d.id
								)
									? 'rotate-90'
									: ''}">▶</span
							>
						{/if}
						<span class="truncate">{d.name}</span>
					</button>

					<div class="flex items-center gap-0.5 pr-1">
						<button
							onclick={() => DesktopEngine.smartRefreshTab(d)}
							class="p-1 text-[11px] text-zinc-500 transition hover:text-white"
							title="Refresh">🔄</button
						>
						<button
							onclick={() => {
								DesktopEngine.activeDesktopId = d.id;
								DesktopEngine.isSplitMenuOpen = !DesktopEngine.isSplitMenuOpen;
							}}
							class="p-1 text-[11px] text-zinc-500 transition hover:text-white"
							title="Split">🗄️</button
						>
						<button
							onclick={() => DesktopEngine.closeTabDirect(d.id)}
							class="p-1 text-[11px] text-zinc-500 transition hover:text-red-400"
							title="Close">✕</button
						>
					</div>
				</div>

				<!-- Nested Accordion Sub-Tab Array List Component -->
				{#if d.apps.length > 1 && DesktopEngine.expandedDesktopIds.has(d.id)}
					<div
						class="my-0.5 ml-2.5 flex flex-col gap-1 border-l border-white/5 pr-1 pl-4 transition-all"
					>
						{#each d.apps as app (app.instanceId)}
							<div
								class="flex items-center justify-between gap-2 rounded border border-white/5 bg-white/1 p-1 hover:border-white/10"
							>
								<button
									type="button"
									onclick={() => {
										DesktopEngine.activeDesktopId = d.id;
										DesktopEngine.focusedAppId = app.instanceId;
									}}
									class="flex-1 truncate pl-1 text-left text-[11px] text-zinc-400 outline-none hover:text-white"
								>
									<span class="mr-1">{app.icon}</span>
									{app.title}
								</button>
								<button
									onclick={() => DesktopEngine.closeSubTab(d.id, app.instanceId)}
									class="px-1.5 py-0.5 text-[10px] text-zinc-600 transition hover:text-red-400"
									title="Close sub-tab"
								>
									✕
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<div class="px-2 text-[11px] text-zinc-600 italic">No open instances</div>
		{/each}
	</div>

	<div class="mx-3 my-2 border-b border-white/5"></div>

	<!-- System Application Roll -->
	<div class="pt-2 pr-3 pb-1.5 pl-3 text-[9px] font-black tracking-wider text-zinc-500 uppercase">
		Applications System
	</div>
	<div class="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-3">
		{#each DesktopEngine.filteredAppList as app (app.title)}
			<button
				onclick={() => DesktopEngine.launchNewDesktop(app)}
				class="group flex items-center gap-3 rounded-lg border border-white/5 bg-white/1 p-2.5 text-left transition-all duration-200 hover:border-[#9999FF] hover:bg-white/5"
			>
				<span class="text-lg">{app.icon}</span>
				<span class="text-xs font-semibold text-zinc-300 transition group-hover:text-white"
					>{app.title}</span
				>
			</button>
		{:else}
			<div class="px-2 text-[11px] text-zinc-600 italic">No matching applications</div>
		{/each}
	</div>
</nav>
