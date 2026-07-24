<script lang="ts">
	import socialLinksData from './list.json';

	interface SocialLink {
		name: string;
		label: string;
		url?: string;
		accent?: string;
	}

	const socialLinks: SocialLink[] = socialLinksData;

	const openExternal = (url?: string) => {
		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer');
		}
	};
</script>

<div class="min-h-screen bg-black font-sans text-zinc-100 selection:bg-[#9999FF]/30">
	<main class="mx-auto max-w-4xl space-y-16 p-6 sm:p-12">
		<!-- Header -->
		<div class="py-12 text-center">
			<h1
				class="bg-linear-to-r from-white via-[#9999FF] to-white/40 bg-clip-text text-6xl font-black tracking-tighter text-transparent italic sm:text-7xl"
			>
				Hi, this is my website :D
			</h1>
		</div>

		<!-- Socials Section -->
		<div class="space-y-8">
			<h2 class="text-4xl font-black tracking-tighter text-[#9999FF] italic">Luca Ferdinand</h2>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each socialLinks as link (link.name)}
					<button
						onclick={() => openExternal(link.url)}
						disabled={!link.url}
						class="rounded-3xl border border-white/10 bg-white/2 p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 hover:bg-white/4 {link.url
							? 'cursor-pointer hover:border-[#9999FF]/30 hover:shadow-[0_0_20px_rgba(153,153,255,0.15)]'
							: 'cursor-default'}"
					>
						<span
							class="text-[10px] font-black tracking-widest uppercase {link.accent ||
								'text-zinc-400'}"
						>
							{link.name}
						</span>
						<p class="mt-1 text-xl font-bold text-white">{link.label}</p>
					</button>
				{/each}
			</div>
		</div>

		<!-- Join Loaf House Section -->
		<div
			class="rounded-3xl border border-white/10 bg-white/2 p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-500 hover:border-[#9999FF]/10"
		>
			<h2 class="mb-6 text-4xl font-black tracking-tighter text-white italic">
				Join <span class="text-[#9999FF]">Loaf House!</span>
			</h2>
			<button
				onclick={() => openExternal('https://discord.gg/6w9z6rqsgm')}
				class="cursor-pointer rounded-2xl bg-[#9999FF] px-12 py-5 text-lg font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(153,153,255,0.35)] hover:brightness-110 active:scale-95"
			>
				Discord Invite
			</button>
		</div>
	</main>
</div>
