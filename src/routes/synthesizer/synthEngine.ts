export interface NoteEvent {
	startBeat: number;
	endBeat: number;
	semitones: number[]; // e.g. [6, 2] or [0] for rest
}

export interface ParsedSequence {
	bpm: number;
	events: NoteEvent[];
	totalBeats: number;
}

const A_FREQ = 440.0;

export function parseSequence(input: string): ParsedSequence {
	// Parse BPM from leading "BPM=" string or default to 120
	const bpmMatch = input.match(/^(\d+)=/);
	const bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 120;

	// Strip off the BPM header to process token pairs
	const sequenceBody = bpmMatch ? input.slice(bpmMatch[0].length) : input;
	const tokens = sequenceBody.split('=').filter((t) => t.trim() !== '');

	const events: NoteEvent[] = [];
	let currentBeat = 0;

	for (const token of tokens) {
		const parts = token.split('-');
		if (parts.length < 2) continue;

		const duration = parseFloat(parts[0]);
		const valStr = parts[1];

		// Parse semitones delimited by '+'
		const semitones = valStr
			.split('+')
			.map((s) => parseFloat(s))
			.filter((n) => !isNaN(n))
			.sort((a, b) => a - b);

		if (isNaN(duration) || semitones.length === 0) continue;

		const lastEvent = events[events.length - 1];

		// Check if current note matches previous note to hold continuously
		const isSameAsLast =
			lastEvent &&
			lastEvent.semitones.length === semitones.length &&
			lastEvent.semitones.every((val, index) => val === semitones[index]);

		if (isSameAsLast) {
			// Extend endBeat to hold the note continuously without retriggering
			lastEvent.endBeat += duration;
		} else {
			events.push({
				startBeat: currentBeat,
				endBeat: currentBeat + duration,
				semitones
			});
		}

		currentBeat += duration;
	}

	return {
		bpm,
		events,
		totalBeats: Math.max(currentBeat, 4)
	};
}

export function playTone(
	audioCtx: AudioContext,
	masterGain: GainNode,
	semitone: number,
	time: number,
	duration: number
) {
	if (semitone === 0) return; // Rest

	const freq = A_FREQ * Math.pow(2, (semitone - 1) / 12);

	const osc = audioCtx.createOscillator();
	const gain = audioCtx.createGain();

	osc.type = 'square';
	osc.frequency.setValueAtTime(freq, time);

	// Sustained envelope holding level across full duration
	gain.gain.setValueAtTime(0, time);
	gain.gain.linearRampToValueAtTime(0.15, time + 0.005);
	gain.gain.setValueAtTime(0.15, time + Math.max(0, duration - 0.01));
	gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

	osc.connect(gain);
	gain.connect(masterGain);

	osc.start(time);
	osc.stop(time + duration);
}
