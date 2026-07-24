// src/routes/converter/converter.svelte.ts

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

export const conversionMatrix: Record<string, CategoryConfig> = {
	length: {
		label: 'Length',
		defaultSource: 'm',
		defaultTarget: 'km',
		units: {
			m: { name: 'Meter (SI Base)', symbol: 'm', ratio: 1 },
			km: { name: 'Kilometer', symbol: 'km', ratio: 1000 },
			cm: { name: 'Centimeter', symbol: 'cm', ratio: 0.01 },
			mm: { name: 'Millimeter', symbol: 'mm', ratio: 0.001 },
			um: { name: 'Micrometer', symbol: 'µm', ratio: 0.000001 },
			nm: { name: 'Nanometer', symbol: 'nm', ratio: 0.000000001 },
			inch: { name: 'Inch (Imperial)', symbol: 'in', ratio: 0.0254 },
			foot: { name: 'Foot (Imperial)', symbol: 'ft', ratio: 0.3048 },
			yard: { name: 'Yard', symbol: 'yd', ratio: 0.9144 },
			mile: { name: 'Mile (Imperial)', symbol: 'mi', ratio: 1609.344 },
			nmi: { name: 'Nautical Mile', symbol: 'NM', ratio: 1852 }
		}
	},
	mass: {
		label: 'Mass / Weight',
		defaultSource: 'kg',
		defaultTarget: 'g',
		units: {
			kg: { name: 'Kilogram (SI Base)', symbol: 'kg', ratio: 1 },
			g: { name: 'Gram', symbol: 'g', ratio: 0.001 },
			mg: { name: 'Milligram', symbol: 'mg', ratio: 0.000001 },
			ug: { name: 'Microgram', symbol: 'µg', ratio: 0.000000001 },
			ton: { name: 'Metric Ton', symbol: 't', ratio: 1000 },
			lb: { name: 'Pound (Imperial)', symbol: 'lb', ratio: 0.45359237 },
			oz: { name: 'Ounce (Imperial)', symbol: 'oz', ratio: 0.028349523 },
			st: { name: 'Stone', symbol: 'st', ratio: 6.35029318 },
			ct: { name: 'Carat', symbol: 'ct', ratio: 0.0002 }
		}
	},
	volume: {
		label: 'Volume',
		defaultSource: 'l',
		defaultTarget: 'ml',
		units: {
			l: { name: 'Liter', symbol: 'L', ratio: 1 },
			ml: { name: 'Milliliter', symbol: 'mL', ratio: 0.001 },
			m3: { name: 'Cubic Meter (SI Base)', symbol: 'm³', ratio: 1000 },
			cm3: { name: 'Cubic Centimeter', symbol: 'cm³', ratio: 0.001 },
			gal: { name: 'Gallon (US Customary)', symbol: 'gal', ratio: 3.78541178 },
			qt: { name: 'Quart (US Customary)', symbol: 'qt', ratio: 0.946352945 },
			pt: { name: 'Pint (US Customary)', symbol: 'pt', ratio: 0.473176473 },
			cup: { name: 'Cup (US Customary)', symbol: 'cp', ratio: 0.24 },
			floz: { name: 'Fluid Ounce (US)', symbol: 'fl oz', ratio: 0.02957353 }
		}
	},
	area: {
		label: 'Area Matrix',
		defaultSource: 'm2',
		defaultTarget: 'ha',
		units: {
			m2: { name: 'Square Meter (SI Base)', symbol: 'm²', ratio: 1 },
			km2: { name: 'Square Kilometer', symbol: 'km²', ratio: 1000000 },
			cm2: { name: 'Square Centimeter', symbol: 'cm²', ratio: 0.0001 },
			ha: { name: 'Hectare', symbol: 'ha', ratio: 10000 },
			acre: { name: 'Acre', symbol: 'ac', ratio: 4046.85642 },
			sqft: { name: 'Square Foot', symbol: 'ft²', ratio: 0.09290304 },
			sqin: { name: 'Square Inch', symbol: 'in²', ratio: 0.00064516 }
		}
	},
	temperature: {
		label: 'Temperature',
		defaultSource: 'c',
		defaultTarget: 'f',
		isSpecial: true,
		units: {
			c: { name: 'Celsius (SI Derived)', symbol: '°C' },
			k: { name: 'Kelvin (SI Base)', symbol: 'K' },
			f: { name: 'Fahrenheit', symbol: '°F' },
			r: { name: 'Rankine', symbol: '°R' }
		}
	},
	currency: {
		label: 'World Currencies',
		defaultSource: 'USD',
		defaultTarget: 'JPY',
		units: {
			EUR: { name: 'Euro', symbol: '€', ratio: 1.0 },
			USD: { name: 'US Dollar', symbol: '$', ratio: 1.1608 },
			GBP: { name: 'British Pound Sterling', symbol: '£', ratio: 0.8542 },
			JPY: { name: 'Japanese Yen', symbol: '¥', ratio: 185.649 },
			CAD: { name: 'Canadian Dollar', symbol: 'C$', ratio: 1.4811 },
			AUD: { name: 'Australian Dollar', symbol: 'A$', ratio: 1.6324 },
			CHF: { name: 'Swiss Franc', symbol: 'CHF', ratio: 0.9825 },
			CNY: { name: 'Chinese Yuan', symbol: '¥', ratio: 7.942 },
			INR: { name: 'Indian Rupee', symbol: '₹', ratio: 93.125 },
			MXN: { name: 'Mexican Peso', symbol: '$', ratio: 19.842 },
			BRL: { name: 'Brazilian Real', symbol: 'R$', ratio: 5.421 },
			ZAR: { name: 'South African Rand', symbol: 'R', ratio: 20.145 },
			AED: { name: 'United Arab Emirates Dirham', symbol: 'د.إ', ratio: 4.2633 },
			ARS: { name: 'Argentine Peso', symbol: '$', ratio: 1042.5 },
			CLP: { name: 'Chilean Peso', symbol: '$', ratio: 1092.45 },
			COP: { name: 'Colombian Peso', symbol: '$', ratio: 4520.15 },
			CZK: { name: 'Czech Koruna', symbol: 'Kč', ratio: 25.213 },
			DKK: { name: 'Danish Krone', symbol: 'kr', ratio: 7.459 },
			HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', ratio: 9.0645 },
			HUF: { name: 'Hungarian Forint', symbol: 'Ft', ratio: 391.85 },
			IDR: { name: 'Indonesian Rupiah', symbol: 'Rp', ratio: 18950.0 },
			ILS: { name: 'Israeli New Shekel', symbol: '₪', ratio: 4.312 },
			KRW: { name: 'South Korean Won', symbol: '₩', ratio: 1595.2 },
			MYR: { name: 'Malaysian Ringgit', symbol: 'RM', ratio: 5.451 },
			NOK: { name: 'Norwegian Krone', symbol: 'kr', ratio: 12.352 },
			NZD: { name: 'New Zealand Dollar', symbol: 'NZ$', ratio: 1.9124 },
			PHP: { name: 'Philippine Peso', symbol: '₱', ratio: 67.82 },
			PLN: { name: 'Polish Zloty', symbol: 'zł', ratio: 4.311 },
			SGD: { name: 'Singapore Dollar', symbol: 'S$', ratio: 1.5642 },
			TRY: { name: 'Turkish Lira', symbol: '₺', ratio: 37.843 }
		}
	}
};

class ConverterEngine {
	public currentCategory = $state<string>('currency');
	public sourceUnit = $state<string>('USD');
	public targetUnit = $state<string>('JPY');

	public sourceValue = $state<number | ''>(159);
	public targetValue = $state<number | ''>(0);

	public currencyApiState = $state({
		loading: false,
		error: null as string | null
	});

	public get currentUnits() {
		return conversionMatrix[this.currentCategory].units;
	}

	public get currentExchangeRate() {
		if (this.currentCategory !== 'currency') return 1;
		const units = conversionMatrix.currency.units;
		const fromRate = units[this.sourceUnit].ratio ?? 1;
		const toRate = units[this.targetUnit].ratio ?? 1;
		return toRate / fromRate;
	}

	private transformTemperature(value: number, from: string, to: string): number {
		let kelvin = 0;
		if (from === 'k') kelvin = value;
		else if (from === 'c') kelvin = value + 273.15;
		else if (from === 'f') kelvin = ((value - 32) * 5) / 9 + 273.15;
		else if (from === 'r') kelvin = (value * 5) / 9;

		if (to === 'k') return kelvin;
		if (to === 'c') return kelvin - 273.15;
		if (to === 'f') return ((kelvin - 273.15) * 9) / 5 + 32;
		if (to === 'r') return (kelvin * 9) / 5;
		return value;
	}

	public calculateTransformation(isForwardDirection = true) {
		const category = conversionMatrix[this.currentCategory];

		if (category.isSpecial) {
			if (isForwardDirection) {
				if (this.sourceValue === '') return;
				this.targetValue = Number(
					this.transformTemperature(this.sourceValue, this.sourceUnit, this.targetUnit).toFixed(4)
				);
			} else {
				if (this.targetValue === '') return;
				this.sourceValue = Number(
					this.transformTemperature(this.targetValue, this.targetUnit, this.sourceUnit).toFixed(4)
				);
			}
			return;
		}

		const units = category.units;
		const fromRatio = units[this.sourceUnit].ratio ?? 1;
		const toRatio = units[this.targetUnit].ratio ?? 1;

		if (isForwardDirection) {
			if (this.sourceValue === '') {
				this.targetValue = '';
				return;
			}
			const baseValue =
				this.sourceValue * (this.currentCategory === 'currency' ? 1 / fromRatio : fromRatio);
			const computedOutput =
				baseValue * (this.currentCategory === 'currency' ? toRatio : 1 / toRatio);
			this.targetValue = Number(
				computedOutput.toFixed(this.currentCategory === 'currency' ? 2 : 5)
			);
		} else {
			if (this.targetValue === '') {
				this.sourceValue = '';
				return;
			}
			const baseValue =
				this.targetValue * (this.currentCategory === 'currency' ? 1 / toRatio : toRatio);
			const computedInput =
				baseValue * (this.currentCategory === 'currency' ? fromRatio : 1 / fromRatio);
			this.sourceValue = Number(computedInput.toFixed(this.currentCategory === 'currency' ? 2 : 5));
		}
	}

	public switchCategory(categoryKey: string) {
		this.currentCategory = categoryKey;
		const targetConfig = conversionMatrix[categoryKey];
		this.sourceUnit = targetConfig.defaultSource;
		this.targetUnit = targetConfig.defaultTarget;
		this.sourceValue = categoryKey === 'currency' ? 159 : 1;
		this.calculateTransformation(true);
	}

	public async syncCurrencyRates() {
		this.currencyApiState.loading = true;
		this.currencyApiState.error = null;
		try {
			const res = await fetch('https://open.er-api.com/v6/latest/EUR');
			if (!res.ok) throw new Error('Central exchange telemetry connection dropped.');

			const payload = await res.json();
			if (!payload || !payload.rates)
				throw new Error('API return data payload structure is invalid.');

			Object.keys(conversionMatrix.currency.units).forEach((ticker) => {
				if (payload.rates[ticker]) {
					conversionMatrix.currency.units[ticker].ratio = payload.rates[ticker];
				}
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
