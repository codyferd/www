<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths'; // Swap 'base' for 'resolve'
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-[#020205] px-6 font-sans text-white"
>
	<!-- Glowing Visual Badge -->
	<div
		class="mb-4 animate-pulse rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-medium tracking-wider text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
	>
		SYSTEM ALERT
	</div>

	<!-- Error Status Number -->
	<h1
		class="bg-linear-to-b from-white to-zinc-500 bg-clip-text text-8xl font-black tracking-tighter text-transparent select-none sm:text-9xl"
	>
		{page.status}
	</h1>

	<!-- Error Description Text -->
	<p class="mt-4 max-w-md text-center text-sm font-medium text-zinc-400">
		{page.error?.message || 'An unexpected system anomaly has occurred.'}
	</p>

	<!-- Action Controls -->
	<div class="mt-8 flex gap-4">
		<button
			onclick={() => window.location.reload()}
			class="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold transition-all duration-200 hover:bg-white/10 hover:text-white"
		>
			Retry Session
		</button>

		<!-- Wrap the fallback path inside the resolve function -->
		<a
			href={resolve('/')}
			class="rounded-lg bg-[#9999FF] px-4 py-2 text-xs font-semibold text-black shadow-[0_0_15px_rgba(153,153,255,0.3)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#8888EE]"
		>
			Return to Desktop
		</a>
	</div>
</div>
