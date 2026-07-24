<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		hardwareData,
		pingLatency,
		audioLatency,
		upTimeSeconds,
		batteryLevel,
		isCharging,
		connectionStats,
		locationFix,
		memoryUsagePercent
	} from './stores';
	import TelemetryCard from './TelemetryCard.svelte';

	// Battery Manager API Interface definition
	interface BatteryManager extends EventTarget {
		charging: boolean;
		level: number;
		onchargingchange: (() => void) | null;
		onlevelchange: (() => void) | null;
	}

	interface ExtendedNavigator extends Navigator {
		getBattery?: () => Promise<BatteryManager>;
		connection?: { effectiveType?: string; downlink?: number };
		mozConnection?: { effectiveType?: string; downlink?: number };
		webkitConnection?: { effectiveType?: string; downlink?: number };
	}

	interface ExtendedPerformanceMemory {
		usedJSHeapSize: number;
		jsHeapSizeLimit: number;
	}

	let refreshRate = $state('Estimating...');
	let orientationType = $state('Unknown');
	let screenWidth = $state(0);
	let screenHeight = $state(0);
	let intervalIds: ReturnType<typeof setInterval>[] = [];

	function checkSystemTelemetry() {
		const ua = navigator.userAgent;
		const navData = navigator as Navigator & { userAgentData?: { platform: string } };
		const platformStr = navData.userAgentData?.platform || navigator.platform || '';

		let osName = 'Web Application Environment';
		let osEmoji = '🌐';

		const osProfiles = [
			{ test: /Android/i, name: 'Android OS', emoji: '🤖' },
			{ test: /iPhone|iPad|iPod/i, name: 'iOS Environment', emoji: '🍏' },
			{ test: /CrOS/i, name: 'ChromeOS', emoji: '💻' },
			{ test: /Windows/i, name: 'Windows OS', emoji: '🪟' },
			{ test: /Macintosh|Mac OS X/i, name: 'macOS', emoji: '🍎' },
			{ test: /Linux/i, name: 'Linux', emoji: '🐧' }
		];

		for (const profile of osProfiles) {
			if (profile.test.test(ua) || profile.test.test(platformStr)) {
				osName = profile.name;
				osEmoji = profile.emoji;
				break;
			}
		}

		let engine = 'Unknown Core';
		if (ua.includes('Firefox')) engine = 'Gecko (Firefox)';
		else if (ua.includes('Chrome')) engine = 'Blink (Chromium Engine)';
		else if (ua.includes('Safari') && !ua.includes('Chrome')) engine = 'WebKit (Safari)';

		hardwareData.update((current) => ({
			...current,
			os: osName,
			osLogoUrl: osEmoji, // Replaced URL with emoji string
			browserEngine: engine,
			platform: platformStr || 'Web App Sandbox',
			locale: navigator.language || 'en-US',
			cpuLogical: navigator.hardwareConcurrency || 'Generic',
			themePreference:
				window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
					? 'Light'
					: 'Dark'
		}));
	}

	function sniffGraphicsPipe() {
		try {
			const canvas = document.createElement('canvas');
			const gl = (canvas.getContext('webgl') ||
				canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
			if (!gl) {
				hardwareData.update((d) => ({ ...d, gpuRenderer: 'Software Canvas Fallback' }));
				return;
			}
			const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
			const renderer = debugInfo
				? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string)
				: (gl.getParameter(gl.RENDERER) as string);
			hardwareData.update((d) => ({ ...d, gpuRenderer: renderer }));
		} catch {
			hardwareData.update((d) => ({ ...d, gpuRenderer: 'Access Denied' }));
		}
	}

	function calculatePingEcho() {
		const start = Date.now();
		fetch('https://www.google.com/generate_204', { mode: 'no-cors' })
			.then(() => pingLatency.set(Date.now() - start))
			.catch(() => pingLatency.set('Offline'));
	}

	function calculateAudioProcessingLatency() {
		try {
			const AudioContextClass =
				window.AudioContext ||
				(window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!AudioContextClass) return;
			const ctx = new AudioContextClass();
			const latency = (ctx as AudioContext & { outputLatency?: number }).outputLatency
				? Math.round((ctx as AudioContext & { outputLatency: number }).outputLatency * 1000)
				: 'N/A';
			audioLatency.set(latency);
			ctx.close().catch(() => {});
		} catch {
			audioLatency.set('Blocked');
		}
	}

	function scanGeolocationalFix() {
		if (!navigator.geolocation) {
			locationFix.update((l) => ({ ...l, status: 'UNSUPPORTED' }));
			return;
		}
		locationFix.update((l) => ({ ...l, status: 'ACQUIRING', lat: 'Scanning...' }));
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				locationFix.set({
					lat: pos.coords.latitude.toFixed(5),
					lon: pos.coords.longitude.toFixed(5),
					accuracy: `±${Math.round(pos.coords.accuracy)}m`,
					status: 'LOCKED'
				});
			},
			() => {
				locationFix.set({ lat: 'Refused', lon: 'N/A', accuracy: 'N/A', status: 'DENIED' });
			},
			{ enableHighAccuracy: true, timeout: 6000 }
		);
	}

	function updateNetworkStatus() {
		const nav = navigator as ExtendedNavigator;
		const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
		connectionStats.set({
			type: conn?.effectiveType || 'Ethernet/Wi-Fi Connection',
			downlink: conn?.downlink || 0,
			isOnline: navigator.onLine
		});
	}

	function checkMemoryAllocations() {
		const mem = (performance as Performance & { memory?: ExtendedPerformanceMemory }).memory;
		if (mem) {
			hardwareData.update((d) => ({
				...d,
				ramUsed: Math.round(mem.usedJSHeapSize / 1048576),
				ramTotal: Math.round(mem.jsHeapSizeLimit / 1048576)
			}));
		}
	}

	function runScreenRefreshRateSniffer() {
		let frames = 0;
		let start = performance.now();
		const loop = () => {
			frames++;
			const diff = performance.now() - start;
			if (diff >= 1000) {
				refreshRate = `${Math.round((frames * 1000) / diff)} Hz`;
			} else {
				requestAnimationFrame(loop);
			}
		};
		requestAnimationFrame(loop);
	}

	function monitorDisplayMetrics() {
		screenWidth = window.screen.width;
		screenHeight = window.screen.height;
		orientationType = window.screen.orientation ? window.screen.orientation.type : 'Standard';
	}

	onMount(() => {
		checkSystemTelemetry();
		sniffGraphicsPipe();
		monitorDisplayMetrics();
		runScreenRefreshRateSniffer();
		updateNetworkStatus();
		calculateAudioProcessingLatency();
		calculatePingEcho();

		const nav = navigator as ExtendedNavigator;
		if (nav.getBattery) {
			nav
				.getBattery()
				.then((batt: BatteryManager) => {
					const sync = () => {
						batteryLevel.set(Math.floor(batt.level * 100));
						isCharging.set(batt.charging);
					};
					sync();
					batt.onlevelchange = sync;
					batt.onchargingchange = sync;
				})
				.catch(() => {
					batteryLevel.set(100);
					isCharging.set(true);
				});
		} else {
			batteryLevel.set(100);
			isCharging.set(true);
		}

		window.addEventListener('resize', monitorDisplayMetrics);
		window.addEventListener('online', updateNetworkStatus);
		window.addEventListener('offline', updateNetworkStatus);

		intervalIds.push(setInterval(() => upTimeSeconds.update((n) => n + 1), 1000));
		intervalIds.push(setInterval(checkMemoryAllocations, 2000));
		intervalIds.push(setInterval(calculatePingEcho, 5000));

		checkMemoryAllocations();
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', monitorDisplayMetrics);
			window.removeEventListener('online', updateNetworkStatus);
			window.removeEventListener('offline', updateNetworkStatus);
		}
		intervalIds.forEach(clearInterval);
	});
</script>

<div
	class="flex min-h-screen scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent items-center justify-center overflow-y-auto bg-black p-4 font-sans tracking-tight text-slate-200 antialiased md:p-12"
>
	<div
		class="w-full max-w-5xl rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4 md:p-12"
	>
		<header
			class="mb-10 flex flex-col items-start justify-between gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-end"
		>
			<div>
				<h1 class="font-mono text-2xl font-black tracking-tighter text-white uppercase sm:text-3xl">
					Avero Advanced <span class="text-[#9999FF]">Fetch</span>
				</h1>
				<p
					class="mt-2 flex items-center gap-2 text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
				>
					<span
						class="h-2 w-2 rounded-full bg-emerald-500 {$connectionStats.isOnline
							? 'animate-ping'
							: 'bg-red-500'}"
					></span>
					Hardware Machine &amp; Sandbox Pipeline Registry
				</p>
			</div>
			<div
				class="flex gap-x-4 gap-y-1 text-left font-mono text-xs text-zinc-500 sm:flex-col sm:text-right"
			>
				<div>PING LATENCY: <span class="font-bold text-[#9999FF]">{$pingLatency}ms</span></div>
				<div>UPTIME PIPELINE: <span class="text-white">{$upTimeSeconds}s</span></div>
			</div>
		</header>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<div class="md:col-span-1">
				<div
					class="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/1 p-6 text-center backdrop-blur-md transition duration-300 hover:border-[#9999FF]/20"
				>
					<!-- Replaced <img> element with text node displaying the local emoji string -->
					<div
						class="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/5 bg-white/2 text-5xl shadow-[0_0_20px_rgba(153,153,255,0.05)]"
					>
						{$hardwareData.osLogoUrl}
					</div>
					<h2 class="text-xl font-black tracking-tight text-white">{$hardwareData.os}</h2>
					<p class="mt-1 font-mono text-xs text-[#9999FF]">{$hardwareData.browserEngine}</p>

					<div
						class="mt-6 w-full space-y-3 border-t border-white/4 pt-4 text-left font-mono text-xs"
					>
						<div class="flex justify-between">
							<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>Host Archetype</span
							>
							<span class="font-bold text-zinc-300">{$hardwareData.platform}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>User Locale</span
							>
							<span class="text-zinc-300">{$hardwareData.locale}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:col-span-2">
				<TelemetryCard title="Silicon Hardware Profiles">
					<div class="space-y-3 font-mono text-xs">
						<div class="flex justify-between border-b border-white/2 py-1">
							<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>CPU Core Matrix</span
							>
							<span class="font-bold text-white">{$hardwareData.cpuLogical} Threads</span>
						</div>
						<div class="flex flex-col border-b border-white/2 py-1">
							<span class="mb-0.5 text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>GPU Pipe Graphics Acceleration</span
							>
							<span class="truncate text-[11px] text-zinc-300" title={$hardwareData.gpuRenderer}
								>{$hardwareData.gpuRenderer}</span
							>
						</div>
						<div class="flex justify-between py-1">
							<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>Audio Driver Engine Latency</span
							>
							<span class="text-zinc-300">{$audioLatency} ms</span>
						</div>
					</div>
				</TelemetryCard>

				<TelemetryCard title="Workspace Topology Metrics">
					<div class="space-y-3 font-mono text-xs">
						<div class="flex justify-between border-b border-white/2 py-1">
							<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>Display Canvas Size</span
							>
							<span class="font-bold text-white">{screenWidth} × {screenHeight} px</span>
						</div>
						<div class="flex justify-between border-b border-white/2 py-1">
							<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>Orientation Node</span
							>
							<span class="text-[11px] font-bold text-white uppercase">{orientationType}</span>
						</div>
						<div class="flex justify-between border-b border-white/2 py-1">
							<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>Estimated Refresh Rate</span
							>
							<span class="font-bold text-[#9999FF]">{refreshRate}</span>
						</div>
						<div class="flex justify-between py-1">
							<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>Preferred Visual Mode</span
							>
							<span class="font-bold text-zinc-400 uppercase"
								>{$hardwareData.themePreference} Theme</span
							>
						</div>
					</div>
				</TelemetryCard>

				<TelemetryCard title="Infrastructure Framework">
					<div class="space-y-3 font-mono text-xs">
						<div class="flex justify-between border-b border-white/2 py-1">
							<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>Network Gateway Node</span
							>
							<span class="max-w-[150px] truncate text-white">{$connectionStats.type}</span>
						</div>
						<div class="flex justify-between border-b border-white/2 py-1">
							<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
								>Downlink Bandwidth Capacity</span
							>
							<span class="font-bold text-zinc-300">{$connectionStats.downlink} Mbps</span>
						</div>
						<div class="flex flex-col py-1">
							<div class="mb-1 flex items-center justify-between">
								<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
									>Active Power State Container</span
								>
								<span
									class="text-xs font-bold {$isCharging ? 'text-emerald-400' : 'text-amber-400'}"
								>
									{$batteryLevel}% {$isCharging ? '[AC]' : '[BATT]'}
								</span>
							</div>
							<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
								<div
									class="h-full bg-emerald-500 transition-all duration-500 {$isCharging
										? 'animate-[pulse_1.5s_infinite]'
										: ''}"
									style="width: {$batteryLevel}%"
								></div>
							</div>
						</div>
					</div>
				</TelemetryCard>

				<TelemetryCard title="Dynamic System Memory Tracker">
					<div class="flex h-full flex-col justify-between font-mono text-xs">
						{#if $hardwareData.ramTotal !== 'Unsupported'}
							<div class="space-y-3">
								<div class="flex justify-between border-b border-white/2 py-1">
									<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
										>Allocated Heap V8 Used</span
									>
									<span class="text-white">{$hardwareData.ramUsed} MB</span>
								</div>
								<div class="flex justify-between border-b border-white/2 py-1">
									<span class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
										>Total V8 Heap Bound Limit</span
									>
									<span class="text-zinc-400">{$hardwareData.ramTotal} MB</span>
								</div>
							</div>
							<div class="mt-4">
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
									<div
										class="h-full bg-[#9999FF] shadow-[0_0_15px_rgba(153,153,255,0.6)] transition-all duration-300"
										style="width: {$memoryUsagePercent}%"
									></div>
								</div>
								<div class="mt-2 text-right text-[9px] tracking-widest text-zinc-500 uppercase">
									HEAP OVERHEAD CAPACITY: {$memoryUsagePercent}%
								</div>
							</div>
						{:else}
							<div
								class="flex h-full flex-col items-center justify-center py-4 text-center text-zinc-500"
							>
								<span class="mb-1 text-lg">🔒</span>
								<span class="text-[10px] tracking-wide uppercase"
									>V8 Performance Memory API Blocked or Unsupported by Host</span
								>
							</div>
						{/if}
					</div>
				</TelemetryCard>
			</div>
		</div>

		<section
			class="mt-6 rounded-2xl border border-white/5 bg-white/1 p-6 backdrop-blur-md transition duration-300 hover:border-[#9999FF]/20"
		>
			<div class="mb-4 flex items-center justify-between">
				<span class="font-mono text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>Spatial Telemetry Hardware Grid</span
				>
				<button
					onclick={scanGeolocationalFix}
					class="rounded-lg bg-[#9999FF] px-4 py-1.5 text-[10px] font-bold tracking-wider text-black uppercase shadow-[0_4px_12px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_15px_rgba(153,153,255,0.35)]"
				>
					{#if $locationFix.status === 'ACQUIRING'}
						LOCKING MATRIX...
					{:else}
						SCAN FIX
					{/if}
				</button>
			</div>
			<div class="grid grid-cols-1 gap-4 font-mono text-xs sm:grid-cols-3">
				<div class="rounded-xl border border-white/5 bg-black/40 p-3">
					<span class="mb-1 block text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
						>LATITUDE FIX CORRIDOR</span
					>
					<span class="font-bold text-white">{$locationFix.lat}</span>
				</div>
				<div class="rounded-xl border border-white/5 bg-black/40 p-3">
					<span class="mb-1 block text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
						>LONGITUDE FIX CORRIDOR</span
					>
					<span class="font-bold text-white">{$locationFix.lon}</span>
				</div>
				<div class="rounded-xl border border-white/5 bg-black/40 p-3">
					<span class="mb-1 block text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
						>METRIC ACCURACY RADIUS</span
					>
					<span class="font-bold text-[#9999FF]">{$locationFix.accuracy}</span>
				</div>
			</div>
		</section>
	</div>
</div>
