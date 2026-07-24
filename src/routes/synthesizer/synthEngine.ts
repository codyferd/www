import type { ParsedNote, WaveEngineType, HarmonicsConfig } from './types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIDDLE_C_FREQ = 261.63;

export const WAVE_ENGINES: WaveEngineType[] = [
	'sine',
	'triangle',
	'sawtooth',
	'square',
	'piano',
	'guitar',
	'organ',
	'violin',
	'brass',
	'flute',
	'bell',
	'pulse-12',
	'pulse-25',
	'sub-bass',
	'acid',
	'8-bit',
	'ambient',
	'metallic',
	'synth-pad',
	'percussion'
];

export function parseSequence(sequenceString: string): ParsedNote[] {
	if (!sequenceString) return [];
	return sequenceString
		.split('.')
		.filter((token) => token.trim() !== '')
		.map((token) => {
			const raw = token.trim();

			if (raw === '_') {
				return {
					isRest: true,
					semitones: 0,
					name: '-',
					frequency: 0,
					volMultiplier: 0,
					durMultiplier: 1,
					isSlide: false,
					slideTargetFreq: null,
					flagDisplay: ''
				};
			}

			let semitones: number;
			let slideTarget: number | null = null;
			let volMultiplier = 0.7;
			let durMultiplier = 1.0;
			let flagDisplay = '';

			if (raw.includes('~')) {
				const slideParts = raw.split('~');
				semitones = parseInt(slideParts[0], 10) || 0;
				slideTarget = parseInt(slideParts[1], 10) || 0;
				flagDisplay = 'GLIDE';
			} else {
				semitones = parseInt(raw, 10) || 0;
			}

			const volMatch = raw.match(/v([1-9])/);
			if (volMatch) {
				volMultiplier = parseInt(volMatch[1], 10) / 10;
			}

			const durMatch = raw.match(/d([1-4])/);
			if (durMatch) {
				durMultiplier = parseInt(durMatch[1], 10);
			}

			const noteIndex = (4 + Math.floor(semitones / 12) * 12 + (semitones % 12) + 12) % 12;
			const octaveOffset = Math.floor((4 * 12 + semitones) / 12);
			const name = `${NOTE_NAMES[noteIndex]}${octaveOffset}`;
			const frequency = MIDDLE_C_FREQ * Math.pow(2, semitones / 12);

			let slideFreq: number | null = null;
			if (slideTarget !== null) {
				slideFreq = MIDDLE_C_FREQ * Math.pow(2, slideTarget / 12);
			}

			return {
				isRest: false,
				semitones,
				name,
				frequency,
				volMultiplier,
				durMultiplier,
				isSlide: slideTarget !== null,
				slideTargetFreq: slideFreq,
				flagDisplay
			};
		});
}

export function playDynamicTone(
	audioCtx: AudioContext,
	masterGain: GainNode,
	waveType: WaveEngineType,
	noteObj: ParsedNote,
	startTime: number,
	duration: number
) {
	if (noteObj.isRest) return;

	const targetVolume = noteObj.volMultiplier;

	if (['sine', 'triangle', 'sawtooth', 'square'].includes(waveType)) {
		const osc = audioCtx.createOscillator();
		const gainNode = audioCtx.createGain();

		osc.type = waveType as OscillatorType;
		osc.frequency.setValueAtTime(noteObj.frequency, startTime);

		if (noteObj.isSlide && noteObj.slideTargetFreq) {
			osc.frequency.exponentialRampToValueAtTime(noteObj.slideTargetFreq, startTime + duration);
		}

		gainNode.gain.setValueAtTime(0, startTime);
		gainNode.gain.linearRampToValueAtTime(targetVolume, startTime + 0.006);
		gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.002);

		osc.connect(gainNode);
		gainNode.connect(masterGain);
		osc.start(startTime);
		osc.stop(startTime + duration);
		return;
	}

	const playComplexOvertoneNodes = (
		harmonics: HarmonicsConfig[],
		attack: number,
		decay: number,
		sustain: number,
		releaseType: 'exponential' | 'linear'
	) => {
		const voiceGain = audioCtx.createGain();
		voiceGain.gain.setValueAtTime(0, startTime);
		voiceGain.gain.linearRampToValueAtTime(targetVolume, startTime + attack);

		if (releaseType === 'exponential') {
			voiceGain.gain.exponentialRampToValueAtTime(
				sustain * targetVolume + 0.001,
				startTime + attack + decay
			);
			voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
		} else {
			voiceGain.gain.linearRampToValueAtTime(sustain * targetVolume, startTime + attack + decay);
			voiceGain.gain.linearRampToValueAtTime(0, startTime + duration);
		}

		harmonics.forEach((h) => {
			const osc = audioCtx.createOscillator();
			const toneGain = audioCtx.createGain();

			if (h.type === 'pulse-12') osc.type = 'sawtooth';
			else if (h.type === 'pulse-25') osc.type = 'square';
			else osc.type = (h.type as OscillatorType) || 'sine';

			const detuneFactor = h.detune || 0;
			const baseFreq = noteObj.frequency * h.partial + detuneFactor;
			osc.frequency.setValueAtTime(baseFreq, startTime);

			if (noteObj.isSlide && noteObj.slideTargetFreq) {
				osc.frequency.exponentialRampToValueAtTime(
					noteObj.slideTargetFreq * h.partial + detuneFactor,
					startTime + duration
				);
			}

			toneGain.gain.setValueAtTime(h.weight, startTime);
			if (h.partial > 1 && !h.keepHarmonics) {
				toneGain.gain.exponentialRampToValueAtTime(
					h.weight * 0.1 + 0.001,
					startTime + duration * 0.6
				);
			}

			osc.connect(toneGain);
			toneGain.connect(voiceGain);
			osc.start(startTime);
			osc.stop(startTime + duration);
		});

		voiceGain.connect(masterGain);
	};

	switch (waveType) {
		case 'piano':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.6, type: 'sine' },
					{ partial: 2.0, weight: 0.25, type: 'triangle' },
					{ partial: 3.0, weight: 0.12, type: 'sawtooth' },
					{ partial: 4.0, weight: 0.05, type: 'triangle' }
				],
				0.004,
				duration * 0.3,
				0.2,
				'exponential'
			);
			break;
		case 'guitar':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.5, type: 'triangle' },
					{ partial: 2.0, weight: 0.3, type: 'triangle' },
					{ partial: 3.0, weight: 0.15, type: 'square' },
					{ partial: 5.0, weight: 0.05, type: 'sine' }
				],
				0.015,
				duration * 0.4,
				0.4,
				'exponential'
			);
			break;
		case 'organ':
			playComplexOvertoneNodes(
				[
					{ partial: 0.5, weight: 0.3, type: 'sine', keepHarmonics: true },
					{ partial: 1.0, weight: 0.5, type: 'sine', keepHarmonics: true },
					{ partial: 2.0, weight: 0.3, type: 'sine', keepHarmonics: true },
					{ partial: 3.0, weight: 0.15, type: 'sine', keepHarmonics: true },
					{ partial: 4.0, weight: 0.1, type: 'sine', keepHarmonics: true }
				],
				0.04,
				duration * 0.1,
				0.85,
				'linear'
			);
			break;
		case 'violin':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.4, type: 'sawtooth', keepHarmonics: true, detune: 2 },
					{ partial: 2.0, weight: 0.3, type: 'sawtooth', keepHarmonics: true, detune: -2 },
					{ partial: 3.0, weight: 0.2, type: 'triangle', keepHarmonics: true },
					{ partial: 4.0, weight: 0.1, type: 'sine', keepHarmonics: true }
				],
				0.12,
				duration * 0.2,
				0.7,
				'linear'
			);
			break;
		case 'brass':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.5, type: 'sawtooth', keepHarmonics: true },
					{ partial: 2.0, weight: 0.35, type: 'sawtooth', keepHarmonics: true },
					{ partial: 3.0, weight: 0.15, type: 'square', keepHarmonics: true }
				],
				0.08,
				duration * 0.15,
				0.6,
				'linear'
			);
			break;
		case 'flute':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.8, type: 'sine', keepHarmonics: true },
					{ partial: 2.0, weight: 0.15, type: 'sine', keepHarmonics: true, detune: 4 },
					{ partial: 3.0, weight: 0.05, type: 'triangle', keepHarmonics: true }
				],
				0.06,
				duration * 0.2,
				0.8,
				'linear'
			);
			break;
		case 'bell':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.4, type: 'sine' },
					{ partial: 2.71, weight: 0.25, type: 'sine' },
					{ partial: 3.56, weight: 0.15, type: 'sine' },
					{ partial: 4.0, weight: 0.1, type: 'sine' },
					{ partial: 6.2, weight: 0.1, type: 'sine' }
				],
				0.002,
				duration * 0.8,
				0.01,
				'exponential'
			);
			break;
		case 'pulse-12':
			playComplexOvertoneNodes(
				[{ partial: 1.0, weight: 0.7, type: 'pulse-12', keepHarmonics: true }],
				0.005,
				duration * 0.2,
				0.5,
				'exponential'
			);
			break;
		case 'pulse-25':
			playComplexOvertoneNodes(
				[{ partial: 1.0, weight: 0.7, type: 'pulse-25', keepHarmonics: true }],
				0.005,
				duration * 0.2,
				0.5,
				'exponential'
			);
			break;
		case 'sub-bass':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.9, type: 'sine', keepHarmonics: true },
					{ partial: 2.0, weight: 0.1, type: 'triangle', keepHarmonics: true }
				],
				0.02,
				duration * 0.1,
				0.9,
				'linear'
			);
			break;
		case 'acid':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.6, type: 'sawtooth', keepHarmonics: true, detune: 1 },
					{ partial: 1.01, weight: 0.3, type: 'sawtooth', keepHarmonics: true, detune: -1 }
				],
				0.005,
				duration * 0.6,
				0.1,
				'exponential'
			);
			break;
		case '8-bit':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.6, type: 'square', keepHarmonics: true },
					{ partial: 2.0, weight: 0.3, type: 'triangle', keepHarmonics: true }
				],
				0.001,
				duration * 0.1,
				0.4,
				'linear'
			);
			break;
		case 'ambient':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.5, type: 'sine', keepHarmonics: true },
					{ partial: 1.5, weight: 0.3, type: 'sine', keepHarmonics: true, detune: 2 },
					{ partial: 2.0, weight: 0.2, type: 'sine', keepHarmonics: true, detune: -2 }
				],
				0.25,
				duration * 0.1,
				0.9,
				'linear'
			);
			break;
		case 'metallic':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.3, type: 'sawtooth' },
					{ partial: 3.14, weight: 0.3, type: 'square' },
					{ partial: 5.41, weight: 0.2, type: 'sawtooth' },
					{ partial: 8.21, weight: 0.2, type: 'sine' }
				],
				0.01,
				duration * 0.4,
				0.1,
				'exponential'
			);
			break;
		case 'synth-pad':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.3, type: 'sawtooth', keepHarmonics: true, detune: -5 },
					{ partial: 1.0, weight: 0.3, type: 'sawtooth', keepHarmonics: true, detune: 5 },
					{ partial: 2.0, weight: 0.2, type: 'triangle', keepHarmonics: true },
					{ partial: 0.5, weight: 0.2, type: 'sine', keepHarmonics: true }
				],
				0.2,
				duration * 0.2,
				0.8,
				'linear'
			);
			break;
		case 'percussion':
			playComplexOvertoneNodes(
				[
					{ partial: 1.0, weight: 0.8, type: 'triangle' },
					{ partial: 7.3, weight: 0.2, type: 'square' }
				],
				0.001,
				duration * 0.15,
				0.001,
				'exponential'
			);
			break;
	}
}
