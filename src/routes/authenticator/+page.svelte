<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { computeVerificationToken, type AuthenticatorToken } from './totp';
	import TokenCard from './TokenCard.svelte';

	let authenticatorVault = $state<AuthenticatorToken[]>([]);
	let newKeyForm = $state({ issuer: '', secret: '' });
	let isPresentationMode = $state(false);
	let globalCountdownTime = $state(30);

	let fileInputBridge = $state<HTMLInputElement | null>(null);
	let operationalTimeThread: ReturnType<typeof setInterval> | null = null;

	const computeAllActiveTokens = () => {
		authenticatorVault.forEach((token) => {
			token.liveCode = computeVerificationToken(token.secret);
		});
	};

	const initializeChronosLoop = () => {
		const synchronizeClockWindow = () => {
			const currentSeconds = new Date().getSeconds();
			globalCountdownTime = 30 - (currentSeconds % 30);
			if (globalCountdownTime === 30 || globalCountdownTime === 0) {
				computeAllActiveTokens();
			}
		};
		synchronizeClockWindow();
		computeAllActiveTokens();
		operationalTimeThread = setInterval(synchronizeClockWindow, 1000);
	};

	const globalKeyIntercept = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && isPresentationMode) isPresentationMode = false;
	};

	onMount(() => {
		initializeChronosLoop();
		window.addEventListener('keydown', globalKeyIntercept);
	});

	onDestroy(() => {
		if (operationalTimeThread) clearInterval(operationalTimeThread);
		window.removeEventListener('keydown', globalKeyIntercept);
	});

	const registerAuthenticatorToken = () => {
		if (!newKeyForm.secret) {
			alert('Validation Error: Token base string key parameter is mandatory.');
			return;
		}
		authenticatorVault.push({
			id: crypto.randomUUID(),
			issuer: newKeyForm.issuer.trim() || 'External Managed Node',
			secret: newKeyForm.secret.trim().toUpperCase().replace(/[\s-]/g, ''),
			liveCode: '000000'
		});
		newKeyForm.issuer = '';
		newKeyForm.secret = '';
		computeAllActiveTokens();
	};

	const purgeTokenVector = (index: number) => {
		if (
			confirm(
				'System Warning: Destroy connection array mapping to this profile vector permanently?'
			)
		) {
			authenticatorVault.splice(index, 1);
		}
	};

	const exportToDiskAsset = () => {
		const backup = {
			application: 'Avero Authenticator Secure Release',
			timestamp: new Date().toISOString(),
			vaultSchema: 'v2.1.0',
			vault: authenticatorVault.map((item) => ({
				issuer: item.issuer,
				secret: item.secret
			}))
		};

		const blob = new Blob([JSON.stringify(backup, null, 2)], {
			type: 'application/json;charset=utf-8;'
		});
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `avero-auth-backup-${Math.floor(Date.now() / 1000)}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleImportPayload = (event: Event) => {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const parsed = JSON.parse(content);
				if (parsed && Array.isArray(parsed.vault)) {
					authenticatorVault = parsed.vault.map((item: { issuer?: string; secret?: string }) => ({
						id: crypto.randomUUID(),
						issuer: item.issuer || 'Imported Node',
						secret: item.secret || '',
						liveCode: '000000'
					}));
					computeAllActiveTokens();
					alert('Import Successful: Authenticator vault has been updated.');
				} else {
					alert('Import Error: Invalid vault structure.');
				}
			} catch (err) {
				console.error('Avero Vault Decryption Fault:', err);
				alert('Import Error: Unable to parse the provided file.');
			}
		};
		reader.readAsText(file);
	};
</script>

<div
	class="flex h-screen w-screen flex-col overflow-hidden bg-black font-mono text-zinc-300 antialiased selection:bg-[#9999FF]/20 selection:text-[#9999FF] md:flex-row"
>
	<!-- Back Trigger Standard Logo Action -->

	{#if !isPresentationMode}
		<aside
			class="z-30 flex w-full shrink-0 flex-col space-y-6 overflow-y-auto border-b border-white/5 bg-black/40 p-6 pt-20 md:w-80 md:border-r md:border-b-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent"
		>
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<span
						class="h-2 w-2 animate-ping rounded-full bg-[#9999FF] shadow-[0_0_10px_rgba(153,153,255,0.8)]"
					></span>
					<h1 class="text-xs font-black tracking-[0.25em] text-white uppercase">AUTH_VAULT_NODE</h1>
				</div>
				<p class="text-[10px] tracking-[0.2em] text-white/40 uppercase">
					Secure Time-Step Protocol
				</p>
			</div>

			<hr class="border-white/5" />

			<div class="space-y-5">
				<div class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
					Provision New Token
				</div>

				<div class="space-y-2">
					<label
						for="issuer-input"
						class="block text-[10px] font-black tracking-wider text-white/60 uppercase"
						>Service / Issuer</label
					>
					<input
						id="issuer-input"
						type="text"
						bind:value={newKeyForm.issuer}
						placeholder="e.g. GitHub, Discord"
						class="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-xs text-white placeholder-white/20 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
					/>
				</div>

				<div class="space-y-2">
					<label
						for="secret-input"
						class="block text-[10px] font-black tracking-wider text-white/60 uppercase"
						>Base32 Secret Key</label
					>
					<input
						id="secret-input"
						type="text"
						bind:value={newKeyForm.secret}
						placeholder="PBRW E23T..."
						class="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-xs font-bold tracking-widest text-[#9999FF] uppercase placeholder-white/20 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
					/>
				</div>

				<button
					onclick={registerAuthenticatorToken}
					class="w-full rounded-xl bg-[#9999FF] px-6 py-3.5 text-[10px] font-black tracking-widest text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)] active:scale-95"
				>
					[ + Commit Key ]
				</button>
			</div>

			<div class="mt-auto space-y-4 rounded-2xl border border-white/5 bg-white/1 p-5">
				<div class="text-[10px] font-black tracking-[0.25em] text-white/30 uppercase">
					State Backup
				</div>
				<div class="grid grid-cols-1 gap-2.5">
					<button
						onclick={() => fileInputBridge?.click()}
						class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-[10px] font-black tracking-widest text-white/80 uppercase transition duration-300 hover:bg-white/10"
					>
						Import Matrix (.json)
					</button>
					<button
						onclick={exportToDiskAsset}
						class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#9999FF]/10 bg-[#9999FF]/10 py-3 text-[10px] font-black tracking-widest text-[#9999FF] uppercase transition duration-300 hover:bg-[#9999FF]/20"
					>
						Export Crypt (.json)
					</button>
				</div>
				<input
					type="file"
					bind:this={fileInputBridge}
					class="hidden"
					accept=".json"
					onchange={handleImportPayload}
				/>
			</div>

			<button
				onclick={() => (isPresentationMode = !isPresentationMode)}
				class="w-full cursor-pointer rounded-xl border border-dashed border-white/10 bg-transparent py-3 text-[10px] font-black tracking-widest text-white/30 uppercase transition duration-300 hover:bg-white/5 hover:text-white/60"
			>
				Enable Terminal View
			</button>
		</aside>
	{/if}

	<main
		class="h-full flex-1 space-y-8 overflow-y-auto bg-black p-6 pt-24 md:p-10 md:pt-10 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent"
	>
		{#if isPresentationMode}
			<div
				class="fixed top-6 right-6 z-50 flex items-center gap-4 rounded-[18px] border border-white/10 bg-black/90 px-4 py-2.5 shadow-[0_0_30px_rgba(153,153,255,0.15)] backdrop-blur-md"
			>
				<div
					class="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#9999FF] uppercase"
				>
					<span class="h-1.5 w-1.5 animate-ping rounded-full bg-[#9999FF]"></span>
					TERMINAL_ONLY_OUTPUT
				</div>
				<button
					onclick={() => (isPresentationMode = false)}
					class="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[9px] font-black text-white/60 uppercase transition hover:bg-white/10"
				>
					Unlock [ESC]
				</button>
			</div>
		{/if}

		<!-- Telemetry Header Row -->
		<div
			class="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl sm:flex-row sm:items-center"
		>
			<div>
				<div class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
					Workspace Monitor
				</div>
				<h2 class="mt-1 text-base font-black tracking-wider text-white uppercase italic">
					{isPresentationMode ? 'System Token Feed (Read-Only)' : 'Cryptographic Vector Deck'}
				</h2>
			</div>

			<div
				class="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/1 px-5 py-3 sm:w-auto sm:justify-start"
			>
				<div class="relative h-7 w-7">
					<svg class="h-full w-full -rotate-90 transform" viewBox="0 0 32 32">
						<circle
							cx="16"
							cy="16"
							r="13"
							stroke="rgba(255,255,255,0.01)"
							stroke-width="2"
							fill="transparent"
						/>
						<circle
							cx="16"
							cy="16"
							r="13"
							stroke={globalCountdownTime < 6 ? '#f43f5e' : '#9999FF'}
							stroke-width="2.5"
							fill="transparent"
							stroke-dasharray="81.68"
							stroke-dashoffset={81.68 - (81.68 * globalCountdownTime) / 30}
							stroke-linecap="square"
							class="transition-all duration-100 ease-linear"
						/>
					</svg>
				</div>
				<div>
					<div class="text-[9px] font-black tracking-[0.25em] text-white/30 uppercase">
						Epoch Expiry
					</div>
					<div
						class="text-xs font-black tracking-wider transition-colors {globalCountdownTime < 6
							? 'animate-pulse text-red-400'
							: 'text-white/80'}"
					>
						{globalCountdownTime}s remaining
					</div>
				</div>
			</div>
		</div>

		{#if authenticatorVault.length === 0}
			<div
				class="mx-auto flex h-80 max-w-5xl flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/1 p-8 text-center text-white/30"
			>
				<div class="mb-3 animate-pulse text-2xl text-[#9999FF]">⊘</div>
				<div class="text-xs font-black tracking-[0.25em] text-white/50 uppercase">
					No Authentication Strings Linked
				</div>
				<p class="mt-3 max-w-sm text-[11px] leading-relaxed tracking-wider text-white/30 uppercase">
					Inject target account records through the provisioning core or drop an encrypted storage
					configuration mapping directly onto your local workspace context.
				</p>
			</div>
		{/if}

		<div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each authenticatorVault as token, index (token.id)}
				<TokenCard
					{token}
					{globalCountdownTime}
					{isPresentationMode}
					onPurge={() => purgeTokenVector(index)}
				/>
			{/each}
		</div>
	</main>
</div>
