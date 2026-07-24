<script lang="ts">
	import './layout.css';
	import favicon from './favicon.avif';
	let { children } = $props();
</script>

<svelte:head>
	<!-- Standard Meta Tags -->
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
	<title>Avero</title>
	<meta name="title" content="Avero" />
	<meta
		name="description"
		content="Avero is a user-friendly, open-source web desktop environment built with Svelte and TailwindCSS. Explore a customizable ecosystem of modern applets."
	/>
	<meta
		name="keywords"
		content="Avero, Web OS, Web Desktop, Svelte project, SvelteKit, TailwindCSS, open source, web applets"
	/>
	<meta name="google-site-verification" content="_v63urJ3pwRcH-D71er8pgN81AdwMHY34lUsla77zjw" />
	<meta name="theme-color" content="#9999ff" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Avero" />
	<meta
		property="og:description"
		content="A user-friendly web desktop built for productivity and ease of use. Completely modular and open source."
	/>
	<meta property="og:image" content={favicon} />

	<!-- Favicon link mapping your imported asset -->
	<link rel="icon" type="image/avif" href={favicon} />
</svelte:head>

<!-- Visually Hidden SEO Semantic Anchor for Crawlers -->
<div class="sr-only" aria-hidden="true">
	<h1>Avero Operating Environment</h1>
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
