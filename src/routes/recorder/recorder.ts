import { writable } from 'svelte/store';

export type RecordMode = 'SCREEN' | 'AUDIO' | 'SCREENSHOT';

export const activeMode = writable<RecordMode>('SCREEN');
export const isRecording = writable<boolean>(false);
export const recordingSeconds = writable<number>(0);
export const errorMessage = writable<string>('');

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let activeStream: MediaStream | null = null;
let timerInterval: ReturnType<typeof setInterval> | null = null;

export const setMode = (mode: RecordMode): void => {
	activeMode.set(mode);
	errorMessage.set('');
};

export const formatTime = (totalSeconds: number): string => {
	const mins = Math.floor(totalSeconds / 60)
		.toString()
		.padStart(2, '0');
	const secs = (totalSeconds % 60).toString().padStart(2, '0');
	return `${mins}:${secs}`;
};

export const startTimer = (): void => {
	recordingSeconds.set(0);
	timerInterval = setInterval(() => {
		recordingSeconds.update((s) => s + 1);
	}, 1000);
};

export const resetPointers = (): void => {
	isRecording.set(false);
	recordingSeconds.set(0);
	if (timerInterval) clearInterval(timerInterval);
	timerInterval = null;
	mediaRecorder = null;
	activeStream = null;
};

export const triggerDownload = (url: string, filename: string): void => {
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
};

export const compileAndDownload = (mimeType: string, mode: RecordMode): void => {
	if (recordedChunks.length === 0) return;

	const blob = new Blob(recordedChunks, { type: mimeType });
	const dataUrl = URL.createObjectURL(blob);
	const prefix = mode === 'SCREEN' ? 'AVERO_REC' : 'AVERO_AUDIO';

	triggerDownload(dataUrl, `${prefix}_${Date.now()}.webm`);
	setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
};

export const captureScreenshotFrame = (stream: MediaStream): void => {
	const videoTrack = stream.getVideoTracks()[0];
	const captureVideo = document.createElement('video');

	captureVideo.srcObject = stream;
	captureVideo.muted = true;
	captureVideo.play();

	captureVideo.onloadedmetadata = () => {
		setTimeout(() => {
			const canvas = document.createElement('canvas');
			canvas.width = captureVideo.videoWidth;
			canvas.height = captureVideo.videoHeight;

			const ctx = canvas.getContext('2d');
			ctx?.drawImage(captureVideo, 0, 0, canvas.width, canvas.height);

			try {
				const dataUrl = canvas.toDataURL('image/png');
				triggerDownload(dataUrl, `AVERO_SNAP_${Date.now()}.png`);
			} catch {
				errorMessage.set('Failed to render framework matrix screenshot frame.');
			}

			videoTrack.stop();
			stream.getTracks().forEach((t) => t.stop());
		}, 300);
	};
};

export const initMediaRecorder = (
	stream: MediaStream,
	mimeType: string,
	mode: RecordMode
): void => {
	recordedChunks = [];
	mediaRecorder = new MediaRecorder(stream, { mimeType });

	mediaRecorder.ondataavailable = (e: BlobEvent) => {
		if (e.data && e.data.size > 0) recordedChunks.push(e.data);
	};

	mediaRecorder.onstop = () => {
		compileAndDownload(mimeType, mode);
		resetPointers();
	};

	stream.getVideoTracks().forEach((track) => {
		track.onended = () => {
			stopCaptureSequence();
		};
	});

	mediaRecorder.start(250);
	isRecording.set(true);
	startTimer();
};

export const startCaptureSequence = async (mode: RecordMode): Promise<void> => {
	errorMessage.set('');
	recordedChunks = [];

	try {
		if (mode === 'SCREEN') {
			activeStream = await navigator.mediaDevices.getDisplayMedia({
				video: { displaySurface: 'monitor' },
				audio: true
			});
			initMediaRecorder(activeStream, 'video/webm', mode);
		} else if (mode === 'AUDIO') {
			activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			initMediaRecorder(activeStream, 'audio/webm', mode);
		} else if (mode === 'SCREENSHOT') {
			activeStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
			captureScreenshotFrame(activeStream);
		}
	} catch (err: unknown) {
		console.error('Capture protocol fault:', err);
		if (err instanceof Error) {
			errorMessage.set(
				err.name === 'NotAllowedError'
					? 'Permissions rejected by operating system client.'
					: `Initialization Error: ${err.message}`
			);
		} else {
			errorMessage.set('An unknown initialization fault occurred.');
		}
		resetPointers();
	}
};

export const stopCaptureSequence = (): void => {
	if (mediaRecorder && mediaRecorder.state !== 'inactive') {
		mediaRecorder.stop();
	}
};

export const abortRecording = (): void => {
	if (timerInterval) clearInterval(timerInterval);
	if (activeStream) {
		activeStream.getTracks().forEach((track) => track.stop());
	}
	resetPointers();
};
