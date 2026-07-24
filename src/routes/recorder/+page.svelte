<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		activeMode,
		isRecording,
		recordingSeconds,
		errorMessage,
		setMode,
		formatTime,
		startCaptureSequence,
		stopCaptureSequence,
		abortRecording,
		type RecordMode
	} from './recorder';

	const handlePrimaryAction = () => {
		if ($isRecording) {
			stopCaptureSequence();
		} else {
			startCaptureSequence($activeMode);
		}
	};

	const getStatusMessage = (mode: RecordMode, recording: boolean): string => {
		if (recording) return 'Capturing Active pipeline stream...';
		switch (mode) {
			case 'SCREEN':
				return 'Ready to record system viewport stream';
			case 'AUDIO':
				return 'Ready to compile audio interface feed';
			case 'SCREENSHOT':
				return 'Ready to flash capture visual array frame';
			default:
				return 'Standby';
		}
	};

	const getShutterLabel = (mode: RecordMode, recording: boolean): string => {
		if (recording) return 'Stop recording session';
		switch (mode) {
			case 'SCREEN':
				return 'Start screen recording';
			case 'AUDIO':
				return 'Start audio recording';
			case 'SCREENSHOT':
				return 'Take screenshot';
		}
	};

	onDestroy(() => {
		abortRecording();
	});
</script>

<div class="flex h-screen w-full flex-col bg-black p-6 font-sans text-white select-none">
	<!-- Header HUD -->
	<header class="mb-4 flex h-14 items-center justify-between">
		<div>
			<h1 class="text-xl font-black tracking-tighter text-white uppercase italic">
				Avero Recorder
			</h1>
			<p class="mt-0.5 text-[8px] font-bold tracking-[0.3em] text-[#9999FF]/60 uppercase">
				Signal Deck v1.0
			</p>
		</div>

		{#if $isRecording}
			<div
				class="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-red-400"
			>
				<span class="h-2 w-2 animate-ping rounded-full bg-red-500"></span>
				<span class="font-mono text-xs font-bold">{formatTime($recordingSeconds)}</span>
			</div>
		{/if}
	</header>

	<!-- Mode Selector Grid -->
	{#if !$isRecording}
		<div class="mb-4 grid grid-cols-3 gap-3">
			<button
				type="button"
				onclick={() => setMode('SCREEN')}
				aria-label="Switch to Screen Capture mode"
				class="flex flex-col items-center justify-center rounded-2xl border p-3.5 transition-all duration-300 {$activeMode ===
				'SCREEN'
					? 'border-[#9999FF] bg-[#9999FF]/10 shadow-[0_0_20px_rgba(153,153,255,0.15)]'
					: 'border-white/5 bg-white/2 hover:border-[#9999FF]/30 hover:bg-white/4'}"
			>
				<span class="mb-1 text-lg" aria-hidden="true">🖥️</span>
				<span class="text-[9px] font-black tracking-widest text-white/80 uppercase">Screen</span>
			</button>

			<button
				type="button"
				onclick={() => setMode('AUDIO')}
				aria-label="Switch to Audio Capture mode"
				class="flex flex-col items-center justify-center rounded-2xl border p-3.5 transition-all duration-300 {$activeMode ===
				'AUDIO'
					? 'border-[#9999FF] bg-[#9999FF]/10 shadow-[0_0_20px_rgba(153,153,255,0.15)]'
					: 'border-white/5 bg-white/2 hover:border-[#9999FF]/30 hover:bg-white/4'}"
			>
				<span class="mb-1 text-lg" aria-hidden="true">🎙️</span>
				<span class="text-[9px] font-black tracking-widest text-white/80 uppercase">Audio</span>
			</button>

			<button
				type="button"
				onclick={() => setMode('SCREENSHOT')}
				aria-label="Switch to Snapshot mode"
				class="flex flex-col items-center justify-center rounded-2xl border p-3.5 transition-all duration-300 {$activeMode ===
				'SCREENSHOT'
					? 'border-[#9999FF] bg-[#9999FF]/10 shadow-[0_0_20px_rgba(153,153,255,0.15)]'
					: 'border-white/5 bg-white/2 hover:border-[#9999FF]/30 hover:bg-white/4'}"
			>
				<span class="mb-1 text-lg" aria-hidden="true">📸</span>
				<span class="text-[9px] font-black tracking-widest text-white/80 uppercase">Snapshot</span>
			</button>
		</div>
	{/if}

	<!-- Viewport HUD -->
	<div
		class="relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/2 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20"
	>
		<div class="z-10 text-center">
			<p class="text-xs font-black tracking-[0.4em] text-white/40 uppercase">
				{getStatusMessage($activeMode, $isRecording)}
			</p>
			{#if $errorMessage}
				<p class="mx-auto mt-2 max-w-70 font-mono text-[10px] text-red-400">{$errorMessage}</p>
			{/if}
		</div>

		<!-- Grid Pattern Overlay -->
		<div
			class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[33.33%_33.33%]"
		></div>
	</div>

	<!-- Master Control Deck -->
	<div class="flex h-28 items-center justify-between px-4">
		<div class="w-20"></div>

		<!-- Shutter Trigger Button -->
		<div class="flex items-center justify-center">
			<button
				type="button"
				onclick={handlePrimaryAction}
				aria-label={getShutterLabel($activeMode, $isRecording)}
				title={getShutterLabel($activeMode, $isRecording)}
				class="flex h-18 w-18 items-center justify-center rounded-full border-4 transition-all duration-300 {$isRecording
					? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.35)] active:scale-95'
					: 'border-[#9999FF] shadow-[0_0_25px_rgba(153,153,255,0.25)] hover:shadow-[0_0_35px_rgba(153,153,255,0.45)] active:scale-95'}"
			>
				<div
					class="transition-all duration-300 {$isRecording
						? 'h-7 w-7 rounded-md bg-red-500'
						: 'h-13 w-13 rounded-full bg-[#9999FF]'}"
				></div>
			</button>
		</div>

		<!-- Secondary Control Actions -->
		{#if $isRecording}
			<button
				type="button"
				onclick={abortRecording}
				aria-label="Abort active recording"
				title="Abort Protocol"
				class="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-400 transition hover:bg-red-500/20"
			>
				✕
			</button>
		{:else}
			<div class="w-20"></div>
		{/if}
	</div>
</div>
