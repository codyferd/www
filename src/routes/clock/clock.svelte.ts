// src/routes/clock/clock.svelte.ts

export interface MeshMove {
	from: string;
	to: string;
}

export interface TrackedZone {
	id: string;
	label: string;
	zone: string;
}

class ClockEngine {
	// --- Tab Architecture ---
	public currentTab = $state<'stopwatch' | 'timer' | 'worldtime'>('stopwatch');

	// --- Component State Matrices ---
	public stopwatch = $state({
		time: 0,
		isRunning: false,
		laps: [] as string[]
	});

	public timer = $state({
		remainingTime: 0,
		isRunning: false,
		isConfigMode: true,
		isExpired: false
	});

	public timerInput = $state({ hours: 0, minutes: 0, seconds: 0 });
	public systemClockTime = $state(new Date());
	public searchQuery = $state('');
	public apiState = $state({ loading: false, error: null as string | null });

	public trackedZones = $state<TrackedZone[]>([
		{ id: '1', label: 'GMT Baseline', zone: 'Etc/GMT' }
	]);

	// --- Native Intervals ---
	private stopwatchInterval: ReturnType<typeof setInterval> | null = null;
	private stopwatchStartTime = 0;
	private timerInterval: ReturnType<typeof setInterval> | null = null;
	private timerEndTime = 0;
	private globalClockInterval: ReturnType<typeof setInterval> | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			this.globalClockInterval = setInterval(() => {
				this.systemClockTime = new Date();
			}, 1000);
		}
	}

	// --- Derived Computed Formats ---
	public get formattedStopwatch() {
		const totalMs = this.stopwatch.time;
		const mins = Math.floor(totalMs / 60000);
		const secs = Math.floor((totalMs % 60000) / 1000);
		const ms = Math.floor((totalMs % 1000) / 10);
		return {
			main: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
			ms: ms.toString().padStart(2, '0')
		};
	}

	public get formattedTimer() {
		const totalMs = this.timer.remainingTime;
		const hrs = Math.floor(totalMs / 3600000);
		const mins = Math.floor((totalMs % 3600000) / 60000);
		const secs = Math.floor((totalMs % 60000) / 1000);
		const ms = Math.floor((totalMs % 1000) / 10);
		const hh = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : '';
		return {
			main: `${hh}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
			ms: ms.toString().padStart(2, '0')
		};
	}

	public get localClockDisplay() {
		return this.systemClockTime.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	public get computedZoneTimes() {
		return this.trackedZones.map((item) => {
			try {
				const timeStr = this.systemClockTime.toLocaleTimeString('en-US', {
					timeZone: item.zone,
					hour12: false,
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit'
				});
				return { ...item, time: timeStr, tzName: item.zone };
			} catch {
				return { ...item, time: '--:--:--', tzName: 'Unknown Coordinate Matrix' };
			}
		});
	}

	// --- Controller Routines: Stopwatch ---
	public toggleStopwatch() {
		if (this.stopwatch.isRunning && this.stopwatchInterval) {
			clearInterval(this.stopwatchInterval);
		} else {
			this.stopwatchStartTime = Date.now() - this.stopwatch.time;
			this.stopwatchInterval = setInterval(() => {
				this.stopwatch.time = Date.now() - this.stopwatchStartTime;
			}, 10);
		}
		this.stopwatch.isRunning = !this.stopwatch.isRunning;
	}

	public recordLap() {
		const f = this.formattedStopwatch;
		this.stopwatch.laps.push(`${f.main}.${f.ms}`);
	}

	public resetStopwatch() {
		if (this.stopwatchInterval) clearInterval(this.stopwatchInterval);
		this.stopwatch.isRunning = false;
		this.stopwatch.time = 0;
		this.stopwatch.laps = [];
	}

	// --- Controller Routines: Timer ---
	public lockAndStartTimer() {
		const h = Math.max(0, Math.floor(this.timerInput.hours) || 0);
		const m = Math.min(59, Math.max(0, Math.floor(this.timerInput.minutes) || 0));
		const s = Math.min(59, Math.max(0, Math.floor(this.timerInput.seconds) || 0));

		const calculatedMs = (h * 3600 + m * 60 + s) * 1000;
		if (calculatedMs <= 0) return;

		this.timer.remainingTime = calculatedMs;
		this.timer.isConfigMode = false;
		this.timer.isExpired = false;
		this.toggleTimer();
	}

	public toggleTimer() {
		if (this.timer.isRunning && this.timerInterval) {
			clearInterval(this.timerInterval);
		} else {
			if (this.timer.isExpired) {
				this.timer.isExpired = false;
				this.timer.isConfigMode = true;
				return;
			}
			this.timerEndTime = Date.now() + this.timer.remainingTime;
			this.timerInterval = setInterval(() => {
				const diff = this.timerEndTime - Date.now();
				if (diff <= 0) {
					this.timer.remainingTime = 0;
					this.timer.isRunning = false;
					this.timer.isExpired = true;
					if (this.timerInterval) clearInterval(this.timerInterval);
				} else {
					this.timer.remainingTime = diff;
				}
			}, 10);
		}
		this.timer.isRunning = !this.timer.isRunning;
	}

	public setPresetTimer(minutes: number) {
		if (this.timerInterval) clearInterval(this.timerInterval);
		this.timer.isRunning = false;
		this.timer.isExpired = false;
		this.timerInput.hours = 0;
		this.timerInput.minutes = minutes;
		this.timerInput.seconds = 0;
		this.timer.remainingTime = minutes * 60 * 1000;
		this.timer.isConfigMode = false;
	}

	public resetTimer() {
		if (this.timerInterval) clearInterval(this.timerInterval);
		this.timer.isRunning = false;
		this.timer.isExpired = false;
		this.timer.remainingTime = 0;
		this.timer.isConfigMode = true;
	}

	// --- Controller Routines: Geolocation Matrix Lookup ---
	public async queryGlobalLocation() {
		const cleanQuery = this.searchQuery.trim();
		if (!cleanQuery) return;

		this.apiState.loading = true;
		this.apiState.error = null;

		try {
			const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=1`;
			const response = await fetch(geoUrl, {
				headers: { 'User-Agent': 'AveroChronometerSystem/2.0' }
			});
			const data = await response.json();

			if (!data || data.length === 0) throw new Error('Location could not be traced');

			const target = data[0];
			const lat = parseFloat(target.lat);
			const lon = parseFloat(target.lon);

			const tzUrl = `https://secure.geonames.org/timezoneJSON?lat=${lat}&lng=${lon}&username=demo`;
			const tzResponse = await fetch(tzUrl);
			const tzData = await tzResponse.json();

			let ianaTimezone = tzData?.timezoneId;
			let fallbackAbbrev = tzData?.timezoneId
				? tzData.timezoneId.split('/').pop().replace('_', ' ')
				: 'GMT';

			if (!ianaTimezone) {
				const structuralGmtOffset = Math.round(lon / 15);
				ianaTimezone = 'UTC';
				fallbackAbbrev = `GMT${structuralGmtOffset >= 0 ? '+' : ''}${structuralGmtOffset}`;
			}

			const structuralLabel = target.display_name.split(',')[0] + ` (${fallbackAbbrev})`;

			if (this.trackedZones.some((z) => z.zone === ianaTimezone && z.label === structuralLabel)) {
				throw new Error('Location node already registered');
			}

			this.trackedZones.push({
				id: Date.now().toString(),
				label: structuralLabel,
				zone: ianaTimezone
			});

			this.searchQuery = '';
		} catch (err: unknown) {
			this.apiState.error = err instanceof Error ? err.message : 'Network anomaly detected';
		} finally {
			this.apiState.loading = false;
		}
	}

	public removeZone(id: string) {
		this.trackedZones = this.trackedZones.filter((z) => z.id !== id);
	}

	public destroy() {
		if (this.stopwatchInterval) clearInterval(this.stopwatchInterval);
		if (this.timerInterval) clearInterval(this.timerInterval);
		if (this.globalClockInterval) clearInterval(this.globalClockInterval);
	}
}

export const Clock = new ClockEngine();
