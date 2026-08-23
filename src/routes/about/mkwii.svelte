<script lang="ts">
	import { slide } from 'svelte/transition';

	interface Props {
		isOpen: boolean;
	}

	let { isOpen }: Props = $props();

	let activeTab = $state<'vehicles' | 'characters' | 'items' | 'timetrials' | 'specials'>(
		'vehicles'
	);

	const vehicles = [
		// Light Karts
		{
			name: 'Standard Kart S',
			euName: 'Standard Kart S',
			class: 'Light',
			type: 'Kart',
			drf: 'Out',
			sp: 41,
			wt: 29,
			ac: 48,
			hn: 48,
			dr: 51,
			of: 40,
			mt: 45,
			unlock: 'Default'
		},
		{
			name: 'Booster Seat',
			euName: 'Baby Booster',
			class: 'Light',
			type: 'Kart',
			drf: 'Out',
			sp: 27,
			wt: 27,
			ac: 56,
			hn: 64,
			dr: 37,
			of: 54,
			mt: 59,
			unlock: 'Default'
		},
		{
			name: 'Mini Beast',
			euName: 'Concerto',
			class: 'Light',
			type: 'Kart',
			drf: 'Out',
			sp: 55,
			wt: 32,
			ac: 29,
			hn: 32,
			dr: 64,
			of: 27,
			mt: 64,
			unlock: 'Default'
		},
		{
			name: 'Cheep Charger',
			euName: 'Cheep Charger',
			class: 'Light',
			type: 'Kart',
			drf: 'Out',
			sp: 34,
			wt: 24,
			ac: 64,
			hn: 56,
			dr: 59,
			of: 45,
			mt: 54,
			unlock: '50cc Retro 1 Star'
		},
		{
			name: 'Tiny Titan',
			euName: 'Rally Romper',
			class: 'Light',
			type: 'Kart',
			drf: 'Out',
			sp: 46,
			wt: 35,
			ac: 43,
			hn: 43,
			dr: 29,
			of: 64,
			mt: 40,
			unlock: '1 Fast Ghost'
		},
		{
			name: 'Blue Falcon',
			euName: 'Blue Falcon',
			class: 'Light',
			type: 'Kart',
			drf: 'Out',
			sp: 60,
			wt: 29,
			ac: 35,
			hn: 29,
			dr: 43,
			of: 24,
			mt: 29,
			unlock: 'Mirror Lightning'
		},
		// Light Bikes
		{
			name: 'Standard Bike S',
			euName: 'Standard Bike S',
			class: 'Light',
			type: 'Bike',
			drf: 'Out',
			sp: 39,
			wt: 21,
			ac: 51,
			hn: 51,
			dr: 54,
			of: 43,
			mt: 48,
			unlock: 'Default'
		},
		{
			name: 'Bullet Bike',
			euName: 'Bullet Bike',
			class: 'Light',
			type: 'Bike',
			drf: 'In',
			sp: 53,
			wt: 24,
			ac: 32,
			hn: 35,
			dr: 67,
			of: 29,
			mt: 67,
			unlock: 'Default'
		},
		{
			name: 'Bit Bike',
			euName: 'Nanobike',
			class: 'Light',
			type: 'Bike',
			drf: 'Out',
			sp: 25,
			wt: 18,
			ac: 59,
			hn: 67,
			dr: 40,
			of: 56,
			mt: 62,
			unlock: 'Default'
		},
		{
			name: 'Quacker',
			euName: 'Quacker',
			class: 'Light',
			type: 'Bike',
			drf: 'In',
			sp: 32,
			wt: 17,
			ac: 67,
			hn: 60,
			dr: 62,
			of: 48,
			mt: 57,
			unlock: '150cc Star'
		},
		{
			name: 'Magikruiser',
			euName: 'Magikruiser',
			class: 'Light',
			type: 'Bike',
			drf: 'In',
			sp: 43,
			wt: 24,
			ac: 45,
			hn: 45,
			dr: 32,
			of: 67,
			mt: 43,
			unlock: '8 Time Trials'
		},
		{
			name: 'Jet Bubble',
			euName: 'Bubble Bike',
			class: 'Light',
			type: 'Bike',
			drf: 'In',
			sp: 48,
			wt: 27,
			ac: 40,
			hn: 40,
			dr: 45,
			of: 35,
			mt: 37,
			unlock: 'Mirror Leaf'
		},
		// Medium Karts
		{
			name: 'Standard Kart M',
			euName: 'Standard Kart M',
			class: 'Medium',
			type: 'Kart',
			drf: 'Out',
			sp: 46,
			wt: 45,
			ac: 40,
			hn: 43,
			dr: 45,
			of: 35,
			mt: 40,
			unlock: 'Default'
		},
		{
			name: 'Classic Dragster',
			euName: 'Nostalgia 1',
			class: 'Medium',
			type: 'Kart',
			drf: 'Out',
			sp: 37,
			wt: 43,
			ac: 59,
			hn: 54,
			dr: 54,
			of: 40,
			mt: 51,
			unlock: 'Default'
		},
		{
			name: 'Wild Wing',
			euName: 'Wild Wing',
			class: 'Medium',
			type: 'Kart',
			drf: 'Out',
			sp: 57,
			wt: 51,
			ac: 21,
			hn: 29,
			dr: 59,
			of: 24,
			mt: 59,
			unlock: 'Default'
		},
		{
			name: 'Super Blooper',
			euName: 'Turbo Blooper',
			class: 'Medium',
			type: 'Kart',
			drf: 'Out',
			sp: 50,
			wt: 40,
			ac: 35,
			hn: 37,
			dr: 21,
			of: 54,
			mt: 35,
			unlock: '50cc Leaf'
		},
		{
			name: 'Daytripper',
			euName: 'Royal Racer',
			class: 'Medium',
			type: 'Kart',
			drf: 'Out',
			sp: 34,
			wt: 45,
			ac: 51,
			hn: 59,
			dr: 32,
			of: 48,
			mt: 54,
			unlock: '150cc Leaf'
		},
		{
			name: 'Sprinter',
			euName: 'B Dasher MK 2',
			class: 'Medium',
			type: 'Kart',
			drf: 'Out',
			sp: 64,
			wt: 48,
			ac: 27,
			hn: 24,
			dr: 37,
			of: 21,
			mt: 24,
			unlock: '24 Fast Ghosts'
		},
		// Medium Bikes
		{
			name: 'Standard Bike M',
			euName: 'Standard Bike M',
			class: 'Medium',
			type: 'Bike',
			drf: 'Out',
			sp: 43,
			wt: 37,
			ac: 43,
			hn: 45,
			dr: 48,
			of: 37,
			mt: 43,
			unlock: 'Default'
		},
		{
			name: 'Mach Bike',
			euName: 'Mach Bike',
			class: 'Medium',
			type: 'Bike',
			drf: 'In',
			sp: 55,
			wt: 37,
			ac: 24,
			hn: 32,
			dr: 62,
			of: 27,
			mt: 62,
			unlock: 'Default'
		},
		{
			name: 'Sugarscoot',
			euName: 'Bon Bon',
			class: 'Medium',
			type: 'Bike',
			drf: 'Out',
			sp: 32,
			wt: 32,
			ac: 54,
			hn: 62,
			dr: 35,
			of: 51,
			mt: 56,
			unlock: 'Default'
		},
		{
			name: 'Zip Zip',
			euName: 'Rapide',
			class: 'Medium',
			type: 'Bike',
			drf: 'Out',
			sp: 41,
			wt: 35,
			ac: 45,
			hn: 51,
			dr: 29,
			of: 62,
			mt: 45,
			unlock: '100cc Lightning'
		},
		{
			name: 'Sneakster',
			euName: 'Nitrocycle',
			class: 'Medium',
			type: 'Bike',
			drf: 'In',
			sp: 62,
			wt: 40,
			ac: 29,
			hn: 27,
			dr: 40,
			of: 24,
			mt: 27,
			unlock: '100cc New 1 Star'
		},
		{
			name: 'Dolphin Dasher',
			euName: 'Dolphin Dasher',
			class: 'Medium',
			type: 'Bike',
			drf: 'In',
			sp: 48,
			wt: 43,
			ac: 37,
			hn: 40,
			dr: 24,
			of: 56,
			mt: 37,
			unlock: 'Mirror Star'
		},
		// Heavy Karts
		{
			name: 'Standard Kart L',
			euName: 'Standard Kart L',
			class: 'Heavy',
			type: 'Kart',
			drf: 'Out',
			sp: 48,
			wt: 59,
			ac: 37,
			hn: 40,
			dr: 40,
			of: 35,
			mt: 35,
			unlock: 'Default'
		},
		{
			name: 'Offroader',
			euName: 'Offroader',
			class: 'Heavy',
			type: 'Kart',
			drf: 'Out',
			sp: 39,
			wt: 64,
			ac: 48,
			hn: 54,
			dr: 18,
			of: 43,
			mt: 45,
			unlock: 'Default'
		},
		{
			name: 'Flame Flyer',
			euName: 'Flame Flyer',
			class: 'Heavy',
			type: 'Kart',
			drf: 'Out',
			sp: 62,
			wt: 59,
			ac: 16,
			hn: 21,
			dr: 48,
			of: 18,
			mt: 48,
			unlock: 'Default'
		},
		{
			name: 'Piranha Prowler',
			euName: 'Piranha Prowler',
			class: 'Heavy',
			type: 'Kart',
			drf: 'Out',
			sp: 55,
			wt: 67,
			ac: 29,
			hn: 35,
			dr: 35,
			of: 29,
			mt: 27,
			unlock: '50cc Special'
		},
		{
			name: 'Jetsetter',
			euName: 'Aero Glider',
			class: 'Heavy',
			type: 'Kart',
			drf: 'Out',
			sp: 69,
			wt: 56,
			ac: 21,
			hn: 17,
			dr: 27,
			of: 16,
			mt: 16,
			unlock: '150cc Retro 1 Star'
		},
		{
			name: 'Honey Coupe',
			euName: 'Dragonetti',
			class: 'Heavy',
			type: 'Kart',
			drf: 'Out',
			sp: 53,
			wt: 62,
			ac: 27,
			hn: 29,
			dr: 56,
			of: 24,
			mt: 56,
			unlock: '150cc Lightning'
		},
		// Heavy Bikes
		{
			name: 'Standard Bike L',
			euName: 'Standard Bike L',
			class: 'Heavy',
			type: 'Bike',
			drf: 'Out',
			sp: 46,
			wt: 54,
			ac: 40,
			hn: 43,
			dr: 43,
			of: 37,
			mt: 37,
			unlock: 'Default'
		},
		{
			name: 'Flame Runner',
			euName: 'Bowser Bike',
			class: 'Heavy',
			type: 'Bike',
			drf: 'In',
			sp: 60,
			wt: 54,
			ac: 18,
			hn: 24,
			dr: 51,
			of: 21,
			mt: 51,
			unlock: 'Default'
		},
		{
			name: 'Wario Bike',
			euName: 'Wario Bike',
			class: 'Heavy',
			type: 'Bike',
			drf: 'Out',
			sp: 37,
			wt: 59,
			ac: 51,
			hn: 56,
			dr: 21,
			of: 45,
			mt: 48,
			unlock: 'Default'
		},
		{
			name: 'Shooting Star',
			euName: 'Twinkle Star',
			class: 'Heavy',
			type: 'Bike',
			drf: 'Out',
			sp: 50,
			wt: 48,
			ac: 29,
			hn: 32,
			dr: 59,
			of: 27,
			mt: 59,
			unlock: '100cc Star'
		},
		{
			name: 'Spear',
			euName: 'Torpedo',
			class: 'Heavy',
			type: 'Bike',
			drf: 'In',
			sp: 67,
			wt: 56,
			ac: 24,
			hn: 18,
			dr: 29,
			of: 18,
			mt: 18,
			unlock: '12 Fast Ghosts'
		},
		{
			name: 'Phantom',
			euName: 'Phantom',
			class: 'Heavy',
			type: 'Bike',
			drf: 'Out',
			sp: 43,
			wt: 51,
			ac: 43,
			hn: 48,
			dr: 17,
			of: 56,
			mt: 40,
			unlock: 'Mirror Special'
		}
	];

	const characters = [
		// Light
		{
			name: 'Baby Mario',
			unlock: 'Default',
			class: 'Light',
			sp: 0,
			wt: 8,
			ac: 0,
			hn: 6,
			dr: 0,
			of: 0,
			mt: 0
		},
		{
			name: 'Baby Luigi',
			unlock: '8 Fast Ghosts',
			class: 'Light',
			sp: 5,
			wt: 8,
			ac: 0,
			hn: 0,
			dr: 0,
			of: 0,
			mt: 0
		},
		{
			name: 'Baby Peach',
			unlock: 'Default',
			class: 'Light',
			sp: 3,
			wt: 6,
			ac: 3,
			hn: 3,
			dr: 0,
			of: 0,
			mt: 0
		},
		{
			name: 'Baby Daisy',
			unlock: '50cc New 1 Star',
			class: 'Light',
			sp: 5,
			wt: 6,
			ac: 0,
			hn: 0,
			dr: 0,
			of: 0,
			mt: 3
		},
		{
			name: 'Toad',
			unlock: 'Default',
			class: 'Light',
			sp: 0,
			wt: 0,
			ac: 6,
			hn: 0,
			dr: 6,
			of: 0,
			mt: 0
		},
		{
			name: 'Toadette',
			unlock: '32 Time Trials',
			class: 'Light',
			sp: 3,
			wt: 0,
			ac: 0,
			hn: 0,
			dr: 0,
			of: 6,
			mt: 0
		},
		{
			name: 'Koopa Troopa',
			unlock: 'Default',
			class: 'Light',
			sp: 0,
			wt: 0,
			ac: 0,
			hn: 3,
			dr: 0,
			of: 0,
			mt: 6
		},
		{
			name: 'Dry Bones',
			unlock: '100cc Leaf',
			class: 'Light',
			sp: 0,
			wt: 0,
			ac: 3,
			hn: 0,
			dr: 3,
			of: 0,
			mt: 6
		},
		{
			name: 'Mii (Light)',
			unlock: '100cc Special',
			class: 'Light',
			sp: 3,
			wt: 3,
			ac: 0,
			hn: 0,
			dr: 3,
			of: 0,
			mt: 3
		},
		// Medium
		{
			name: 'Mario',
			unlock: 'Default',
			class: 'Medium',
			sp: 0,
			wt: 6,
			ac: 2,
			hn: 2,
			dr: 3,
			of: 0,
			mt: 0
		},
		{
			name: 'Luigi',
			unlock: 'Default',
			class: 'Medium',
			sp: 2,
			wt: 6,
			ac: 0,
			hn: 0,
			dr: 0,
			of: 0,
			mt: 0
		},
		{
			name: 'Peach',
			unlock: 'Default',
			class: 'Medium',
			sp: 2,
			wt: 0,
			ac: 5,
			hn: 0,
			dr: 6,
			of: 0,
			mt: 0
		},
		{
			name: 'Daisy',
			unlock: '150cc Special',
			class: 'Medium',
			sp: 4,
			wt: 0,
			ac: 0,
			hn: 2,
			dr: 0,
			of: 0,
			mt: 3
		},
		{
			name: 'Yoshi',
			unlock: 'Default',
			class: 'Medium',
			sp: 0,
			wt: 3,
			ac: 0,
			hn: 0,
			dr: 3,
			of: 5,
			mt: 0
		},
		{
			name: 'Birdo',
			unlock: '16 Time Trials',
			class: 'Medium',
			sp: 0,
			wt: 3,
			ac: 0,
			hn: 0,
			dr: 0,
			of: 3,
			mt: 5
		},
		{
			name: 'Diddy Kong',
			unlock: '50cc Lightning',
			class: 'Medium',
			sp: 0,
			wt: 0,
			ac: 3,
			hn: 0,
			dr: 3,
			of: 0,
			mt: 5
		},
		{
			name: 'Bowser Jr.',
			unlock: '100cc Retro 1 Star',
			class: 'Medium',
			sp: 0,
			wt: 0,
			ac: 0,
			hn: 0,
			dr: 0,
			of: 3,
			mt: 3
		},
		{
			name: 'Mii (Medium)',
			unlock: '100cc Special',
			class: 'Medium',
			sp: 3,
			wt: 3,
			ac: 0,
			hn: 0,
			dr: 0,
			of: 3,
			mt: 3
		},
		// Heavy
		{
			name: 'Wario',
			unlock: 'Default',
			class: 'Heavy',
			sp: 0,
			wt: 3,
			ac: 0,
			hn: 0,
			dr: 0,
			of: 3,
			mt: 6
		},
		{
			name: 'Waluigi',
			unlock: 'Default',
			class: 'Heavy',
			sp: 0,
			wt: 0,
			ac: 6,
			hn: 0,
			dr: 5,
			of: 3,
			mt: 0
		},
		{
			name: 'Donkey Kong',
			unlock: 'Default',
			class: 'Heavy',
			sp: 0,
			wt: 3,
			ac: 2,
			hn: 2,
			dr: 0,
			of: 0,
			mt: 3
		},
		{
			name: 'Bowser',
			unlock: 'Default',
			class: 'Heavy',
			sp: 2,
			wt: 5,
			ac: 0,
			hn: 0,
			dr: 3,
			of: 0,
			mt: 0
		},
		{
			name: 'King Boo',
			unlock: '50cc Star',
			class: 'Heavy',
			sp: 0,
			wt: 0,
			ac: 0,
			hn: 5,
			dr: 0,
			of: 3,
			mt: 0
		},
		{
			name: 'Rosalina',
			unlock: 'Mirror All 1 Star',
			class: 'Heavy',
			sp: 3,
			wt: 0,
			ac: 0,
			hn: 3,
			dr: 0,
			of: 0,
			mt: 3
		},
		{
			name: 'Funky Kong',
			unlock: '4 Fast Ghosts',
			class: 'Heavy',
			sp: 4,
			wt: 0,
			ac: 0,
			hn: 0,
			dr: 0,
			of: 3,
			mt: 0
		},
		{
			name: 'Dry Bowser',
			unlock: '150cc New 1 Star',
			class: 'Heavy',
			sp: 0,
			wt: 0,
			ac: 0,
			hn: 0,
			dr: 0,
			of: 6,
			mt: 6
		},
		{
			name: 'Mii (Heavy)',
			unlock: '100cc Special',
			class: 'Heavy',
			sp: 3,
			wt: 0,
			ac: 3,
			hn: 3,
			dr: 3,
			of: 0,
			mt: 0
		}
	];

	const itemChances = [
		{
			name: 'Fake Item Box',
			rates: ['17%', '15%', '3%', '-', '-', '-', '-', '-', '-', '-', '-', '-']
		},
		{ name: 'Banana', rates: ['37%', '21%', '10%', '6%', '3%', '-', '-', '-', '-', '-', '-', '-'] },
		{
			name: 'Triple Banana',
			rates: ['12%', '11%', '8%', '-', '-', '-', '-', '-', '-', '-', '-', '-']
		},
		{
			name: 'Green Shell',
			rates: ['26%', '13%', '14%', '4%', '6%', '-', '-', '-', '-', '-', '-', '-']
		},
		{
			name: 'Triple Green Shell',
			rates: ['-', '4%', '11%', '7%', '9%', '-', '-', '-', '-', '-', '-', '-']
		},
		{
			name: 'Red Shell',
			rates: ['7%', '25%', '16%', '11%', '6%', '10%', '5%', '4%', '-', '-', '-', '-']
		},
		{
			name: 'Triple Red Shell',
			rates: ['-', '-', '-', '6%', '9%', '28%', '15%', '18%', '-', '-', '-', '-']
		},
		{
			name: 'Mushroom',
			rates: ['-', '9%', '20%', '17%', '17%', '17%', '5%', 'X', '2%', '-', '-', '-']
		},
		{
			name: 'Triple Mushroom',
			rates: ['-', '-', '3%', '28%', '23%', '17%', '20%', '25%', '40%', '33%', '12%', '17%']
		},
		{ name: 'Blooper', rates: ['-', '-', '-', '-', '3%', '3%', '15%', '4%', '4%', '-', '-', '-'] },
		{ name: 'Blue Shell', rates: ['-', '-', '-', '-', '-', '7%', '5%', 'X', '1%', '-', '-', '-'] },
		{
			name: 'Bob-omb',
			rates: ['-', '4%', '9%', '11%', '11%', '10%', '-', '-', '-', '-', '-', '-']
		},
		{
			name: 'Lightning Cloud',
			rates: ['-', '-', '6%', '7%', '11%', '3%', '-', '-', '-', '-', '-', '-']
		},
		{ name: 'POW Block', rates: ['-', '-', '-', '-', '3%', 'X', '10%', '7%', '4%', '-', '-', '-'] },
		{
			name: 'Mega Mushroom',
			rates: ['-', '-', '-', '4%', 'X', 'X', '10%', '4%', '3%', '-', '-', '-']
		},
		{
			name: 'Golden Mushroom',
			rates: ['-', '-', '-', '-', '-', '3%', '15%', '11%', '27%', '27%', '31%', '29%']
		},
		{
			name: 'Bullet Bill',
			rates: ['-', '-', '-', '-', '-', '-', '-', '11%', '2%', '10%', '30%', '20%']
		},
		{
			name: 'Lightning Bolt',
			rates: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '1%', '2%', '17%']
		},
		{ name: 'Star', rates: ['-', '-', '-', '-', '-', '-', '-', '18%', '16%', '29%', '25%', '17%'] }
	];

	const timeTrials = [
		{ track: 'Luigi Circuit', staff: '01:29.670', unlock: '01:24.957', fast: '01:19.419' },
		{ track: 'Moo Moo Meadows', staff: '01:37.856', unlock: '01:33.623', fast: '01:25.909' },
		{ track: 'Mushroom Gorge', staff: '02:16.110', unlock: '02:09.633', fast: '02:01.011' },
		{ track: "Toad's Factory", staff: '02:22.480', unlock: '02:17.114', fast: '02:05.593' },
		{ track: 'Mario Circuit', staff: '01:44.777', unlock: '01:40.378', fast: '01:33.702' },
		{ track: 'Coconut Mall', staff: '02:30.764', unlock: '02:24.788', fast: '02:13.333' },
		{ track: 'DK Summit', staff: '02:34.693', unlock: '02:27.923', fast: '02:17.546' },
		{ track: "Wario's Gold Mine", staff: '02:19.583', unlock: '02:15.312', fast: '02:04.800' },
		{ track: 'Daisy Circuit', staff: '01:56.822', unlock: '01:51.118', fast: '01:41.362' },
		{ track: 'Koopa Cape', staff: '03:03.022', unlock: '02:54.897', fast: '02:41.370' },
		{ track: 'Maple Treeway', staff: '02:58.633', unlock: '02:50.439', fast: '02:37.812' },
		{ track: 'Grumble Volcano', staff: '02:28.237', unlock: '02:22.408', fast: '02:11.852' },
		{ track: 'Dry Dry Ruins', staff: '02:30.949', unlock: '02:25.091', fast: '02:14.286' },
		{ track: 'Moonview Highway', staff: '02:16.802', unlock: '02:07.780', fast: '02:04.163' },
		{ track: "Bowser's Castle", staff: '03:04.836', unlock: '02:57.275', fast: '02:42.098' },
		{ track: 'Rainbow Road', staff: '03:05.895', unlock: '02:59.361', fast: '02:44.734' },
		{ track: 'GCN Peach Beach', staff: '01:34.233', unlock: '01:30.698', fast: '01:23.140' },
		{ track: 'DS Yoshi Falls', staff: '01:16.461', unlock: '01:14.070', fast: '01:09.175' },
		{ track: 'SNES Ghost Valley 2', staff: '01:06.595', unlock: '01:03.786', fast: '00:58.907' },
		{ track: 'N64 Mario Raceway', staff: '02:14.799', unlock: '02:09.112', fast: '01:59.053' },
		{ track: 'N64 Sherbet Land', staff: '02:48.651', unlock: '02:42.140', fast: '02:28.356' },
		{ track: 'GBA Shy Guy Beach', staff: '01:45.568', unlock: '01:39.255', fast: '01:32.867' },
		{ track: 'DS Delfino Square', staff: '02:41.807', unlock: '02:34.563', fast: '02:24.169' },
		{ track: 'GCN Waluigi Stadium', staff: '02:32.882', unlock: '02:24.645', fast: '02:12.367' },
		{ track: 'DS Desert Hills', staff: '02:10.233', unlock: '02:02.122', fast: '01:52.686' },
		{ track: 'GBA Bowser Castle 3', staff: '02:58.304', unlock: '02:50.637', fast: '02:39.391' },
		{
			track: "N64 DK's Jungle Parkway",
			staff: '02:58.264',
			unlock: '02:50.946',
			fast: '02:37.782'
		},
		{ track: 'GCN Mario Circuit', staff: '01:59.771', unlock: '01:55.281', fast: '01:49.939' },
		{ track: 'SNES Mario Circuit 3', staff: '01:38.880', unlock: '01:35.204', fast: '01:26.659' },
		{ track: 'DS Peach Gardens', staff: '02:34.894', unlock: '02:29.006', fast: '02:16.777' },
		{ track: 'GCN DK Mountain', staff: '02:57.744', unlock: '02:50.248', fast: '02:38.130' },
		{ track: "N64 Bowser's Castle", staff: '03:19.323', unlock: '03:08.733', fast: '02:55.933' }
	];

	const specialUnlocks = [
		{ name: 'Star Cup', condition: '1st-3rd in Mushroom+Flower Cup' },
		{ name: 'Special Cup', condition: '1st-3rd in Star Cup' },
		{ name: 'Leaf Cup', condition: '1st-3rd in Shell+Banana Cup' },
		{ name: 'Lightning Cup', condition: '1st-3rd in Leaf Cup' },
		{ name: 'Karts+Bikes Mode', condition: '1st-3rd in All 8 Cups' },
		{ name: 'Mirror Mode', condition: 'All 150cc Cups' },
		{ name: 'Mii Outfit B', condition: '32 Fast Ghosts' },
		{ name: 'WFC Gold Wheel', condition: 'Play primarily with the Wii Wheel' },
		{ name: 'Alternative Title+Ending', condition: 'All Mirror Mode Cups' },
		{ name: 'Tiny Titan (Alt)', condition: '50 WFC Wins' },
		{ name: 'Birdo (Alt)', condition: '250 WFC Wins' },
		{ name: 'Toadette (Alt)', condition: '1000 WFC Wins' },
		{ name: 'Rosalina (Alt)', condition: 'Have SMGalaxy save file + 50 races' }
	];
</script>

{#if isOpen}
	<div transition:slide={{ duration: 300 }} class="mt-6 space-y-6 border-t border-white/10 pt-6">
		<!-- Navigation Tabs -->
		<div class="flex flex-wrap gap-2 border-b border-white/10 pb-4">
			<button
				onclick={() => (activeTab = 'vehicles')}
				class="cursor-pointer rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all {activeTab ===
				'vehicles'
					? 'bg-[#9999FF] text-black shadow-md'
					: 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}"
			>
				Vehicles ({vehicles.length})
			</button>
			<button
				onclick={() => (activeTab = 'characters')}
				class="cursor-pointer rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all {activeTab ===
				'characters'
					? 'bg-[#9999FF] text-black shadow-md'
					: 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}"
			>
				Characters ({characters.length})
			</button>
			<button
				onclick={() => (activeTab = 'items')}
				class="cursor-pointer rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all {activeTab ===
				'items'
					? 'bg-[#9999FF] text-black shadow-md'
					: 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}"
			>
				Item Chances
			</button>
			<button
				onclick={() => (activeTab = 'timetrials')}
				class="cursor-pointer rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all {activeTab ===
				'timetrials'
					? 'bg-[#9999FF] text-black shadow-md'
					: 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}"
			>
				Time Trials ({timeTrials.length})
			</button>
			<button
				onclick={() => (activeTab = 'specials')}
				class="cursor-pointer rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all {activeTab ===
				'specials'
					? 'bg-[#9999FF] text-black shadow-md'
					: 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}"
			>
				Unlocks
			</button>
		</div>

		<!-- 1. VEHICLES TAB -->
		{#if activeTab === 'vehicles'}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each vehicles as item (item.name)}
					<div
						class="space-y-3 rounded-2xl border border-white/5 bg-white/2 p-4 transition-colors hover:border-white/10"
					>
						<div class="flex items-start justify-between border-b border-white/10 pb-2">
							<div>
								<h4 class="text-base font-bold text-white">{item.name}</h4>
								{#if item.euName !== item.name}
									<p class="text-[10px] text-zinc-400">EU: {item.euName}</p>
								{/if}
							</div>
							<span
								class="rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#9999FF] uppercase"
							>
								{item.class} • {item.type}
							</span>
						</div>

						<div class="flex justify-between text-xs text-zinc-400">
							<span
								>Drift: <strong class="text-white"
									>{item.drf === 'In' ? 'Inside' : 'Outside'}</strong
								></span
							>
							<span>Unlock: <strong class="text-[#9999FF]">{item.unlock}</strong></span>
						</div>

						<!-- Vehicle Stats Bars -->
						<div class="space-y-1.5 rounded-xl border border-white/5 bg-black/40 p-3">
							{#each [{ label: 'Speed', val: item.sp }, { label: 'Weight', val: item.wt }, { label: 'Acceleration', val: item.ac }, { label: 'Handling', val: item.hn }, { label: 'Drift', val: item.dr }, { label: 'Off-Road', val: item.of }, { label: 'Mini-Turbo', val: item.mt }] as stat (stat.label)}
								<div class="space-y-0.5">
									<div class="flex justify-between text-[10px] font-semibold">
										<span class="tracking-wider text-zinc-400 uppercase">{stat.label}</span>
										<span class="font-mono text-white">{stat.val}</span>
									</div>
									<div class="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
										<div
											class="h-full rounded-full bg-[#9999FF]"
											style="width: {(stat.val / 80) * 100}%;"
										></div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- 2. CHARACTERS TAB -->
		{#if activeTab === 'characters'}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each characters as char (char.name)}
					<div
						class="space-y-3 rounded-2xl border border-white/5 bg-white/2 p-4 transition-colors hover:border-white/10"
					>
						<div class="flex items-center justify-between border-b border-white/10 pb-2">
							<h4 class="text-base font-bold text-white">{char.name}</h4>
							<span
								class="rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#9999FF] uppercase"
							>
								{char.class}
							</span>
						</div>

						<p class="text-xs text-zinc-400">
							Unlock: <strong class="text-[#9999FF]">{char.unlock}</strong>
						</p>

						<!-- Stat Bonuses -->
						<div class="rounded-xl border border-white/5 bg-black/40 p-3">
							<p class="mb-2 text-[10px] font-black tracking-widest text-zinc-500 uppercase">
								Stat Bonuses
							</p>
							<div class="grid grid-cols-2 gap-2 text-xs">
								{#each [{ label: 'Speed', val: char.sp }, { label: 'Weight', val: char.wt }, { label: 'Acceleration', val: char.ac }, { label: 'Handling', val: char.hn }, { label: 'Drift', val: char.dr }, { label: 'Off-Road', val: char.of }, { label: 'Mini-Turbo', val: char.mt }] as stat (stat.label)}
									<div class="flex justify-between border-b border-white/5 pb-0.5">
										<span class="text-[11px] text-zinc-400">{stat.label}</span>
										<span
											class="font-mono font-bold {stat.val > 0
												? 'text-emerald-400'
												: 'text-zinc-600'}"
										>
											{stat.val > 0 ? `+${stat.val}` : '0'}
										</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- 3. ITEM CHANCES TAB -->
		{#if activeTab === 'items'}
			<div class="space-y-4">
				<p class="text-xs text-zinc-400 italic">
					Probability rates based on a standard 12-player race setup using balanced items.
				</p>
				<div class="overflow-x-auto rounded-2xl border border-white/10 bg-white/2">
					<table class="w-full text-left text-xs text-zinc-300">
						<thead
							class="bg-white/5 text-[10px] font-black tracking-wider text-[#9999FF] uppercase"
						>
							<tr>
								<th class="p-3 whitespace-nowrap">Item Name</th>
								{#each [...Array(12).keys()] as i (i)}
									<th class="p-3 text-center">P{i + 1}</th>
								{/each}
							</tr>
						</thead>

						<tbody class="divide-y divide-white/5">
							{#each itemChances as item (item.name)}
								<tr class="transition-colors hover:bg-white/5">
									<td class="p-3 font-bold whitespace-nowrap text-white">{item.name}</td>
									{#each item.rates as rate, i (i)}
										<td
											class="p-3 text-center font-mono {rate !== '-'
												? 'font-semibold text-zinc-100'
												: 'text-zinc-700'}"
										>
											{rate}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- 4. TIME TRIALS TAB -->
		{#if activeTab === 'timetrials'}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each timeTrials as tt (tt.track)}
					<div
						class="space-y-2 rounded-2xl border border-white/5 bg-white/2 p-4 transition-colors hover:border-white/10"
					>
						<h4 class="border-b border-white/10 pb-1.5 text-sm font-bold text-white">{tt.track}</h4>
						<div class="space-y-1 font-mono text-xs">
							<div class="flex justify-between">
								<span class="font-sans text-zinc-500">Staff Ghost:</span>
								<span class="text-zinc-300">{tt.staff}</span>
							</div>
							<div class="flex justify-between">
								<span class="font-sans text-zinc-500">Unlock Target:</span>
								<span class="font-bold text-[#9999FF]">{tt.unlock}</span>
							</div>
							<div class="flex justify-between">
								<span class="font-sans text-zinc-500">Fast Staff:</span>
								<span class="font-bold text-emerald-400">{tt.fast}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- 5. UNLOCKS TAB -->
		{#if activeTab === 'specials'}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each specialUnlocks as item (item.name)}
					<div
						class="flex flex-col justify-between space-y-2 rounded-2xl border border-white/5 bg-white/2 p-4 transition-colors hover:border-white/10"
					>
						<span class="text-[10px] font-black tracking-wider text-[#9999FF] uppercase"
							>{item.name}</span
						>
						<p class="text-sm font-bold text-white">{item.condition}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
