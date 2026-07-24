<script lang="ts">
	import { onMount } from 'svelte';
	import {
		DEFAULT_FEEDS,
		isCustomFeed,
		fetchNewsFeed,
		scrapeArticleContent,
		exportFeedsJSON,
		parseImportedFeedsJSON,
		type Article
	} from './helpers';

	// State (Svelte 5 Runes)
	let activeFeeds = $state<Record<string, string>>({});
	let currentCat = $state<string>('');
	let articles = $state<Article[]>([]);
	let loading = $state<boolean>(false);
	let loadingContent = $state<boolean>(false);
	let showMgmt = $state<boolean>(false);

	let newFeedKey = $state<string>('');
	let newFeedUrl = $state<string>('');

	let activeArticle = $state<Article | null>(null);
	let articleBody = $state<string>('');

	const categories = $derived(Object.keys(activeFeeds));

	onMount(() => {
		loadInitialFeeds();
	});

	function loadInitialFeeds() {
		const saved = localStorage.getItem('avero_custom_feeds');
		if (saved) {
			try {
				activeFeeds = JSON.parse(saved);
			} catch {
				activeFeeds = { ...DEFAULT_FEEDS };
			}
		} else {
			activeFeeds = { ...DEFAULT_FEEDS };
		}

		const keys = Object.keys(activeFeeds);
		if (keys.length > 0) {
			currentCat = keys[0];
			fetchNews(keys[0]);
		}
	}

	function saveFeedsState() {
		localStorage.setItem('avero_custom_feeds', JSON.stringify(activeFeeds));
	}

	async function fetchNews(cat: string) {
		if (!cat || !activeFeeds[cat]) return;
		currentCat = cat;
		loading = true;
		activeArticle = null;
		articles = [];

		try {
			articles = await fetchNewsFeed(cat, activeFeeds[cat]);
		} catch (e) {
			console.error('RSS Fetch failed', e);
		} finally {
			loading = false;
		}
	}

	function addCustomFeed() {
		const key = newFeedKey
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');
		const url = newFeedUrl.trim();

		if (!key || !url) {
			alert('Provide valid ID and URL parameters.');
			return;
		}

		activeFeeds = { ...activeFeeds, [key]: url };
		saveFeedsState();

		newFeedKey = '';
		newFeedUrl = '';
		fetchNews(key);
	}

	function deleteFeed(cat: string) {
		if (confirm(`Purge subscription registry mapping for sequence entry: "${cat}"?`)) {
			const updated = { ...activeFeeds };
			delete updated[cat];
			activeFeeds = updated;
			saveFeedsState();

			const remaining = Object.keys(activeFeeds);
			if (currentCat === cat && remaining.length > 0) {
				fetchNews(remaining[0]);
			} else if (remaining.length === 0) {
				articles = [];
			}
		}
	}

	function handleExport() {
		exportFeedsJSON(activeFeeds);
	}

	function handleImport(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const rawText = e.target?.result as string;
			try {
				const parsed = parseImportedFeedsJSON(rawText);
				activeFeeds = parsed;
				saveFeedsState();
				const firstKey = Object.keys(parsed)[0];
				if (firstKey) fetchNews(firstKey);
				alert('Feed configurations successfully imported from JSON.');
			} catch {
				alert('Failure loading external configurations: File must be a valid JSON map.');
			}
		};
		reader.readAsText(file);
	}

	async function openArticle(article: Article) {
		activeArticle = article;
		articleBody = '';
		loadingContent = true;

		try {
			articleBody = await scrapeArticleContent(article.link);
		} catch {
			articleBody =
				'Could not stream clean reading metrics. Connection locked down by target host.';
		} finally {
			loadingContent = false;
		}
	}
</script>

<div class="min-h-screen w-full bg-black font-sans tracking-tight text-white">
	{#if !activeArticle}
		<!-- App Bar -->
		<header class="sticky top-0 z-50 border-b border-white/10 bg-black/80 p-6 backdrop-blur-xl">
			<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
				<h1
					class="text-2xl font-black tracking-tighter text-white italic drop-shadow-[0_0_15px_rgba(153,153,255,0.4)]"
				>
					AVERO<span class="text-[#9999FF]">NEWS</span>
				</h1>

				<div class="flex items-center gap-3">
					<button
						onclick={() => (showMgmt = !showMgmt)}
						class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition duration-300 hover:border-[#9999FF]/30 hover:bg-white/10"
					>
						⚙️ Manage Feeds
					</button>
					<button
						onclick={handleExport}
						class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition duration-300 hover:border-[#9999FF]/30 hover:bg-white/10"
					>
						📤 Export Feeds
					</button>
					<label
						class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition duration-300 hover:border-[#9999FF]/30 hover:bg-white/10"
					>
						📥 Import Feeds
						<input type="file" onchange={handleImport} accept=".json" class="hidden" />
					</label>
				</div>
			</div>

			<!-- Feed Management Panel -->
			{#if showMgmt}
				<div
					class="mx-auto mt-5 max-w-7xl rounded-2xl border border-white/10 bg-white/3 p-4 backdrop-blur-md"
				>
					<div class="flex flex-wrap items-center gap-3">
						<input
							type="text"
							bind:value={newFeedKey}
							placeholder="Feed ID (e.g. techcrunch)"
							class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#9999FF]/50"
						/>
						<input
							type="text"
							bind:value={newFeedUrl}
							placeholder="https://example.com/rss"
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#9999FF]/50 sm:w-80"
						/>
						<button
							onclick={addCustomFeed}
							class="rounded-xl bg-[#9999FF] px-5 py-2.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all hover:bg-[#8888EE]"
						>
							+ Add Feed
						</button>
					</div>
				</div>
			{/if}

			<!-- Categories Bar -->
			<nav class="mx-auto mt-6 flex max-w-7xl flex-wrap items-center gap-2">
				{#each categories as cat (cat)}
					<div class="inline-flex items-center gap-1">
						<button
							onclick={() => fetchNews(cat)}
							class="rounded-xl border px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 {currentCat ===
							cat
								? 'border-[#9999FF] bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.25)]'
								: 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'}"
						>
							{cat}
						</button>
						{#if isCustomFeed(cat)}
							<button
								onclick={() => deleteFeed(cat)}
								class="px-1 text-xs text-red-400 opacity-50 transition hover:opacity-100"
								title="Delete Custom Feed"
							>
								✕
							</button>
						{/if}
					</div>
				{/each}
			</nav>
		</header>

		<!-- News Grid -->
		<main class="mx-auto max-w-7xl p-6">
			{#if loading}
				<div class="flex items-center justify-center p-20">
					<div
						class="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl"
					>
						<span class="text-xs font-black tracking-[0.25em] text-[#9999FF] uppercase"
							>Avero Network Stream</span
						>
						<p class="mt-2 text-sm text-white/50">Fetching stream items from target pipeline...</p>
					</div>
				</div>
			{:else if articles.length === 0}
				<div
					class="rounded-2xl border border-white/5 bg-white/2 p-8 text-center text-sm text-white/40"
				>
					No news articles resolved for target pipeline. Check structural stream data or proxy
					routing boundaries.
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each articles as article (article.id)}
						<!-- News Card -->
						<button
							onclick={() => openArticle(article)}
							class="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/2 p-6 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[#9999FF]/40 hover:bg-white/4 hover:shadow-[0_0_30px_rgba(153,153,255,0.15)]"
						>
							<div>
								<h3 class="text-base font-bold text-white group-hover:text-[#9999FF]">
									{article.title}
								</h3>
								<p class="mt-3 line-clamp-3 text-xs leading-relaxed text-white/50">
									{article.description}
								</p>
							</div>
							<small
								class="mt-6 block text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
							>
								{article.source}
							</small>
						</button>
					{/each}
				</div>
			{/if}
		</main>
	{/if}

	<!-- Reader Overlay -->
	{#if activeArticle}
		<div
			class="fixed inset-0 z-50 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-y-auto bg-black p-6 md:p-16"
		>
			<div class="mx-auto max-w-3xl">
				<button
					onclick={() => (activeArticle = null)}
					class="mb-8 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase transition hover:border-[#9999FF]/40 hover:bg-white/10"
				>
					← Back to Feed
				</button>

				<h2 class="mb-8 text-2xl leading-tight font-black text-white md:text-3xl">
					{activeArticle.title}
				</h2>

				{#if loadingContent}
					<div class="p-12 text-center text-sm text-white/40">
						Streaming source documents across buffer lanes...
					</div>
				{:else}
					<div
						class="prose max-w-none text-sm leading-relaxed text-white/80 prose-invert [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_p]:mb-4"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html articleBody}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
