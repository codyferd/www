import {
	type ActivityType,
	type WorkoutLog,
	type WeightEntry,
	type NutritionLog,
	INITIAL_WORKOUTS,
	INITIAL_WEIGHTS,
	INITIAL_NUTRITION
} from './types';

class HealthStore {
	// Navigation tab
	activeTab = $state<'tracker' | 'nutrition' | 'weight'>('tracker');

	// Workouts & History
	workouts = $state<WorkoutLog[]>([]);
	weights = $state<WeightEntry[]>([]);
	nutrition = $state<NutritionLog[]>([]);

	// Active Workout Tracker State
	isTracking = $state(false);
	activityType = $state<ActivityType>('run');
	elapsedSeconds = $state(0);
	distanceMeters = $state(0);
	currentSpeedKmh = $state(0);

	// GPS tracking internals
	private watchId: number | null = null;
	private lastCoords: { lat: number; lng: number; time: number } | null = null;
	private timerInterval: ReturnType<typeof setInterval> | null = null;

	// Form inputs for Nutrition
	foodName = $state('');
	foodCalories = $state('');
	foodCarbs = $state('');
	foodFat = $state('');
	foodProtein = $state('');

	// Form inputs for Weight
	newWeightKg = $state('');

	constructor() {
		this.loadFromStorage();
	}

	private loadFromStorage() {
		if (typeof window === 'undefined') {
			this.workouts = INITIAL_WORKOUTS;
			this.weights = INITIAL_WEIGHTS;
			this.nutrition = INITIAL_NUTRITION;
			return;
		}
		try {
			const w = localStorage.getItem('avero_workouts');
			const wt = localStorage.getItem('avero_weights');
			const n = localStorage.getItem('avero_nutrition');

			this.workouts = w ? JSON.parse(w) : INITIAL_WORKOUTS;
			this.weights = wt ? JSON.parse(wt) : INITIAL_WEIGHTS;
			this.nutrition = n ? JSON.parse(n) : INITIAL_NUTRITION;
		} catch {
			this.workouts = INITIAL_WORKOUTS;
			this.weights = INITIAL_WEIGHTS;
			this.nutrition = INITIAL_NUTRITION;
		}
	}

	private saveToStorage() {
		if (typeof window === 'undefined') return;
		localStorage.setItem('avero_workouts', JSON.stringify(this.workouts));
		localStorage.setItem('avero_weights', JSON.stringify(this.weights));
		localStorage.setItem('avero_nutrition', JSON.stringify(this.nutrition));
	}

	// --- Workout & GPS Tracking Logic ---
	startTracker(type: ActivityType) {
		this.activityType = type;
		this.isTracking = true;
		this.elapsedSeconds = 0;
		this.distanceMeters = 0;
		this.currentSpeedKmh = 0;
		this.lastCoords = null;

		// Start timer stopwatch
		this.timerInterval = setInterval(() => {
			this.elapsedSeconds += 1;
		}, 1000);

		// Start GPS watch if available
		if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
			this.watchId = navigator.geolocation.watchPosition(
				(pos) => {
					const { latitude, longitude, speed } = pos.coords;
					const now = Date.now();

					// If browser reports speed directly (m/s to km/h)
					if (speed !== null && speed >= 0) {
						this.currentSpeedKmh = Number((speed * 3.6).toFixed(1));
					}

					if (this.lastCoords) {
						const dist = this.calculateDistance(
							this.lastCoords.lat,
							this.lastCoords.lng,
							latitude,
							longitude
						);
						// Ignore minor GPS jitter (< 2 meters movement per tick)
						if (dist > 2) {
							this.distanceMeters += dist;
							const timeDiffHours = (now - this.lastCoords.time) / 3600000;
							if (timeDiffHours > 0 && speed === null) {
								const calcSpeed = dist / 1000 / timeDiffHours;
								this.currentSpeedKmh = Number(calcSpeed.toFixed(1));
							}
						}
					}

					this.lastCoords = { lat: latitude, lng: longitude, time: now };
				},
				(err) => {
					console.warn('GPS tracking error or permission denied:', err.message);
				},
				{ enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
			);
		}
	}

	stopTracker() {
		if (!this.isTracking) return;

		if (this.timerInterval !== null) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}

		if (this.watchId !== null && typeof navigator !== 'undefined') {
			navigator.geolocation.clearWatch(this.watchId);
			this.watchId = null;
		}

		this.isTracking = false;

		const durationHours = this.elapsedSeconds / 3600;
		const distanceKm = this.distanceMeters / 1000;
		const avgSpeed = durationHours > 0 ? Number((distanceKm / durationHours).toFixed(1)) : 0;

		// Estimate calories burned based on activity & weight
		let calMultiplier = 600; // default run
		if (this.activityType === 'bike') calMultiplier = 450;
		if (this.activityType === 'walk') calMultiplier = 300;
		const caloriesBurned = Math.round(durationHours * calMultiplier);

		const newWorkout: WorkoutLog = {
			id: 'wo-' + Math.random().toString(36).substring(2, 9),
			type: this.activityType,
			durationSeconds: this.elapsedSeconds,
			distanceMeters: Math.round(this.distanceMeters),
			caloriesBurned,
			avgSpeedKmh: avgSpeed > 0 ? avgSpeed : this.currentSpeedKmh,
			date: new Date().toISOString()
		};

		this.workouts.unshift(newWorkout);
		this.saveToStorage();
	}

	private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371e3; // Earth radius in meters
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δφ = ((lat2 - lat1) * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;

		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c;
	}

	// --- Nutrition Management ---
	addNutritionLog() {
		if (!this.foodName.trim() || !this.foodCalories) return;
		const entry: NutritionLog = {
			id: 'n-' + Math.random().toString(36).substring(2, 9),
			name: this.foodName,
			calories: Number(this.foodCalories) || 0,
			carbsG: Number(this.foodCarbs) || 0,
			fatG: Number(this.foodFat) || 0,
			proteinG: Number(this.foodProtein) || 0,
			date: new Date().toISOString().split('T')[0]
		};
		this.nutrition.unshift(entry);
		this.foodName = '';
		this.foodCalories = '';
		this.foodCarbs = '';
		this.foodFat = '';
		this.foodProtein = '';
		this.saveToStorage();
	}

	deleteNutrition(id: string) {
		this.nutrition = this.nutrition.filter((n) => n.id !== id);
		this.saveToStorage();
	}

	// --- Weight Management ---
	addWeightEntry() {
		if (!this.newWeightKg) return;
		const entry: WeightEntry = {
			id: 'w-' + Math.random().toString(36).substring(2, 9),
			weightKg: Number(this.newWeightKg),
			date: new Date().toISOString().split('T')[0]
		};
		this.weights.unshift(entry);
		this.newWeightKg = '';
		this.saveToStorage();
	}

	deleteWeight(id: string) {
		this.weights = this.weights.filter((w) => w.id !== id);
		this.saveToStorage();
	}

	// --- Computed Macros & Totals ---
	get todayNutritionTotals() {
		const todayStr = new Date().toISOString().split('T')[0];
		const todayLogs = this.nutrition.filter((n) => n.date === todayStr);
		return todayLogs.reduce(
			(acc, item) => ({
				calories: acc.calories + item.calories,
				carbs: acc.carbs + item.carbsG,
				fat: acc.fat + item.fatG,
				protein: acc.protein + item.proteinG
			}),
			{ calories: 0, carbs: 0, fat: 0, protein: 0 }
		);
	}

	get latestWeight() {
		if (this.weights.length === 0) return 0;
		return this.weights[0].weightKg;
	}
}

export const healthStore = new HealthStore();
