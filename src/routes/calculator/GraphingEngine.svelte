<script lang="ts">
	import { onMount } from 'svelte';
	import { math, type GraphEquation } from './calculator';

	let {
		graphEquations = $bindable(),
		triggerGraphDraw
	}: {
		graphEquations: GraphEquation[];
		triggerGraphDraw: number;
	} = $props();

	let graphCanvas = $state<HTMLCanvasElement | null>(null);
	let zoom = $state<number>(40);
	let mousePos = $state({ x: '0.00', y: '0.00', show: false });

	const drawGraph = () => {
		if (!graphCanvas) return;
		const ctx = graphCanvas.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const width = graphCanvas.offsetWidth;
		const height = graphCanvas.offsetHeight;

		graphCanvas.width = width * dpr;
		graphCanvas.height = height * dpr;
		ctx.scale(dpr, dpr);

		ctx.clearRect(0, 0, width, height);

		const centerX = width / 2;
		const centerY = height / 2;
		const currentZoom = zoom;

		// 1. Gridlines (Translucent Standard Avero Borders)
		ctx.strokeStyle = '#141416';
		ctx.lineWidth = 1;
		ctx.beginPath();

		for (let x = centerX % currentZoom; x < width; x += currentZoom) {
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
		}
		for (let y = centerY % currentZoom; y < height; y += currentZoom) {
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
		}
		ctx.stroke();

		// 2. Main Axes (Lavender Accent Core)
		ctx.strokeStyle = 'rgba(153, 153, 255, 0.15)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0, centerY);
		ctx.lineTo(width, centerY);
		ctx.moveTo(centerX, 0);
		ctx.lineTo(centerX, height);
		ctx.stroke();

		// 3. Render plotted equation sets
		graphEquations.forEach((eq) => {
			if (!eq.text.trim()) return;
			try {
				const expr = math.compile(eq.text);

				ctx.strokeStyle = eq.color;
				ctx.lineWidth = 2.5;
				ctx.beginPath();

				let structuralStart = true;

				for (let px = 0; px < width; px++) {
					const xVal = (px - centerX) / currentZoom;
					const yVal = expr.evaluate({ x: xVal });

					if (typeof yVal === 'number' && !isNaN(yVal) && isFinite(yVal)) {
						const py = centerY - yVal * currentZoom;

						if (py >= -100 && py <= height + 100) {
							if (structuralStart) {
								ctx.moveTo(px, py);
								structuralStart = false;
							} else {
								ctx.lineTo(px, py);
							}
						} else {
							structuralStart = true;
						}
					} else {
						structuralStart = true;
					}
				}
				ctx.stroke();
			} catch {
				// Silent catch on partial formula inputs
			}
		});
	};

	const trackMouse = (e: MouseEvent) => {
		if (!graphCanvas) return;
		const rect = graphCanvas.getBoundingClientRect();

		const clientX = e.clientX - rect.left;
		const clientY = e.clientY - rect.top;

		const dpr = window.devicePixelRatio || 1;
		const visualW = graphCanvas.width / dpr;
		const visualH = graphCanvas.height / dpr;

		const mathX = (clientX - visualW / 2) / zoom;
		const mathY = (visualH / 2 - clientY) / zoom;

		mousePos.x = mathX.toFixed(2);
		mousePos.y = mathY.toFixed(2);
		mousePos.show = true;
	};

	const zoomIn = () => {
		zoom = Math.min(500, zoom * 1.3);
		drawGraph();
	};
	const zoomOut = () => {
		zoom = Math.max(5, zoom / 1.3);
		drawGraph();
	};
	const resetView = () => {
		zoom = 40;
		drawGraph();
	};

	$effect(() => {
		if (triggerGraphDraw !== undefined || zoom !== undefined) {
			drawGraph();
		}
	});

	onMount(() => {
		drawGraph();
		const handleResize = () => drawGraph();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<div
	class="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/2 p-6 shadow-2xl backdrop-blur-xl"
>
	<div
		class="mb-4 flex flex-col items-start justify-between gap-4 px-2 sm:flex-row sm:items-center"
	>
		<div class="flex flex-wrap gap-4 font-mono text-[10px] tracking-wider text-white/40">
			<span>ZOOM SCALE: <b class="text-[#9999FF]">{zoom.toFixed(1)} px/u</b></span>
			{#if mousePos.show}
				<span>COORDS: <b class="text-[#9999FF]">x: {mousePos.x}, y: {mousePos.y}</b></span>
			{:else}
				<span>COORDS: <b class="text-white/20">Hover canvas</b></span>
			{/if}
		</div>

		<div class="flex gap-2">
			<button
				onclick={zoomIn}
				class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-black text-white transition-all duration-200 hover:border-white/20 hover:bg-white/10"
			>
				+
			</button>
			<button
				onclick={zoomOut}
				class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-black text-white transition-all duration-200 hover:border-white/20 hover:bg-white/10"
			>
				-
			</button>
			<button
				onclick={resetView}
				class="cursor-pointer rounded-lg border border-[#9999FF]/20 bg-[#9999FF]/10 px-3.5 py-1.5 text-[9px] font-black tracking-widest text-[#9999FF] uppercase transition-all duration-200 hover:bg-[#9999FF]/20"
			>
				Reset
			</button>
		</div>
	</div>

	<div class="relative overflow-hidden rounded-2xl border border-white/10">
		<canvas
			bind:this={graphCanvas}
			onmousemove={trackMouse}
			onmouseleave={() => (mousePos.show = false)}
			class="h-[520px] w-full"
		></canvas>
	</div>

	<div
		class="mt-4 space-y-1.5 rounded-2xl border border-white/5 bg-black/40 p-5 font-mono text-[11px] text-white/40"
	>
		<p class="mb-2 text-[9px] font-black tracking-[0.25em] text-[#9999FF] uppercase">
			Advanced Plot Engine Syntax
		</p>
		<p>• Write algebraic code formats using <b>x</b> as your target parameter variable.</p>
		<p>
			• Math.js engine parsing allows deep expressions like: <span class="text-white/80"
				>sin(x) * cos(x/2)</span
			>
			or <span class="text-white/80">abs(x)</span>.
		</p>
	</div>
</div>

<style>
	canvas {
		background: #000000;
		cursor: crosshair;
	}
</style>
