<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let { analyser, isPlaying }: { analyser: AnalyserNode | null; isPlaying: boolean } = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let animFrameId: number;

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const width = (canvas.width = canvas.clientWidth);
		const height = (canvas.height = canvas.clientHeight);

		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, width, height);
		ctx.lineWidth = 2;
		ctx.strokeStyle = isPlaying ? '#9999FF' : 'rgba(255, 255, 255, 0.1)';
		ctx.shadowColor = '#9999FF';
		ctx.shadowBlur = isPlaying ? 10 : 0;
		ctx.beginPath();

		if (analyser) {
			const bufferLength = analyser.frequencyBinCount;
			const dataArray = new Uint8Array(bufferLength);
			analyser.getByteTimeDomainData(dataArray);

			const sliceWidth = width / bufferLength;
			let x = 0;
			for (let i = 0; i < bufferLength; i++) {
				const v = dataArray[i] / 128.0;
				const y = (v * height) / 2;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
				x += sliceWidth;
			}
		} else {
			ctx.moveTo(0, height / 2);
			ctx.lineTo(width, height / 2);
		}

		ctx.stroke();
		animFrameId = requestAnimationFrame(draw);
	}

	onMount(() => {
		draw();
	});

	onDestroy(() => {
		if (animFrameId) cancelAnimationFrame(animFrameId);
	});
</script>

<div
	class="relative h-32 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-[0_0_20px_rgba(153,153,255,0.05)]"
>
	<canvas bind:this={canvas} class="block h-full w-full"></canvas>
</div>
