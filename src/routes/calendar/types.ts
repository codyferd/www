export interface CalendarEvent {
	id: string;
	title: string;
	description?: string;
	date: string; // YYYY-MM-DD
	time?: string; // HH:mm
	category: 'work' | 'personal' | 'launch' | 'meeting' | 'reminder';
}

export type CalendarView = 'month' | 'week';

export interface CalendarExportData {
	app: string;
	version: string;
	exportedAt: string;
	events: CalendarEvent[];
}

export const CATEGORY_STYLES: Record<
	CalendarEvent['category'],
	{ label: string; bg: string; border: string; text: string; dot: string }
> = {
	work: {
		label: 'Work',
		bg: 'bg-indigo-500/10',
		border: 'border-indigo-500/30',
		text: 'text-indigo-300',
		dot: 'bg-indigo-400'
	},
	personal: {
		label: 'Personal',
		bg: 'bg-emerald-500/10',
		border: 'border-emerald-500/30',
		text: 'text-emerald-300',
		dot: 'bg-emerald-400'
	},
	launch: {
		label: 'Launch',
		bg: 'bg-[#9999FF]/15',
		border: 'border-[#9999FF]/40',
		text: 'text-[#9999FF]',
		dot: 'bg-[#9999FF]'
	},
	meeting: {
		label: 'Meeting',
		bg: 'bg-amber-500/10',
		border: 'border-amber-500/30',
		text: 'text-amber-300',
		dot: 'bg-amber-400'
	},
	reminder: {
		label: 'Reminder',
		bg: 'bg-rose-500/10',
		border: 'border-rose-500/30',
		text: 'text-rose-300',
		dot: 'bg-rose-400'
	}
};

export const INITIAL_EVENTS: CalendarEvent[] = [];
