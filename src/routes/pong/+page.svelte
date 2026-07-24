<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	// Game Engine Frame Constants
	const BASE_WIDTH = 800;
	const BASE_HEIGHT = 600;
	const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT;

	// State Runes
	let pongCanvas = $state<HTMLCanvasElement | null>(null);
	let arenaWrapper = $state<HTMLDivElement | null>(null);

	let scores = $state({ p1: 0, p2: 0 });
	let gameState = $state({ running: false, gameOver: false });
	let winner = $state<number | null>(null);

	// Physics Engine Entities
	const paddleWidth = 12;
	const paddleHeight = 100;
	const ballRadius = 8;

	let p1 = $state({ x: 20, y: 250 });
	let p2 = $state({ x: 768, y: 250 });
	let ball = $state({ x: 400, y: 300, vx: 0, vy: 0, speed: 7 });

	let ctx: CanvasRenderingContext2D | null = null;
	let requestId: number | null = null;
	let resizeObserver: ResizeObserver | null = null;
	const keysPressed: Record<string, boolean> = {};

	function initBall(direction: number) {
		ball.x = BASE_WIDTH / 2;
		ball.y = BASE_HEIGHT / 2;
		ball.speed = 7;

		const angle = (Math.random() * 60 - 30) * (Math.PI / 180);
		ball.vx = direction * ball.speed * Math.cos(angle);
		ball.vy = ball.speed * Math.sin(angle);
	}

	function bounceBall(paddleY: number) {
		ball.speed = Math.min(16, ball.speed + 0.6);

		const relativeIntersectY = paddleY + paddleHeight / 2 - ball.y;
		const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
		const bounceAngle = normalizedIntersectY * (Math.PI / 3);

		const direction = ball.vx > 0 ? -1 : 1;
		ball.vx = direction * ball.speed * Math.cos(bounceAngle);
		ball.vy = ball.speed * -Math.sin(bounceAngle);
	}

	function checkMatchLimit(nextServeDirection: number) {
		if (scores.p1 >= 7) {
			winner = 1;
			gameState.running = false;
			gameState.gameOver = true;
		} else if (scores.p2 >= 7) {
			winner = 2;
			gameState.running = false;
			gameState.gameOver = true;
		} else {
			initBall(nextServeDirection);
		}
	}

	function updatePhysics() {
		if (keysPressed['KeyW'] || keysPressed['w']) p1.y = Math.max(10, p1.y - 8);
		if (keysPressed['KeyS'] || keysPressed['s'])
			p1.y = Math.min(BASE_HEIGHT - paddleHeight - 10, p1.y + 8);

		if (keysPressed['ArrowUp']) p2.y = Math.max(10, p2.y - 8);
		if (keysPressed['ArrowDown']) p2.y = Math.min(BASE_HEIGHT - paddleHeight - 10, p2.y + 8);

		ball.x += ball.vx;
		ball.y += ball.vy;

		if (ball.y - ballRadius <= 0) {
			ball.y = ballRadius;
			ball.vy = -ball.vy;
		} else if (ball.y + ballRadius >= BASE_HEIGHT) {
			ball.y = BASE_HEIGHT - ballRadius;
			ball.vy = -ball.vy;
		}

		// P1 Interception
		if (ball.vx < 0 && ball.x - ballRadius <= p1.x + paddleWidth && ball.x + ballRadius >= p1.x) {
			if (ball.y >= p1.y && ball.y <= p1.y + paddleHeight) {
				ball.x = p1.x + paddleWidth + ballRadius;
				bounceBall(p1.y);
			}
		}

		// P2 Interception
		if (ball.vx > 0 && ball.x + ballRadius >= p2.x && ball.x - ballRadius <= p2.x + paddleWidth) {
			if (ball.y >= p2.y && ball.y <= p2.y + paddleHeight) {
				ball.x = p2.x - ballRadius;
				bounceBall(p2.y);
			}
		}

		if (ball.x < 0) {
			scores.p2++;
			checkMatchLimit(1);
		} else if (ball.x > BASE_WIDTH) {
			scores.p1++;
			checkMatchLimit(-1);
		}
	}

	function renderFrame() {
		if (!ctx || !pongCanvas) return;

		ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

		// Center Net Guideline
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
		ctx.lineWidth = 4;
		ctx.setLineDash([15, 15]);
		ctx.beginPath();
		ctx.moveTo(BASE_WIDTH / 2, 0);
		ctx.lineTo(BASE_WIDTH / 2, BASE_HEIGHT);
		ctx.stroke();
		ctx.setLineDash([]);

		// Player 1 Paddle (Avero Lavender Accent)
		ctx.fillStyle = '#9999FF';
		ctx.fillRect(p1.x, p1.y, paddleWidth, paddleHeight);

		// Player 2 Paddle (Emerald Accent)
		ctx.fillStyle = '#10B981';
		ctx.fillRect(p2.x, p2.y, paddleWidth, paddleHeight);

		// Ball
		ctx.fillStyle = '#FFFFFF';
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
		ctx.fill();
	}

	function gameLoop() {
		if (!gameState.running) return;
		updatePhysics();
		renderFrame();
		requestId = requestAnimationFrame(gameLoop);
	}

	function handleResize() {
		if (!arenaWrapper || !pongCanvas) return;

		const availableWidth = arenaWrapper.clientWidth;
		const availableHeight = arenaWrapper.clientHeight;

		let finalWidth = availableWidth;
		let finalHeight = availableWidth / ASPECT_RATIO;

		if (finalHeight > availableHeight) {
			finalHeight = availableHeight;
			finalWidth = availableHeight * ASPECT_RATIO;
		}

		pongCanvas.width = BASE_WIDTH;
		pongCanvas.height = BASE_HEIGHT;

		pongCanvas.style.width = `${finalWidth}px`;
		pongCanvas.style.height = `${finalHeight}px`;

		renderFrame();
	}

	function startMatch() {
		scores.p1 = 0;
		scores.p2 = 0;
		p1.y = BASE_HEIGHT / 2 - paddleHeight / 2;
		p2.y = BASE_HEIGHT / 2 - paddleHeight / 2;

		gameState.running = true;
		gameState.gameOver = false;
		winner = null;

		initBall(Math.random() > 0.5 ? 1 : -1);

		setTimeout(() => {
			handleResize();
			gameLoop();
		}, 0);
	}

	function handleKeyDown(e: KeyboardEvent) {
		keysPressed[e.key] = true;
		keysPressed[e.code] = true;
	}

	function handleKeyUp(e: KeyboardEvent) {
		keysPressed[e.key] = false;
		keysPressed[e.code] = false;
	}

	function bindTouch(keyId: string, isPressed: boolean) {
		keysPressed[keyId] = isPressed;
	}

	onMount(() => {
		if (pongCanvas) {
			ctx = pongCanvas.getContext('2d');
		}

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		if (arenaWrapper) {
			resizeObserver = new ResizeObserver(() => handleResize());
			resizeObserver.observe(arenaWrapper);
		}

		handleResize();
	});

	onDestroy(() => {
		if (requestId !== null) cancelAnimationFrame(requestId);
		if (resizeObserver) resizeObserver.disconnect();
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('keyup', handleKeyUp);
	});
</script>

<div
	role="region"
	aria-label="Avero Pong Game Arena"
	class="relative flex h-screen w-screen touch-none flex-col overflow-hidden bg-black font-sans text-white select-none"
>
	<!-- Header HUD Panel -->
	<header
		class="z-20 flex w-full flex-none items-center justify-between border-b border-white/5 bg-white/2 px-6 py-4 backdrop-blur-xl"
	>
		<div class="flex items-center gap-3">
			<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">P1 (W/S)</span>
			<span class="font-mono text-2xl font-black text-[#9999FF] italic">{scores.p1}</span>
		</div>

		<div
			class="hidden font-mono text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase sm:block"
		>
			First to 7 Wins
		</div>

		<div class="flex items-center gap-3">
			<span class="font-mono text-2xl font-black text-emerald-400 italic">{scores.p2}</span>
			<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">P2 (▲/▼)</span>
		</div>
	</header>

	<!-- Main Max-Frame Viewport Container -->
	<main class="relative flex flex-1 items-center justify-center overflow-hidden p-2 md:p-6">
		<!-- Left Touch Controls (P1) -->
		<div class="absolute top-3 bottom-3 left-3 z-30 flex w-16 flex-col gap-3 px-1 lg:hidden">
			<button
				aria-label="Player 1 Up"
				ontouchstart={(e) => {
					e.preventDefault();
					bindTouch('w', true);
				}}
				ontouchend={(e) => {
					e.preventDefault();
					bindTouch('w', false);
				}}
				class="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-black text-[#9999FF] transition active:scale-95 active:bg-white/15"
			>
				▲
			</button>
			<button
				aria-label="Player 1 Down"
				ontouchstart={(e) => {
					e.preventDefault();
					bindTouch('s', true);
				}}
				ontouchend={(e) => {
					e.preventDefault();
					bindTouch('s', false);
				}}
				class="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-black text-[#9999FF] transition active:scale-95 active:bg-white/15"
			>
				▼
			</button>
		</div>

		<!-- Central Maximum Viewport Arena Wrapper -->
		<div
			bind:this={arenaWrapper}
			class="relative flex h-full w-full items-center justify-center rounded-[28px] border border-white/10 bg-white/2 p-2 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4 md:p-4"
		>
			<canvas bind:this={pongCanvas} class="block rounded-2xl bg-[#050505] shadow-2xl"></canvas>

			{#if !gameState.running}
				<div
					class="absolute inset-0 z-50 flex items-center justify-center rounded-[28px] bg-black/85 backdrop-blur-md"
				>
					<div class="p-6 text-center">
						<h1
							class="mb-2 text-3xl font-black tracking-tight text-white uppercase italic md:text-5xl"
						>
							{gameState.gameOver ? 'Match Concluded' : 'Avero Pong'}
						</h1>

						{#if gameState.gameOver}
							<p class="mb-6 font-mono text-xs tracking-wider text-white/50 uppercase">
								Winner:
								<span
									class={winner === 1 ? 'font-bold text-[#9999FF]' : 'font-bold text-emerald-400'}
								>
									Player {winner}
								</span>
							</p>
						{:else}
							<p class="mb-6 font-mono text-[10px] tracking-widest text-white/40 uppercase">
								P1: W/S keys | P2: Arrow keys
							</p>
						{/if}

						<button
							onclick={startMatch}
							class="rounded-xl bg-[#9999FF] px-8 py-3.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
						>
							{gameState.gameOver ? 'Rematch' : 'Launch System'}
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right Touch Controls (P2) -->
		<div class="absolute top-3 right-3 bottom-3 z-30 flex w-16 flex-col gap-3 px-1 lg:hidden">
			<button
				aria-label="Player 2 Up"
				ontouchstart={(e) => {
					e.preventDefault();
					bindTouch('ArrowUp', true);
				}}
				ontouchend={(e) => {
					e.preventDefault();
					bindTouch('ArrowUp', false);
				}}
				class="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-black text-emerald-400 transition active:scale-95 active:bg-white/15"
			>
				▲
			</button>
			<button
				aria-label="Player 2 Down"
				ontouchstart={(e) => {
					e.preventDefault();
					bindTouch('ArrowDown', true);
				}}
				ontouchend={(e) => {
					e.preventDefault();
					bindTouch('ArrowDown', false);
				}}
				class="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-black text-emerald-400 transition active:scale-95 active:bg-white/15"
			>
				▼
			</button>
		</div>
	</main>
</div>
