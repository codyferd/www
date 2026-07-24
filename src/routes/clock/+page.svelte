<!-- src/routes/clock/+page.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Clock } from './clock.svelte';

	onDestroy(() => {
		Clock.destroy();
	});
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-sans tracking-tight text-white"
>
	<!-- Nav Control Tabs -->
	<div class="mb-8 flex gap-2 rounded-xl border border-white/5 bg-white/2 p-1 backdrop-blur-md">
		<button
			onclick={() => (Clock.currentTab = 'stopwatch')}
			class="rounded-lg px-4 py-2 text-[10px] font-black tracking-wider uppercase transition-all duration-200 {Clock.currentTab ===
			'stopwatch'
				? 'bg-[#9999FF]/15 text-[#9999FF]'
				: 'text-zinc-500 hover:text-white'}"
		>
			Stopwatch
		</button>
		<button
			onclick={() => (Clock.currentTab = 'timer')}
			class="rounded-lg px-4 py-2 text-[10px] font-black tracking-wider uppercase transition-all duration-200 {Clock.currentTab ===
			'timer'
				? 'bg-[#9999FF]/15 text-[#9999FF]'
				: 'text-zinc-500 hover:text-white'}"
		>
			Timer
		</button>
		<button
			onclick={() => (Clock.currentTab = 'worldtime')}
			class="rounded-lg px-4 py-2 text-[10px] font-black tracking-wider uppercase transition-all duration-200 {Clock.currentTab ===
			'worldtime'
				? 'bg-[#9999FF]/15 text-[#9999FF]'
				: 'text-zinc-500 hover:text-white'}"
		>
			World Time
		</button>
	</div>

	<!-- Canvas Wrapper Layer -->
	<div
		class="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/2 p-6 shadow-[0_0_20px_rgba(153,153,255,0.05)] backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4 md:p-10"
	>
		<!-- ================== MODE: STOPWATCH ================== -->
		{#if Clock.currentTab === 'stopwatch'}
			<div class="flex flex-col items-center gap-6">
				<span class="text-[10px] font-black tracking-[0.4em] text-[#9999FF] uppercase"
					>System Chronometer</span
				>

				<div
					class="flex items-baseline font-mono text-6xl font-black tracking-tighter sm:text-7xl {Clock
						.stopwatch.isRunning
						? 'text-white drop-shadow-[0_0_30px_rgba(153,153,255,0.3)]'
						: 'text-zinc-300'}"
				>
					<span>{Clock.formattedStopwatch.main}</span>
					<span class="ml-2 w-16 text-2xl font-bold text-[#9999FF] opacity-80"
						>{Clock.formattedStopwatch.ms}</span
					>
				</div>

				<div class="flex w-full gap-3">
					<button
						onclick={() => Clock.toggleStopwatch()}
						class="flex-1 rounded-xl py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(153,153,255,0.35)] {Clock
							.stopwatch.isRunning
							? 'bg-rose-500 hover:bg-rose-600'
							: 'bg-[#9999FF] hover:bg-[#8888EE]'}"
					>
						{Clock.stopwatch.isRunning ? 'STOP' : 'START'}
					</button>
					<button
						onclick={() => Clock.recordLap()}
						disabled={!Clock.stopwatch.isRunning}
						class="rounded-xl border border-white/10 bg-white/5 px-6 text-xs font-bold tracking-wider text-white uppercase transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
					>
						LAP
					</button>
					<button
						onclick={() => Clock.resetStopwatch()}
						class="rounded-xl border border-white/10 bg-white/5 px-6 text-xs font-bold tracking-wider text-white uppercase transition-all hover:bg-white/10"
					>
						RESET
					</button>
				</div>

				<!-- Lap Metrics Panel -->
				<div
					class="flex h-48 w-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/1"
				>
					<div
						class="flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-y-auto p-4"
					>
						{#if Clock.stopwatch.laps.length === 0}
							<div
								class="flex h-full items-center justify-center text-[9px] font-bold tracking-widest text-white/20 uppercase"
							>
								No Laps Recorded
							</div>
						{:else}
							{#each Clock.stopwatch.laps.slice().reverse() as time, idx (time + idx)}
								<div
									class="flex items-center justify-between border-b border-white/5 py-2.5 text-[10px] font-black tracking-wider uppercase last:border-0"
								>
									<span class="text-zinc-500">LAP {Clock.stopwatch.laps.length - idx}</span>
									<span class="font-mono text-sm text-white">{time}</span>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- ================== MODE: TIMER ================== -->
		{#if Clock.currentTab === 'timer'}
			<div class="flex flex-col items-center gap-6">
				<span class="text-[10px] font-black tracking-[0.4em] text-[#9999FF] uppercase"
					>Countdown Engine</span
				>

				{#if Clock.timer.isConfigMode}
					<!-- Input Setup Wheels -->
					<div class="flex items-center gap-3 font-mono">
						<div class="flex flex-col items-center">
							<input
								type="number"
								bind:value={Clock.timerInput.hours}
								min="0"
								max="23"
								class="w-16 rounded-xl border border-white/10 bg-white/5 py-2 text-center text-xl text-white outline-none focus:border-[#9999FF]/50"
							/>
							<span class="mt-1 text-[8px] font-black tracking-widest text-zinc-500 uppercase"
								>HRS</span
							>
						</div>
						<span class="mb-4 text-xl text-zinc-600">:</span>
						<div class="flex flex-col items-center">
							<input
								type="number"
								bind:value={Clock.timerInput.minutes}
								min="0"
								max="59"
								class="w-16 rounded-xl border border-white/10 bg-white/5 py-2 text-center text-xl text-white outline-none focus:border-[#9999FF]/50"
							/>
							<span class="mt-1 text-[8px] font-black tracking-widest text-zinc-500 uppercase"
								>MIN</span
							>
						</div>
						<span class="mb-4 text-xl text-zinc-600">:</span>
						<div class="flex flex-col items-center">
							<input
								type="number"
								bind:value={Clock.timerInput.seconds}
								min="0"
								max="59"
								class="w-16 rounded-xl border border-white/10 bg-white/5 py-2 text-center text-xl text-white outline-none focus:border-[#9999FF]/50"
							/>
							<span class="mt-1 text-[8px] font-black tracking-widest text-zinc-500 uppercase"
								>SEC</span
							>
						</div>
					</div>
				{:else}
					<!-- Live Counter Panel -->
					<div
						class="flex items-baseline font-mono text-6xl font-black tracking-tighter sm:text-7xl
						{Clock.timer.isExpired
							? 'animate-pulse text-rose-500'
							: Clock.timer.isRunning
								? 'text-white drop-shadow-[0_0_30px_rgba(153,153,255,0.3)]'
								: 'text-zinc-400'}"
					>
						<span>{Clock.formattedTimer.main}</span>
						<span class="ml-2 w-16 text-2xl font-bold text-[#9999FF] opacity-80"
							>{Clock.formattedTimer.ms}</span
						>
					</div>
				{/if}

				<div class="flex w-full gap-3">
					{#if Clock.timer.isConfigMode}
						<button
							onclick={() => Clock.lockAndStartTimer()}
							class="flex-1 rounded-xl bg-[#9999FF] py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE]"
						>
							SET & START
						</button>
					{:else}
						<button
							onclick={() => Clock.toggleTimer()}
							class="flex-1 rounded-xl py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 {Clock
								.timer.isRunning
								? 'bg-rose-500 hover:bg-rose-600'
								: 'bg-[#9999FF] hover:bg-[#8888EE]'}"
						>
							{Clock.timer.isRunning ? 'STOP' : 'START'}
						</button>
					{/if}
					<button
						onclick={() => Clock.resetTimer()}
						disabled={Clock.timer.isConfigMode}
						class="rounded-xl border border-white/10 bg-white/5 px-6 text-xs font-bold tracking-wider text-white uppercase transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-20"
					>
						CLEAR
					</button>
				</div>

				<!-- Fast Preset Presets Row -->
				<div class="flex w-full justify-center gap-2">
					<button
						onclick={() => Clock.setPresetTimer(1)}
						class="flex-1 rounded-lg border border-white/5 bg-white/2 px-3 py-2 text-[9px] font-black tracking-wider text-zinc-400 uppercase transition duration-300 hover:border-[#9999FF]/30 hover:text-white"
						>1 MIN</button
					>
					<button
						onclick={() => Clock.setPresetTimer(5)}
						class="flex-1 rounded-lg border border-white/5 bg-white/2 px-3 py-2 text-[9px] font-black tracking-wider text-zinc-400 uppercase transition duration-300 hover:border-[#9999FF]/30 hover:text-white"
						>5 MIN</button
					>
					<button
						onclick={() => Clock.setPresetTimer(10)}
						class="flex-1 rounded-lg border border-white/5 bg-white/2 px-3 py-2 text-[9px] font-black tracking-wider text-zinc-400 uppercase transition duration-300 hover:border-[#9999FF]/30 hover:text-white"
						>10 MIN</button
					>
				</div>
			</div>
		{/if}

		<!-- ================== MODE: WORLD TIME ================== -->
		{#if Clock.currentTab === 'worldtime'}
			<div class="flex flex-col items-center gap-6">
				<span class="text-[10px] font-black tracking-[0.4em] text-[#9999FF] uppercase"
					>Global Matrix Finder</span
				>

				<!-- Local Terminal View Node -->
				<div
					class="flex w-full flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/1 p-4"
				>
					<span class="mb-1 text-[9px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
						>Local Terminal Frame</span
					>
					<div class="font-mono text-3xl font-black text-zinc-100">{Clock.localClockDisplay}</div>
				</div>

				<!-- Main World Tracking Node -->
				<div
					class="flex h-64 w-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/1"
				>
					<!-- Header Search Deck -->
					<form
						onsubmit={(e) => {
							e.preventDefault();
							Clock.queryGlobalLocation();
						}}
						class="flex gap-2 border-b border-white/5 bg-black/20 p-2"
					>
						<input
							type="text"
							bind:value={Clock.searchQuery}
							placeholder={Clock.apiState.loading
								? 'Querying Satellite Node...'
								: 'Add anywhere (e.g. Iceland, Cairo)...'}
							disabled={Clock.apiState.loading}
							class="flex-1 rounded-xl border border-white/10 bg-white/3 px-4 py-2 text-xs text-white placeholder-white/20 transition duration-300 outline-none focus:border-[#9999FF]/50"
						/>
						<button
							type="submit"
							disabled={Clock.apiState.loading || !Clock.searchQuery.trim()}
							class="rounded-xl bg-[#9999FF] px-4 text-[10px] font-black tracking-wider text-black uppercase transition duration-200 hover:bg-[#8888EE] disabled:bg-zinc-800 disabled:text-zinc-600"
						>
							{Clock.apiState.loading ? '...' : 'Add'}
						</button>
					</form>

					<!-- Tracked Container Body -->
					<div
						class="flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-y-auto p-3"
					>
						{#if Clock.apiState.error}
							<div
								class="p-2 text-center text-[9px] font-bold tracking-wider text-rose-400 uppercase"
							>
								✕ {Clock.apiState.error}
							</div>
						{/if}

						{#if Clock.trackedZones.length === 0}
							<div
								class="flex h-full items-center justify-center text-[9px] font-bold tracking-widest text-white/20 uppercase"
							>
								No Tracked Nodes
							</div>
						{:else}
							{#each Clock.computedZoneTimes as zone (zone.id)}
								<div
									class="group flex items-center justify-between rounded-xl border-b border-white/5 px-2 py-2.5 transition last:border-0 hover:bg-white/2"
								>
									<div class="flex max-w-[70%] flex-col">
										<span class="truncate text-xs font-bold text-zinc-200">{zone.label}</span>
										<span
											class="mt-0.5 truncate font-mono text-[8px] tracking-normal text-zinc-500 lowercase"
											>{zone.tzName}</span
										>
									</div>
									<div class="flex items-center gap-3">
										<span class="font-mono text-xs font-bold text-[#9999FF]">{zone.time}</span>
										<button
											onclick={() => Clock.removeZone(zone.id)}
											class="cursor-pointer border-none bg-transparent p-0 font-sans text-sm font-bold text-zinc-600 transition-colors hover:text-rose-400"
										>
											×
										</button>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
