<script lang="ts">
	import { CryptoState } from './cryptoState.svelte';

	// Renamed to avoid Svelte 5 store macro name collisions ($state vs $cryptoCtx)
	const cryptoCtx = new CryptoState();

	// Svelte 5 bind:this elements are plain variable bindings, not reactive runes
	let nativeFileInputNode = $state<HTMLInputElement | undefined>(undefined);

	function onFileSelected(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			cryptoCtx.fileInput = target.files[0];
			cryptoCtx.textOutput = '';
		}
	}

	function onFileDrop(e: DragEvent) {
		cryptoCtx.isDragging = false;
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			cryptoCtx.fileInput = e.dataTransfer.files[0];
			cryptoCtx.textOutput = '';
		}
	}
</script>

<div
	class="flex h-screen w-screen flex-col overflow-hidden bg-black font-sans tracking-tight text-gray-100 select-none"
>
	<!-- Pipeline Execution Navigation Bar -->
	<header
		class="z-10 flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-black px-4"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex cursor-pointer items-center space-x-2"
			onclick={() => cryptoCtx.resetWorkspace()}
		>
			<span class="text-xl">🔐</span>
			<h1 class="text-lg font-bold tracking-tight text-white">
				Avero <span class="text-[#9999FF]">Encrypt</span>
			</h1>
		</div>
		<div
			class="flex items-center space-x-2 rounded-full border border-white/5 bg-white/2 px-3 py-1 font-mono text-[10px] text-white/40 sm:text-xs"
		>
			<div class="relative flex h-1.5 w-1.5">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
				></span>
				<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
			</div>
			<span>Engine:</span>
			<span class="font-bold text-[#9999FF]">Web Crypto API</span>
		</div>
	</header>

	<main class="relative flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
		<!-- Left Panel: Configurations & Actions -->
		<div
			class="order-1 flex w-full flex-col justify-between border-b border-white/5 bg-black p-4 sm:p-6 md:w-5/12 md:border-r md:border-b-0"
		>
			<div class="space-y-6">
				<div>
					<label
						class="mb-2 block font-mono text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
						for="pipeline-mode">Operation Pipeline Mode</label
					>
					<div
						id="pipeline-mode"
						class="grid grid-cols-2 rounded-xl border border-white/5 bg-white/1 p-1"
					>
						<button
							onclick={() => cryptoCtx.setOperationMode('encrypt')}
							class="rounded-lg py-2.5 font-mono text-xs font-semibold tracking-tight transition duration-300 {cryptoCtx.operationMode ===
							'encrypt'
								? 'bg-[#9999FF] font-bold text-black shadow-[0_0_20px_rgba(153,153,255,0.2)]'
								: 'text-white/40 hover:text-white/80'}"
						>
							🔒 ENCRYPT
						</button>
						<button
							onclick={() => cryptoCtx.setOperationMode('decrypt')}
							class="rounded-lg py-2.5 font-mono text-xs font-semibold tracking-tight transition duration-300 {cryptoCtx.operationMode ===
							'decrypt'
								? 'bg-white/10 font-bold text-white shadow-md'
								: 'text-white/40 hover:text-white/80'}"
						>
							🔓 DECRYPT
						</button>
					</div>
				</div>

				<div>
					<label
						class="mb-2 block font-mono text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
						for="payload-target">Data Payload Target</label
					>
					<div
						id="payload-target"
						class="grid grid-cols-2 rounded-xl border border-white/5 bg-white/1 p-1"
					>
						<button
							onclick={() => cryptoCtx.setPayloadType('text')}
							class="rounded-lg py-2 text-xs font-medium transition duration-300 {cryptoCtx.payloadType ===
							'text'
								? 'border border-[#9999FF]/20 bg-white/4 text-white shadow-[0_0_15px_rgba(153,153,255,0.05)]'
								: 'text-white/30 hover:text-white/60'}"
						>
							📝 Plain Text
						</button>
						<button
							onclick={() => cryptoCtx.setPayloadType('file')}
							class="rounded-lg py-2 text-xs font-medium transition duration-300 {cryptoCtx.payloadType ===
							'file'
								? 'border border-[#9999FF]/20 bg-white/4 text-white shadow-[0_0_15px_rgba(153,153,255,0.05)]'
								: 'text-white/30 hover:text-white/60'}"
						>
							📁 File Node
						</button>
					</div>
				</div>

				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<label
							class="font-mono text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
							for="passphrase-input">Secret Passphrase Key</label
						>
						<button
							onclick={() => (cryptoCtx.showPassword = !cryptoCtx.showPassword)}
							class="font-mono text-[10px] text-white/40 transition duration-200 hover:text-[#9999FF]"
						>
							{cryptoCtx.showPassword ? 'Hide Key' : 'Reveal Key'}
						</button>
					</div>
					<div class="relative w-full">
						<input
							id="passphrase-input"
							type={cryptoCtx.showPassword ? 'text' : 'password'}
							bind:value={cryptoCtx.passphrase}
							autocorrect="off"
							autocapitalize="off"
							spellcheck="false"
							placeholder="Enter cryptographic secret string..."
							class="w-full rounded-[20px] border border-white/10 bg-white/3 py-3.5 pr-12 pl-6 font-mono text-sm text-white placeholder-white/20 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
						/>
						<span class="absolute top-4 right-5 text-xs opacity-30">🔑</span>
					</div>
				</div>
			</div>

			<div class="mt-8 border-t border-white/5 pt-4">
				<button
					onclick={() => cryptoCtx.processCryptographicPayload()}
					disabled={cryptoCtx.isProcessing || !cryptoCtx.passphrase}
					class="flex w-full items-center justify-center space-x-2 rounded-xl py-3.5 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300
								 {!cryptoCtx.passphrase
						? 'cursor-not-allowed border border-white/5 bg-white/2 text-white/20'
						: 'bg-[#9999FF] text-black shadow-[0_4px_20px_rgba(153,153,255,0.15)] hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]'}"
				>
					{#if cryptoCtx.isProcessing}
						<span
							class="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
						></span>
					{:else}
						<span
							>{cryptoCtx.operationMode === 'encrypt'
								? '🔒 Run Encryption Array'
								: '🔓 Run Decryption Array'}</span
						>
					{/if}
				</button>
			</div>
		</div>

		<!-- Right Panel: Data Processing View Deck -->
		<div
			class="custom-scrollbar order-2 flex h-auto w-full flex-col overflow-y-auto bg-zinc-950 p-4 sm:p-6 md:h-full md:w-7/12"
		>
			<div class="flex min-h-0 flex-1 flex-col space-y-4">
				<div class="flex shrink-0 items-center justify-between">
					<h2 class="font-mono text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
						Input Target Pipeline Data Source
					</h2>
					{#if cryptoCtx.hasInputContent}
						<button
							onclick={() => cryptoCtx.clearInputSource()}
							class="font-mono text-[10px] text-white/40 transition hover:text-red-400"
						>
							✕ Clear Input
						</button>
					{/if}
				</div>

				{#if cryptoCtx.payloadType === 'text'}
					<div class="flex min-h-50 flex-1 flex-col md:min-h-0">
						<textarea
							bind:value={cryptoCtx.textInput}
							autocapitalize="off"
							spellcheck="false"
							placeholder={cryptoCtx.operationMode === 'encrypt'
								? 'Enter raw text strings to encode into unreadable secure text arrays...'
								: 'Paste Base64 encoded cypher block output text array here to decode...'}
							class="custom-scrollbar min-h-45 w-full flex-1 resize-none rounded-2xl border border-white/10 bg-black p-4 font-mono text-xs leading-relaxed text-white/70 placeholder-white/20 transition duration-300 outline-none select-text focus:border-[#9999FF]/30 md:min-h-0"
						></textarea>
					</div>
				{:else}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="flex min-h-50 flex-1 flex-col md:min-h-0">
						<div
							ondragover={(e) => {
								e.preventDefault();
								cryptoCtx.isDragging = true;
							}}
							ondragleave={() => (cryptoCtx.isDragging = false)}
							ondrop={(e) => {
								e.preventDefault();
								onFileDrop(e);
							}}
							onclick={() => nativeFileInputNode?.click()}
							class="flex min-h-45 flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-black p-6 text-center transition duration-300 md:min-h-0
									  {cryptoCtx.isDragging
								? 'border-[#9999FF] bg-[#9999FF]/5'
								: 'border-white/10 hover:border-[#9999FF]/30'}"
						>
							<input
								type="file"
								bind:this={nativeFileInputNode}
								class="hidden"
								onchange={onFileSelected}
							/>

							{#if !cryptoCtx.fileInput}
								<div
									class="pointer-events-none space-y-2 opacity-30 transition group-hover:opacity-100"
								>
									<span class="block text-3xl">📦</span>
									<p class="font-mono text-xs font-medium text-white/80">
										Drag & drop raw local data object node here
									</p>
									<p class="text-[10px] text-white/40">
										or click to manually map system directory path index
									</p>
								</div>
							{:else}
								<div
									class="max-w-sm space-y-3 rounded-xl border border-[#9999FF]/20 bg-white/2 p-4 shadow-md backdrop-blur-md"
								>
									<span class="block text-2xl">📄</span>
									<div class="text-left font-mono">
										<p class="max-w-60 truncate text-xs font-bold text-white">
											{cryptoCtx.fileInput.name}
										</p>
										<p class="mt-0.5 text-[10px] text-white/40">
											Payload Size: {cryptoCtx.formatBytes(cryptoCtx.fileInput.size)}
										</p>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			{#if cryptoCtx.textOutput || cryptoCtx.statusMessage}
				<div
					class="mt-6 flex shrink-0 flex-col space-y-3 border-t border-white/5 pt-6 transition-all duration-500"
				>
					<div class="flex items-center justify-between">
						<h3 class="font-mono text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
							Operational Output Node Stream
						</h3>
						<div class="flex items-center space-x-2">
							{#if cryptoCtx.statusMessage}
								<span class="font-mono text-[10px] text-[#9999FF]/70"
									>{cryptoCtx.statusMessage}</span
								>
							{/if}
							{#if cryptoCtx.textOutput}
								<button
									onclick={() => cryptoCtx.copyToClipboard()}
									class="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/60 transition duration-200 hover:border-[#9999FF]/30 hover:text-white"
								>
									📋 Copy Text Data
								</button>
							{/if}
						</div>
					</div>

					{#if cryptoCtx.textOutput}
						<div
							class="custom-scrollbar max-h-37.5 w-full overflow-y-auto rounded-xl border border-white/10 bg-black p-4 shadow-[0_0_20px_rgba(153,153,255,0.02)]"
						>
							<p class="font-mono text-xs leading-relaxed break-all text-white/70 select-text">
								{cryptoCtx.textOutput}
							</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	:global(.custom-scrollbar::-webkit-scrollbar) {
		width: 5px;
		height: 5px;
	}
	:global(.custom-scrollbar::-webkit-scrollbar-track) {
		background: transparent;
	}
	:global(.custom-scrollbar::-webkit-scrollbar-thumb) {
		background: rgba(255, 255, 255, 0.08);
		border-radius: 99px;
	}
	:global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
		background: rgba(153, 153, 255, 0.3);
	}
</style>
