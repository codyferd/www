<script lang="ts">
	import { downloadQRCode, generateQRDataUrl } from './qrGenerator';
	import type { CorrectionLevel } from './types';

	let text = $state('');
	let size = $state(256);
	let level = $state<CorrectionLevel>('H');
	let qrDataUrl = $state('');
	let isGenerating = $state(false);

	$effect(() => {
		const currentText = text;
		const currentSize = size;
		const currentLevel = level;

		if (!currentText.trim()) {
			qrDataUrl = '';
			return;
		}

		isGenerating = true;
		generateQRDataUrl(currentText, currentSize, currentLevel)
			.then((url) => {
				qrDataUrl = url;
			})
			.finally(() => {
				isGenerating = false;
			});
	});

	function handleDownload() {
		if (!qrDataUrl) return;
		downloadQRCode(qrDataUrl, `avero-qr-${Date.now()}.png`);
	}
</script>

<div
	class="flex h-screen w-screen flex-col overflow-hidden bg-black font-sans text-white select-none"
>
	<!-- Header -->
	<header
		class="z-20 flex items-center justify-between border-b border-white/10 bg-black/80 px-6 py-3.5 backdrop-blur-xl"
	>
		<div class="flex items-center gap-3">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9999FF] text-xs font-black text-black"
			>
				QR
			</div>
			<h1 class="text-xs font-black tracking-widest uppercase">Avero QR</h1>
			<span
				class="rounded-lg border border-[#9999FF]/20 bg-[#9999FF]/10 px-2 py-0.5 font-mono text-[10px] text-[#9999FF]"
			>
				v1.0
			</span>
		</div>

		<button
			onclick={handleDownload}
			disabled={!qrDataUrl || isGenerating}
			class="rounded-xl bg-[#9999FF] px-5 py-2.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none"
		>
			Download PNG
		</button>
	</header>

	<main class="flex flex-1 flex-col overflow-hidden md:flex-row">
		<!-- Controls Panel -->
		<aside
			class="flex w-full flex-col gap-6 border-b border-white/5 bg-black/90 p-6 backdrop-blur-xl md:w-80 md:border-r md:border-b-0"
		>
			<div>
				<label
					for="qr-content"
					class="mb-3 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
				>
					Content
				</label>
				<textarea
					id="qr-content"
					bind:value={text}
					placeholder="Paste URL or text here..."
					class="h-36 w-full resize-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent rounded-2xl border border-white/10 bg-white/3 p-4 text-xs text-white placeholder-white/30 transition-all duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
				></textarea>
			</div>

			<div class="space-y-4">
				<span class="block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
					Settings
				</span>

				<div
					class="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 p-3.5 transition duration-300 hover:border-[#9999FF]/20"
				>
					<label for="qr-size" class="text-xs font-medium text-white/70">Size</label>
					<select
						id="qr-size"
						bind:value={size}
						class="bg-transparent font-mono text-xs font-bold text-[#9999FF] outline-none"
					>
						<option value={128} class="bg-black text-white">128px</option>
						<option value={256} class="bg-black text-white">256px</option>
						<option value={512} class="bg-black text-white">512px</option>
					</select>
				</div>

				<div
					class="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 p-3.5 transition duration-300 hover:border-[#9999FF]/20"
				>
					<label for="qr-level" class="text-xs font-medium text-white/70">Correction</label>
					<select
						id="qr-level"
						bind:value={level}
						class="bg-transparent font-mono text-xs font-bold text-[#9999FF] outline-none"
					>
						<option value="L" class="bg-black text-white">Low (7%)</option>
						<option value="M" class="bg-black text-white">Medium (15%)</option>
						<option value="Q" class="bg-black text-white">Quartile (25%)</option>
						<option value="H" class="bg-black text-white">High (30%)</option>
					</select>
				</div>
			</div>
		</aside>

		<!-- Preview Canvas Area -->
		<div class="relative flex flex-1 items-center justify-center bg-black p-8">
			{#if !text.trim()}
				<div class="flex flex-col items-center gap-3 text-center opacity-30">
					<span class="text-5xl">🔳</span>
					<p class="text-[10px] font-black tracking-[0.25em] text-white uppercase">
						Awaiting Input
					</p>
				</div>
			{:else if qrDataUrl}
				<div
					class="rounded-[28px] border border-white/10 bg-white p-6 shadow-[0_0_50px_rgba(153,153,255,0.2)] transition-all duration-500 hover:scale-105"
				>
					<img
						src={qrDataUrl}
						alt="Generated QR Code"
						class="animate-in fade-in zoom-in block h-auto max-w-full rounded-xl duration-300"
					/>
				</div>
			{/if}
		</div>
	</main>

	<!-- Footer -->
	<footer
		class="flex items-center justify-between border-t border-white/5 bg-black px-6 py-2.5 text-[10px] font-bold text-white/40"
	>
		<div class="flex items-center gap-2">
			<span class="h-2 w-2 animate-ping rounded-full bg-emerald-500"></span>
			<span>Avero Creative Engine</span>
		</div>
		<span class="font-mono tracking-wider uppercase">Pitch Black & Lavender</span>
	</footer>
</div>
