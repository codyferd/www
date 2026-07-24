<script lang="ts">
	import SidebarIndex from './SidebarIndex.svelte';
	import appsData from './apps.json';
	import gamesData from './games.json';

	interface LinkItem {
		name: string;
		url: string;
		image?: string;
	}

	let currentCategory = $state<'apps' | 'games'>('apps');
	let searchQuery = $state('');
	let isSidebarOpen = $state(false);

	const datasets = { apps: appsData as LinkItem[], games: gamesData as LinkItem[] };

	let filteredItems = $derived(
		[...datasets[currentCategory]]
			.sort((a, b) => a.name.localeCompare(b.name))
			.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function launchLink(item: LinkItem, targetMode: 'internal' | 'external') {
		if (targetMode === 'external') {
			window.open(item.url, '_blank', 'noopener,noreferrer');
			return;
		}

		const iframeHTML = `
			<body style="margin:0;background:#000;overflow:hidden">
				<iframe src="${item.url}" style="width:100vw;height:100vh;border:none;" allow="autoplay; fullscreen; gamepad"></iframe>
			</body>
		`;

		window.parent.postMessage(
			{
				type: 'AVERO_OPEN_TAB',
				title: item.name,
				content: iframeHTML
			},
			'*'
		);
	}
</script>

<div
	class="flex h-screen w-screen flex-col overflow-hidden bg-black font-sans tracking-tight text-white selection:bg-[#9999FF]/30 md:flex-row"
>
	<!-- Mobile Utility Header HUD - Forced Hidden State on Desktop Viewports -->
	<div
		class=" z-50 flex shrink-0 items-center justify-between border-b border-white/10 bg-white/1 p-5 backdrop-blur-md md:hidden"
	>
		<h1 class="text-lg font-black tracking-tighter text-white uppercase italic">
			AVERO <span class="text-[#9999FF]">LINKS</span>
		</h1>
		<button
			onclick={() => (isSidebarOpen = !isSidebarOpen)}
			class="rounded-xl border border-white/10 bg-white/2 p-2 text-white/70 transition-colors hover:text-white"
			aria-label="Toggle structural console sidebar index link parameters"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16m-7 6h7"
				></path></svg
			>
		</button>
	</div>

	<!-- System Navigation Console Layout Block -->
	<SidebarIndex
		items={filteredItems}
		category={currentCategory}
		bind:search={searchQuery}
		bind:isOpen={isSidebarOpen}
		onSelectCategory={(cat) => {
			currentCategory = cat;
			searchQuery = '';
		}}
		onLaunch={launchLink}
	/>

	<!-- Immersive Grid Content Area Workspace Viewport -->
	<main
		class="h-full flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-y-auto bg-black p-6 md:p-12"
	>
		<div
			class="flex min-h-full flex-col rounded-[28px] border border-white/10 bg-white/2 p-6 transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4"
		>
			<!-- Area State Descriptive Metrics Header info -->
			<div class="mb-10 flex items-center justify-between border-b border-white/5 pb-6">
				<h2 class="text-xl font-black tracking-tighter text-white uppercase italic">
					Avero <span class="text-[#9999FF] capitalize">{currentCategory}</span>
				</h2>
				<span
					class="rounded-full border border-[#9999FF]/20 bg-[#9999FF]/10 px-3 py-1 font-mono text-[10px] font-black tracking-wider text-[#9999FF] uppercase"
				>
					{filteredItems.length} Matrix Blocks Allocated
				</span>
			</div>

			<!-- Core 4-Column Forced Grid System Array layout (Corrected Responsive Hierarchy) -->
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each filteredItems as item (item.name)}
					<div
						class="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/1 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#9999FF]/30"
					>
						<!-- Consistent Squared Visual Frame -->
						<div
							class="relative flex aspect-square items-center justify-center overflow-hidden border-b border-white/5 bg-black"
						>
							{#if item.image}
								<img
									src={item.image}
									alt={item.name}
									class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
								/>
							{:else}
								<div
									class="px-4 text-center text-[11px] font-black tracking-[0.3em] text-white/20 uppercase italic transition-colors group-hover:text-[#9999FF]/30"
								>
									AVERO // MATRIX
								</div>
							{/if}
						</div>

						<!-- Core Action Controller Container Layer -->
						<div class="flex flex-1 flex-col justify-between bg-black p-5">
							<h3
								class="mb-6 truncate text-sm font-bold tracking-tight text-white/90 transition-colors group-hover:text-white"
							>
								{item.name}
							</h3>

							<div class="grid grid-cols-2 gap-3">
								<button
									onclick={() => launchLink(item, 'internal')}
									class="rounded-xl bg-[#9999FF] py-3 text-[10px] font-black tracking-wider text-black uppercase shadow-[0_4px_15px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_20px_rgba(153,153,255,0.3)]"
								>
									Avero Tab
								</button>
								<button
									onclick={() => launchLink(item, 'external')}
									class="rounded-xl border border-white/10 bg-white/3 py-3 text-[10px] font-black tracking-wider text-white/80 uppercase transition-all duration-300 hover:border-white/20 hover:text-white"
								>
									External
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Dynamic Void State Handling Indicator -->
			{#if filteredItems.length === 0}
				<div
					class="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/5 py-20 text-center"
				>
					<p class="text-xs font-black tracking-[0.4em] text-white/20 uppercase">
						No Data Stream Elements match Query
					</p>
				</div>
			{/if}
		</div>
	</main>
</div>
