import { create, all } from 'mathjs';

// Instantiate the math.js engine
export const math = create(all);

export interface HistoryItem {
	exp: string;
	res: string;
}

export interface GraphEquation {
	id: number;
	text: string;
	color: string;
}

export const CONSTANTS: Record<string, string> = {
	pi: '3.14159265359',
	e: '2.71828182846',
	phi: '1.61803398875',
	c: '299792458 m/s',
	G: '6.6743e-11 m^3 / (kg s^2)',
	h: '6.62607015e-34 J s',
	k: '1.380649e-23 J/K',
	avogadro: '6.02214076e23 mol^-1',
	i: 'Imaginary Radix Unit'
};
