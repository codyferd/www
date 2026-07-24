<script lang="ts">
	interface LinkItem {
		name: string;
		url: string;
		image?: string;
	}

	interface Props {
		items: LinkItem[];
		category: 'apps' | 'games';
		search: string;
		isOpen: boolean;
		onSelectCategory: (cat: 'apps' | 'games') => void;
		onLaunch: (item: LinkItem, target: 'internal' | 'external') => void;
	}

	let {
		items,
		category,
		search = $bindable(),
		isOpen = $bindable(),
		onSelectCategory,
		onLaunch
	}: Props = $props();
</script>

<!-- 
	Separated Responsive Navigation Index Block
	- Mobile: Controlled purely by isOpen toggle state (`fixed inset-0` with crisp overlay).
	- Desktop: Forced standard flex-block positioning (`md:flex md:relative`), completely stripping filters.
-->
<aside
	class="
	h-full w-full shrink-0 flex-col overflow-hidden border-r border-white/5
	md:relative md:inset-auto md:z-auto md:flex md:w-80 md:bg-black md:backdrop-blur-none
	{isOpen ? 'fixed inset-0 z-40 flex bg-black/90 backdrop-blur-xl' : 'hidden'}
"
>
	<!-- Search Engine HUD Interface -->
	<div class="mt-20 border-b border-white/5 bg-black p-5 md:mt-0">
		<input
			type="text"
			bind:value={search}
			placeholder="Search indexed directory..."
			class="w-full rounded-[14px] border border-white/10 bg-white/3 px-4 py-3 text-xs font-medium text-white placeholder-white/20 transition duration-300 outline-none focus:border-[#9999FF]/40 focus:bg-white/5 focus:shadow-[0_0_20px_rgba(153,153,255,0.08)]"
		/>
	</div>

	<!-- Core Protocol Category Router Toggles -->
	<div
		class="grid grid-cols-2 gap-2 border-b border-white/5 bg-black p-5 text-[10px] font-black tracking-widest uppercase"
	>
		<button
			onclick={() => {
				onSelectCategory('apps');
				isOpen = false;
			}}
			class="rounded-xl border py-3 transition-all duration-300 {category === 'apps'
				? 'border-[#9999FF] bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.2)]'
				: 'border-white/5 bg-transparent text-white/40 hover:text-white'}"
		>
			Apps
		</button>
		<button
			onclick={() => {
				onSelectCategory('games');
				isOpen = false;
			}}
			class="rounded-xl border py-3 transition-all duration-300 {category === 'games'
				? 'border-[#9999FF] bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.2)]'
				: 'border-white/5 bg-transparent text-white/40 hover:text-white'}"
		>
			Games
		</button>
	</div>

	<!-- Vertical Continuous Index Stream Feed -->
	<nav
		class="flex-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent space-y-2 overflow-y-auto bg-black p-4 md:bg-transparent"
	>
		{#each items as item (item.name)}
			<div
				class="group flex flex-col rounded-xl border border-white/5 bg-white/1 p-4 transition-all duration-300 hover:border-[#9999FF]/20"
			>
				<span
					class="mb-3 truncate px-1 text-xs font-bold text-white/70 transition-colors group-hover:text-white"
				>
					{item.name}
				</span>
				<div
					class="grid grid-cols-2 gap-2 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
				>
					<button
						onclick={() => {
							onLaunch(item, 'internal');
							isOpen = false;
						}}
						class="rounded-lg bg-[#9999FF]/10 py-1.5 text-[9px] font-black tracking-wider text-[#9999FF] uppercase transition-all duration-200 hover:bg-[#9999FF] hover:text-black"
					>
						Tab
					</button>
					<button
						onclick={() => {
							onLaunch(item, 'external');
							isOpen = false;
						}}
						class="rounded-lg border border-white/5 bg-white/5 py-1.5 text-[9px] font-black tracking-wider text-white/60 uppercase transition-all duration-200 hover:bg-white/10 hover:text-white"
					>
						Ext
					</button>
				</div>
			</div>
		{/each}

		{#if items.length === 0}
			<div class="pt-10 text-center text-[10px] font-black tracking-widest text-white/20 uppercase">
				Empty Matrix Stack
			</div>
		{/if}
	</nav>
</aside>
