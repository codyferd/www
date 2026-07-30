<script lang="ts">
	import { calendar } from './calendar.svelte';
	import { CATEGORY_STYLES } from './types';

	let fileInputRef: HTMLInputElement;

	function getDaysInMonth(year: number, month: number) {
		return new Date(year, month + 1, 0).getDate();
	}

	function getMonthGrid(currentDate: Date) {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstDayIndex = new Date(year, month, 1).getDay();
		const totalDays = getDaysInMonth(year, month);
		const prevMonthDays = getDaysInMonth(year, month - 1);
		const todayStr = new Date().toISOString().split('T')[0];

		const cells = [];

		// Leading days from previous month
		for (let i = firstDayIndex - 1; i >= 0; i--) {
			const dayNum = prevMonthDays - i;
			const dateStr = new Date(year, month - 1, dayNum).toISOString().split('T')[0];
			cells.push({ dateStr, dayNum, isCurrentMonth: false, isToday: dateStr === todayStr });
		}

		// Current month days
		for (let d = 1; d <= totalDays; d++) {
			const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			cells.push({ dateStr, dayNum: d, isCurrentMonth: true, isToday: dateStr === todayStr });
		}

		// Trailing days (42 cells max)
		const remaining = 42 - cells.length;
		for (let x = 1; x <= remaining; x++) {
			const dateStr = new Date(year, month + 1, x).toISOString().split('T')[0];
			cells.push({ dateStr, dayNum: x, isCurrentMonth: false, isToday: dateStr === todayStr });
		}

		return cells;
	}

	function getWeekGrid(currentDate: Date) {
		const todayStr = new Date().toISOString().split('T')[0];
		const firstTimestamp = currentDate.getTime() - currentDate.getDay() * 86400000;

		return Array.from({ length: 7 }, (_, i) => {
			const day = new Date(firstTimestamp + i * 86400000);
			const dateStr = day.toISOString().split('T')[0];
			return {
				dateStr,
				dayNum: day.getDate(),
				dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
				isToday: dateStr === todayStr
			};
		});
	}

	async function handleFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files?.[0]) {
			try {
				const count = await calendar.importJson(target.files[0]);
				alert(`Successfully imported ${count} event(s).`);
			} catch (err) {
				alert(`Import failed: ${err}`);
			} finally {
				target.value = '';
			}
		}
	}
</script>

<div class="min-h-screen bg-black p-4 font-sans tracking-tight text-white md:p-8">
	<!-- Top Navigation Header -->
	<header class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<div class="flex items-center gap-3">
				<div class="h-3 w-3 rounded-full bg-[#9999FF] shadow-[0_0_12px_#9999FF]"></div>
				<h1 class="text-2xl font-black tracking-wider text-white uppercase">Avero Calendar</h1>
				<span
					class="rounded-full border border-[#9999FF]/30 bg-[#9999FF]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#9999FF]"
				>
					v1.0
				</span>
			</div>
			<p class="mt-1 text-xs text-white/40">
				Event engine with live filters & schema import/export
			</p>
		</div>

		<!-- Action Controls -->
		<div class="flex flex-wrap items-center gap-2">
			<button
				onclick={() => calendar.openCreateModal()}
				class="rounded-xl bg-[#9999FF] px-5 py-2.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
			>
				+ New Event
			</button>

			<button
				onclick={() => calendar.exportJson()}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-[#9999FF]/40 hover:bg-white/10"
			>
				Export JSON
			</button>

			<button
				onclick={() => fileInputRef.click()}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-[#9999FF]/40 hover:bg-white/10"
			>
				Import JSON
			</button>
			<input
				type="file"
				accept=".json"
				bind:this={fileInputRef}
				onchange={handleFileUpload}
				class="hidden"
			/>
		</div>
	</header>

	<!-- Dashboard Canvas Wrapper -->
	<div
		class="rounded-[28px] border border-white/10 bg-white/2 p-4 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4 md:p-8"
	>
		<!-- Metrics Row -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div
				class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-5 transition duration-300 hover:border-[#9999FF]/20"
			>
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>Total Stored</span
				>
				<span class="mt-2 text-3xl font-black text-white"
					>{calendar.events.length}<span class="ml-1 text-sm font-light text-white/45">events</span
					></span
				>
				<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
					<div
						class="h-full bg-[#9999FF]"
						style="width: {Math.min(calendar.events.length * 10, 100)}%"
					></div>
				</div>
			</div>

			<div
				class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-5 transition duration-300 hover:border-[#9999FF]/20"
			>
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>Current Month</span
				>
				<span class="mt-2 text-3xl font-black text-white"
					>{calendar.totalMonthEvents}<span class="ml-1 text-sm font-light text-white/45"
						>scheduled</span
					></span
				>
				<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
					<div
						class="h-full bg-emerald-400"
						style="width: {Math.min(calendar.totalMonthEvents * 15, 100)}%"
					></div>
				</div>
			</div>

			<div
				class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-5 transition duration-300 hover:border-[#9999FF]/20"
			>
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>System Status</span
				>
				<div class="mt-2 flex items-center gap-2">
					<span class="flex h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500"></span>
					<span class="text-xl font-bold text-white">Live Sync</span>
				</div>
				<p class="mt-3 text-[11px] text-white/40">Local reactive state active</p>
			</div>

			<div
				class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-5 transition duration-300 hover:border-[#9999FF]/20"
			>
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>Active Filter</span
				>
				<span class="mt-2 text-xl font-bold text-[#9999FF] capitalize"
					>{calendar.selectedCategory}</span
				>
				<p class="mt-3 text-[11px] text-white/40">
					{calendar.filteredEvents.length} matches showing
				</p>
			</div>
		</div>

		<!-- Toolbar Filters & Search -->
		<div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<!-- Month Navigator -->
			<div class="flex items-center gap-3">
				<button
					onclick={() => calendar.prev()}
					class="rounded-xl border border-white/10 bg-white/5 p-2 text-xs hover:border-[#9999FF]/40 hover:bg-white/10"
				>
					‹
				</button>
				<h2 class="min-w-40 text-center text-lg font-bold text-white">
					{calendar.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
				</h2>
				<button
					onclick={() => calendar.next()}
					class="rounded-xl border border-white/10 bg-white/5 p-2 text-xs hover:border-[#9999FF]/40 hover:bg-white/10"
				>
					›
				</button>
				<button
					onclick={() => calendar.today()}
					class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:text-white"
				>
					Today
				</button>
			</div>

			<!-- Search & View Mode Switch -->
			<div class="flex flex-wrap items-center gap-3">
				<input
					type="text"
					placeholder="Search events..."
					bind:value={calendar.searchQuery}
					class="w-full rounded-2xl border border-white/10 bg-white/3 px-4 py-2 text-xs text-white outline-none focus:border-[#9999FF]/50 sm:w-48"
				/>

				<!-- View Mode Switch -->
				<div class="flex rounded-xl border border-white/10 bg-white/5 p-1">
					<button
						onclick={() => (calendar.viewMode = 'month')}
						class="rounded-lg px-3 py-1 text-xs font-semibold transition {calendar.viewMode ===
						'month'
							? 'bg-[#9999FF] text-black'
							: 'text-white/60 hover:text-white'}"
					>
						Month
					</button>
					<button
						onclick={() => (calendar.viewMode = 'week')}
						class="rounded-lg px-3 py-1 text-xs font-semibold transition {calendar.viewMode ===
						'week'
							? 'bg-[#9999FF] text-black'
							: 'text-white/60 hover:text-white'}"
					>
						Week
					</button>
				</div>
			</div>
		</div>

		<!-- Category Filter Pills -->
		<div class="mb-6 flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
			<button
				onclick={() => (calendar.selectedCategory = 'all')}
				class="rounded-xl border px-3 py-1.5 text-xs font-medium transition {calendar.selectedCategory ===
				'all'
					? 'border-[#9999FF] bg-[#9999FF]/20 text-[#9999FF]'
					: 'border-white/5 bg-white/2 text-white/50 hover:text-white'}"
			>
				All
			</button>
			{#each Object.entries(CATEGORY_STYLES) as [catKey, catStyle] (catKey)}
				<button
					onclick={() => (calendar.selectedCategory = catKey)}
					class="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition {calendar.selectedCategory ===
					catKey
						? 'border-[#9999FF] bg-[#9999FF]/20 text-white'
						: 'border-white/5 bg-white/2 text-white/50 hover:text-white'}"
				>
					<span class="h-2 w-2 rounded-full {catStyle.dot}"></span>
					{catStyle.label}
				</button>
			{/each}
		</div>

		<!-- CALENDAR MAIN VIEWS -->
		{#if calendar.viewMode === 'month'}
			<!-- Month Grid Header -->
			<div
				class="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-black tracking-widest text-white/30 uppercase"
			>
				<span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span
					>Fri</span
				><span>Sat</span>
			</div>

			<!-- Month Cells -->
			<div class="grid grid-cols-7 gap-2">
				{#each getMonthGrid(calendar.currentDate) as cell (cell.dateStr)}
					{@const dayEvents = calendar.filteredEvents.filter((e) => e.date === cell.dateStr)}
					<button
						type="button"
						onclick={() => calendar.openCreateModal(cell.dateStr)}
						class="group flex min-h-27.5 cursor-pointer flex-col justify-between rounded-2xl border p-2 text-left transition duration-300 {cell.isToday
							? 'border-[#9999FF]/60 bg-[#9999FF]/5'
							: cell.isCurrentMonth
								? 'border-white/5 bg-white/1 hover:border-[#9999FF]/30 hover:bg-white/3'
								: 'border-transparent bg-white/0.5 text-white/20'}"
					>
						<div class="flex w-full items-center justify-between">
							<span
								class="text-xs font-bold {cell.isToday
									? 'text-[#9999FF]'
									: cell.isCurrentMonth
										? 'text-white/80'
										: 'text-white/20'}"
							>
								{cell.dayNum}
							</span>
							{#if cell.isToday}
								<span
									class="rounded-full bg-[#9999FF] px-1.5 py-0.5 text-[9px] font-black text-black"
									>TODAY</span
								>
							{/if}
						</div>

						<!-- Events inside cell -->
						<div
							class="mt-2 flex max-h-20 w-full scrollbar-thin scrollbar-thumb-white/10 flex-col gap-1 overflow-y-auto"
						>
							{#each dayEvents as event (event.id)}
								{@const style = CATEGORY_STYLES[event.category]}
								<div
									role="button"
									tabindex="0"
									onclick={(e) => {
										e.stopPropagation();
										calendar.openEditModal(event);
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											calendar.openEditModal(event);
										}
									}}
									class="cursor-pointer rounded-lg border p-1.5 text-left text-[10px] transition-all hover:scale-[1.02] {style.bg} {style.border} {style.text}"
								>
									<div class="truncate font-bold">{event.title}</div>
									{#if event.time}<div class="text-[9px] opacity-70">{event.time}</div>{/if}
								</div>
							{/each}
						</div>
					</button>
				{/each}
			</div>
		{:else}
			<!-- Week Grid View -->
			<div class="grid grid-cols-1 gap-3 md:grid-cols-7">
				{#each getWeekGrid(calendar.currentDate) as day (day.dateStr)}
					{@const dayEvents = calendar.filteredEvents.filter((e) => e.date === day.dateStr)}
					<div class="flex min-h-80 flex-col rounded-2xl border border-white/5 bg-white/1 p-3">
						<div class="mb-3 border-b border-white/5 pb-2 text-center">
							<span class="text-[10px] font-bold tracking-wider text-white/40 uppercase"
								>{day.dayName}</span
							>
							<div class="text-lg font-black {day.isToday ? 'text-[#9999FF]' : 'text-white'}">
								{day.dayNum}
							</div>
						</div>

						<div class="flex-1 scrollbar-thin space-y-2 overflow-y-auto">
							{#each dayEvents as event (event.id)}
								{@const style = CATEGORY_STYLES[event.category]}
								<button
									type="button"
									onclick={() => calendar.openEditModal(event)}
									class="w-full cursor-pointer rounded-xl border p-2.5 text-left transition hover:scale-[1.02] {style.bg} {style.border} {style.text}"
								>
									<div class="text-xs font-bold">{event.title}</div>
									{#if event.time}<div class="mt-1 text-[10px] opacity-80">{event.time}</div>{/if}
								</button>
							{/each}
							<button
								type="button"
								onclick={() => calendar.openCreateModal(day.dateStr)}
								class="w-full rounded-xl border border-dashed border-white/10 py-2 text-center text-xs text-white/30 hover:border-[#9999FF]/40 hover:text-[#9999FF]"
							>
								+ Add
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Upcoming Agenda Sidebar / Bottom Section -->
		<div class="mt-8 border-t border-white/5 pt-6">
			<h3 class="mb-4 text-xs font-black tracking-[0.2em] text-[#9999FF] uppercase">
				Upcoming Agenda
			</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
				{#each calendar.upcomingEvents as event (event.id)}
					{@const style = CATEGORY_STYLES[event.category]}
					<button
						type="button"
						onclick={() => calendar.openEditModal(event)}
						class="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-white/5 bg-white/1 p-4 text-left transition duration-300 hover:border-[#9999FF]/30 hover:bg-white/3"
					>
						<div>
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full {style.dot}"></span>
								<span class="text-xs font-bold text-white">{event.title}</span>
							</div>
							<p class="mt-1 text-[11px] text-white/40">
								{event.date}
								{event.time ? `at ${event.time}` : ''}
							</p>
						</div>
						<span
							class="rounded-lg border px-2 py-1 text-[10px] font-bold uppercase {style.bg} {style.border} {style.text}"
						>
							{event.category}
						</span>
					</button>
				{:else}
					<p class="text-xs text-white/30">No upcoming events found.</p>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- EVENT CREATE / EDIT MODAL -->
{#if calendar.isModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
		<div
			class="w-full max-w-md rounded-[28px] border border-white/10 bg-black/90 p-6 shadow-[0_0_50px_rgba(153,153,255,0.15)] md:p-8"
		>
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-lg font-bold text-white">
					{calendar.activeModalEvent ? 'Edit Event' : 'Create New Event'}
				</h2>
				<button onclick={() => calendar.closeModal()} class="text-white/40 hover:text-white"
					>✕</button
				>
			</div>

			<div class="space-y-4">
				<div>
					<label
						for="event-title"
						class="mb-1 block text-[10px] font-bold tracking-wider text-white/40 uppercase"
						>Title *</label
					>
					<input
						id="event-title"
						type="text"
						bind:value={calendar.formTitle}
						placeholder="e.g., Team Standup"
						class="w-full rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-white outline-none focus:border-[#9999FF]/50"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label
							for="event-date"
							class="mb-1 block text-[10px] font-bold tracking-wider text-white/40 uppercase"
							>Date *</label
						>
						<input
							id="event-date"
							type="date"
							bind:value={calendar.formDate}
							class="w-full rounded-2xl border border-white/10 bg-white/3 px-3 py-2.5 text-xs text-white outline-none focus:border-[#9999FF]/50"
						/>
					</div>
					<div>
						<label
							for="event-time"
							class="mb-1 block text-[10px] font-bold tracking-wider text-white/40 uppercase"
							>Time</label
						>
						<input
							id="event-time"
							type="time"
							bind:value={calendar.formTime}
							class="w-full rounded-2xl border border-white/10 bg-white/3 px-3 py-2.5 text-xs text-white outline-none focus:border-[#9999FF]/50"
						/>
					</div>
				</div>

				<div>
					<label
						for="event-category"
						class="mb-1 block text-[10px] font-bold tracking-wider text-white/40 uppercase"
						>Category</label
					>
					<select
						id="event-category"
						bind:value={calendar.formCategory}
						class="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs text-white outline-none focus:border-[#9999FF]/50"
					>
						{#each Object.entries(CATEGORY_STYLES) as [key, style] (key)}
							<option value={key}>{style.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label
						for="event-description"
						class="mb-1 block text-[10px] font-bold tracking-wider text-white/40 uppercase"
						>Description</label
					>
					<textarea
						id="event-description"
						bind:value={calendar.formDescription}
						rows="3"
						placeholder="Add notes or links..."
						class="w-full rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-xs text-white outline-none focus:border-[#9999FF]/50"
					></textarea>
				</div>
			</div>

			<div class="mt-8 flex items-center justify-between">
				{#if calendar.activeModalEvent}
					<button
						onclick={() => calendar.deleteEvent(calendar.activeModalEvent!.id)}
						class="text-xs font-bold text-rose-400 hover:underline"
					>
						Delete
					</button>
				{:else}
					<div></div>
				{/if}

				<div class="flex items-center gap-2">
					<button
						onclick={() => calendar.closeModal()}
						class="rounded-xl px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
					>
						Cancel
					</button>
					<button
						onclick={() => calendar.saveEvent()}
						class="rounded-xl bg-[#9999FF] px-5 py-2.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] hover:bg-[#8888EE]"
					>
						Save Event
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
