import { get } from 'svelte/store';
import L from 'leaflet';
import 'leaflet-routing-machine';
import {
	mapInstance,
	routingControl,
	poiLayer,
	standaloneMarkerLayer,
	selectedNodeInfo,
	isInspecting,
	suggestions,
	activePOI,
	routeInfo,
	globalSearchQuery,
	startPoint,
	endPoint,
	type LocationSuggestion
} from './stores';

/* eslint-disable @typescript-eslint/no-namespace */
declare module 'leaflet' {
	namespace Routing {
		function control(options?: unknown): unknown;
		function osrmv1(options?: unknown): unknown;
	}
}
/* eslint-enable @typescript-eslint/no-namespace */

interface OverpassElement {
	lat: number;
	lon: number;
	tags: {
		name?: string;
		[key: string]: string | undefined;
	};
}

interface RouteFoundEvent {
	routes: Array<{
		summary: {
			totalDistance: number;
			totalTime: number;
		};
	}>;
}

interface Waypoint {
	latLng: L.LatLng;
}

interface LeafletRoutingInterface {
	control: (options?: unknown) => L.Control & {
		on: (event: string, handler: (e: RouteFoundEvent) => void) => void;
	};
	osrmv1: (options?: unknown) => unknown;
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;

export async function reverseGeocodeMapCoordinates(lat: number, lon: number): Promise<void> {
	const map = get(mapInstance);
	const markers = get(standaloneMarkerLayer);
	if (!map || !markers) return;

	isInspecting.set(true);
	selectedNodeInfo.set({
		title: 'Resolving geospatial node markers...',
		coords: `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`,
		latLng: L.latLng(lat, lon)
	});

	markers.clearLayers();
	L.circleMarker([lat, lon], {
		color: '#9999FF',
		radius: 10,
		weight: 2,
		fillOpacity: 0.3
	}).addTo(markers);

	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
		);
		if (!res.ok) throw new Error();
		const data = await res.json();
		const resolvedTitle =
			data.display_name || `Coordinate Anchor (${lat.toFixed(4)}, ${lon.toFixed(4)})`;

		selectedNodeInfo.update((prev) => (prev ? { ...prev, title: resolvedTitle } : null));
	} catch {
		selectedNodeInfo.update((prev) =>
			prev
				? {
						...prev,
						title: `Dropped Pin Marker Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`
					}
				: null
		);
	} finally {
		isInspecting.set(false);
	}
}

export function debounceSearch(type: 'global' | 'start' | 'end', query: string): void {
	if (searchTimer) clearTimeout(searchTimer);

	if (query.length < 3) {
		suggestions.update((s) => ({ ...s, [type]: [] }));
		return;
	}

	searchTimer = setTimeout(async () => {
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6`
			);
			if (res.ok) {
				const data = await res.json();
				suggestions.update((s) => ({ ...s, [type]: data }));
			}
		} catch (e) {
			console.error('Search failed', e);
		}
	}, 350);
}

export function selectLoc(type: 'global' | 'start' | 'end', loc: LocationSuggestion): void {
	const map = get(mapInstance);
	const markers = get(standaloneMarkerLayer);
	if (!map || !markers) return;

	const targetLatLng = L.latLng(parseFloat(loc.lat), parseFloat(loc.lon));
	suggestions.update((s) => ({ ...s, [type]: [] }));

	if (type === 'global') {
		globalSearchQuery.set(loc.display_name);
		markers.clearLayers();

		L.circleMarker(targetLatLng, {
			color: '#9999FF',
			radius: 12,
			weight: 3,
			fillOpacity: 0.2
		}).addTo(markers);
		L.marker(targetLatLng).addTo(markers);

		map.setView(targetLatLng, 14);

		selectedNodeInfo.set({
			title: loc.display_name,
			coords: `Lat: ${parseFloat(loc.lat).toFixed(5)}, Lon: ${parseFloat(loc.lon).toFixed(5)}`,
			latLng: targetLatLng
		});
	} else if (type === 'start') {
		startPoint.set(loc.display_name);
		map.panTo(targetLatLng);
	} else {
		endPoint.set(loc.display_name);
		map.panTo(targetLatLng);
	}
}

export async function geocode(query: string): Promise<L.LatLng> {
	const res = await fetch(
		`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
	);
	const data = await res.json();
	if (data[0]) return L.latLng(data[0].lat, data[0].lon);
	throw new Error(`Location not found: ${query}`);
}

export async function planTrip(): Promise<void> {
	const map = get(mapInstance);
	const startVal = get(startPoint);
	const endVal = get(endPoint);
	const currControl = get(routingControl);

	if (!map || !startVal || !endVal) return;

	try {
		const startLoc = await geocode(startVal);
		const endLoc = await geocode(endVal);

		if (currControl) {
			map.removeControl(currControl);
		}

		const routing = (L as unknown as { Routing: LeafletRoutingInterface }).Routing;

		const newControl = routing
			.control({
				waypoints: [startLoc, endLoc],
				lineOptions: { styles: [{ color: '#9999FF', weight: 6, opacity: 0.85 }] },
				router: routing.osrmv1({
					serviceUrl: 'https://router.project-osrm.org/route/v1',
					profile: 'driving'
				}),
				createMarker: (_i: number, wp: Waypoint) => L.marker(wp.latLng, { draggable: false }),
				addWaypoints: false,
				fitSelectedRoutes: true,
				show: false
			})
			.addTo(map);

		newControl.on('routesfound', (e: RouteFoundEvent) => {
			const s = e.routes[0].summary;
			routeInfo.set({
				distance: (s.totalDistance / 1609.34).toFixed(1) + ' miles',
				duration: Math.round(s.totalTime / 60) + ' mins'
			});
		});

		routingControl.set(newControl);
	} catch (e: unknown) {
		const err = e as Error;
		alert(err.message || 'Avero Route Failure');
	}
}

export async function findPOI(type: string): Promise<void> {
	const map = get(mapInstance);
	const layer = get(poiLayer);
	const current = get(activePOI);

	if (!map || !layer) return;

	if (current === type) {
		activePOI.set(null);
		layer.clearLayers();
		return;
	}

	activePOI.set(type);
	layer.clearLayers();
	const b = map.getBounds();

	const query = `[out:json];(node["amenity"="${type}"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()});node["leisure"="${type}"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}););out 50;`;

	try {
		const res = await fetch(
			`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
		);
		const data = await res.json();

		data.elements.forEach((el: OverpassElement) => {
			const marker = L.circleMarker([el.lat, el.lon], {
				color: '#9999FF',
				fillColor: '#ffffff',
				fillOpacity: 0.9,
				radius: 6,
				weight: 2
			});

			const markerName =
				el.tags.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Feature Node`;
			marker.bindPopup(`<b>${markerName}</b>`);
			marker.addTo(layer);

			marker.on('click', (e: L.LeafletEvent) => {
				L.DomEvent.stopPropagation(e);
				reverseGeocodeMapCoordinates(el.lat, el.lon);
			});
		});
	} catch (e) {
		console.error('POI fetch failed.', e);
	}
}

export function clearAll(): void {
	const map = get(mapInstance);
	const control = get(routingControl);
	const poi = get(poiLayer);
	const markers = get(standaloneMarkerLayer);

	if (control && map) map.removeControl(control);
	if (poi) poi.clearLayers();
	if (markers) markers.clearLayers();

	routingControl.set(null);
	globalSearchQuery.set('');
	startPoint.set('');
	endPoint.set('');
	routeInfo.set(null);
	selectedNodeInfo.set(null);
	activePOI.set(null);
}
