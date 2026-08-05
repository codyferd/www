<script lang="ts">
	import { healthStore } from './healthStore.svelte';

	// Format seconds into HH:MM:SS
	function formatTime(totalSeconds: number): string {
		const hrs = Math.floor(totalSeconds / 3600);
		const mins = Math.floor((totalSeconds % 3600) / 60);
		const secs = totalSeconds % 60;
		return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="flex h-full w-full flex-col bg-black font-sans tracking-tight text-white select-none">
	<!-- Top Bar Navigation -->
	<header
		class="flex items-center justify-between border-b border-white/5 bg-white/1 px-8 py-5 backdrop-blur-md"
	>
		<div class="flex items-center gap-3">
			<div
				class="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#9999FF]/30 bg-[#9999FF]/10 text-[#9999FF] shadow-[0_0_20px_rgba(153,153,255,0.2)]"
			>
				⚡
			</div>
			<div>
				<h1 class="text-lg font-bold tracking-tight text-white">Avero Health</h1>
				<p class="text-xs text-white/40">Telemetry, GPS tracking & metabolic macro analytics</p>
			</div>
		</div>

		<!-- Tab Switcher -->
		<div class="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/2 p-1.5">
			<button
				onclick={() => (healthStore.activeTab = 'tracker')}
				class="rounded-xl px-5 py-2 text-xs font-bold transition-all duration-300 {healthStore.activeTab ===
				'tracker'
					? 'bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.3)]'
					: 'text-white/60 hover:text-white'}"
			>
				GPS Tracker
			</button>
			<button
				onclick={() => (healthStore.activeTab = 'nutrition')}
				class="rounded-xl px-5 py-2 text-xs font-bold transition-all duration-300 {healthStore.activeTab ===
				'nutrition'
					? 'bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.3)]'
					: 'text-white/60 hover:text-white'}"
			>
				Nutrition & Macros
			</button>
			<button
				onclick={() => (healthStore.activeTab = 'weight')}
				class="rounded-xl px-5 py-2 text-xs font-bold transition-all duration-300 {healthStore.activeTab ===
				'weight'
					? 'bg-[#9999FF] text-black shadow-[0_0_20px_rgba(153,153,255,0.3)]'
					: 'text-white/60 hover:text-white'}"
			>
				Weight Tracker
			</button>
		</div>
	</header>

	<!-- Main Body Workspace -->
	<main
		class="flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-y-auto p-8"
	>
		<div class="mx-auto max-w-5xl space-y-8">
			<!-- TAB 1: GPS & WORKOUT TRACKER -->
			{#if healthStore.activeTab === 'tracker'}
				<div
					class="rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20"
				>
					<div class="flex items-center justify-between border-b border-white/5 pb-6">
						<div>
							<h2 class="text-xl font-black text-white">Live Activity Telemetry</h2>
							<p class="mt-1 text-xs text-white/40">
								Real-time stopwatch, GPS distance, and velocity metrics.
							</p>
						</div>
						{#if healthStore.isTracking}
							<div class="flex items-center gap-2">
								<span class="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500"></span>
								<span class="text-xs font-bold tracking-widest text-emerald-400 uppercase"
									>Recording</span
								>
							</div>
						{/if}
					</div>

					{#if !healthStore.isTracking}
						<!-- Pre-start Configuration -->
						<div class="py-10 text-center">
							<p class="mb-6 text-xs font-black tracking-[0.25em] text-white/40 uppercase">
								Select Activity Type
							</p>
							<div class="mb-8 flex justify-center gap-4">
								<button
									onclick={() => healthStore.startTracker('run')}
									class="rounded-2xl border px-8 py-5 transition-all duration-300 {healthStore.activityType ===
									'run'
										? 'border-[#9999FF] bg-[#9999FF]/10 text-white shadow-[0_0_20px_rgba(153,153,255,0.2)]'
										: 'border-white/10 bg-white/2 text-white/60 hover:border-white/20'}"
								>
									<span class="mb-1 block text-2xl">🏃‍♂️</span>
									<span class="text-xs font-bold tracking-wider uppercase">Run</span>
								</button>
								<button
									onclick={() => healthStore.startTracker('bike')}
									class="rounded-2xl border px-8 py-5 transition-all duration-300 {healthStore.activityType ===
									'bike'
										? 'border-[#9999FF] bg-[#9999FF]/10 text-white shadow-[0_0_20px_rgba(153,153,255,0.2)]'
										: 'border-white/10 bg-white/2 text-white/60 hover:border-white/20'}"
								>
									<span class="mb-1 block text-2xl">🚴‍♂️</span>
									<span class="text-xs font-bold tracking-wider uppercase">Bike</span>
								</button>
								<button
									onclick={() => healthStore.startTracker('walk')}
									class="rounded-2xl border px-8 py-5 transition-all duration-300 {healthStore.activityType ===
									'walk'
										? 'border-[#9999FF] bg-[#9999FF]/10 text-white shadow-[0_0_20px_rgba(153,153,255,0.2)]'
										: 'border-white/10 bg-white/2 text-white/60 hover:border-white/20'}"
								>
									<span class="mb-1 block text-2xl">🚶‍♂️</span>
									<span class="text-xs font-bold tracking-wider uppercase">Walk</span>
								</button>
							</div>

							<button
								onclick={() => healthStore.startTracker(healthStore.activityType)}
								class="rounded-xl bg-[#9999FF] px-10 py-4 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.2)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_30px_rgba(153,153,255,0.4)]"
							>
								Start Session
							</button>
						</div>
					{:else}
						<!-- Active Telemetry Dashboard -->
						<div class="py-10">
							<div class="mb-10 grid grid-cols-3 gap-6">
								<div
									class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6 text-center"
								>
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Stopwatch Time</span
									>
									<span class="mt-2 text-4xl font-black text-white"
										>{formatTime(healthStore.elapsedSeconds)}</span
									>
								</div>
								<div
									class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6 text-center"
								>
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Distance Covered</span
									>
									<span class="mt-2 text-4xl font-black text-[#9999FF]">
										{(healthStore.distanceMeters / 1000).toFixed(2)}<span
											class="ml-1 text-sm font-light text-white/45">km</span
										>
									</span>
								</div>
								<div
									class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6 text-center"
								>
									<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
										>Current Velocity</span
									>
									<span class="mt-2 text-4xl font-black text-white">
										{healthStore.currentSpeedKmh}<span class="ml-1 text-sm font-light text-white/45"
											>km/h</span
										>
									</span>
								</div>
							</div>

							<div class="text-center">
								<button
									onclick={() => healthStore.stopTracker()}
									class="rounded-xl bg-red-500 px-10 py-4 text-xs font-bold tracking-wider text-white uppercase shadow-[0_4px_20px_rgba(239,68,68,0.3)] transition-all duration-300 hover:bg-red-600"
								>
									Stop & Save Session
								</button>
							</div>
						</div>
					{/if}

					<!-- Past Workout History -->
					<div class="mt-8 border-t border-white/5 pt-8">
						<h3 class="mb-4 text-sm font-bold text-white">Activity History</h3>
						<div class="space-y-3">
							{#each healthStore.workouts as wo (wo.id)}
								<div
									class="flex items-center justify-between rounded-2xl border border-white/5 bg-white/1 p-5"
								>
									<div class="flex items-center gap-4">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg"
										>
											{wo.type === 'run' ? '🏃‍♂️' : wo.type === 'bike' ? '🚴‍♂️' : '🚶‍♂️'}
										</div>
										<div>
											<span class="text-sm font-bold text-white uppercase">{wo.type} Session</span>
											<p class="mt-0.5 text-xs text-white/40">
												{new Date(wo.date).toLocaleString()}
											</p>
										</div>
									</div>
									<div class="flex items-center gap-6 text-right">
										<div>
											<span class="block text-xs text-white/40">Distance</span>
											<span class="text-sm font-bold text-white"
												>{(wo.distanceMeters / 1000).toFixed(2)} km</span
											>
										</div>
										<div>
											<span class="block text-xs text-white/40">Duration</span>
											<span class="text-sm font-bold text-white"
												>{Math.round(wo.durationSeconds / 60)} mins</span
											>
										</div>
										<div>
											<span class="block text-xs text-white/40">Calories</span>
											<span class="text-sm font-bold text-[#9999FF]">{wo.caloriesBurned} kcal</span>
										</div>
									</div>
								</div>
							{:else}
								<div class="py-8 text-center text-xs text-white/30">No recorded workouts yet.</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- TAB 2: NUTRITION & MACROS -->
			{:else if healthStore.activeTab === 'nutrition'}
				<div class="space-y-6">
					<!-- Daily Summary Cards -->
					<div class="grid grid-cols-4 gap-4">
						<div
							class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6"
						>
							<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Total Calories</span
							>
							<span class="mt-2 text-3xl font-black text-white"
								>{healthStore.todayNutritionTotals.calories}<span
									class="ml-1 text-sm font-light text-white/45">kcal</span
								></span
							>
							<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
								<div
									class="h-full bg-[#9999FF]"
									style="width: {Math.min(
										(healthStore.todayNutritionTotals.calories / 2500) * 100,
										100
									)}%"
								></div>
							</div>
						</div>
						<div
							class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6"
						>
							<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Carbohydrates</span
							>
							<span class="mt-2 text-3xl font-black text-white"
								>{healthStore.todayNutritionTotals.carbs}<span
									class="ml-1 text-sm font-light text-white/45">g</span
								></span
							>
							<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
								<div
									class="h-full bg-blue-400"
									style="width: {Math.min(
										(healthStore.todayNutritionTotals.carbs / 300) * 100,
										100
									)}%"
								></div>
							</div>
						</div>
						<div
							class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6"
						>
							<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Fat</span
							>
							<span class="mt-2 text-3xl font-black text-white"
								>{healthStore.todayNutritionTotals.fat}<span
									class="ml-1 text-sm font-light text-white/45">g</span
								></span
							>
							<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
								<div
									class="h-full bg-amber-400"
									style="width: {Math.min((healthStore.todayNutritionTotals.fat / 80) * 100, 100)}%"
								></div>
							</div>
						</div>
						<div
							class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6"
						>
							<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Protein</span
							>
							<span class="mt-2 text-3xl font-black text-white"
								>{healthStore.todayNutritionTotals.protein}<span
									class="ml-1 text-sm font-light text-white/45">g</span
								></span
							>
							<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
								<div
									class="h-full bg-emerald-400"
									style="width: {Math.min(
										(healthStore.todayNutritionTotals.protein / 150) * 100,
										100
									)}%"
								></div>
							</div>
						</div>
					</div>
					<div
						class="rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20"
					>
						<h3 class="mb-6 text-lg font-bold text-white">Log Meal or Food Item</h3>
						<div class="mb-4 grid grid-cols-2 gap-4">
							<label class="block">
								<span
									class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
									>Food Name</span
								>
								<input
									type="text"
									bind:value={healthStore.foodName}
									placeholder="e.g. Salmon & Rice"
									class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6"
								/>
							</label>
							<label class="block">
								<span
									class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
									>Calories (kcal)</span
								>
								<input
									type="number"
									bind:value={healthStore.foodCalories}
									placeholder="e.g. 600"
									class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6"
								/>
							</label>
						</div>
						<div class="mb-6 grid grid-cols-3 gap-4">
							<label class="block">
								<span
									class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
									>Carbs (g)</span
								>
								<input
									type="number"
									bind:value={healthStore.foodCarbs}
									placeholder="0"
									class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6"
								/>
							</label>
							<label class="block">
								<span
									class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
									>Fat (g)</span
								>
								<input
									type="number"
									bind:value={healthStore.foodFat}
									placeholder="0"
									class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6"
								/>
							</label>
							<label class="block">
								<span
									class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
									>Protein (g)</span
								>
								<input
									type="number"
									bind:value={healthStore.foodProtein}
									placeholder="0"
									class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6"
								/>
							</label>
						</div>
						<button
							onclick={() => healthStore.addNutritionLog()}
							class="rounded-xl bg-[#9999FF] px-6 py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE]"
						>
							Add Nutrition Log
						</button>
					</div>
					<div class="rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl">
						<h3 class="mb-4 text-sm font-bold text-white">Today's Nutrition Logs</h3>
						<div class="space-y-3">
							{#each healthStore.nutrition as item (item.id)}
								<div
									class="flex items-center justify-between rounded-2xl border border-white/5 bg-white/1 p-5"
								>
									<div>
										<span class="text-sm font-bold text-white">{item.name}</span>
										<p class="mt-0.5 text-xs text-white/40">{item.date}</p>
									</div>
									<div class="flex items-center gap-6">
										<div class="text-right">
											<span class="text-sm font-bold text-[#9999FF]">{item.calories} kcal</span>
											<p class="text-[10px] text-white/40">
												C: {item.carbsG}g | F: {item.fatG}g | P: {item.proteinG}g
											</p>
										</div>
										<button
											onclick={() => healthStore.deleteNutrition(item.id)}
											class="px-2 text-xs text-red-400 hover:text-red-300">✕</button
										>
									</div>
								</div>
							{:else}
								<div class="py-8 text-center text-xs text-white/30">
									No nutrition logs for today.
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- TAB 3: WEIGHT TRACKER -->
			{:else if healthStore.activeTab === 'weight'}
				<div class="space-y-6">
					<div class="grid grid-cols-2 gap-6">
						<div
							class="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl"
						>
							<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Current Weight</span
							>
							<span class="mt-4 text-5xl font-black text-white"
								>{healthStore.latestWeight}<span class="ml-2 text-lg font-light text-[#9999FF]"
									>kg</span
								></span
							>
							<p class="mt-4 text-xs text-white/40">
								Track your weight over time to hit your personal goals.
							</p>
						</div>

						<div class="rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl">
							<h3 class="mb-4 text-lg font-bold text-white">Log Weight Entry</h3>
							<label class="mb-4 block">
								<span
									class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
									>Weight (kg)</span
								>
								<input
									type="number"
									step="0.1"
									bind:value={healthStore.newWeightKg}
									placeholder="78.0"
									class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6"
								/>
							</label>
							<button
								onclick={() => healthStore.addWeightEntry()}
								class="rounded-xl bg-[#9999FF] px-6 py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE]"
							>
								Save Weight Record
							</button>
						</div>
					</div>

					<div class="rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl">
						<h3 class="mb-4 text-sm font-bold text-white">Weight History Log</h3>
						<div class="space-y-3">
							{#each healthStore.weights as w (w.id)}
								<div
									class="flex items-center justify-between rounded-2xl border border-white/5 bg-white/1 p-5"
								>
									<span class="text-sm font-bold text-white">{w.date}</span>
									<div class="flex items-center gap-6">
										<span class="text-sm font-bold text-[#9999FF]">{w.weightKg} kg</span>
										<button
											onclick={() => healthStore.deleteWeight(w.id)}
											class="px-2 text-xs text-red-400 hover:text-red-300">✕</button
										>
									</div>
								</div>
							{:else}
								<div class="py-8 text-center text-xs text-white/30">
									No weight entries recorded.
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>
