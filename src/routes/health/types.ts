export type ActivityType = 'run' | 'bike' | 'walk';

export interface GpsPoint {
	lat: number;
	lng: number;
	timestamp: number;
}

export interface WorkoutLog {
	id: string;
	type: ActivityType;
	durationSeconds: number;
	distanceMeters: number;
	caloriesBurned: number;
	avgSpeedKmh: number;
	date: string; // ISO date string
}

export interface WeightEntry {
	id: string;
	weightKg: number;
	date: string; // YYYY-MM-DD
}

export interface NutritionLog {
	id: string;
	name: string;
	calories: number;
	carbsG: number;
	fatG: number;
	proteinG: number;
	date: string; // YYYY-MM-DD
}

export const INITIAL_WEIGHTS: WeightEntry[] = [
	{ id: 'w-1', weightKg: 78.5, date: '2026-08-01' },
	{ id: 'w-2', weightKg: 78.2, date: '2026-08-03' },
	{ id: 'w-3', weightKg: 78.0, date: '2026-08-05' }
];

export const INITIAL_NUTRITION: NutritionLog[] = [
	{
		id: 'n-1',
		name: 'Oats & Whey Protein',
		calories: 450,
		carbsG: 55,
		fatG: 10,
		proteinG: 35,
		date: '2026-08-05'
	},
	{
		id: 'n-2',
		name: 'Grilled Chicken Salad',
		calories: 520,
		carbsG: 20,
		fatG: 18,
		proteinG: 48,
		date: '2026-08-05'
	}
];

export const INITIAL_WORKOUTS: WorkoutLog[] = [
	{
		id: 'wo-1',
		type: 'run',
		durationSeconds: 1840,
		distanceMeters: 5120,
		caloriesBurned: 410,
		avgSpeedKmh: 10.02,
		date: '2026-08-04T07:30:00Z'
	}
];
