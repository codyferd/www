<script lang="ts">
	import { languages } from './languages';

	let inputText = $state('');
	let translatedText = $state('');
	let sourceLang = $state('en');
	let targetLang = $state('es');
	let loading = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;

	async function translateText() {
		if (!inputText.trim()) {
			translatedText = '';
			return;
		}

		if (sourceLang === targetLang) {
			translatedText = inputText;
			return;
		}

		loading = true;
		try {
			const query = encodeURIComponent(inputText);
			const pair = `${sourceLang}|${targetLang}`;
			const url = `https://api.mymemory.translated.net/get?q=${query}&langpair=${pair}`;

			const response = await fetch(url);
			const data = await response.json();

			if (data.responseData) {
				translatedText = data.responseData.translatedText;
			} else if (data.responseStatus !== 200) {
				translatedText = 'Quota limited or translation failed.';
			}
		} catch {
			translatedText = 'Network relay disconnect.';
		} finally {
			loading = false;
		}
	}

	function debouncedTranslate() {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			translateText();
		}, 500);
	}

	function swapLanguages() {
		const temp = sourceLang;
		sourceLang = targetLang;
		targetLang = temp;

		if (translatedText && !loading) {
			inputText = translatedText;
		}
		translateText();
	}

	function handleLangChange() {
		if (inputText.trim()) {
			translateText();
		}
	}

	function clear() {
		inputText = '';
		translatedText = '';
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-black p-4 font-sans text-white">
	<div
		class="w-full max-w-4xl rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4 md:p-8"
	>
		<!-- Header HUD -->
		<div
			class="flex flex-col items-start justify-between gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center"
		>
			<div>
				<h1 class="flex items-center gap-2 text-2xl font-black tracking-tight text-white">
					AVERO <span class="font-light text-[#9999FF]">TRANSLATE</span>
				</h1>
				<p class="mt-1 text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
					Two-Way Relay Matrix
				</p>
			</div>

			<!-- Language Selectors -->
			<div class="flex w-full items-center gap-2 sm:w-auto">
				<select
					bind:value={sourceLang}
					onchange={handleLangChange}
					class="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition duration-300 outline-none focus:border-[#9999FF]/50 sm:flex-none"
				>
					{#each languages as lang (lang.code)}
						<option value={lang.code} class="bg-zinc-900 text-white">{lang.name}</option>
					{/each}
				</select>

				<button
					onclick={swapLanguages}
					class="rounded-xl border border-white/10 bg-white/5 p-2.5 text-[#9999FF] transition-all duration-300 hover:border-[#9999FF]/30 hover:bg-[#9999FF]/10 active:scale-95"
					title="Swap Languages"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
						/>
					</svg>
				</button>

				<select
					bind:value={targetLang}
					onchange={handleLangChange}
					class="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition duration-300 outline-none focus:border-[#9999FF]/50 sm:flex-none"
				>
					{#each languages as lang (lang.code)}
						<option value={lang.code} class="bg-zinc-900 text-white">{lang.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Main Workspace Grid -->
		<div class="my-6 grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Input Pane -->
			<div class="space-y-2">
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>Source Buffer</span
				>
				<textarea
					bind:value={inputText}
					oninput={debouncedTranslate}
					placeholder="Type or paste text to translate..."
					class="h-56 w-full resize-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent rounded-[20px] border border-white/10 bg-white/3 p-4 text-sm leading-relaxed text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
				></textarea>
			</div>

			<!-- Output Pane -->
			<div class="space-y-2">
				<span class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
					>Output Matrix</span
				>
				<div
					class="relative h-56 w-full scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-y-auto rounded-[20px] border border-white/5 bg-white/1 p-4 transition duration-300 hover:border-[#9999FF]/20"
				>
					{#if loading}
						<div
							class="absolute inset-0 flex items-center justify-center rounded-[20px] bg-black/40 backdrop-blur-sm"
						>
							<div
								class="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#9999FF]"
							></div>
						</div>
					{/if}
					<p
						class={`text-sm leading-relaxed ${translatedText ? 'text-white' : 'text-white/30 italic'}`}
					>
						{translatedText || 'Awaiting stream calculation...'}
					</p>
				</div>
			</div>
		</div>

		<!-- Footer Status Bar -->
		<div
			class="flex items-center justify-between border-t border-white/5 pt-4 font-mono text-[10px] text-white/40"
		>
			<div class="flex items-center gap-2">
				<span
					class={`h-2 w-2 rounded-full ${loading ? 'animate-ping bg-[#9999FF]' : 'bg-emerald-500'}`}
				></span>
				<span>STATUS: {loading ? 'PROCESSING_STREAM' : 'READY'}</span>
			</div>
			<button
				onclick={clear}
				class="text-xs font-bold tracking-wider text-white/60 uppercase transition-colors duration-300 hover:text-[#9999FF]"
			>
				Reset Buffer
			</button>
		</div>
	</div>
</div>
