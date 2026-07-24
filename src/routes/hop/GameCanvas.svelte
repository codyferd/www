<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gameState, score, highScore, speedMultiplier, configMatrix } from './stores';

	// 1. Declare the children snippet prop interface
	let { children }: { children?: import('svelte').Snippet } = $props();

	let canvasRef = $state<HTMLCanvasElement | null>(null);
	let containerRef = $state<HTMLDivElement | null>(null);
	let animationFrameId: number;

	// Virtual Internal Dimension Coordinates
	const V_WIDTH = 800;
	const V_HEIGHT = 240;
	const GROUND_Y = 200;

	// Player Entity Struct
	const player = {
		x: 80,
		y: GROUND_Y - 32,
		w: 24,
		h: 32,
		vy: 0,
		gravity: 0.6,
		jumpForce: -11.5,
		isGrounded: false,
		rotation: 0
	};

	interface Obstacle {
		x: number;
		y: number;
		w: number;
		h: number;
		color: string;
	}

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		size: number;
		alpha: number;
		color: string;
	}

	let obstacles: Obstacle[] = [];
	let particles: Particle[] = [];
	let baseSpeed = 5.5;
	let obstacleSpawnTimer = 0;
	let nextSpawnInterval = 100;

	// Trigger Runner Jump Physics
	export function triggerJump() {
		if ($gameState !== 'RUNNING') return;
		if (player.isGrounded) {
			player.vy = player.jumpForce;
			player.isGrounded = false;

			// Generate elegant burst particles off ground impact
			for (let i = 0; i < 6; i++) {
				particles.push({
					x: player.x + player.w / 2,
					y: player.y + player.h,
					vx: -1 - Math.random() * 2,
					vy: (Math.random() - 0.5) * 2,
					size: Math.random() * 3 + 1,
					alpha: 1,
					color: 'rgba(153, 153, 255, 0.6)' // Lavender Spark
				});
			}
		}
	}

	export function startEngineCycle() {
		gameState.set('RUNNING');
		score.set(0);
		speedMultiplier.set(1.0);
		obstacles = [];
		particles = [];

		player.y = GROUND_Y - player.h;
		player.vy = 0;
		player.isGrounded = true;
		player.rotation = 0;

		obstacleSpawnTimer = 0;
		nextSpawnInterval = 80;
	}

	function spawnObstacle() {
		const baseMaxHeight = $configMatrix.height;
		const randomnessFactor = $configMatrix.randomness / 100;

		let ow = 16;
		let oh = baseMaxHeight;

		if (randomnessFactor > 0) {
			const variance = Math.random() * baseMaxHeight * randomnessFactor;
			oh = Math.max(
				16,
				Math.min(
					120,
					baseMaxHeight - variance * 0.5 + (Math.random() > 0.5 ? variance * 0.5 : -variance * 0.3)
				)
			);
			ow = Math.max(12, Math.min(36, 20 + (Math.random() - 0.5) * 12 * randomnessFactor));
		}

		obstacles.push({
			x: V_WIDTH,
			y: GROUND_Y - Math.round(oh),
			w: Math.round(ow),
			h: Math.round(oh),
			color: Math.random() > 0.6 ? '#B3B3FF' : '#9999FF' // Avero Primary Accent Scales
		});
	}

	function updatePhysics() {
		score.update((n) => n + 0.15);
		speedMultiplier.set(1.0 + Math.floor($score / 250) * 0.12);
		const currentSpeed = baseSpeed * $speedMultiplier;

		player.vy += player.gravity;
		player.y += player.vy;

		if (player.y >= GROUND_Y - player.h) {
			player.y = GROUND_Y - player.h;
			player.vy = 0;
			player.isGrounded = true;
			player.rotation = 0;
		} else {
			player.rotation += 0.07;
		}

		obstacleSpawnTimer++;
		if (obstacleSpawnTimer >= nextSpawnInterval) {
			spawnObstacle();
			obstacleSpawnTimer = 0;

			const baseInterval = 65 - $speedMultiplier * 10;
			const varianceRange = 50 * ($configMatrix.intervalSpread / 100);

			nextSpawnInterval = baseInterval + (Math.random() * varianceRange * 2 - varianceRange);
			if (nextSpawnInterval < 35) nextSpawnInterval = 35;
		}

		// Structural Hitbox Collision Matrices
		for (let i = obstacles.length - 1; i >= 0; i--) {
			const obs = obstacles[i];
			obs.x -= currentSpeed;

			if (
				player.x < obs.x + obs.w &&
				player.x + player.w > obs.x &&
				player.y < obs.y + obs.h &&
				player.y + player.h > obs.y
			) {
				gameState.set('GAMEOVER');
				triggerImpactExplosion();
				if ($score > $highScore) {
					highScore.set(Math.floor($score));
					localStorage.setItem('averohop_highscore', String(Math.floor($score)));
				}
				return;
			}

			if (obs.x + obs.w < 0) {
				obstacles.splice(i, 1);
			}
		}

		for (let i = particles.length - 1; i >= 0; i--) {
			const p = particles[i];
			p.x += p.vx;
			p.y += p.vy;
			p.alpha -= 0.02;
			if (p.alpha <= 0) particles.splice(i, 1);
		}
	}

	function triggerImpactExplosion() {
		for (let i = 0; i < 35; i++) {
			particles.push({
				x: player.x + player.w / 2,
				y: player.y + player.h / 2,
				vx: (Math.random() - 0.5) * 10,
				vy: (Math.random() - 0.7) * 12,
				size: Math.random() * 4 + 2,
				alpha: 1,
				color: i % 2 === 0 ? '#EF4444' : '#9999FF'
			});
		}
	}

	function renderFrames() {
		if (!canvasRef) return;
		const ctx = canvasRef.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

		const dpr = window.devicePixelRatio || 1;
		const sX = (canvasRef.width / dpr / V_WIDTH) * dpr;
		const sY = (canvasRef.height / dpr / V_HEIGHT) * dpr;

		if (canvasRef.width === 0 || canvasRef.height === 0) return;

		ctx.save();
		ctx.scale(sX, sY);

		// 1. Render Quantum Floor Bed
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(0, GROUND_Y);
		ctx.lineTo(V_WIDTH, GROUND_Y);
		ctx.stroke();

		ctx.strokeStyle = '#9999FF';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(0, GROUND_Y + 4);
		ctx.lineTo(V_WIDTH, GROUND_Y + 4);
		ctx.stroke();

		// 2. Render Obstacles
		obstacles.forEach((obs) => {
			ctx.fillStyle = obs.color;
			ctx.shadowBlur = 12;
			ctx.shadowColor = obs.color;
			ctx.beginPath();
			ctx.roundRect(obs.x, obs.y, obs.w, obs.h, [4, 4, 0, 0]);
			ctx.fill();
			ctx.shadowBlur = 0;
		});

		// 3. Render Tail Blast Particles
		particles.forEach((p) => {
			ctx.save();
			ctx.globalAlpha = Math.max(0, p.alpha);
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		});

		// 4. Render Core Node (Player)
		if ($gameState !== 'GAMEOVER') {
			ctx.save();
			ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
			ctx.rotate(player.rotation);

			ctx.fillStyle = '#FFFFFF';
			ctx.shadowBlur = 16;
			ctx.shadowColor = '#9999FF';
			ctx.beginPath();
			ctx.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, 6);
			ctx.fill();

			// Direct Forward Pointer Sensor Eye
			ctx.fillStyle = '#9999FF';
			ctx.fillRect(2, -10, 8, 3);
			ctx.restore();
		}

		ctx.restore();
	}

	function runMasterEngineLoop() {
		if ($gameState === 'RUNNING') {
			updatePhysics();
		}
		renderFrames();
		animationFrameId = requestAnimationFrame(runMasterEngineLoop);
	}

	function resizeViewport() {
		if (!canvasRef || !containerRef) return;
		const rect = containerRef.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			const dpr = window.devicePixelRatio || 1;
			canvasRef.width = rect.width * dpr;
			canvasRef.height = rect.height * dpr;
		}
	}

	onMount(() => {
		highScore.set(parseInt(localStorage.getItem('averohop_highscore') || '0'));
		resizeViewport();
		window.addEventListener('resize', resizeViewport);
		runMasterEngineLoop();
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', resizeViewport);
		}
		cancelAnimationFrame(animationFrameId);
	});
</script>

<div
	bind:this={containerRef}
	class="relative h-[280px] w-full touch-none overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-black to-[#090915] shadow-[0_20px_50px_rgba(0,0,0,0.8)] sm:h-[340px]"
>
	<div class="bg-grid-pattern pointer-events-none absolute inset-0 opacity-10"></div>
	<canvas bind:this={canvasRef} class="absolute inset-0 block h-full w-full"></canvas>

	<!-- Safely execute the passed layout template snippet if it exists -->
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.bg-grid-pattern {
		background-image:
			linear-gradient(to right, rgba(153, 153, 255, 0.2) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(153, 153, 255, 0.2) 1px, transparent 1px);
		background-size: 30px 30px;
		transform: perspective(200px) rotateX(60deg);
		transform-origin: top;
		bottom: -50px;
	}
</style>
