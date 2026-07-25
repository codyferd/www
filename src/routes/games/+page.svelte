<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import defaultGamemakerScript from './main.json';
	import tutorial from './TUTORIAL.md?raw';

	interface Character {
		name: string;
		color: string;
		avatar: string;
		sprite?: string;
	}

	interface SpritePlacement {
		id: string;
		position:
			| 'left'
			| 'left-center'
			| 'center-left'
			| 'center'
			| 'center-right'
			| 'right-center'
			| 'right';
	}

	interface ScriptNode {
		speaker?: string;
		text?: string;
		bg?: string;
		video?: string;
		music?: string[];
		sfx?: string[];
		sprites?: SpritePlacement[];
	}

	interface GamemakerData {
		backgrounds?: Record<string, string>;
		videos?: Record<string, string>;
		sprites?: Record<string, string>;
		music?: Record<string, string>;
		sfx?: Record<string, string>;
		characters: Record<string, Character>;
		script: ScriptNode[];
	}

	interface TextToken {
		text: string;
		type: 'plain' | 'bold' | 'italic' | 'code';
	}

	let gameData = $state<GamemakerData>(defaultGamemakerScript as GamemakerData);
	let currentIndex = $state<number>(0);

	let displayedText = $state<string>('');
	let isTyping = $state<boolean>(false);
	let isAutoPlay = $state<boolean>(false);
	let textSpeed = $state<number>(25);
	let autoDelay = $state<number>(2000);

	// Audio Mute Controls
	let isMusicMuted = $state<boolean>(false);
	let isSfxMuted = $state<boolean>(false);
	let audioUnlocked = $state<boolean>(false);

	let typingTimer: ReturnType<typeof setTimeout> | null = null;
	let autoPlayTimer: ReturnType<typeof setTimeout> | null = null;
	let lastRenderedText = '';

	let isMenuOpen = $state<boolean>(false);
	let isDocsOpen = $state<boolean>(false);
	let saveCodeInput = $state<string>('');
	let fileInputRef = $state<HTMLInputElement>();

	// Multi-channel Audio Management
	let activeMusicElements = new SvelteMap<string, HTMLAudioElement>();

	let currentNode = $derived<ScriptNode | undefined>(gameData.script[currentIndex]);
	let currentSpeaker = $derived<Character | null>(
		currentNode?.speaker && gameData.characters[currentNode.speaker]
			? gameData.characters[currentNode.speaker]
			: null
	);

	let backgroundUrl = $derived<string>(
		currentNode?.bg && gameData.backgrounds && gameData.backgrounds[currentNode.bg]
			? gameData.backgrounds[currentNode.bg]
			: ''
	);

	let videoUrl = $derived<string>(
		currentNode?.video && gameData.videos && gameData.videos[currentNode.video]
			? gameData.videos[currentNode.video]
			: ''
	);

	function parseMarkdownTokens(str: string): TextToken[] {
		if (!str) return [];

		const pattern = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
		const parts = str.split(pattern);

		return parts.map((part) => {
			if (part.startsWith('**') && part.endsWith('**')) {
				return { type: 'bold', text: part.slice(2, -2) };
			}
			if (part.startsWith('*') && part.endsWith('*')) {
				return { type: 'italic', text: part.slice(1, -1) };
			}
			if (part.startsWith('`') && part.endsWith('`')) {
				return { type: 'code', text: part.slice(1, -1) };
			}
			return { type: 'plain', text: part };
		});
	}

	// Audio Sync Effect
	$effect(() => {
		if (!audioUnlocked) return;

		const targetMusicKeys = currentNode?.music || [];
		const activeKeys = new Set(targetMusicKeys);

		// Stop tracks no longer present
		for (const [key, audio] of activeMusicElements.entries()) {
			if (!activeKeys.has(key) || isMusicMuted) {
				audio.pause();
				activeMusicElements.delete(key);
			}
		}

		// Play requested music tracks
		if (!isMusicMuted) {
			for (const key of targetMusicKeys) {
				if (!activeMusicElements.has(key) && gameData.music && gameData.music[key]) {
					const audio = new Audio(gameData.music[key]);
					audio.loop = true;
					audio.play().catch(() => {});
					activeMusicElements.set(key, audio);
				}
			}
		}

		// Play requested SFX
		if (!isSfxMuted && currentNode?.sfx) {
			for (const sfxKey of currentNode.sfx) {
				if (gameData.sfx && gameData.sfx[sfxKey]) {
					const sfxAudio = new Audio(gameData.sfx[sfxKey]);
					sfxAudio.loop = false;
					sfxAudio.play().catch(() => {});
				}
			}
		}
	});

	function unlockAudioContext() {
		if (!audioUnlocked) {
			audioUnlocked = true;
		}
	}

	function startTypewriter(fullText: string) {
		if (typingTimer) clearTimeout(typingTimer);
		if (autoPlayTimer) clearTimeout(autoPlayTimer);

		displayedText = '';
		isTyping = true;
		lastRenderedText = fullText;
		let charIndex = 0;

		function typeNextChar() {
			if (charIndex < fullText.length) {
				displayedText += fullText.charAt(charIndex);
				charIndex++;
				typingTimer = setTimeout(typeNextChar, textSpeed);
			} else {
				isTyping = false;
				if (isAutoPlay && currentIndex < gameData.script.length - 1) {
					autoPlayTimer = setTimeout(advanceNode, autoDelay);
				}
			}
		}

		typeNextChar();
	}

	$effect(() => {
		const targetText = currentNode?.text;
		if (targetText !== undefined && targetText !== lastRenderedText) {
			if (targetText.length > 0) {
				Promise.resolve().then(() => startTypewriter(targetText));
			} else {
				displayedText = '';
				isTyping = false;
				lastRenderedText = '';
				if (isAutoPlay && currentIndex < gameData.script.length - 1) {
					autoPlayTimer = setTimeout(advanceNode, autoDelay);
				}
			}
		}
	});

	function completeTypewriterImmediately() {
		if (typingTimer) clearTimeout(typingTimer);
		if (currentNode?.text) {
			displayedText = currentNode.text;
		}
		isTyping = false;
	}

	function advanceNode() {
		unlockAudioContext();
		if (autoPlayTimer) clearTimeout(autoPlayTimer);

		if (isTyping) {
			completeTypewriterImmediately();
			return;
		}

		if (currentIndex < gameData.script.length - 1) {
			currentIndex += 1;
		}
	}

	function toggleAutoPlay() {
		isAutoPlay = !isAutoPlay;
		if (isAutoPlay && !isTyping && currentIndex < gameData.script.length - 1) {
			advanceNode();
		} else if (!isAutoPlay && autoPlayTimer) {
			clearTimeout(autoPlayTimer);
		}
	}

	function loadFromSaveCode() {
		const valStr = (saveCodeInput ?? '').toString().trim();
		const targetIdx = parseInt(valStr, 10) - 1;
		if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx < gameData.script.length) {
			currentIndex = targetIdx;
			lastRenderedText = '';
			isMenuOpen = false;
		} else {
			alert('Please enter a valid script node number.');
		}
	}

	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const parsed = JSON.parse(e.target?.result as string) as GamemakerData;
				if (parsed.script && Array.isArray(parsed.script) && parsed.characters) {
					gameData = parsed;
					currentIndex = 0;
					isAutoPlay = false;
					lastRenderedText = '';
					isMenuOpen = false;
				} else {
					alert('Invalid Avero Games JSON format.');
				}
			} catch {
				alert('Error reading script JSON file.');
			}
		};
		reader.readAsText(file);
	}

	function loadDefaultScript() {
		gameData = defaultGamemakerScript as GamemakerData;
		currentIndex = 0;
		isAutoPlay = false;
		lastRenderedText = '';
		isMenuOpen = false;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.code === 'Space') {
			e.preventDefault();
			advanceNode();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown);
		}
		if (typingTimer) clearTimeout(typingTimer);
		if (autoPlayTimer) clearTimeout(autoPlayTimer);
		for (const audio of activeMusicElements.values()) {
			audio.pause();
		}
	});
</script>

<svelte:head>
	<title>Avero Games</title>
</svelte:head>

<!-- Main Stage Container -->
<div
	role="button"
	tabindex="0"
	onclick={advanceNode}
	onkeydown={handleKeyDown}
	class="relative flex h-dvh w-full flex-col justify-between overflow-hidden bg-black font-sans text-white select-none focus:outline-none"
>
	<!-- Video Layer -->
	{#if videoUrl}
		<video
			src={videoUrl}
			autoplay
			loop
			muted
			playsinline
			class="absolute inset-0 h-full w-full object-cover"
		></video>
	{:else if backgroundUrl}
		<div
			class="absolute inset-0 bg-cover bg-center transition-all duration-700"
			style="background-image: url('{backgroundUrl}');"
		></div>
	{/if}

	<!-- Vignette Overlay -->
	<div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

	<!-- Audio Unlock Prompt Banner -->
	{#if !audioUnlocked}
		<div
			class="absolute top-16 left-1/2 z-40 -translate-x-1/2 rounded-full border border-[#9999FF]/40 bg-black/80 px-4 py-1.5 text-xs font-semibold text-[#9999FF] shadow-lg backdrop-blur-md"
		>
			🔊 Tap anywhere or press Space for audio
		</div>
	{/if}

	<!-- Top Menu Header -->
	<header class="relative z-30 mt-20 flex items-center justify-between p-3 md:p-6 landscape:p-2">
		<div class="relative">
			<!-- Menu Toggle Button (☰ Icon only) -->
			<button
				aria-label="Toggle Menu"
				onclick={(e) => {
					e.stopPropagation();
					isMenuOpen = !isMenuOpen;
				}}
				class="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-black/60 text-lg font-bold backdrop-blur-md transition hover:border-[#9999FF] active:scale-95"
			>
				☰
			</button>

			<!-- Menu Dropdown Container -->
			{#if isMenuOpen}
				<!-- Backdrop to close dropdown on outside tap for mobile -->
				<div
					role="none"
					class="fixed inset-0 z-40 bg-transparent"
					onclick={(e) => {
						e.stopPropagation();
						isMenuOpen = false;
					}}
				></div>

				<div
					role="none"
					onclick={(e) => e.stopPropagation()}
					class="absolute top-12 left-0 z-50 max-h-[80vh] w-[calc(100vw-2rem)] max-w-xs space-y-4 overflow-y-auto rounded-2xl border border-white/15 bg-black/95 p-4 shadow-2xl backdrop-blur-xl sm:w-80"
				>
					<div>
						<span class="text-[10px] font-black tracking-widest text-white/40 uppercase"
							>Script Source</span
						>
						<div class="mt-2 flex gap-2">
							<input
								type="file"
								accept=".json"
								bind:this={fileInputRef}
								onchange={handleFileUpload}
								class="hidden"
							/>
							<button
								onclick={() => fileInputRef?.click()}
								class="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold tracking-wider text-white uppercase hover:border-[#9999FF] hover:bg-[#9999FF]/10 active:scale-95"
							>
								Load JSON File
							</button>
							<button
								onclick={loadDefaultScript}
								class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 active:scale-95"
							>
								Reset
							</button>
						</div>
					</div>

					<!-- Audio Mute Toggles -->
					<div class="border-t border-white/10 pt-3">
						<span class="text-[10px] font-black tracking-widest text-white/40 uppercase"
							>Audio Settings</span
						>
						<div class="mt-2 grid grid-cols-2 gap-2">
							<button
								onclick={() => (isMusicMuted = !isMusicMuted)}
								class="rounded-xl border p-2 text-xs font-bold uppercase transition active:scale-95 {isMusicMuted
									? 'border-red-500/50 bg-red-500/10 text-red-400'
									: 'border-white/10 bg-white/5 text-white/80'}"
							>
								Music: {isMusicMuted ? 'Muted' : 'ON'}
							</button>
							<button
								onclick={() => (isSfxMuted = !isSfxMuted)}
								class="rounded-xl border p-2 text-xs font-bold uppercase transition active:scale-95 {isSfxMuted
									? 'border-red-500/50 bg-red-500/10 text-red-400'
									: 'border-white/10 bg-white/5 text-white/80'}"
							>
								SFX: {isSfxMuted ? 'Muted' : 'ON'}
							</button>
						</div>
					</div>

					<!-- Auto Play Controls -->
					<div class="border-t border-white/10 pt-3">
						<span class="text-[10px] font-black tracking-widest text-white/40 uppercase"
							>Playback Controls</span
						>
						<div class="mt-2 flex items-center justify-between">
							<span class="text-xs font-medium text-white/80">Auto Play</span>
							<button
								onclick={toggleAutoPlay}
								class="rounded-xl border px-3 py-1 text-xs font-bold uppercase backdrop-blur-md transition active:scale-95 {isAutoPlay
									? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
									: 'border-white/15 bg-white/5 text-white/70'}"
							>
								{isAutoPlay ? 'ON' : 'OFF'}
							</button>
						</div>
						<div class="mt-3 space-y-2">
							<label class="block text-[11px] text-white/60">
								Typewriter Speed: <strong class="text-white">{textSpeed}ms</strong>
								<input
									type="range"
									min="0"
									max="100"
									bind:value={textSpeed}
									class="w-full accent-[#9999FF]"
								/>
							</label>
							<label class="block text-[11px] text-white/60">
								Auto Delay: <strong class="text-white">{autoDelay}ms</strong>
								<input
									type="range"
									min="1000"
									max="10000"
									step="200"
									bind:value={autoDelay}
									class="w-full accent-[#9999FF]"
								/>
							</label>
						</div>
					</div>

					<!-- Script Node Jump -->
					<div class="border-t border-white/10 pt-3">
						<span class="text-[10px] font-black tracking-widest text-white/40 uppercase"
							>Script Node Jump</span
						>
						<p class="mt-1 text-[11px] text-white/60">
							Current Node: <strong class="text-[#9999FF]">{currentIndex + 1}</strong>
						</p>
						<div class="mt-2 flex gap-2">
							<input
								type="number"
								placeholder="Node #"
								bind:value={saveCodeInput}
								min="1"
								max={gameData.script.length}
								class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white focus:border-[#9999FF] focus:outline-none"
							/>
							<button
								onclick={loadFromSaveCode}
								class="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 uppercase hover:bg-emerald-500/30 active:scale-95"
							>
								Jump
							</button>
						</div>
					</div>

					<!-- Documentation Button -->
					<div class="border-t border-white/10 pt-3">
						<button
							onclick={() => {
								isDocsOpen = true;
								isMenuOpen = false;
							}}
							class="w-full rounded-xl border border-[#9999FF]/40 bg-[#9999FF]/10 py-2.5 text-xs font-bold tracking-wider text-[#9999FF] uppercase transition hover:bg-[#9999FF]/20 active:scale-95"
						>
							📖 View Documentation
						</button>
					</div>
				</div>
			{/if}
		</div>
	</header>

	<!-- Documentation Modal -->
	{#if isDocsOpen}
		<div
			role="none"
			onclick={(e) => e.stopPropagation()}
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md md:p-6"
		>
			<div
				class="flex h-full max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-zinc-950 shadow-2xl"
			>
				<div class="flex items-center justify-between border-b border-white/10 p-3 md:p-4">
					<h3 class="text-sm font-bold tracking-wider text-[#9999FF] uppercase md:text-base">
						📖 Avero Games Documentation
					</h3>
					<button
						onclick={() => (isDocsOpen = false)}
						class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10 active:scale-95"
					>
						✕ Close
					</button>
				</div>
				<div class="relative w-full flex-1 bg-white">
					<iframe
						title="Tutorial Source"
						srcdoc={`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 1.5rem;
            background-color: #0d1117;
            color: #c9d1d9;
            font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
            font-size: 0.9rem;
            line-height: 1.6;
          }
          pre {
            margin: 0;
            white-space: pre-wrap;     /* Wraps long lines nicely */
            word-break: break-word;    /* Avoids horizontal scrollbars */
            tab-size: 2;
          }
        </style>
      </head>
      <body>
        <pre><code>${tutorial.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </body>
    </html>
  `}
						style="width: 100%; height: 500px; border: 1px solid #30363d; border-radius: 8px;"
					></iframe>
				</div>
			</div>
		</div>
	{/if}

	<!-- Middle Stage: Sprites Layer -->
	<div
		class="pointer-events-none relative z-20 flex flex-1 items-end justify-between px-4 pb-2 md:px-12 md:pb-4 landscape:px-12"
	>
		{#if currentNode?.sprites && currentNode.sprites.length > 0}
			{#each currentNode.sprites as placement (placement.id)}
				{@const charData = gameData.characters[placement.id]}
				{#if charData && charData.sprite && gameData.sprites && gameData.sprites[charData.sprite]}
					{@const spriteImageUrl = gameData.sprites[charData.sprite]}
					<div
						class="absolute bottom-16 flex h-48 w-32 items-end justify-center transition-all duration-500 sm:h-64 sm:w-44 md:bottom-28 md:h-96 md:w-64 landscape:bottom-12 landscape:h-56 landscape:w-40
						{placement.position === 'left' ? 'left-2 sm:left-4 landscape:left-8' : ''}
						{placement.position === 'left-center' ? 'left-[16%] -translate-x-1/2' : ''}
						{placement.position === 'center-left' ? 'left-[33%] -translate-x-1/2' : ''}
						{placement.position === 'center' ? 'left-1/2 -translate-x-1/2' : ''}
						{placement.position === 'center-right' ? 'left-[66%] -translate-x-1/2' : ''}
						{placement.position === 'right-center' ? 'left-[83%] -translate-x-1/2' : ''}
						{placement.position === 'right' ? 'right-2 sm:right-4 landscape:right-8' : ''}"
					>
						<img
							src={spriteImageUrl}
							alt={charData.name}
							class="max-h-full max-w-full object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)]"
						/>
					</div>
				{/if}
			{/each}
		{/if}
	</div>

	<!-- Bottom Dialogue Frame Box -->
	{#if currentNode?.text !== undefined && currentNode.text.length > 0}
		<div class="relative z-30 p-2 pb-4 md:p-6 landscape:p-2 landscape:pb-2">
			<div class="mx-auto max-w-5xl space-y-2">
				{#if currentSpeaker}
					<div
						class="inline-flex items-center gap-2 rounded-xl border border-[#9999FF]/30 bg-black/80 px-3 py-1 backdrop-blur-md"
					>
						<span class="text-xs">{currentSpeaker.avatar}</span>
						<span
							class="text-[10px] font-black tracking-widest text-[#9999FF] uppercase md:text-xs"
						>
							{currentSpeaker.name}
						</span>
					</div>
				{/if}

				<div
					class="w-full rounded-2xl border border-white/15 bg-black/85 p-3 text-left shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition duration-300 md:p-6"
				>
					<p
						class="min-h-10 text-xs leading-relaxed font-medium text-zinc-100 sm:text-sm md:min-h-16 md:text-lg landscape:min-h-8"
					>
						{#each parseMarkdownTokens(displayedText) as token (token.text)}
							{#if token.type === 'bold'}
								<strong class="font-bold text-[#9999FF]">{token.text}</strong>
							{:else if token.type === 'italic'}
								<em class="text-amber-200 italic">{token.text}</em>
							{:else if token.type === 'code'}
								<code class="rounded bg-white/10 px-1 py-0.5 font-mono text-xs text-emerald-300"
									>{token.text}</code
								>
							{:else}
								<span>{token.text}</span>
							{/if}
						{/each}
						{#if isTyping}
							<span class="inline-block h-3.5 w-1 animate-pulse bg-[#9999FF]"></span>
						{/if}
					</p>
					<div class="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
						<span
							class="font-mono text-[9px] tracking-widest text-[#9999FF] uppercase md:text-[10px]"
						>
							Node: [{currentIndex + 1}]
						</span>
						<span
							class="font-mono text-[9px] tracking-widest text-white/40 uppercase md:text-[10px]"
						>
							{isTyping ? 'Tap to finish' : 'Tap to continue →'}
						</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
