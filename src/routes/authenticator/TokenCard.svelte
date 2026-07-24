<script lang="ts">
	import { formatTokenDigits } from './totp';

	let { token, globalCountdownTime, isPresentationMode, onPurge } = $props<{
		token: { id: string; issuer: string; secret: string; liveCode: string };
		globalCountdownTime: number;
		isPresentationMode: boolean;
		onPurge: () => void;
	}>();

	const copyTokenToClipboard = (codeString: string, event: MouseEvent) => {
		const targetElement = event.currentTarget as HTMLElement;
		navigator.clipboard.writeText(codeString).then(() => {
			const originalNodeText = targetElement.innerHTML;
			targetElement.innerHTML = `<span>COPIED</span><span class="text-[9px] font-normal tracking-normal text-[#9999FF] uppercase pr-1 select-none font-mono">[Success]</span>`;
			setTimeout(() => {
				targetElement.innerHTML = originalNodeText;
			}, 800);
		});
	};
</script>

<div
	class="group/card relative rounded-[24px] border border-white/5 bg-white/2 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#9999FF]/30 hover:bg-white/4 hover:shadow-[0_0_35px_rgba(153,153,255,0.08)]"
>
	<div class="mb-4 flex items-center justify-between gap-2">
		<div class="overflow-hidden">
			<div class="text-[9px] font-black tracking-[0.25em] text-white/40 uppercase">
				Issuer System
			</div>
			<span class="mt-1.5 block truncate text-sm font-black tracking-tight text-white uppercase"
				>{token.issuer || 'Unknown Node'}</span
			>
		</div>

		{#if !isPresentationMode}
			<button
				onclick={onPurge}
				class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black text-white/60 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 active:scale-95"
				title="Purge Vector"
			>
				[✕]
			</button>
		{/if}
	</div>

	<div class="rounded-xl border border-white/5 bg-black/40 p-4">
		<div class="w-full space-y-2 text-left">
			<span class="block text-[9px] font-black tracking-[0.25em] text-white/30 uppercase"
				>Verification Seed</span
			>
			<button
				type="button"
				onclick={(e) => copyTokenToClipboard(token.liveCode, e)}
				class="group/code flex w-full cursor-pointer items-center justify-between rounded border-none bg-transparent p-0 text-3xl font-black tracking-widest text-[#9999FF] transition-all duration-200 outline-none select-all hover:brightness-110 active:opacity-75"
				title="Click to copy code value"
			>
				<span class="font-mono">{formatTokenDigits(token.liveCode)}</span>
				<span
					class="pr-1 font-mono text-[9px] font-black tracking-widest text-white/20 uppercase transition-colors select-none group-hover/code:text-[#9999FF]/60"
					>[Copy]</span
				>
			</button>
		</div>
	</div>

	<div
		class="mt-4 flex items-center justify-between px-1 text-[9px] font-black tracking-[0.2em] text-white/40 uppercase"
	>
		<div class="flex items-center gap-1.5">
			<span class="h-1.5 w-1.5 rounded-full bg-[#9999FF] shadow-[0_0_8px_#9999FF]"></span>
			<span>Dynamic_Valid</span>
		</div>
		<span class={globalCountdownTime < 6 ? 'animate-pulse text-red-400' : 'text-white/60'}
			>T-{globalCountdownTime}s</span
		>
	</div>
</div>
