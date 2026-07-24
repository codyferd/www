export type WaveEngineType =
	| 'sine'
	| 'triangle'
	| 'sawtooth'
	| 'square'
	| 'piano'
	| 'guitar'
	| 'organ'
	| 'violin'
	| 'brass'
	| 'flute'
	| 'bell'
	| 'pulse-12'
	| 'pulse-25'
	| 'sub-bass'
	| 'acid'
	| '8-bit'
	| 'ambient'
	| 'metallic'
	| 'synth-pad'
	| 'percussion';

export interface ParsedNote {
	isRest: boolean;
	semitones: number;
	name: string;
	frequency: number;
	volMultiplier: number;
	durMultiplier: number;
	isSlide: boolean;
	slideTargetFreq: number | null;
	flagDisplay: string;
}

export interface HarmonicsConfig {
	partial: number;
	weight: number;
	type?: OscillatorType | 'pulse-12' | 'pulse-25';
	keepHarmonics?: boolean;
	detune?: number;
}
