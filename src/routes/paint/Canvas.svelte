<script lang="ts">
	import { tick } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import {
		currentTool,
		brushColor,
		brushSize,
		brushOpacity,
		textContent,
		canvasSize,
		layers,
		activeLayerId,
		zoomScale,
		panOffset,
		pushHistory,
		type Layer
	} from './stores';

	let canvasContainer: HTMLDivElement;
	let interactionCanvas: HTMLCanvasElement;
	let isDrawing = false;
	let startPos = { x: 0, y: 0 };
	let lastPos = { x: 0, y: 0 };

	const canvasContexts = new SvelteMap<string, CanvasRenderingContext2D>();

	$effect(() => {
		if ($layers && $canvasSize) {
			tick().then(() => syncLayerCanvases());
		}
	});

	function syncLayerCanvases() {
		$layers.forEach((layer) => {
			let el = document.getElementById(`layer-canvas-${layer.id}`) as HTMLCanvasElement;
			if (el) {
				if (el.width !== $canvasSize.width || el.height !== $canvasSize.height) {
					el.width = $canvasSize.width;
					el.height = $canvasSize.height;
				}
				const ctx = el.getContext('2d');
				if (ctx) {
					canvasContexts.set(layer.id, ctx);
					if (layer.dataUrl && !el.dataset.loaded) {
						const img = new Image();
						img.onload = () => {
							ctx.clearRect(0, 0, el.width, el.height);
							ctx.drawImage(img, 0, 0);
							el.dataset.loaded = 'true';
						};
						img.src = layer.dataUrl;
					}
				}
			}
		});
	}

	export function captureState(): Layer[] {
		return $layers.map((l) => {
			const el = document.getElementById(`layer-canvas-${l.id}`) as HTMLCanvasElement;
			return {
				...l,
				dataUrl: el ? el.toDataURL() : l.dataUrl
			};
		});
	}

	export function restoreState(state: Layer[]) {
		layers.set(state);
		tick().then(() => {
			state.forEach((l) => {
				const el = document.getElementById(`layer-canvas-${l.id}`) as HTMLCanvasElement;
				if (el) {
					const ctx = el.getContext('2d');
					if (ctx) {
						ctx.clearRect(0, 0, $canvasSize.width, $canvasSize.height);
						if (l.dataUrl) {
							const img = new Image();
							img.onload = () => ctx.drawImage(img, 0, 0);
							img.src = l.dataUrl;
						}
					}
				}
			});
		});
	}

	function getCoords(e: MouseEvent | TouchEvent) {
		if (!interactionCanvas) return { x: 0, y: 0 };
		const rect = interactionCanvas.getBoundingClientRect();
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		const x = ((clientX - rect.left) / rect.width) * $canvasSize.width;
		const y = ((clientY - rect.top) / rect.height) * $canvasSize.height;
		return { x: Math.round(x), y: Math.round(y) };
	}

	function getActiveCtx(): CanvasRenderingContext2D | null {
		if (!$activeLayerId) return null;
		const el = document.getElementById(`layer-canvas-${$activeLayerId}`) as HTMLCanvasElement;
		return el ? el.getContext('2d') : null;
	}

	function handlePointerDown(e: MouseEvent | TouchEvent) {
		const coords = getCoords(e);
		const ctx = getActiveCtx();
		const activeLayer = $layers.find((l) => l.id === $activeLayerId);

		if (!ctx || !activeLayer || !activeLayer.visible) return;

		if ($currentTool === 'pipette') {
			sampleColor(coords.x, coords.y);
			return;
		}

		pushHistory(captureState());
		isDrawing = true;
		startPos = coords;
		lastPos = coords;

		if ($currentTool === 'bucket') {
			floodFill(coords.x, coords.y, $brushColor);
			isDrawing = false;
		} else if ($currentTool === 'text') {
			ctx.save();
			ctx.globalAlpha = $brushOpacity / 100;
			ctx.fillStyle = $brushColor;
			ctx.font = `${$brushSize * 2.5}px sans-serif`;
			ctx.textBaseline = 'top';
			ctx.fillText($textContent || 'Avero', coords.x, coords.y);
			ctx.restore();
			isDrawing = false;
		} else if ($currentTool === 'brush' || $currentTool === 'eraser') {
			drawStroke(coords.x, coords.y, coords.x, coords.y);
		}
	}

	function handlePointerMove(e: MouseEvent | TouchEvent) {
		if (!isDrawing) return;
		const coords = getCoords(e);

		if (['line', 'rect', 'ellipse'].includes($currentTool)) {
			renderShapePreview(coords.x, coords.y);
		} else if ($currentTool === 'brush' || $currentTool === 'eraser') {
			drawStroke(lastPos.x, lastPos.y, coords.x, coords.y);
			lastPos = coords;
		}
	}

	function handlePointerUp(e: MouseEvent | TouchEvent) {
		if (!isDrawing) return;
		const coords = getCoords(e);
		if (['line', 'rect', 'ellipse'].includes($currentTool)) {
			commitShape(coords.x, coords.y);
		}
		isDrawing = false;
		clearPreview();
	}

	function drawStroke(x1: number, y1: number, x2: number, y2: number) {
		const ctx = getActiveCtx();
		if (!ctx) return;
		ctx.save();
		ctx.globalAlpha = $brushOpacity / 100;

		if ($currentTool === 'eraser') {
			ctx.globalCompositeOperation = 'destination-out';
			ctx.strokeStyle = 'rgba(0,0,0,1)';
		} else {
			ctx.globalCompositeOperation = 'source-over';
			ctx.strokeStyle = $brushColor;
		}

		ctx.lineWidth = $brushSize;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		ctx.restore();
	}

	function renderShapePreview(x: number, y: number) {
		if (!interactionCanvas) return;
		const ctx = interactionCanvas.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, $canvasSize.width, $canvasSize.height);

		ctx.save();
		ctx.globalAlpha = $brushOpacity / 100;
		ctx.strokeStyle = $brushColor;
		ctx.lineWidth = $brushSize;
		ctx.lineCap = 'round';

		ctx.beginPath();
		if ($currentTool === 'line') {
			ctx.moveTo(startPos.x, startPos.y);
			ctx.lineTo(x, y);
		} else if ($currentTool === 'rect') {
			ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
		} else if ($currentTool === 'ellipse') {
			const rx = Math.abs(x - startPos.x) / 2;
			const ry = Math.abs(y - startPos.y) / 2;
			const cx = startPos.x + (x - startPos.x) / 2;
			const cy = startPos.y + (y - startPos.y) / 2;
			ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
		}
		ctx.stroke();
		ctx.restore();
	}

	function commitShape(x: number, y: number) {
		const ctx = getActiveCtx();
		if (!ctx) return;
		ctx.save();
		ctx.globalAlpha = $brushOpacity / 100;
		ctx.strokeStyle = $brushColor;
		ctx.lineWidth = $brushSize;
		ctx.lineCap = 'round';

		ctx.beginPath();
		if ($currentTool === 'line') {
			ctx.moveTo(startPos.x, startPos.y);
			ctx.lineTo(x, y);
		} else if ($currentTool === 'rect') {
			ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
		} else if ($currentTool === 'ellipse') {
			const rx = Math.abs(x - startPos.x) / 2;
			const ry = Math.abs(y - startPos.y) / 2;
			const cx = startPos.x + (x - startPos.x) / 2;
			const cy = startPos.y + (y - startPos.y) / 2;
			ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
		}
		ctx.stroke();
		ctx.restore();
	}

	function clearPreview() {
		if (interactionCanvas) {
			const ctx = interactionCanvas.getContext('2d');
			ctx?.clearRect(0, 0, $canvasSize.width, $canvasSize.height);
		}
	}

	function sampleColor(x: number, y: number) {
		const temp = document.createElement('canvas');
		temp.width = $canvasSize.width;
		temp.height = $canvasSize.height;
		const tCtx = temp.getContext('2d');
		if (!tCtx) return;

		$layers.forEach((l) => {
			if (l.visible) {
				const el = document.getElementById(`layer-canvas-${l.id}`) as HTMLCanvasElement;
				if (el) tCtx.drawImage(el, 0, 0);
			}
		});

		const pixel = tCtx.getImageData(x, y, 1, 1).data;
		if (pixel[3] > 0) {
			const hex =
				'#' + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
			brushColor.set(hex);
			currentTool.set('brush');
		}
	}

	function floodFill(startX: number, startY: number, fillHex: string) {
		const ctx = getActiveCtx();
		if (!ctx) return;
		const imgData = ctx.getImageData(0, 0, $canvasSize.width, $canvasSize.height);
		const data = imgData.data;

		let c = fillHex.replace('#', '');
		if (c.length === 3)
			c = c
				.split('')
				.map((s) => s + s)
				.join('');
		const tr = parseInt(c.substring(0, 2), 16);
		const tg = parseInt(c.substring(2, 4), 16);
		const tb = parseInt(c.substring(4, 6), 16);

		const startIdx = (startY * $canvasSize.width + startX) * 4;
		const sr = data[startIdx],
			sg = data[startIdx + 1],
			sb = data[startIdx + 2],
			sa = data[startIdx + 3];

		if (sr === tr && sg === tg && sb === tb && sa === 255) return;

		const queue: [number, number][] = [[startX, startY]];
		const width = $canvasSize.width;
		const height = $canvasSize.height;

		while (queue.length > 0) {
			const [cx, cy] = queue.pop()!;
			const idx = (cy * width + cx) * 4;

			if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
				if (
					data[idx] === sr &&
					data[idx + 1] === sg &&
					data[idx + 2] === sb &&
					data[idx + 3] === sa
				) {
					data[idx] = tr;
					data[idx + 1] = tg;
					data[idx + 2] = tb;
					data[idx + 3] = 255;
					queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
				}
			}
		}
		ctx.putImageData(imgData, 0, 0);
	}

	export function exportMergedPNG() {
		const temp = document.createElement('canvas');
		temp.width = $canvasSize.width;
		temp.height = $canvasSize.height;
		const ctx = temp.getContext('2d');
		if (!ctx) return;

		$layers.forEach((l) => {
			if (l.visible) {
				const el = document.getElementById(`layer-canvas-${l.id}`) as HTMLCanvasElement;
				if (el) ctx.drawImage(el, 0, 0);
			}
		});

		const a = document.createElement('a');
		a.href = temp.toDataURL('image/png');
		a.download = `avero-artwork-${Date.now()}.png`;
		a.click();
	}
</script>

<div
	bind:this={canvasContainer}
	class="relative overflow-hidden rounded-xl bg-white shadow-2xl transition-transform duration-150 select-none"
	style="width: {$canvasSize.width}px; height: {$canvasSize.height}px; transform: scale({$zoomScale}) translate({$panOffset.x}px, {$panOffset.y}px);"
>
	{#each $layers as layer, index (layer.id)}
		<canvas
			id={`layer-canvas-${layer.id}`}
			width={$canvasSize.width}
			height={$canvasSize.height}
			class="pointer-events-none absolute inset-0"
			style="z-index: {index}; display: {layer.visible ? 'block' : 'none'};"
		></canvas>
	{/each}

	<canvas
		bind:this={interactionCanvas}
		width={$canvasSize.width}
		height={$canvasSize.height}
		class="absolute inset-0 z-50 cursor-crosshair touch-none"
		onmousedown={handlePointerDown}
		onmousemove={handlePointerMove}
		onmouseup={handlePointerUp}
		onmouseleave={handlePointerUp}
		ontouchstart={(e) => {
			e.preventDefault();
			handlePointerDown(e);
		}}
		ontouchmove={(e) => {
			e.preventDefault();
			handlePointerMove(e);
		}}
		ontouchend={(e) => {
			e.preventDefault();
			handlePointerUp(e);
		}}
	></canvas>
</div>
