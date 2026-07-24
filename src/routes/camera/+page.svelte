<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let videoElement = $state<HTMLVideoElement | null>(null);
	let downloadAnchor = $state<HTMLAnchorElement | null>(null);
	let streamActive = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let isFrontCamera = $state<boolean>(true);
	let hasMultipleCameras = $state<boolean>(false);

	let localStream: MediaStream | null = null;

	// Scans the client system hardware for multiple configurations (Front vs Back)
	const checkDeviceCameras = async () => {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const videoDevices = devices.filter((device) => device.kind === 'videoinput');
			hasMultipleCameras = videoDevices.length > 1;
		} catch (err) {
			console.warn('Failed to discover complete device hardware matrix map:', err);
		}
	};

	const initCamera = async () => {
		stopCurrentStream();
		errorMessage = '';

		const constraints: MediaStreamConstraints = {
			video: {
				facingMode: isFrontCamera ? 'user' : 'environment',
				width: { ideal: 1920 },
				height: { ideal: 1080 }
			},
			audio: false
		};

		try {
			localStream = await navigator.mediaDevices.getUserMedia(constraints);
			if (videoElement) {
				videoElement.srcObject = localStream;
				streamActive = true;
			}
			await checkDeviceCameras();
		} catch (err) {
			streamActive = false;
			if (err instanceof Error) {
				if (err.name === 'NotAllowedError') {
					errorMessage = 'Access Denied. Please enable camera permissions.';
				} else {
					errorMessage = `Initialization Error: ${err.message}`;
				}
			} else {
				errorMessage = 'An unexpected optics setup error occurred.';
			}
		}
	};

	const flipCamera = () => {
		isFrontCamera = !isFrontCamera;
		initCamera();
	};

	const capturePhoto = () => {
		if (!streamActive || !videoElement) return;

		const canvas = document.createElement('canvas');
		const video = videoElement;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Handle mirror transforms inside canvas spatial buffers for front facing output snapshots
		if (isFrontCamera) {
			ctx.translate(canvas.width, 0);
			ctx.scale(-1, 1);
		}

		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		try {
			const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

			if (downloadAnchor) {
				downloadAnchor.href = dataUrl;
				downloadAnchor.download = `AVERO_CAPTURE_${Date.now()}.jpg`;
				downloadAnchor.click();
			}
		} catch (err) {
			console.error('Frame capture buffer render failure process tracking chain loop broken:', err);
		}
	};

	const stopCurrentStream = () => {
		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
			localStream = null;
		}
		if (videoElement) {
			videoElement.srcObject = null;
		}
		streamActive = false;
	};

	onMount(() => {
		initCamera();
	});

	onDestroy(() => {
		stopCurrentStream();
	});
</script>

<div
	class="relative min-h-screen bg-black p-4 font-sans text-zinc-100 antialiased selection:bg-[#9999FF]/20 selection:text-[#9999FF] sm:p-8 md:p-12"
>
	<div class="mx-auto max-w-5xl pt-16">
		<!-- Header Metrics telemetry panel -->
		<div
			class="mb-8 flex flex-col items-start justify-between gap-6 border-b border-white/5 pb-6 sm:flex-row sm:items-center"
		>
			<div>
				<h1 class="text-4xl font-black tracking-tighter text-white uppercase italic">
					Avero <span class="text-[#9999FF]">Cam</span>
				</h1>
				<p class="mt-1 font-mono text-[10px] tracking-widest text-white/40 uppercase">
					Optics Relay & Capture Matrix v1.0
				</p>
			</div>

			<div
				class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/2 px-4 py-2 backdrop-blur-md"
			>
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 {streamActive
							? 'bg-emerald-400'
							: 'bg-red-400'}"
					></span>
					<span
						class="relative inline-flex h-2 w-2 rounded-full {streamActive
							? 'bg-emerald-500'
							: 'bg-red-500'}"
					></span>
				</span>
				<span
					class="font-mono text-[10px] font-black tracking-widest uppercase {streamActive
						? 'text-[#9999FF]'
						: 'text-white/40'}"
				>
					{streamActive ? 'SYSTEM: ACTIVE' : 'SYSTEM: OFFLINE'}
				</span>
			</div>
		</div>

		<!-- Camera Frame & Controls Grid -->
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
			<!-- Video Canvas Feed Container -->
			<div class="lg:col-span-9">
				<div
					class="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/2 p-1.5 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:bg-white/4"
				>
					<div class="relative aspect-4/3 w-full overflow-hidden rounded-[22px] bg-black">
						<video
							bind:this={videoElement}
							autoplay
							playsinline
							class="h-full w-full object-cover"
							class:mirror={isFrontCamera}
						></video>

						<!-- No Stream Error/Init Overlay -->
						{#if !streamActive}
							<div
								class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-sm"
							>
								<span
									class="mb-2 font-mono text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
								>
									Hardware Interface Error
								</span>
								<h2 class="mb-4 text-xl font-bold tracking-tight text-white/60">
									Optics array disconnected or blocked
								</h2>
								<button
									onclick={initCamera}
									class="cursor-pointer rounded-xl bg-[#9999FF] px-6 py-3 text-[10px] font-black tracking-widest text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(153,153,255,0.35)] active:scale-[0.98]"
								>
									Initialize Sensors
								</button>
								{#if errorMessage}
									<p
										class="mt-4 max-w-xs rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-1.5 font-mono text-[10px] text-red-400"
									>
										{errorMessage}
									</p>
								{/if}
							</div>
						{/if}

						<!-- Retro-Futuristic Composition Grid Overlay -->
						{#if streamActive}
							<div class="capture-grid-lines pointer-events-none absolute inset-0 z-10"></div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Quick-Action Control Dashboard -->
			<div class="space-y-4 lg:col-span-3">
				<div
					class="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/4"
				>
					<div>
						<span
							class="mb-4 block font-mono text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
						>
							Capture Deck
						</span>

						<!-- Physical-Feel Capactitative Shutter Button -->
						<div class="my-6 flex justify-center">
							<button
								onclick={capturePhoto}
								disabled={!streamActive}
								class="shutter-trigger relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-4 border-white/10 bg-black transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40"
								class:active-trigger={streamActive}
								title="Capture Frame"
							>
								<div
									class="shutter-inner h-16 w-16 rounded-full bg-[#9999FF] shadow-[0_0_20px_rgba(153,153,255,0.3)] transition-transform duration-100 ease-out"
								></div>
							</button>
						</div>
					</div>

					<div class="space-y-3">
						<button
							onclick={flipCamera}
							disabled={!hasMultipleCameras || !streamActive}
							class="w-full cursor-pointer rounded-xl border border-white/5 bg-white/3 py-3 text-[10px] font-black tracking-widest text-white uppercase transition-all duration-300 hover:border-[#9999FF]/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-20"
						>
							Flip Lens Matrix
						</button>

						<div class="border-t border-white/5 pt-3">
							<span
								class="block text-center font-mono text-[9px] tracking-widest text-white/30 uppercase"
							>
								Target Resolution: 1920 × 1080
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Hidden Download Anchor -->
	<a bind:this={downloadAnchor} id="download" class="hidden" href="#download">Download</a>
</div>

<style>
	/* Video Mirror Transform */
	.mirror {
		transform: scaleX(-1);
	}

	/* Framing Rule-of-Thirds Grid Overlay */
	.capture-grid-lines {
		border: 1px solid rgba(153, 153, 255, 0.03);
	}
	.capture-grid-lines::before,
	.capture-grid-lines::after {
		content: '';
		position: absolute;
	}
	.capture-grid-lines::before {
		top: 0;
		bottom: 0;
		left: 33.33%;
		right: 33.33%;
		border-left: 1px dashed rgba(153, 153, 255, 0.08);
		border-right: 1px dashed rgba(153, 153, 255, 0.08);
	}
	.capture-grid-lines::after {
		left: 0;
		right: 0;
		top: 33.33%;
		bottom: 33.33%;
		border-top: 1px dashed rgba(153, 153, 255, 0.08);
		border-bottom: 1px dashed rgba(153, 153, 255, 0.08);
	}

	/* Shutter Mechanical Bounce */
	.shutter-trigger.active-trigger:hover {
		border-color: rgba(153, 153, 255, 0.4);
		box-shadow: 0 0 30px rgba(153, 153, 255, 0.25);
		transform: scale(1.05);
	}
	.shutter-trigger.active-trigger:active {
		transform: scale(0.95);
	}
	.shutter-trigger.active-trigger:active .shutter-inner {
		transform: scale(0.85);
		background-color: #8888ee;
	}
	.shutter-trigger:disabled .shutter-inner {
		background-color: #27272a;
		box-shadow: none;
	}
</style>
