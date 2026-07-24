import { writable, derived } from 'svelte/store';
import type L from 'leaflet';

export interface LocationSuggestion {
	display_name: string;
	lat: string;
	lon: string;
}

export interface RouteInfo {
	distance: string;
	duration: string;
}

export interface SelectedNode {
	title: string;
	coords: string;
	latLng: L.LatLng;
}

export interface POIType {
	label: string;
	val: string;
	icon: string;
}

export const globalSearchQuery = writable<string>('');
export const startPoint = writable<string>('');
export const endPoint = writable<string>('');
export const routeInfo = writable<RouteInfo | null>(null);
export const activePOI = writable<string | null>(null);
export const isInspecting = writable<boolean>(false);
export const selectedNodeInfo = writable<SelectedNode | null>(null);

export const suggestions = writable<{
	global: LocationSuggestion[];
	start: LocationSuggestion[];
	end: LocationSuggestion[];
}>({
	global: [],
	start: [],
	end: []
});

export const mapInstance = writable<L.Map | null>(null);
export const routingControl = writable<L.Control | null>(null);
export const poiLayer = writable<L.LayerGroup | null>(null);
export const standaloneMarkerLayer = writable<L.LayerGroup | null>(null);

export const poiTypes: POIType[] = [
	{ label: 'Food', val: 'restaurant', icon: '🍴' },
	{ label: 'Fuel', val: 'fuel', icon: '⛽' },
	{ label: 'Hospital', val: 'hospital', icon: '🏥' },
	{ label: 'Hotel', val: 'hotel', icon: '🏨' },
	{ label: 'Cafe', val: 'cafe', icon: '☕' },
	{ label: 'Charging', val: 'charging_station', icon: '⚡' },
	{ label: 'Park', val: 'park', icon: '🌳' },
	{ label: 'Cinema', val: 'cinema', icon: '🎬' },
	{ label: 'Bank', val: 'bank', icon: '🏦' },
	{ label: 'Pharmacy', val: 'pharmacy', icon: '💊' },
	{ label: 'ATM', val: 'atm', icon: '🏧' },
	{ label: 'Supermarket', val: 'supermarket', icon: '🛒' },
	{ label: 'Parking', val: 'parking', icon: '🅿️' },
	{ label: 'Library', val: 'library', icon: '📚' },
	{ label: 'Post Office', val: 'post_office', icon: '📯' }
];

export const isRouteReady = derived(
	[startPoint, endPoint],
	([$start, $end]) => $start.trim().length > 0 && $end.trim().length > 0
);
