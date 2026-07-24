<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { WaveEngineType } from './types';
	import { parseSequence, playDynamicTone, WAVE_ENGINES } from './synthEngine';
	import Oscilloscope from './Oscilloscope.svelte';
	import TimelineNode from './TimelineNode.svelte';

	// Reactive States
	let sequenceString = $state('5.8v3.12~0.11.7._.8d2.10v9.8._.7.0~12.5.7.5.8.5.7.8.4.5');
	let tempo = $state(140);
	let gate = $state(0.7);
	let waveType = $state<WaveEngineType>('triangle');
	let masterVolume = $state(1.0);

	let isPlaying = $state(false);
	let currentNoteIndex = $state(-1);

	// Web Audio context references
	let audioCtx: AudioContext | null = null;
	let masterGain: GainNode | null = null;
	let analyser = $state<AnalyserNode | null>(null);
	let schedulerTimerId: NodeJS.Timeout | number | null = null;

	let nextNoteTime = 0.0;
	let scheduleAheadTime = 0.12;
	let lookahead = 25.0;
	let notePointer = 0;

	let parsedNotes = $derived(parseSequence(sequenceString));

	function initAudioEngine() {
		if (audioCtx) return;
		const AudioContextClass =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		audioCtx = new AudioContextClass();

		masterGain = audioCtx.createGain();
		masterGain.gain.setValueAtTime(0.6 * masterVolume, audioCtx.currentTime);

		analyser = audioCtx.createAnalyser();
		analyser.fftSize = 1024;

		masterGain.connect(analyser);
		analyser.connect(audioCtx.destination);
	}

	$effect(() => {
		if (masterGain && audioCtx) {
			masterGain.gain.linearRampToValueAtTime(0.6 * masterVolume, audioCtx.currentTime + 0.02);
		}
	});

	function scheduleNote(index: number, time: number) {
		if (!audioCtx || parsedNotes.length === 0) return;

		const targetIndex = index % parsedNotes.length;
		const currentNote = parsedNotes[targetIndex];

		const baseStepDuration = 60.0 / tempo;
		const customStepDuration = baseStepDuration * currentNote.durMultiplier;
		const activePlayDuration = customStepDuration * gate;

		if (!currentNote.isRest && masterGain) {
			playDynamicTone(audioCtx, masterGain, waveType, currentNote, time, activePlayDuration);
		}

		const delayTimeMs = Math.max(0, (time - audioCtx.currentTime) * 1000);
		setTimeout(() => {
			if (isPlaying) {
				currentNoteIndex = targetIndex;
			}
		}, delayTimeMs);

		nextNoteTime += customStepDuration;
		notePointer++;
	}

	function scheduler() {
		if (!audioCtx) return;
		while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
			scheduleNote(notePointer, nextNoteTime);
		}
		schedulerTimerId = setTimeout(scheduler, lookahead);
	}

	function togglePlayback() {
		initAudioEngine();
		if (!audioCtx) return;

		if (isPlaying) {
			isPlaying = false;
			currentNoteIndex = -1;
			if (schedulerTimerId) clearTimeout(schedulerTimerId);
		} else {
			if (audioCtx.state === 'suspended') audioCtx.resume();
			isPlaying = true;
			notePointer = 0;
			nextNoteTime = audioCtx.currentTime + 0.02;
			scheduler();
		}
	}

	function resetSequence() {
		sequenceString = '5.8v3.12~0.11.7._.8d2.10v9.8._.7.0~12.5.7.5.8.5.7.8.4.5';
		tempo = 140;
		gate = 0.7;
		waveType = 'triangle';
		masterVolume = 1.0;
	}

	onDestroy(() => {
		if (schedulerTimerId) clearTimeout(schedulerTimerId);
		if (audioCtx) audioCtx.close();
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-black p-4 font-sans text-white md:p-8">
	<div
		class="w-full max-w-4xl space-y-8 rounded-[28px] border border-white/10 bg-white/2 p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 md:p-10"
	>
		<!-- Header Zone -->
		<div
			class="flex flex-col items-start justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center"
		>
			<div>
				<h1 class="font-sans text-2xl font-black tracking-tight text-white uppercase">
					Avero Synthesizer Pro
				</h1>
				<p class="mt-1 font-mono text-xs text-white/40">
					Macro Token Language String Compiler // v3.0
				</p>
			</div>
			<div class="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
				<span
					class="h-2.5 w-2.5 rounded-full {isPlaying ? 'animate-ping bg-[#9999FF]' : 'bg-white/20'}"
				></span>
				<span class="font-mono text-[10px] font-bold tracking-widest text-white/60 uppercase">
					{isPlaying ? 'Sequencer Active' : 'System Standby'}
				</span>
			</div>
		</div>

		<!-- Oscilloscope Canvas visualizer -->
		<Oscilloscope {analyser} {isPlaying} />

		<!-- Expression Command Input -->
		<div class="space-y-3">
			<div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>String Expression Command Input</span
				>
				<span class="font-mono text-[10px] text-white/40">
					Guide: <b class="text-[#9999FF]">~</b> glide | <b class="text-amber-400">v</b> vol (1-9) |
					<b class="text-sky-400">d</b>
					len mult | <b class="text-white/60">_</b> rest
				</span>
			</div>
			<div class="flex flex-col gap-3 sm:flex-row">
				<input
					type="text"
					bind:value={sequenceString}
					placeholder="e.g. 5.8v3.12~0.11.7._.8d2"
					disabled={isPlaying}
					class="w-full rounded-2xl border border-white/10 bg-white/3 px-5 py-3.5 font-mono text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)] disabled:opacity-50"
				/>
				<div class="flex min-w-max gap-2">
					<button
						onclick={togglePlayback}
						class="rounded-2xl bg-[#9999FF] px-6 py-3.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
					>
						{isPlaying ? 'Stop Engine' : 'Compile & Play'}
					</button>
					<button
						onclick={resetSequence}
						disabled={isPlaying}
						class="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 font-mono text-xs font-bold text-white/60 uppercase transition duration-300 hover:border-[#9999FF]/30 hover:bg-white/10 disabled:opacity-40"
					>
						Reset
					</button>
				</div>
			</div>
		</div>

		<!-- Audio Parameters & Engine Profiles -->
		<div class="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Master Volume -->
			<div
				class="flex flex-col justify-between space-y-3 rounded-2xl border border-white/5 bg-white/1 p-5 transition duration-300 hover:border-[#9999FF]/20"
			>
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
					Master Volume ({Math.round(masterVolume * 20)}%)
				</span>
				<input
					type="range"
					bind:value={masterVolume}
					min="0.0"
					max="5.0"
					step="0.1"
					class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-[#9999FF]"
				/>
			</div>

			<!-- Base Tempo -->
			<div
				class="flex flex-col justify-between space-y-3 rounded-2xl border border-white/5 bg-white/1 p-5 transition duration-300 hover:border-[#9999FF]/20"
			>
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
					Base Tempo ({tempo} BPM)
				</span>
				<input
					type="range"
					bind:value={tempo}
					min="60"
					max="300"
					step="5"
					class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-[#9999FF]"
				/>
			</div>

			<!-- Gate Length -->
			<div
				class="flex flex-col justify-between space-y-3 rounded-2xl border border-white/5 bg-white/1 p-5 transition duration-300 hover:border-[#9999FF]/20"
			>
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
					Gate Length ({Math.floor(gate * 100)}%)
				</span>
				<input
					type="range"
					bind:value={gate}
					min="0.1"
					max="1.0"
					step="0.05"
					class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-[#9999FF]"
				/>
			</div>

			<!-- Waveform Selection -->
			<div
				class="flex flex-col justify-between space-y-2 rounded-2xl border border-white/5 bg-white/1 p-4 transition duration-300 hover:border-[#9999FF]/20"
			>
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>Engine Form</span
				>
				<div
					class="grid max-h-25 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent grid-cols-2 gap-1.5 overflow-y-auto pr-1"
				>
					{#each WAVE_ENGINES as type (type)}
						<button
							onclick={() => (waveType = type)}
							class="truncate rounded-lg border px-2 py-1 text-center font-mono text-[9px] font-bold uppercase transition-all {waveType ===
							type
								? 'border-[#9999FF]/50 bg-[#9999FF]/10 text-[#9999FF] shadow-[0_0_10px_rgba(153,153,255,0.2)]'
								: 'border-white/5 bg-white/2 text-white/40 hover:border-white/20'}"
							title={type}
						>
							{type}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Compiled Parameter Node Timeline -->
		<div class="space-y-3 border-t border-white/10 pt-6">
			<span class="block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
				Compiled Parameter Node Timeline
			</span>
			<div
				class="flex max-h-55 min-h-18.75 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-wrap items-center gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/1 p-4"
			>
				{#each parsedNotes as note, index (index)}
					<TimelineNode {note} {index} isActive={isPlaying && currentNoteIndex === index} />
				{/each}
			</div>
		</div>
	</div>
</div>
