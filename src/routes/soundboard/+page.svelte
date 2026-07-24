<script lang="ts">
	import soundList from './list.json';

	// Reactive States
	let searchQuery = $state('');
	let activeSounds = $state<Record<number, HTMLAudioElement>>({});

	// Derived States
	let filteredSounds = $derived(
		soundList
			.map((sound, index) => ({ ...sound, originalIndex: index }))
			.filter((sound) => sound.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	let playingSoundsCount = $derived(Object.keys(activeSounds).length);

	// Methods
	const playSound = (sound: { originalIndex: number; file: string; name: string }) => {
		const idx = sound.originalIndex;

		// If this specific pad is already playing, stop it to restart cleanly
		if (activeSounds[idx]) {
			activeSounds[idx].pause();
			activeSounds[idx].currentTime = 0;
			delete activeSounds[idx];
		}

		const audio = new Audio(sound.file);
		activeSounds[idx] = audio;

		audio.play().catch((err) => {
			console.warn(`Could not play audio track for ${sound.name}:`, err);
			delete activeSounds[idx];
		});

		// Cleanup when audio finishes playing
		audio.onended = () => {
			delete activeSounds[idx];
		};
	};

	const stopAll = () => {
		Object.values(activeSounds).forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
		});
		activeSounds = {}; // Clear map
	};
</script>

<div class="min-h-screen bg-black p-4 font-sans text-white md:p-8">
	<div class="mx-auto max-w-5xl space-y-8">
		<!-- Header -->
		<header
			class="flex flex-col items-start justify-between gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center"
		>
			<div class="flex items-center gap-4">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9999FF]/10 shadow-[0_0_20px_rgba(153,153,255,0.15)]"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 animate-pulse text-[#9999FF]"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
						/>
					</svg>
				</div>
				<div>
					<h1 class="text-2xl font-black tracking-tight text-white">Avero Soundboard</h1>
					<p class="text-xs tracking-wider text-white/40 uppercase">Interactive Audio Responses</p>
				</div>
			</div>

			<!-- Global Action -->
			{#if playingSoundsCount > 0}
				<button
					onclick={stopAll}
					class="flex items-center gap-2 rounded-xl bg-white/5 px-5 py-3 text-xs font-bold tracking-wider text-white uppercase transition-all duration-300 hover:bg-red-500/20 hover:text-red-400 active:scale-95"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
						/>
					</svg>
					Stop All ({playingSoundsCount})
				</button>
			{/if}
		</header>

		<!-- Global Controls & Search -->
		<div class="relative w-full">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-white/30"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<input
				bind:value={searchQuery}
				type="text"
				placeholder="Search sounds by name..."
				class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 pl-14 text-sm text-white placeholder-white/30 transition duration-300 focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)] focus:outline-none"
			/>
			{#if searchQuery}
				<button
					type="button"
					onclick={() => (searchQuery = '')}
					aria-label="Clear search query"
					class="absolute top-1/2 right-5 -translate-y-1/2 text-white/30 transition hover:text-white"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>

		<!-- Empty State -->
		{#if filteredSounds.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/2 py-20 text-center backdrop-blur-xl"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mb-4 h-12 w-12 text-white/20"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
					/>
				</svg>
				<p class="font-medium text-white/50">No audio found matching your filters</p>
				<button
					onclick={() => (searchQuery = '')}
					class="mt-2 text-xs font-bold text-[#9999FF] hover:underline"
				>
					Clear search
				</button>
			</div>
			<!-- Sound Board Grid -->
		{:else}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{#each filteredSounds as sound (sound.originalIndex)}
					<button
						onclick={() => playSound(sound)}
						class="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl border bg-white/2 p-4 text-center backdrop-blur-xl transition-all duration-300 active:scale-95 {activeSounds[
							sound.originalIndex
						]
							? 'border-[#9999FF]/50 bg-white/4 shadow-[0_0_20px_rgba(153,153,255,0.15)]'
							: 'border-white/10 hover:border-[#9999FF]/30 hover:bg-white/4'}"
					>
						<!-- Overlay Pulse Indicator -->
						{#if activeSounds[sound.originalIndex]}
							<div class="pointer-events-none absolute inset-0 animate-pulse bg-[#9999FF]/10"></div>
						{/if}

						<!-- Audio Waves Icon -->
						<div
							class="mb-3 transition-transform duration-300 {activeSounds[sound.originalIndex]
								? 'scale-110 text-[#9999FF]'
								: 'text-white/30 group-hover:text-white/60'}"
						>
							{#if activeSounds[sound.originalIndex]}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-8 w-8"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M13 5.039V18.961C13 19.866 11.916 20.332 11.261 19.704L7.172 15.787C6.793 15.424 6.279 15.221 5.743 15.221H4C2.895 15.221 2 14.327 2 13.221V10.779C2 9.673 2.895 8.779 4 8.779H5.743C6.279 8.779 6.793 8.576 7.172 8.213L11.261 4.296C11.916 3.668 13 4.134 13 5.039Z"
									/>
									<path
										d="M16 8C17.1046 8 18 8.89543 18 10V14C18 15.1046 17.1046 16 16 16"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
									/>
									<path
										d="M19.5 5.5C21.433 7.433 22 9.5 22 12C22 14.5 21.433 16.567 19.5 18.5"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-8 w-8"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M7 4V20L20 12L7 4Z" />
								</svg>
							{/if}
						</div>

						<!-- Sound Label -->
						<div
							class="w-full truncate px-1 text-sm font-medium {activeSounds[sound.originalIndex]
								? 'text-white'
								: 'text-white/70'}"
						>
							{sound.name}
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
