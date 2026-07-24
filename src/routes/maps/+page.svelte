<script lang="ts">
	import { onMount } from 'svelte';
	import L from 'leaflet';
	import 'leaflet-routing-machine';
	import 'leaflet/dist/leaflet.css';
	import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

	import {
		globalSearchQuery,
		startPoint,
		endPoint,
		routeInfo,
		activePOI,
		isInspecting,
		selectedNodeInfo,
		suggestions,
		poiTypes,
		mapInstance,
		poiLayer,
		standaloneMarkerLayer
	} from './stores';
	import {
		debounceSearch,
		selectLoc,
		planTrip,
		findPOI,
		clearAll,
		reverseGeocodeMapCoordinates
	} from './helpers';

	let mapContainer: HTMLDivElement;

	onMount(() => {
		if (!mapContainer) return;

		// Initialize Leaflet Map
		const map = L.map(mapContainer, {
			zoomControl: false,
			attributionControl: false
		}).setView([40.7128, -74.006], 12);

		L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
			maxZoom: 20
		}).addTo(map);

		const pois = L.layerGroup().addTo(map);
		const markers = L.layerGroup().addTo(map);

		mapInstance.set(map);
		poiLayer.set(pois);
		standaloneMarkerLayer.set(markers);

		map.on('click', (e: L.LeafletMouseEvent) => {
			reverseGeocodeMapCoordinates(e.latlng.lat, e.latlng.lng);
		});

		return () => {
			map.remove();
		};
	});

	function setInspectedAsRoute(type: 'start' | 'end') {
		if (!$selectedNodeInfo || $isInspecting) return;
		if (type === 'start') {
			startPoint.set($selectedNodeInfo.title);
		} else {
			endPoint.set($selectedNodeInfo.title);
		}
		selectedNodeInfo.set(null);
		$standaloneMarkerLayer?.clearLayers();
	}
</script>

<div
	class="relative flex h-screen w-screen overflow-hidden bg-black font-sans text-white select-none"
>
	<!-- Side Floating Controls -->
	<aside
		class="absolute top-5 left-5 z-1000 flex max-h-[calc(100vh-40px)] w-88 flex-col gap-4 rounded-3xl border border-white/10 bg-black/90 p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
	>
		<div>
			<h2 class="text-xl font-black tracking-tighter uppercase">
				Avero <span class="text-[#9999FF]">Maps</span>
			</h2>
			<div class="mt-1 flex items-center gap-2">
				<span class="h-2 w-2 animate-ping rounded-full bg-emerald-500"></span>
				<span class="font-mono text-[9px] font-bold tracking-widest text-white/40 uppercase">
					Routing & Discovery
				</span>
			</div>
		</div>

		<!-- Global Search -->
		<section class="border-b border-white/5 pb-3">
			<div class="relative">
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>Explore Location</span
				>
				<div class="relative mt-1 flex items-center">
					<input
						type="text"
						bind:value={$globalSearchQuery}
						oninput={() => debounceSearch('global', $globalSearchQuery)}
						placeholder="Search cities, landmarks, addresses..."
						class="w-full rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-xs text-white transition outline-none placeholder:text-white/30 focus:border-[#9999FF]/50 focus:bg-white/6"
					/>
					<span class="absolute right-3.5 text-xs opacity-30">🔍</span>
				</div>
				{#if $suggestions.global.length}
					<div
						class="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0e0e11] shadow-2xl"
					>
						{#each $suggestions.global as res, idx (`global-${res.lat}-${res.lon}-${idx}`)}
							<button
								type="button"
								onclick={() => selectLoc('global', res)}
								class="w-full truncate border-b border-white/3 px-3 py-2 text-left text-xs text-zinc-300 transition hover:bg-[#9999FF] hover:text-black"
							>
								{res.display_name}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<!-- Route Constructor -->
		<section class="space-y-3">
			<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
				>Route Constructor</span
			>

			<div class="relative">
				<input
					type="text"
					bind:value={$startPoint}
					oninput={() => debounceSearch('start', $startPoint)}
					placeholder="Search start origin..."
					class="w-full rounded-2xl border border-white/10 bg-white/3 px-4 py-2.5 text-xs text-white transition outline-none placeholder:text-white/30 focus:border-[#9999FF]/50 focus:bg-white/6"
				/>
				{#if $suggestions.start.length}
					<div
						class="absolute z-50 mt-1 max-h-36 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0e0e11] shadow-2xl"
					>
						{#each $suggestions.start as res, idx (`start-${res.lat}-${res.lon}-${idx}`)}
							<button
								type="button"
								onclick={() => selectLoc('start', res)}
								class="w-full truncate border-b border-white/3 px-3 py-2 text-left text-xs text-zinc-300 transition hover:bg-[#9999FF] hover:text-black"
							>
								{res.display_name}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="relative">
				<input
					type="text"
					bind:value={$endPoint}
					oninput={() => debounceSearch('end', $endPoint)}
					placeholder="Search destination endpoint..."
					class="w-full rounded-2xl border border-white/10 bg-white/3 px-4 py-2.5 text-xs text-white transition outline-none placeholder:text-white/30 focus:border-[#9999FF]/50 focus:bg-white/6"
				/>
				{#if $suggestions.end.length}
					<div
						class="absolute z-50 mt-1 max-h-36 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0e0e11] shadow-2xl"
					>
						{#each $suggestions.end as res, idx (`end-${res.lat}-${res.lon}-${idx}`)}
							<button
								type="button"
								onclick={() => selectLoc('end', res)}
								class="w-full truncate border-b border-white/3 px-3 py-2 text-left text-xs text-zinc-300 transition hover:bg-[#9999FF] hover:text-black"
							>
								{res.display_name}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<button
				onclick={planTrip}
				class="w-full rounded-xl bg-[#9999FF] py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
			>
				Construct Route
			</button>
		</section>

		<!-- Metrics Card -->
		{#if $routeInfo}
			<div
				class="flex flex-col justify-between rounded-2xl border border-[#9999FF]/30 bg-[#9999FF]/10 p-4 shadow-[0_0_20px_rgba(153,153,255,0.15)] transition"
			>
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-black tracking-widest text-white/50 uppercase"
						>Distance</span
					>
					<span class="font-mono text-xs font-bold text-white">{$routeInfo.distance}</span>
				</div>
				<div class="mt-2 flex items-center justify-between">
					<span class="text-[10px] font-black tracking-widest text-white/50 uppercase"
						>Est. Duration</span
					>
					<span class="font-mono text-sm font-bold text-[#9999FF]">{$routeInfo.duration}</span>
				</div>
			</div>
		{/if}

		<!-- POI Chips Scan -->
		<section class="flex min-h-0 flex-1 flex-col border-t border-white/5 pt-3">
			<span class="mb-2 text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
				>POI Scan Matrix</span
			>
			<div class="flex flex-wrap gap-1.5 overflow-y-auto pr-1">
				{#each poiTypes as poi (poi.val)}
					<button
						onclick={() => findPOI(poi.val)}
						class="rounded-full border border-white/10 bg-white/3 px-3 py-1.5 text-[10px] font-bold transition hover:border-[#9999FF]/40 hover:bg-[#9999FF]/20 {$activePOI ===
						poi.val
							? 'border-[#9999FF] bg-[#9999FF] text-black'
							: 'text-zinc-300'}"
					>
						{poi.icon}
						{poi.label}
					</button>
				{/each}
			</div>
		</section>
	</aside>

	<!-- Main Canvas Frame / Map -->
	<div bind:this={mapContainer} class="h-full w-full bg-[#050505]"></div>

	<!-- Node Inspector Overlay -->
	{#if $selectedNodeInfo}
		<div
			class="absolute bottom-5 left-5 z-1000 w-88 rounded-2xl border border-white/10 bg-black/90 p-4 shadow-2xl backdrop-blur-xl"
		>
			<div class="flex items-start justify-between gap-3">
				<div class="space-y-1">
					<span
						class="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-widest text-[#9999FF] uppercase"
					>
						{#if $isInspecting}
							<span
								class="h-2 w-2 animate-spin rounded-full border border-[#9999FF] border-t-transparent"
							></span>
							Geocoding Node...
						{:else}
							Location Resolved
						{/if}
					</span>
					<h3 class="line-clamp-2 text-xs font-bold text-white">{$selectedNodeInfo.title}</h3>
					<p class="font-mono text-[10px] text-white/40">{$selectedNodeInfo.coords}</p>
				</div>
				<button
					onclick={() => selectedNodeInfo.set(null)}
					class="text-xs text-white/40 hover:text-white">✕</button
				>
			</div>
			<div class="mt-3 flex space-x-2 border-t border-white/5 pt-3">
				<button
					onclick={() => setInspectedAsRoute('start')}
					disabled={$isInspecting}
					class="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] font-bold text-zinc-200 transition hover:bg-[#9999FF] hover:text-black disabled:opacity-40"
				>
					📍 Set Origin
				</button>
				<button
					onclick={() => setInspectedAsRoute('end')}
					disabled={$isInspecting}
					class="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] font-bold text-zinc-200 transition hover:bg-[#9999FF] hover:text-black disabled:opacity-40"
				>
					🏁 Set Dest
				</button>
			</div>
		</div>
	{/if}

	<!-- Action Controls -->
	<div class="absolute right-5 bottom-5 z-1000 flex flex-col gap-2">
		<button
			onclick={() => $mapInstance?.zoomIn()}
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/80 font-bold text-white backdrop-blur transition hover:bg-[#9999FF] hover:text-black"
			title="Zoom In"
		>
			+
		</button>
		<button
			onclick={() => $mapInstance?.zoomOut()}
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/80 font-bold text-white backdrop-blur transition hover:bg-[#9999FF] hover:text-black"
			title="Zoom Out"
		>
			-
		</button>
		<button
			onclick={() => $mapInstance?.locate({ setView: true, maxZoom: 14 })}
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/80 font-bold text-white backdrop-blur transition hover:bg-[#9999FF] hover:text-black"
			title="Locate Me"
		>
			📍
		</button>
		<button
			onclick={clearAll}
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-black/80 font-bold text-red-400 backdrop-blur transition hover:bg-red-500 hover:text-white"
			title="Clear All"
		>
			🗑️
		</button>
	</div>
</div>
