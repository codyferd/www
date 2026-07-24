<script lang="ts">
	import { onMount } from 'svelte';
	import { type ChartSettings, type ChartDataNode } from './charts';

	let {
		settings,
		nodes
	}: {
		settings: ChartSettings;
		nodes: ChartDataNode[];
	} = $props();

	let canvasElement = $state<HTMLCanvasElement | null>(null);

	const drawChart = () => {
		if (!canvasElement) return;
		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const width = canvasElement.offsetWidth;
		const height = canvasElement.offsetHeight;

		// Scaled resolution handler
		canvasElement.width = width * dpr;
		canvasElement.height = height * dpr;
		ctx.scale(dpr, dpr);

		// Core theme force lock: Pitch Black Background
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, width, height);

		const visibleNodes = nodes.filter((n) => n.visible);
		const centerX = width / 2;
		const centerY = height / 2;
		const radius = Math.min(centerX, centerY) - 50;
		const padding = 60;

		if (visibleNodes.length === 0) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
			ctx.font = '10px ui-monospace, monospace';
			ctx.textAlign = 'center';
			ctx.fillText('NO SYSTEM DATA SEGMENTS LOADED', centerX, centerY);
			return;
		}

		const totalValueSum = visibleNodes.reduce((acc, curr) => acc + (curr.value || 0), 0) || 1;
		const totalElements = visibleNodes.length;

		// Brand Colors Configuration
		const gridColor = 'rgba(255, 255, 255, 0.05)';
		const accentColor = '#9999FF';
		const textColor = '#ffffff';
		const subtextColor = 'rgba(255, 255, 255, 0.4)';

		// ----------------------------------------------------
		// VISUALIZER RENDER: TIME CHART / AREA CHART
		// ----------------------------------------------------
		if (settings.type === 'time' || settings.type === 'area') {
			const graphWidth = width - padding * 2;
			const graphHeight = height - padding * 2;
			const intervalCount = settings.timeLabels.length;
			const stepX = graphWidth / (intervalCount - 1 || 1);

			let peakValue = 10;
			visibleNodes.forEach((node) => {
				node.history.forEach((v) => {
					if (v > peakValue) peakValue = v;
				});
			});
			peakValue = Math.ceil(peakValue * 1.15);

			// Draw Background Grid Lines
			if (settings.showGrid) {
				ctx.strokeStyle = gridColor;
				ctx.lineWidth = 1;
				for (let i = 0; i <= 4; i++) {
					const ratio = i / 4;
					const yTick = height - padding - ratio * graphHeight;
					ctx.beginPath();
					ctx.moveTo(padding, yTick);
					ctx.lineTo(width - padding, yTick);
					ctx.stroke();

					ctx.fillStyle = subtextColor;
					ctx.font = '9px ui-monospace, monospace';
					ctx.textAlign = 'right';
					ctx.fillText(Math.round(ratio * peakValue).toString(), padding - 10, yTick + 3);
				}
			}

			// Draw Boundary Axis
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(padding, padding);
			ctx.lineTo(padding, height - padding);
			ctx.lineTo(width - padding, height - padding);
			ctx.stroke();

			// Time X Axis Labels
			settings.timeLabels.forEach((label, index) => {
				const xLabelPos = padding + index * stepX;
				ctx.fillStyle = textColor;
				ctx.font = '9px ui-monospace, monospace';
				ctx.textAlign = 'center';
				ctx.fillText(label.toUpperCase(), xLabelPos, height - padding + 20);
			});

			// Data Paths
			visibleNodes.forEach((node) => {
				const points: { x: number; y: number }[] = [];
				node.history.forEach((val, idx) => {
					const posX = padding + idx * stepX;
					const posY = height - padding - (val / peakValue) * graphHeight;
					points.push({ x: posX, y: posY });
				});

				// Render Area Under curves
				if (settings.type === 'area' && points.length > 0) {
					ctx.beginPath();
					ctx.moveTo(points[0].x, height - padding);
					points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
					ctx.lineTo(points[points.length - 1].x, height - padding);
					ctx.closePath();
					ctx.fillStyle = node.color + '15'; // Soft alpha glow mapping
					ctx.fill();
				}

				// Render Line vectors
				ctx.beginPath();
				ctx.lineWidth = 2.5;
				ctx.strokeStyle = node.color;

				if (settings.smoothLines && points.length > 2) {
					ctx.moveTo(points[0].x, points[0].y);
					for (let i = 0; i < points.length - 1; i++) {
						const xc = (points[i].x + points[i + 1].x) / 2;
						const yc = (points[i].y + points[i + 1].y) / 2;
						ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
					}
					ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
				} else {
					points.forEach((pt, idx) => {
						if (idx === 0) ctx.moveTo(pt.x, pt.y);
						else ctx.lineTo(pt.x, pt.y);
					});
				}
				ctx.stroke();

				// Metric Target Dot Joints
				points.forEach((pt, idx) => {
					ctx.beginPath();
					ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
					ctx.fillStyle = node.color;
					ctx.fill();
					ctx.strokeStyle = '#000000';
					ctx.lineWidth = 1.5;
					ctx.stroke();

					if (settings.showValues) {
						ctx.fillStyle = textColor;
						ctx.font = '8px ui-monospace, monospace';
						ctx.textAlign = 'center';
						ctx.fillText(node.history[idx].toString(), pt.x, pt.y - 8);
					}
				});
			});
		}
		// ----------------------------------------------------
		// VISUALIZER RENDER: PIE / DOUGHNUT CHART
		// ----------------------------------------------------
		else if (settings.type === 'pie' || settings.type === 'doughnut') {
			let startAngle = 0;
			visibleNodes.forEach((node) => {
				const sliceAngle = ((node.value || 0) / totalValueSum) * (2 * Math.PI);
				ctx.beginPath();
				ctx.moveTo(centerX, centerY);
				ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
				ctx.closePath();
				ctx.fillStyle = node.color;
				ctx.fill();
				startAngle += sliceAngle;
			});

			if (settings.type === 'doughnut') {
				ctx.beginPath();
				ctx.arc(centerX, centerY, radius * 0.65, 0, 2 * Math.PI);
				ctx.fillStyle = '#000000'; // Lock center knockout background to pure pitch black
				ctx.fill();
			}
		}
		// ----------------------------------------------------
		// VISUALIZER RENDER: BAR CHART
		// ----------------------------------------------------
		else if (settings.type === 'bar') {
			const graphWidth = width - padding * 2;
			const graphHeight = height - padding * 2;
			const barGap = 16;
			const barWidth = graphWidth / totalElements - barGap;
			const maxValue = Math.max(...visibleNodes.map((n) => n.value || 0), 1);

			if (settings.showGrid) {
				ctx.strokeStyle = gridColor;
				ctx.lineWidth = 1;
				for (let i = 0; i <= 4; i++) {
					const ratio = i / 4;
					const yTick = height - padding - ratio * graphHeight;
					ctx.beginPath();
					ctx.moveTo(padding, yTick);
					ctx.lineTo(width - padding, yTick);
					ctx.stroke();
				}
			}

			visibleNodes.forEach((node, idx) => {
				const computedHeight = ((node.value || 0) / maxValue) * graphHeight;
				const x = padding + idx * (barWidth + barGap) + barGap / 2;
				const y = height - padding - computedHeight;

				ctx.fillStyle = node.color;
				ctx.fillRect(x, y, barWidth, computedHeight);

				if (settings.showValues) {
					ctx.fillStyle = textColor;
					ctx.font = '10px ui-monospace, monospace';
					ctx.textAlign = 'center';
					ctx.fillText((node.value || 0).toString(), x + barWidth / 2, y - 8);
				}
			});
		}
		// ----------------------------------------------------
		// VISUALIZER RENDER: LINE CHART
		// ----------------------------------------------------
		else if (settings.type === 'line') {
			const graphWidth = width - padding * 2;
			const graphHeight = height - padding * 2;
			const maxValue = Math.max(...visibleNodes.map((n) => n.value || 0), 1);
			const stepX = graphWidth / (totalElements > 1 ? totalElements - 1 : 1);

			if (settings.showGrid) {
				ctx.strokeStyle = gridColor;
				ctx.lineWidth = 1;
				for (let i = 0; i <= 4; i++) {
					const ratio = i / 4;
					const yTick = height - padding - ratio * graphHeight;
					ctx.beginPath();
					ctx.moveTo(padding, yTick);
					ctx.lineTo(width - padding, yTick);
					ctx.stroke();
				}
			}

			const points: { x: number; y: number; color: string; value: number }[] = [];
			visibleNodes.forEach((node, idx) => {
				const x = padding + idx * stepX;
				const y = height - padding - ((node.value || 0) / maxValue) * graphHeight;
				points.push({ x, y, color: node.color, value: node.value });
			});

			ctx.beginPath();
			ctx.lineWidth = 3;
			ctx.strokeStyle = visibleNodes[0]?.color || accentColor;

			if (settings.smoothLines && points.length > 2) {
				ctx.moveTo(points[0].x, points[0].y);
				for (let i = 0; i < points.length - 1; i++) {
					const xc = (points[i].x + points[i + 1].x) / 2;
					const yc = (points[i].y + points[i + 1].y) / 2;
					ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
				}
				ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
			} else {
				points.forEach((pt, idx) => {
					if (idx === 0) ctx.moveTo(pt.x, pt.y);
					else ctx.lineTo(pt.x, pt.y);
				});
			}
			ctx.stroke();

			points.forEach((pt) => {
				ctx.beginPath();
				ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
				ctx.fillStyle = pt.color;
				ctx.fill();
				ctx.strokeStyle = '#000000';
				ctx.lineWidth = 1.5;
				ctx.stroke();

				if (settings.showValues) {
					ctx.fillStyle = textColor;
					ctx.font = '10px ui-monospace, monospace';
					ctx.textAlign = 'center';
					ctx.fillText(pt.value.toString(), pt.x, pt.y - 10);
				}
			});
		}
		// ----------------------------------------------------
		// VISUALIZER RENDER: POLAR / RADAR
		// ----------------------------------------------------
		else if (settings.type === 'polar' || settings.type === 'radar') {
			const angleSegment = (2 * Math.PI) / totalElements;
			const maxVal = Math.max(...visibleNodes.map((n) => n.value || 0), 1);

			// Radially aligned grids
			ctx.strokeStyle = gridColor;
			ctx.lineWidth = 1;
			[0.2, 0.4, 0.6, 0.8, 1].forEach((scale) => {
				ctx.beginPath();
				ctx.arc(centerX, centerY, radius * scale, 0, 2 * Math.PI);
				ctx.stroke();
			});

			if (settings.type === 'polar') {
				let currentSliceAngle = 0;
				visibleNodes.forEach((node) => {
					const adaptiveRadius = ((node.value || 0) / maxVal) * radius;
					ctx.beginPath();
					ctx.moveTo(centerX, centerY);
					ctx.arc(
						centerX,
						centerY,
						adaptiveRadius,
						currentSliceAngle,
						currentSliceAngle + angleSegment
					);
					ctx.closePath();
					ctx.fillStyle = node.color + 'aa';
					ctx.fill();
					ctx.strokeStyle = node.color;
					ctx.lineWidth = 1;
					ctx.stroke();
					currentSliceAngle += angleSegment;
				});
			} else {
				ctx.beginPath();
				visibleNodes.forEach((node, idx) => {
					const length = ((node.value || 0) / maxVal) * radius;
					const x = centerX + length * Math.cos(idx * angleSegment - Math.PI / 2);
					const y = centerY + length * Math.sin(idx * angleSegment - Math.PI / 2);
					if (idx === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				});
				ctx.closePath();
				ctx.fillStyle = 'rgba(153, 153, 255, 0.15)'; // Pure Neon Lavender filled geometry base
				ctx.fill();
				ctx.strokeStyle = accentColor;
				ctx.lineWidth = 2.5;
				ctx.stroke();

				visibleNodes.forEach((node, idx) => {
					const length = ((node.value || 0) / maxVal) * radius;
					const x = centerX + length * Math.cos(idx * angleSegment - Math.PI / 2);
					const y = centerY + length * Math.sin(idx * angleSegment - Math.PI / 2);

					ctx.beginPath();
					ctx.arc(x, y, 4, 0, 2 * Math.PI);
					ctx.fillStyle = node.color;
					ctx.fill();
					ctx.strokeStyle = '#000000';
					ctx.stroke();
				});
			}
		}
	};

	$effect(() => {
		if (settings || nodes) {
			drawChart();
		}
	});

	onMount(() => {
		drawChart();
		const handleResize = () => drawChart();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<canvas
	bind:this={canvasElement}
	class="h-[360px] w-full max-w-full rounded-2xl border border-white/5 bg-black"
></canvas>

<style>
	canvas {
		image-rendering: -webkit-optimize-contrast;
		image-rendering: crisp-edges;
	}
</style>
