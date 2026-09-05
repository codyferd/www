<script lang="ts">
	import sourcesData from './links.json';
	import type { Source } from './types';

	let searchQuery = $state('');
	const sources: Source[] = sourcesData;

	let filteredSources = $derived(
		sources
			.filter(
				(source) =>
					source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(source.link && source.link.toLowerCase().includes(searchQuery.toLowerCase()))
			)
			.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
	);
</script>

<div
	class="min-h-screen bg-black p-6 font-sans tracking-tight text-white selection:bg-[#9999FF]/30 selection:text-[#9999FF] md:p-12"
>
	<div class="mx-auto max-w-6xl space-y-8">
		<div
			class="space-y-6 rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4 md:p-10"
		>
			<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 class="flex items-center gap-3 text-3xl font-black tracking-tight text-white">
						AVERO <span class="text-[#9999FF]">LINKS</span>
					</h1>
					<p class="mt-1 text-xs tracking-wider text-white/40 uppercase">
						Unblocked Site Directory
					</p>
				</div>

				<div
					class="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
				>
					<span class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
					</span>
					<span class="text-[10px] font-black tracking-[0.2em] text-white/60 uppercase"
						>Ecosystem Online</span
					>
				</div>
			</div>

			<div class="relative w-full">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search unblocked sources..."
					class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 pr-12 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
				/>
				{#if searchQuery}
					<button
						onclick={() => (searchQuery = '')}
						class="absolute top-1/2 right-4 h-6 w-6 -translate-y-1/2 rounded-full bg-white/10 text-xs text-white/40 transition hover:bg-white/20 hover:text-white"
						aria-label="Clear search"
					>
						✕
					</button>
				{/if}
			</div>
		</div>

		<section class="space-y-4">
			<div class="flex items-center justify-between border-b border-white/10 pb-3">
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>Index / Unblocked Sites</span
				>
				<span class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
					>{filteredSources.length} Listed</span
				>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				{#each filteredSources as source (source)}
					<a
						href={source.link}
						target="_blank"
						rel="noopener noreferrer external"
						class="group flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6 transition duration-300 hover:border-[#9999FF]/20 hover:bg-white/3"
					>
						<div>
							<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Domain Host</span
							>
							<div
								class="mt-2 flex items-center justify-between text-xl font-bold text-white transition-colors group-hover:text-[#9999FF]"
							>
								{source.name}
								<span class="text-sm text-white/30 transition-colors group-hover:text-[#9999FF]"
									>↗</span
								>
							</div>
						</div>
						<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
							<div
								class="h-full bg-[#9999FF] transition-all duration-300"
								style="width: 100%"
							></div>
						</div>
					</a>
				{:else}
					<div
						class="col-span-full rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/30"
					>
						No unblocked sources match your query.
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
