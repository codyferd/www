import { SvelteDate } from 'svelte/reactivity';
import { INITIAL_EVENTS, type CalendarEvent, type CalendarExportData } from './types';

class CalendarState {
	public events = $state<CalendarEvent[]>(INITIAL_EVENTS);
	public currentDate = $state<SvelteDate>(new SvelteDate());
	public viewMode = $state<'month' | 'week'>('month');
	public selectedCategory = $state<string>('all');
	public searchQuery = $state<string>('');
	public activeModalEvent = $state<CalendarEvent | null>(null);
	public isModalOpen = $state<boolean>(false);
	public modalDatePreset = $state<string>('');

	// Form State
	public formTitle = $state<string>('');
	public formDescription = $state<string>('');
	public formDate = $state<string>('');
	public formTime = $state<string>('');
	public formCategory = $state<CalendarEvent['category']>('work');

	// Computed Metrics & Filtered Views
	public filteredEvents = $derived.by(() => {
		return this.events.filter((evt) => {
			const matchesCategory =
				this.selectedCategory === 'all' || evt.category === this.selectedCategory;
			const matchesSearch =
				!this.searchQuery ||
				evt.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
				(evt.description && evt.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
			return matchesCategory && matchesSearch;
		});
	});

	public upcomingEvents = $derived.by(() => {
		const today = new Date().toISOString().split('T')[0];
		return this.filteredEvents
			.filter((e) => e.date >= today)
			.sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`))
			.slice(0, 5);
	});

	public totalMonthEvents = $derived.by(() => {
		const year = this.currentDate.getFullYear();
		const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
		const prefix = `${year}-${month}`;
		return this.events.filter((e) => e.date.startsWith(prefix)).length;
	});

	// Date Navigation Actions
	public prev() {
		const d = new SvelteDate(this.currentDate);
		if (this.viewMode === 'month') d.setMonth(d.getMonth() - 1);
		else d.setDate(d.getDate() - 7);
		this.currentDate = d;
	}

	public next() {
		const d = new SvelteDate(this.currentDate);
		if (this.viewMode === 'month') d.setMonth(d.getMonth() + 1);
		else d.setDate(d.getDate() + 7);
		this.currentDate = d;
	}

	public today() {
		this.currentDate = new SvelteDate();
	}

	// Modal & Event CRUD
	public openCreateModal(dateStr?: string) {
		this.activeModalEvent = null;
		this.formTitle = '';
		this.formDescription = '';
		this.formDate = dateStr || new Date().toISOString().split('T')[0];
		this.formTime = '12:00';
		this.formCategory = 'work';
		this.isModalOpen = true;
	}

	public openEditModal(event: CalendarEvent) {
		this.activeModalEvent = event;
		this.formTitle = event.title;
		this.formDescription = event.description || '';
		this.formDate = event.date;
		this.formTime = event.time || '';
		this.formCategory = event.category;
		this.isModalOpen = true;
	}

	public closeModal() {
		this.isModalOpen = false;
		this.activeModalEvent = null;
	}

	public saveEvent() {
		if (!this.formTitle.trim() || !this.formDate) return;

		if (this.activeModalEvent) {
			this.events = this.events.map((evt) =>
				evt.id === this.activeModalEvent!.id
					? {
							...evt,
							title: this.formTitle.trim(),
							description: this.formDescription.trim(),
							date: this.formDate,
							time: this.formTime,
							category: this.formCategory
						}
					: evt
			);
		} else {
			const newEvent: CalendarEvent = {
				id: `evt-${Date.now()}`,
				title: this.formTitle.trim(),
				description: this.formDescription.trim(),
				date: this.formDate,
				time: this.formTime,
				category: this.formCategory
			};
			this.events = [...this.events, newEvent];
		}

		this.closeModal();
	}

	public deleteEvent(id: string) {
		this.events = this.events.filter((e) => e.id !== id);
		if (this.activeModalEvent?.id === id) this.closeModal();
	}

	// JSON Import / Export Infrastructure
	public exportJson() {
		const payload: CalendarExportData = {
			app: 'Avero Calendar',
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			events: $state.snapshot(this.events)
		};

		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `avero-calendar-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	public importJson(file: File): Promise<number> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const parsed = JSON.parse(e.target?.result as string);
					const importedEvents: CalendarEvent[] = Array.isArray(parsed) ? parsed : parsed.events;

					if (!Array.isArray(importedEvents)) {
						throw new Error('Invalid JSON structure: Missing array or events property.');
					}

					const valid = importedEvents.filter(
						(evt) => evt && typeof evt.title === 'string' && typeof evt.date === 'string'
					);

					const existingIds = new Set(this.events.map((ev) => ev.id));
					const deduplicated = valid.map((ev) => ({
						...ev,
						id: existingIds.has(ev.id)
							? `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
							: ev.id,
						category: ev.category || 'work'
					}));

					this.events = [...this.events, ...deduplicated];
					resolve(deduplicated.length);
				} catch (err) {
					reject(err instanceof Error ? err.message : 'Invalid JSON file format.');
				}
			};
			reader.onerror = () => reject('Error reading file from disk.');
			reader.readAsText(file);
		});
	}
}

export const calendar = new CalendarState();
