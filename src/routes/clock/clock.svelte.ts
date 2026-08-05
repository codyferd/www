export interface MeshMove {
	from: string;
	to: string;
}

export interface TrackedZone {
	id: string;
	label: string;
	zone: string;
}

export type DayOfWeek = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface AlarmItem {
	id: string;
	time: string; // HH:mm format (24-hour)
	label: string;
	enabled: boolean;
	days: DayOfWeek[]; // Days on which the alarm repeats
}

class ClockEngine {
	// --- Tab Architecture ---
	public currentTab = $state<'stopwatch' | 'timer' | 'worldtime' | 'alarm'>('stopwatch');

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

	// --- Alarm System State ---
	public alarms = $state<AlarmItem[]>([]);
	public alarmInput = $state({
		time: '08:00',
		label: 'Alarm',
		days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as DayOfWeek[]
	});
	public notificationPermission = $state<NotificationPermission>('default');

	// --- Audio & Web API State ---
	private audioCtx: AudioContext | null = null;
	private activeAlarmIds = new Set<string>();

	// --- Native Intervals ---
	private stopwatchInterval: ReturnType<typeof setInterval> | null = null;
	private stopwatchStartTime = 0;
	private timerInterval: ReturnType<typeof setInterval> | null = null;
	private timerEndTime = 0;
	private globalClockInterval: ReturnType<typeof setInterval> | null = null;

	public readonly allDays: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	constructor() {
		if (typeof window !== 'undefined') {
			if ('Notification' in window) {
				this.notificationPermission = Notification.permission;
			}

			this.globalClockInterval = setInterval(() => {
				const now = new Date();
				this.systemClockTime = now;
				this.checkAlarms(now);
			}, 1000);
		}
	}

	// --- Sound & Notification Helpers ---
	public async requestNotificationPermission() {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			const permission = await Notification.requestPermission();
			this.notificationPermission = permission;
		}
	}

	private triggerAlert(title: string, body: string) {
		this.playAlarmSound();

		if (
			typeof window !== 'undefined' &&
			'Notification' in window &&
			Notification.permission === 'granted'
		) {
			new Notification(title, { body });
		}
	}

	public playAlarmSound() {
		if (typeof window === 'undefined') return;

		const AudioContextClass =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (!this.audioCtx) {
			this.audioCtx = new AudioContextClass();
		}

		if (this.audioCtx.state === 'suspended') {
			this.audioCtx.resume();
		}

		// Play a repeating two-tone alarm melody over 2 seconds
		const now = this.audioCtx.currentTime;
		const osc = this.audioCtx.createOscillator();
		const gain = this.audioCtx.createGain();

		osc.type = 'square';

		// Pulse frequencies for classic digital alarm effect
		for (let i = 0; i < 6; i++) {
			const startTime = now + i * 0.3;
			const freq = i % 2 === 0 ? 880 : 1046.5; // A5 and C6 notes
			osc.frequency.setValueAtTime(freq, startTime);
			gain.gain.setValueAtTime(0.2, startTime);
			gain.gain.setValueAtTime(0, startTime + 0.15);
		}

		osc.connect(gain);
		gain.connect(this.audioCtx.destination);

		osc.start(now);
		osc.stop(now + 1.8);
	}

	// --- Alarm Routines ---
	public toggleInputDay(day: DayOfWeek) {
		if (this.alarmInput.days.includes(day)) {
			this.alarmInput.days = this.alarmInput.days.filter((d) => d !== day);
		} else {
			this.alarmInput.days = [...this.alarmInput.days, day];
		}
	}

	public addAlarm() {
		if (!this.alarmInput.time) return;
		this.alarms.push({
			id: Date.now().toString(),
			time: this.alarmInput.time,
			label: this.alarmInput.label || 'Alarm',
			enabled: true,
			days: [...this.alarmInput.days]
		});
		this.alarmInput.label = 'Alarm';
	}

	public toggleAlarm(id: string) {
		const alarm = this.alarms.find((a) => a.id === id);
		if (alarm) alarm.enabled = !alarm.enabled;
	}

	public removeAlarm(id: string) {
		this.alarms = this.alarms.filter((a) => a.id !== id);
	}

	private checkAlarms(now: Date) {
		const currentFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
		const seconds = now.getSeconds();
		const currentDay = this.allDays[now.getDay()];

		// Check once at the start of the minute
		if (seconds === 0) {
			this.alarms.forEach((alarm) => {
				const matchesDay = alarm.days.length === 0 || alarm.days.includes(currentDay);
				if (
					alarm.enabled &&
					alarm.time === currentFormatted &&
					matchesDay &&
					!this.activeAlarmIds.has(alarm.id)
				) {
					this.activeAlarmIds.add(alarm.id);
					this.triggerAlert(
						`Alarm: ${alarm.label}`,
						`Your alarm set for ${alarm.time} is going off!`
					);
				}
			});
		} else if (seconds === 1) {
			this.activeAlarmIds.clear();
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

	// Explicit 24-Hour Digital Display
	public get localClockDisplay() {
		return this.systemClockTime.toLocaleTimeString('en-GB', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	public get computedZoneTimes() {
		return this.trackedZones.map((item) => {
			try {
				const timeStr = this.systemClockTime.toLocaleTimeString('en-GB', {
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

					// Trigger Alert & Web Notification when timer finishes
					this.triggerAlert('Timer Complete', 'Your countdown timer has expired!');
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
		if (this.audioCtx) this.audioCtx.close();
	}
}

export const Clock = new ClockEngine();
