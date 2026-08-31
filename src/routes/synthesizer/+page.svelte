<script lang="ts">
	import { onDestroy } from 'svelte';
	import { parseSequence, playTone } from './synthEngine';

	let sequenceString = $state('185=2-1=1-4=2-1=1-4=1-8=1-4=2-1=1-8=1-9=2-8=1-4=4-3');
	let isPlaying = $state(false);

	let audioCtx: AudioContext | null = null;
	let masterGain: GainNode | null = null;
	let timerId: number | null = null;

	let currentBeat = $state(0);

	function initAudio() {
		if (audioCtx) return;
		const AudioContextClass =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		audioCtx = new AudioContextClass();
		masterGain = audioCtx.createGain();
		masterGain.gain.value = 0.5;
		masterGain.connect(audioCtx.destination);
	}

	function togglePlay() {
		initAudio();
		if (!audioCtx) return;

		if (isPlaying) {
			isPlaying = false;
			if (timerId) clearTimeout(timerId);
			currentBeat = 0;
		} else {
			if (audioCtx.state === 'suspended') audioCtx.resume();
			isPlaying = true;
			runSequencer();
		}
	}

	function stopPlay() {
		isPlaying = false;
		if (timerId) clearTimeout(timerId);
		currentBeat = 0;
	}

	function restartPlay() {
		stopPlay();
		togglePlay();
	}

	function runSequencer() {
		if (!audioCtx) return;
		const parsed = parseSequence(sequenceString);
		const beatDuration = 60 / parsed.bpm;

		let beatIndex = 0;

		const step = () => {
			if (!isPlaying) return;

			currentBeat = beatIndex;

			// Find events active at this beat
			const activeEvent = parsed.events.find(
				(e) => beatIndex >= e.startBeat && beatIndex < e.endBeat
			);

			if (activeEvent) {
				const duration = (activeEvent.endBeat - activeEvent.startBeat) * beatDuration;
				activeEvent.semitones.forEach((semi) => {
					if (audioCtx) {
						playTone(audioCtx, masterGain!, semi, audioCtx.currentTime, duration);
					}
				});
			}

			beatIndex++;
			if (beatIndex >= parsed.totalBeats) {
				beatIndex = 0; // Loop
			}

			timerId = window.setTimeout(step, beatDuration * 1000);
		};

		step();
	}

	onDestroy(() => {
		if (timerId) clearTimeout(timerId);
		if (audioCtx) audioCtx.close();
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-black p-4 font-sans text-white">
	<div
		class="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
	>
		<h1 class="text-lg font-bold tracking-wider uppercase">Avero Synth</h1>

		<input
			type="text"
			bind:value={sequenceString}
			disabled={isPlaying}
			class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 font-mono text-xs text-white outline-none focus:border-[#9999FF]"
		/>

		<div class="flex gap-2 pt-2">
			<button
				onclick={togglePlay}
				class="flex-1 rounded-xl bg-[#9999FF] py-2 text-xs font-bold text-black uppercase transition hover:opacity-90"
			>
				{isPlaying ? 'Pause' : 'Play'}
			</button>
			<button
				onclick={stopPlay}
				class="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase transition hover:bg-white/20"
			>
				Stop
			</button>
			<button
				onclick={restartPlay}
				class="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase transition hover:bg-white/20"
			>
				Restart
			</button>
		</div>

		{#if isPlaying}
			<div class="text-center font-mono text-[10px] text-white/50 uppercase">
				Current Beat: {currentBeat}
			</div>
		{/if}
	</div>
</div>
