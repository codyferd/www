<script lang="ts">
	import './layout.css';
	import favicon from './favicon.png';

	let { children } = $props();

	const siteUrl = 'https://codyferd.github.io/avero';
	const title = 'Avero — Modular Web Desktop Environment';
	const description =
		'Avero is a user-friendly, open-source web desktop environment built with Svelte and TailwindCSS. Explore a customizable ecosystem of modern applets.';
</script>

<svelte:head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
	<title>{title}</title>
	<meta name="title" content={title} />
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="Avero, Web OS, Web Desktop, Svelte project, SvelteKit, TailwindCSS, open source, web applets"
	/>
	<meta name="google-site-verification" content="_v63urJ3pwRcH-D71er8pgN81AdwMHY34lUsla77zjw" />
	<meta name="theme-color" content="#9999ff" />
	<link rel="canonical" href={siteUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={siteUrl} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:site_name" content="Avero" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:image" content="{siteUrl}{favicon}" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={siteUrl} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="{siteUrl}{favicon}" />
	<link rel="icon" type="image/png" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />

	<!-- JSON-LD Structured Data -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "Avero",
			"url": "{siteUrl}",
			"description": "{description}",
			"applicationCategory": "DesktopEnvironment",
			"operatingSystem": "All"
		}
	</script>
</svelte:head>

<!-- SEO Semantic Anchor (Visible H1 fix for Crawlers without breaking UI) -->
<h1 class="sr-only">Avero Operating Environment</h1>

<div class="sr-only">
	<p>
		Avero is an open source, web-based operating environment built on SvelteKit and TailwindCSS.
	</p>
	<p>
		Designed to be clean, responsive, and user-friendly, Avero provides a modular suite of web
		applets including Avero Blocks.
	</p>
</div>

<div class="min-h-screen bg-[#020205] font-sans text-[#f8fafc] selection:bg-indigo-500/40">
	<main>
		{@render children()}
	</main>
</div>
