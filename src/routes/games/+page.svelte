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
			'left' | 'left-center' | 'center-left' | 'center' | 'center-right' | 'right-center' | 'right';
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

	// Dynamic Sprite Sizing Calculations (Percentage based on total sprites)
	let activeSprites = $derived(currentNode?.sprites || []);
	let spriteCount = $derived(activeSprites.length);

	let dynamicSpriteStyle = $derived.by(() => {
		if (spriteCount <= 2) return 'height: 60%; max-width: 25%;';
		if (spriteCount <= 4) return 'height: 50%; max-width: 20%;';
		return 'height: 42%; max-width: 15%;';
	});

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

<!-- Viewport Outer Bounds (Forces dynamic 100dvh to eliminate browser toolbar jumping) -->
<div
	class="h-dvh00dvw] fixed inset-0 flex items-center justify-center overflow-hidden bg-black font-sans text-white select-none"
>
	<!-- Portrait Mobile Warning Overlay -->
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 text-center sm:hidden landscape:hidden"
	>
		<div class="text-4xl">🔄</div>
		<h2 class="mt-4 text-xl font-bold text-[#9999FF]">Please Rotate Your Device</h2>
		<p class="mt-2 text-sm text-zinc-400">
			This game requires landscape orientation to fit the stage box on screen.
		</p>
	</div>

	<!-- 2000x1000 Aspect-Ratio Locked Container -->
	<!-- Container Query Container (cqw / cqh) ensures text/padding scales seamlessly -->
	<div
		role="button"
		tabindex="0"
		onclick={advanceNode}
		onkeydown={handleKeyDown}
		class="@container-size relative flex aspect-2/1 h-full max-h-dvh w-full max-w-dvw flex-col justify-between overflow-hidden bg-black focus:outline-none"
		style="max-width: calc(100dvh * 2); max-height: calc(100dvw / 2);"
	>
		<!-- Video / Background Layer -->
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
				class="absolute top-[5cqh] left-1/2 z-40 -translate-x-1/2 rounded-full border border-[#9999FF]/40 bg-black/80 px-[2cqw] py-[0.8cqh] text-[1.4cqw] font-semibold text-[#9999FF] shadow-lg backdrop-blur-md"
			>
				🔊 Tap anywhere or press Space for audio
			</div>
		{/if}

		<!-- Top Menu Header -->
		<header class="relative z-30 flex items-center justify-between p-[2cqw]">
			<div class="relative">
				<!-- Menu Toggle Button -->
				<button
					aria-label="Toggle Menu"
					onclick={(e) => {
						e.stopPropagation();
						isMenuOpen = !isMenuOpen;
					}}
					class="flex h-[4cqw] min-h-8 w-[4cqw] min-w-8 items-center justify-center rounded-2xl border border-white/15 bg-black/60 text-[2cqw] font-bold backdrop-blur-md transition hover:border-[#9999FF] active:scale-95"
				>
					☰
				</button>

				<!-- Menu Dropdown Container -->
				{#if isMenuOpen}
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
						class="absolute top-[5cqw] left-0 z-50 w-[24cqw] min-w-64 space-y-4 rounded-2xl border border-white/15 bg-black/95 p-4 shadow-2xl backdrop-blur-xl"
					>
						<div>
							<span class="text-[0.8cqw] font-black tracking-widest text-white/40 uppercase"
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
									class="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-[0.9cqw] font-bold tracking-wider text-white uppercase hover:border-[#9999FF] hover:bg-[#9999FF]/10 active:scale-95"
								>
									Load JSON File
								</button>
								<button
									onclick={loadDefaultScript}
									class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[0.9cqw] font-bold text-white/70 hover:bg-white/10 active:scale-95"
								>
									Reset
								</button>
							</div>
						</div>

						<!-- Audio Mute Toggles -->
						<div class="border-t border-white/10 pt-3">
							<span class="text-[0.8cqw] font-black tracking-widest text-white/40 uppercase"
								>Audio Settings</span
							>
							<div class="mt-2 grid grid-cols-2 gap-2">
								<button
									onclick={() => (isMusicMuted = !isMusicMuted)}
									class="rounded-xl border p-2 text-[0.8cqw] font-bold uppercase transition active:scale-95 {isMusicMuted
										? 'border-red-500/50 bg-red-500/10 text-red-400'
										: 'border-white/10 bg-white/5 text-white/80'}"
								>
									Music: {isMusicMuted ? 'Muted' : 'ON'}
								</button>
								<button
									onclick={() => (isSfxMuted = !isSfxMuted)}
									class="rounded-xl border p-2 text-[0.8cqw] font-bold uppercase transition active:scale-95 {isSfxMuted
										? 'border-red-500/50 bg-red-500/10 text-red-400'
										: 'border-white/10 bg-white/5 text-white/80'}"
								>
									SFX: {isSfxMuted ? 'Muted' : 'ON'}
								</button>
							</div>
						</div>

						<!-- Auto Play Controls -->
						<div class="border-t border-white/10 pt-3">
							<span class="text-[0.8cqw] font-black tracking-widest text-white/40 uppercase"
								>Playback Controls</span
							>
							<div class="mt-2 flex items-center justify-between">
								<span class="text-[0.9cqw] font-medium text-white/80">Auto Play</span>
								<button
									onclick={toggleAutoPlay}
									class="rounded-xl border px-3 py-1 text-[0.8cqw] font-bold uppercase backdrop-blur-md transition active:scale-95 {isAutoPlay
										? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
										: 'border-white/15 bg-white/5 text-white/70'}"
								>
									{isAutoPlay ? 'ON' : 'OFF'}
								</button>
							</div>
							<div class="mt-3 space-y-2">
								<label class="block text-[0.8cqw] text-white/60">
									Typewriter Speed: <strong class="text-white">{textSpeed}ms</strong>
									<input
										type="range"
										min="0"
										max="100"
										bind:value={textSpeed}
										class="w-full accent-[#9999FF]"
									/>
								</label>
								<label class="block text-[0.8cqw] text-white/60">
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
							<span class="text-[0.8cqw] font-black tracking-widest text-white/40 uppercase"
								>Script Node Jump</span
							>
							<p class="mt-1 text-[0.8cqw] text-white/60">
								Current Node: <strong class="text-[#9999FF]">{currentIndex + 1}</strong>
							</p>
							<div class="mt-2 flex gap-2">
								<input
									type="number"
									placeholder="Node #"
									bind:value={saveCodeInput}
									min="1"
									max={gameData.script.length}
									class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[0.8cqw] text-white focus:border-[#9999FF] focus:outline-none"
								/>
								<button
									onclick={loadFromSaveCode}
									class="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-[0.8cqw] font-bold text-emerald-300 uppercase hover:bg-emerald-500/30 active:scale-95"
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
								class="w-full rounded-xl border border-[#9999FF]/40 bg-[#9999FF]/10 py-2.5 text-[0.8cqw] font-bold tracking-wider text-[#9999FF] uppercase transition hover:bg-[#9999FF]/20 active:scale-95"
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
				class="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-[4cqw] backdrop-blur-md"
			>
				<div
					class="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-zinc-950 shadow-2xl"
				>
					<div class="flex items-center justify-between border-b border-white/10 p-[1.5cqw]">
						<h3 class="text-[1.2cqw] font-bold tracking-wider text-[#9999FF] uppercase">
							📖 Avero Games Documentation
						</h3>
						<button
							onclick={() => (isDocsOpen = false)}
							class="rounded-xl border border-white/10 bg-white/5 px-[1.5cqw] py-[0.5cqw] text-[1cqw] font-bold text-white/80 hover:bg-white/10 active:scale-95"
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
						white-space: pre-wrap;
						word-break: break-word;
						tab-size: 2;
					}
				</style>
			</head>
			<body>
				<pre><code>${tutorial.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
			</body>
		</html>
	`}
							style="width: 100%; height: 100%; border: none;"
						></iframe>
					</div>
				</div>
			</div>
		{/if}

		<!-- Middle Stage: Sprites Layer -->
		<div
			class="pointer-events-none relative z-20 flex flex-1 items-end justify-between px-[4cqw] pb-[16cqh]"
		>
			{#if currentNode?.sprites && currentNode.sprites.length > 0}
				{#each currentNode.sprites as placement (placement.id)}
					{@const charData = gameData.characters[placement.id]}
					{#if charData && charData.sprite && gameData.sprites && gameData.sprites[charData.sprite]}
						{@const spriteImageUrl = gameData.sprites[charData.sprite]}
						<div
							style={dynamicSpriteStyle}
							class="absolute bottom-0 flex w-full items-end justify-center transition-all duration-500
							{placement.position === 'left' ? 'left-[4cqw]' : ''}
							{placement.position === 'left-center' ? 'left-[18%] -translate-x-1/2' : ''}
							{placement.position === 'center-left' ? 'left-[33%] -translate-x-1/2' : ''}
							{placement.position === 'center' ? 'left-1/2 -translate-x-1/2' : ''}
							{placement.position === 'center-right' ? 'left-[66%] -translate-x-1/2' : ''}
							{placement.position === 'right-center' ? 'left-[82%] -translate-x-1/2' : ''}
							{placement.position === 'right' ? 'right-[4cqw]' : ''}"
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

		<!-- Bottom Dialogue Frame Box (Locked inside 2000x1000 viewport area) -->
		{#if currentNode?.text !== undefined && currentNode.text.length > 0}
			<div class="relative z-30 p-[2cqw] pb-[2cqw]">
				<div class="mx-auto max-w-full space-y-[1cqh]">
					{#if currentSpeaker}
						<div
							class="inline-flex items-center gap-[0.5cqw] rounded-xl border border-[#9999FF]/30 bg-black/80 px-[1.2cqw] py-[0.4cqh] backdrop-blur-md"
						>
							<span class="text-[1.2cqw]">{currentSpeaker.avatar}</span>
							<span class="text-[1cqw] font-black tracking-widest text-[#9999FF] uppercase">
								{currentSpeaker.name}
							</span>
						</div>
					{/if}

					<div
						class="w-full rounded-2xl border border-white/15 bg-black/85 p-[2cqw] text-left shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition duration-300"
					>
						<p class="min-h-[5cqh] text-[1.5cqw] leading-relaxed font-medium text-zinc-100">
							{#each parseMarkdownTokens(displayedText) as token (token.text)}
								{#if token.type === 'bold'}
									<strong class="font-bold text-[#9999FF]">{token.text}</strong>
								{:else if token.type === 'italic'}
									<em class="text-amber-200 italic">{token.text}</em>
								{:else if token.type === 'code'}
									<code
										class="rounded bg-white/10 px-1 py-0.5 font-mono text-[1.2cqw] text-emerald-300"
										>{token.text}</code
									>
								{:else}
									<span>{token.text}</span>
								{/if}
							{/each}
							{#if isTyping}
								<span class="inline-block h-[1.5cqw] w-1 animate-pulse bg-[#9999FF]"></span>
							{/if}
						</p>
						<div
							class="mt-[1cqh] flex items-center justify-between border-t border-white/5 pt-[0.8cqh]"
						>
							<span class="font-mono text-[0.8cqw] tracking-widest text-[#9999FF] uppercase">
								Node: [{currentIndex + 1}]
							</span>
							<span class="font-mono text-[0.8cqw] tracking-widest text-white/40 uppercase">
								{isTyping ? 'Tap to finish' : 'Tap to continue →'}
							</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
