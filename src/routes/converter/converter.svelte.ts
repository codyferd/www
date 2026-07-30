export interface UnitConfig {
	name: string;
	symbol: string;
	ratio?: number;
}
export interface CategoryConfig {
	label: string;
	defaultSource: string;
	defaultTarget: string;
	isSpecial?: boolean;
	units: Record<string, UnitConfig>;
}

// Helper to construct standard ratio-based unit definitions concisely: [name, symbol, ratio]
const u = (name: string, symbol: string, ratio?: number): UnitConfig =>
	ratio !== undefined ? { name, symbol, ratio } : { name, symbol };

export const conversionMatrix: Record<string, CategoryConfig> = {
	length: {
		label: 'Length',
		defaultSource: 'm',
		defaultTarget: 'km',
		units: {
			m: u('Meter (SI Base)', 'm', 1),
			km: u('Kilometer', 'km', 1000),
			cm: u('Centimeter', 'cm', 0.01),
			mm: u('Millimeter', 'mm', 0.001),
			um: u('Micrometer', 'µm', 0.000001),
			nm: u('Nanometer', 'nm', 1e-9),
			inch: u('Inch (Imperial)', 'in', 0.0254),
			foot: u('Foot (Imperial)', 'ft', 0.3048),
			yard: u('Yard', 'yd', 0.9144),
			mile: u('Mile (Imperial)', 'mi', 1609.344),
			nmi: u('Nautical Mile', 'NM', 1852)
		}
	},
	mass: {
		label: 'Mass / Weight',
		defaultSource: 'kg',
		defaultTarget: 'g',
		units: {
			kg: u('Kilogram (SI Base)', 'kg', 1),
			g: u('Gram', 'g', 0.001),
			mg: u('Milligram', 'mg', 0.000001),
			ug: u('Microgram', 'µg', 1e-9),
			ton: u('Metric Ton', 't', 1000),
			lb: u('Pound (Imperial)', 'lb', 0.45359237),
			oz: u('Ounce (Imperial)', 'oz', 0.028349523),
			st: u('Stone', 'st', 6.35029318),
			ct: u('Carat', 'ct', 0.0002)
		}
	},
	volume: {
		label: 'Volume',
		defaultSource: 'l',
		defaultTarget: 'ml',
		units: {
			l: u('Liter', 'L', 1),
			ml: u('Milliliter', 'mL', 0.001),
			m3: u('Cubic Meter (SI Base)', 'm³', 1000),
			cm3: u('Cubic Centimeter', 'cm³', 0.001),
			gal: u('Gallon (US Customary)', 'gal', 3.78541178),
			qt: u('Quart (US Customary)', 'qt', 0.946352945),
			pt: u('Pint (US Customary)', 'pt', 0.473176473),
			cup: u('Cup (US Customary)', 'cp', 0.24),
			floz: u('Fluid Ounce (US)', 'fl oz', 0.02957353)
		}
	},
	area: {
		label: 'Area Matrix',
		defaultSource: 'm2',
		defaultTarget: 'ha',
		units: {
			m2: u('Square Meter (SI Base)', 'm²', 1),
			km2: u('Square Kilometer', 'km²', 1e6),
			cm2: u('Square Centimeter', 'cm²', 0.0001),
			ha: u('Hectare', 'ha', 10000),
			acre: u('Acre', 'ac', 4046.85642),
			sqft: u('Square Foot', 'ft²', 0.09290304),
			sqin: u('Square Inch', 'in²', 0.00064516)
		}
	},
	temperature: {
		label: 'Temperature',
		defaultSource: 'c',
		defaultTarget: 'f',
		isSpecial: true,
		units: {
			c: u('Celsius (SI Derived)', '°C'),
			k: u('Kelvin (SI Base)', 'K'),
			f: u('Fahrenheit', '°F'),
			r: u('Rankine', '°R')
		}
	},
	color: {
		label: 'Color Spaces',
		defaultSource: 'hex',
		defaultTarget: 'rgb',
		isSpecial: true,
		units: {
			hex: u('Hexadecimal', 'HEX'),
			rgb: u('RGB (Red, Green, Blue)', 'RGB'),
			hsl: u('HSL (Hue, Saturation, Lightness)', 'HSL'),
			hsv: u('HSV (Hue, Saturation, Value)', 'HSV'),
			cmyk: u('CMYK (Cyan, Magenta, Yellow, Key)', 'CMYK')
		}
	},
	currency: {
		label: 'World Currencies',
		defaultSource: 'USD',
		defaultTarget: 'JPY',
		units: {
			EUR: u('Euro', '€', 1.0),
			USD: u('US Dollar', '$', 1.1608),
			GBP: u('British Pound Sterling', '£', 0.8542),
			JPY: u('Japanese Yen', '¥', 185.649),
			CAD: u('Canadian Dollar', 'C$', 1.4811),
			AUD: u('Australian Dollar', 'A$', 1.6324),
			CHF: u('Swiss Franc', 'CHF', 0.9825),
			CNY: u('Chinese Yuan', '¥', 7.942),
			INR: u('Indian Rupee', '₹', 93.125),
			MXN: u('Mexican Peso', '$', 19.842),
			BRL: u('Brazilian Real', 'R$', 5.421),
			ZAR: u('South African Rand', 'R', 20.145),
			AED: u('United Arab Emirates Dirham', 'د.إ', 4.2633),
			ARS: u('Argentine Peso', '$', 1042.5),
			CLP: u('Chilean Peso', '$', 1092.45),
			COP: u('Colombian Peso', '$', 4520.15),
			CZK: u('Czech Koruna', 'Kč', 25.213),
			DKK: u('Danish Krone', 'kr', 7.459),
			HKD: u('Hong Kong Dollar', 'HK$', 9.0645),
			HUF: u('Hungarian Forint', 'Ft', 391.85),
			IDR: u('Indonesian Rupiah', 'Rp', 18950.0),
			ILS: u('Israeli New Shekel', '₪', 4.312),
			KRW: u('South Korean Won', '₩', 1595.2),
			MYR: u('Malaysian Ringgit', 'RM', 5.451),
			NOK: u('Norwegian Krone', 'kr', 12.352),
			NZD: u('New Zealand Dollar', 'NZ$', 1.9124),
			PHP: u('Philippine Peso', '₱', 67.82),
			PLN: u('Polish Zloty', 'zł', 4.311),
			SGD: u('Singapore Dollar', 'S$', 1.5642),
			TRY: u('Turkish Lira', '₺', 37.843)
		}
	}
};

class ConverterEngine {
	public currentCategory = $state<string>('currency');
	public sourceUnit = $state<string>('USD');
	public targetUnit = $state<string>('JPY');
	public sourceValue = $state<string | number | ''>(159);
	public targetValue = $state<string | number | ''>(0);

	public currentColorHex = $derived.by(() => {
		if (this.currentCategory !== 'color' || !this.sourceValue) return '#9999FF';
		const rgb = this.toRgb(String(this.sourceValue), this.sourceUnit);
		return rgb ? this.rgbToHex(rgb.r, rgb.g, rgb.b) : '#9999FF';
	});

	public currencyApiState = $state({ loading: false, error: null as string | null });

	public get currentUnits() {
		return conversionMatrix[this.currentCategory].units;
	}

	public get currentExchangeRate() {
		if (this.currentCategory !== 'currency') return 1;
		const u = conversionMatrix.currency.units;
		return (u[this.targetUnit].ratio ?? 1) / (u[this.sourceUnit].ratio ?? 1);
	}

	private transformTemperature(v: number, from: string, to: string): number {
		const kMap: Record<string, number> = {
			k: v,
			c: v + 273.15,
			f: ((v - 32) * 5) / 9 + 273.15,
			r: (v * 5) / 9
		};
		const k = kMap[from] ?? v;
		const outMap: Record<string, number> = {
			k,
			c: k - 273.15,
			f: ((k - 273.15) * 9) / 5 + 32,
			r: (k * 9) / 5
		};
		return outMap[to] ?? v;
	}

	/* --- Color Algorithms --- */
	private rgbToHex = (r: number, g: number, b: number) =>
		'#' +
		[r, g, b]
			.map((n) =>
				Math.max(0, Math.min(255, Math.round(n)))
					.toString(16)
					.padStart(2, '0')
			)
			.join('')
			.toUpperCase();

	private toRgb(val: string, format: string): { r: number; g: number; b: number } | null {
		const clean = val.trim();
		if (format === 'hex') {
			let h = clean.replace(/^#/, '');
			if (h.length === 3) h = [...h].map((c) => c + c).join('');
			if (h.length !== 6) return null;
			const n = parseInt(h, 16);
			return isNaN(n) ? null : { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
		}

		const nums = (clean.match(/-?\d+(\.\d+)?/g) || []).map(Number);
		if (nums.length < 3) return null;

		if (format === 'rgb') return { r: nums[0], g: nums[1], b: nums[2] };

		if (format === 'hsl') {
			const [h, s, l] = [nums[0] / 360, nums[1] / 100, nums[2] / 100];
			if (s === 0)
				return { r: Math.round(l * 255), g: Math.round(l * 255), b: Math.round(l * 255) };
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s,
				p = 2 * l - q;
			const h2r = (t: number) => {
				t = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 / 2) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			};
			return {
				r: Math.round(h2r(h + 1 / 3) * 255),
				g: Math.round(h2r(h) * 255),
				b: Math.round(h2r(h - 1 / 3) * 255)
			};
		}

		if (format === 'hsv') {
			const [h, s, v] = [nums[0] / 360, nums[1] / 100, nums[2] / 100];
			const i = Math.floor(h * 6),
				f = h * 6 - i;
			const [p, q, t] = [v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)];
			const map = [
				[v, t, p],
				[q, v, p],
				[p, v, t],
				[p, q, v],
				[t, p, v],
				[v, p, q]
			];
			const [r, g, b] = map[i % 6];
			return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
		}

		if (format === 'cmyk' && nums.length >= 4) {
			const [c, m, y, k] = [nums[0] / 100, nums[1] / 100, nums[2] / 100, nums[3] / 100];
			return {
				r: Math.round(255 * (1 - c) * (1 - k)),
				g: Math.round(255 * (1 - m) * (1 - k)),
				b: Math.round(255 * (1 - y) * (1 - k))
			};
		}

		return null;
	}

	private fromRgb(rgb: { r: number; g: number; b: number }, format: string): string {
		const { r, g, b } = rgb;
		if (format === 'hex') return this.rgbToHex(r, g, b);
		if (format === 'rgb') return `rgb(${r}, ${g}, ${b})`;

		const [rN, gN, bN] = [r / 255, g / 255, b / 255];
		const max = Math.max(rN, gN, bN),
			min = Math.min(rN, gN, bN),
			d = max - min;
		let h = 0;

		if (d !== 0) {
			if (max === rN) h = (gN - bN) / d + (gN < bN ? 6 : 0);
			else if (max === gN) h = (bN - rN) / d + 2;
			else h = (rN - gN) / d + 4;
			h /= 6;
		}

		if (format === 'hsl') {
			const l = (max + min) / 2;
			const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);
			return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
		}

		if (format === 'hsv') {
			const s = max === 0 ? 0 : d / max;
			return `hsv(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(max * 100)}%)`;
		}

		if (format === 'cmyk') {
			const k = 1 - max;
			if (k === 1) return 'cmyk(0%, 0%, 0%, 100%)';
			return `cmyk(${Math.round(((1 - rN - k) / (1 - k)) * 100)}%, ${Math.round(((1 - gN - k) / (1 - k)) * 100)}%, ${Math.round(((1 - bN - k) / (1 - k)) * 100)}%, ${Math.round(k * 100)}%)`;
		}

		return '';
	}

	public calculateTransformation(isForward = true) {
		const catKey = this.currentCategory;
		const category = conversionMatrix[catKey];
		const inVal = isForward ? this.sourceValue : this.targetValue;
		const [from, to] = isForward
			? [this.sourceUnit, this.targetUnit]
			: [this.targetUnit, this.sourceUnit];

		const setOutput = (val: string | number | '') => {
			if (isForward) this.targetValue = val;
			else this.sourceValue = val;
		};

		if (inVal === '') return setOutput('');

		if (catKey === 'color') {
			const rgb = this.toRgb(String(inVal), from);
			return setOutput(rgb ? this.fromRgb(rgb, to) : '');
		}

		if (category.isSpecial) {
			return setOutput(Number(this.transformTemperature(Number(inVal), from, to).toFixed(4)));
		}

		const units = category.units;
		const fromRatio = units[from].ratio ?? 1,
			toRatio = units[to].ratio ?? 1;
		const isCurrency = catKey === 'currency';

		const baseValue = Number(inVal) * (isCurrency ? 1 / fromRatio : fromRatio);
		const computedOutput = baseValue * (isCurrency ? toRatio : 1 / toRatio);

		setOutput(Number(computedOutput.toFixed(isCurrency ? 2 : 5)));
	}

	public switchCategory(categoryKey: string) {
		this.currentCategory = categoryKey;
		const config = conversionMatrix[categoryKey];
		this.sourceUnit = config.defaultSource;
		this.targetUnit = config.defaultTarget;
		this.sourceValue = categoryKey === 'color' ? '#9999FF' : categoryKey === 'currency' ? 159 : 1;
		this.calculateTransformation(true);
	}

	public async syncCurrencyRates() {
		this.currencyApiState = { loading: true, error: null };
		try {
			const res = await fetch('https://open.er-api.com/v6/latest/EUR');
			if (!res.ok) throw new Error('Central exchange telemetry connection dropped.');
			const payload = await res.json();
			if (!payload?.rates) throw new Error('API return data payload structure is invalid.');

			Object.keys(conversionMatrix.currency.units).forEach((ticker) => {
				if (payload.rates[ticker])
					conversionMatrix.currency.units[ticker].ratio = payload.rates[ticker];
			});

			this.calculateTransformation(true);
		} catch (err: unknown) {
			this.currencyApiState.error =
				err instanceof Error ? err.message : 'Network frame processing error.';
		} finally {
			this.currencyApiState.loading = false;
		}
	}
}

export const Converter = new ConverterEngine();
