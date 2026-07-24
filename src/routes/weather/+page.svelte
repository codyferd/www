<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface WeatherData {
		current?: {
			temperature_2m?: number;
			relative_humidity_2m?: number;
			weather_code?: number;
			wind_speed_10m?: number;
			precipitation?: number;
			precipitation_probability?: number;
			surface_pressure?: number;
			visibility?: number;
		};
		daily?: {
			time: string[];
			temperature_2m_max: number[];
			temperature_2m_min: number[];
			uv_index_max: number[];
			precipitation_probability_max: number[];
			sunrise?: string[];
			sunset?: string[];
		};
		hourly?: {
			time: string[];
			temperature_2m: number[];
			precipitation_probability: number[];
		};
	}

	let loading = $state(true);
	let weather = $state<WeatherData | null>(null);
	let airQuality = $state<number | null>(null);
	let cityName = $state('Detecting...');
	let cityInput = $state('');
	let unit = $state<'K' | 'C' | 'F'>('K');
	let currentTime = $state('--:--:--');
	let clockInterval: ReturnType<typeof setInterval> | null = null;

	const weatherCodes: Record<number, string> = {
		0: 'Clear Sky',
		1: 'Mainly Clear',
		2: 'Partly Cloudy',
		3: 'Overcast',
		45: 'Foggy',
		48: 'Rime Fog',
		51: 'Light Drizzle',
		53: 'Mod. Drizzle',
		55: 'Dense Drizzle',
		61: 'Slight Rain',
		63: 'Mod. Rain',
		65: 'Heavy Rain',
		71: 'Slight Snow',
		73: 'Mod. Snow',
		75: 'Heavy Snow',
		80: 'Slight Showers',
		81: 'Mod. Showers',
		82: 'Violent Showers',
		95: 'Thunderstorm',
		96: 'Thunderstorm Hail'
	};

	let weatherDesc = $derived(
		weather?.current?.weather_code != null
			? weatherCodes[weather.current.weather_code] || 'Atmospheric Event'
			: 'Searching...'
	);

	const getThermalEmoji = (c: number, rain = 0) =>
		rain > 40 ? '🌧️' : c >= 30 ? '☀️' : c >= 20 ? '🌤️' : c >= 10 ? '🌥️' : c >= 0 ? '🌨️' : '🧊';

	const convertTemp = (c?: number | null) => {
		if (c == null) return '--';
		if (unit === 'K') return (c + 273.15).toFixed(1);
		if (unit === 'F') return Math.round((c * 9) / 5 + 32).toString();
		return Math.round(c).toString();
	};

	let hourlySlice = $derived.by(() => {
		if (!weather?.hourly?.time) return [];
		const { time, temperature_2m, precipitation_probability } = weather.hourly;
		const start = Math.max(
			0,
			time.findIndex((t) => new Date(t) >= new Date())
		);
		return time.slice(start, start + 24).map((t, i) => ({
			time: t,
			temp: temperature_2m[start + i],
			rainChance: precipitation_probability[start + i] ?? 0
		}));
	});

	// Dynamically builds grid items; excludes missing Open-Meteo fields
	let metrics = $derived.by(() => {
		if (!weather) return [];
		const c = weather.current;
		const d = weather.daily;

		return [
			c?.relative_humidity_2m != null && { label: 'Humidity', val: `${c.relative_humidity_2m}%` },
			c?.surface_pressure != null && {
				label: 'Pressure',
				val: `${Math.round(c.surface_pressure)} hPa`
			},
			c?.visibility != null && {
				label: 'Visibility',
				val: `${(c.visibility / 1000).toFixed(1)} km`
			},
			airQuality != null && { label: 'Air Quality', val: `${airQuality} AQI` },
			d?.sunrise?.[0] && { label: 'Sunrise', val: formatTime(d.sunrise[0]) },
			d?.sunset?.[0] && { label: 'Sunset', val: formatTime(d.sunset[0]) },
			c?.precipitation_probability != null && {
				label: 'Rain Prob.',
				val: `${c.precipitation_probability}%`
			},
			c?.precipitation != null && { label: 'Precipitation', val: `${c.precipitation} mm` },
			d?.uv_index_max?.[0] != null && { label: 'Solar Index', val: `${d.uv_index_max[0]} UVI` },
			c?.wind_speed_10m != null && { label: 'Wind Speed', val: `${c.wind_speed_10m} km/h` }
		].filter((m): m is { label: string; val: string } => Boolean(m));
	});

	const fetchWeather = async (lat: number, lon: number) => {
		loading = true;
		try {
			const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,precipitation_probability,surface_pressure,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,sunrise,sunset&hourly=temperature_2m,precipitation_probability&timezone=auto`;
			const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;

			const [wRes, aqRes] = await Promise.all([
				fetch(wUrl).then((r) => r.json()),
				fetch(aqUrl)
					.then((r) => r.json())
					.catch(() => null)
			]);

			weather = wRes;
			airQuality = aqRes?.current?.us_aqi ?? null;
		} catch (err) {
			console.error('Telemetry Sync Error', err);
		} finally {
			loading = false;
		}
	};

	const getCityName = async (lat: number, lon: number) => {
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
			);
			const data = await res.json();
			const addr = data.address || {};
			cityName = addr.city || addr.town || addr.village || addr.county || 'Nexus Point';
		} catch {
			cityName = 'Nexus Point';
		}
	};

	const getWeatherByCity = async () => {
		if (!cityInput.trim()) return;
		loading = true;
		try {
			const res = await fetch(
				`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1`
			);
			const data = await res.json();
			if (data.results?.[0]) {
				const { name, latitude, longitude } = data.results[0];
				cityName = name;
				await fetchWeather(latitude, longitude);
			} else {
				alert('Location not found');
			}
		} catch {
			alert('Failed to query location telemetry');
		} finally {
			cityInput = '';
			loading = false;
		}
	};

	const formatDate = (d: string) =>
		new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(d));
	const formatTime = (t: string) =>
		new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
	const updateClock = () => {
		currentTime = new Date().toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});
	};

	onMount(() => {
		updateClock();
		clockInterval = setInterval(updateClock, 1000);
		const defaultLat = 40.7128,
			defaultLon = -74.006;

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(p) => {
					getCityName(p.coords.latitude, p.coords.longitude);
					fetchWeather(p.coords.latitude, p.coords.longitude);
				},
				() => {
					cityName = 'New York';
					fetchWeather(defaultLat, defaultLon);
				}
			);
		} else {
			cityName = 'New York';
			fetchWeather(defaultLat, defaultLon);
		}
	});

	onDestroy(() => clockInterval && clearInterval(clockInterval));
</script>

<svelte:head>
	<title>Avero Weather | Telemetry</title>
</svelte:head>

<div
	class="min-h-screen bg-black p-6 font-sans tracking-tight text-white selection:bg-[#9999FF]/30 selection:text-white md:p-12 lg:p-16"
>
	<div class="mx-auto max-w-6xl space-y-8">
		<!-- Header Controls -->
		<header class="flex flex-col items-center justify-between gap-6 lg:flex-row">
			<div class="relative w-full lg:w-1/2">
				<input
					type="text"
					bind:value={cityInput}
					onkeydown={(e) => e.key === 'Enter' && getWeatherByCity()}
					placeholder="Search global coordinates or city name..."
					class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
				/>
				<button
					onclick={getWeatherByCity}
					class="absolute top-1/2 right-3 -translate-y-1/2 rounded-xl bg-[#9999FF] px-4 py-2 text-[10px] font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE]"
				>
					Query
				</button>
			</div>

			<div class="flex w-full items-center justify-between gap-6 lg:w-auto lg:justify-end">
				<div class="hidden text-right sm:block">
					<p class="text-[10px] font-black tracking-[0.25em] uppercase opacity-30">System Chrono</p>
					<p class="font-mono text-sm text-[#9999FF]">{currentTime}</p>
				</div>
				<select
					bind:value={unit}
					class="cursor-pointer rounded-xl border border-white/10 bg-black px-4 py-3 font-mono text-xs font-bold text-white uppercase transition duration-300 outline-none hover:border-[#9999FF]/40"
				>
					<option value="K">Kelvin (K)</option>
					<option value="C">Celsius (°C)</option>
					<option value="F">Fahrenheit (°F)</option>
				</select>
			</div>
		</header>

		<!-- Loading State -->
		{#if loading}
			<div
				class="flex h-96 flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/2 backdrop-blur-xl"
			>
				<div
					class="mb-6 h-12 w-12 animate-spin rounded-full border-2 border-[#9999FF]/20 border-t-[#9999FF]"
				></div>
				<div class="text-[10px] font-black tracking-[0.6em] text-white/40 uppercase">
					Calculating Atmospheric Variance
				</div>
			</div>
		{:else if weather}
			<div class="animate-in fade-in space-y-8 duration-700">
				<!-- Hero Card + Dynamic Metrics Grid -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
					<!-- Main Hero Card -->
					<div
						class="relative flex min-h-90 flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-white/2 p-8 shadow-[0_0_30px_rgba(153,153,255,0.05)] backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/30 hover:bg-white/4 md:p-12 lg:col-span-2"
					>
						<div class="z-10 space-y-3">
							<div class="flex items-center gap-2">
								<span
									class="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_#22c55e]"
								></span>
								<span class="text-[10px] font-black tracking-[0.3em] text-[#9999FF] uppercase"
									>Telemetry: Stable</span
								>
							</div>
							<h1 class="text-6xl font-black tracking-tighter text-white md:text-7xl">
								{cityName}
							</h1>
							<p class="text-xl font-light text-white/60 italic md:text-2xl">{weatherDesc}</p>
						</div>

						<div class="z-10 mt-8 flex items-baseline gap-2">
							<span
								class="text-8xl leading-none font-black tracking-tighter text-[#9999FF] drop-shadow-[0_0_35px_rgba(153,153,255,0.35)] md:text-9xl"
							>
								{convertTemp(weather.current?.temperature_2m)}
							</span>
							<span class="text-3xl font-light text-white/40">°{unit}</span>
						</div>

						<div
							class="pointer-events-none absolute -right-12 -bottom-12 h-72 w-72 rounded-full bg-[#9999FF] opacity-20 blur-3xl"
						></div>
					</div>

					<!-- Dynamic Metrics Cards Grid -->
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-2">
						{#each metrics as metric (metric.label)}
							<div
								class="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/2 p-5 backdrop-blur-md transition duration-300 hover:border-[#9999FF]/30 hover:bg-white/4"
							>
								<span class="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
									>{metric.label}</span
								>
								<p class="mt-3 text-2xl font-black text-white">{metric.val}</p>
							</div>
						{/each}
					</div>
				</div>

				<!-- 24-Hour Atmospheric Projection -->
				<div
					class="overflow-hidden rounded-[28px] border border-white/10 bg-white/2 backdrop-blur-xl transition-all duration-300 hover:border-[#9999FF]/20"
				>
					<div
						class="flex items-center justify-between border-b border-white/10 bg-white/1 px-8 py-5"
					>
						<h2 class="text-[11px] font-black tracking-[0.3em] text-[#9999FF] uppercase">
							24-Hour Atmospheric Projection
						</h2>
					</div>

					<div
						class="flex scrollbar-thin [scrollbar-color:rgba(255,255,255,0.1)_transparent] gap-4 overflow-x-auto p-6"
					>
						{#each hourlySlice as hour (hour.time)}
							<div
								class="flex min-w-25 shrink-0 flex-col items-center justify-between rounded-xl border border-white/5 bg-white/1 p-4 text-center transition duration-300 hover:border-[#9999FF]/30 hover:bg-white/3"
							>
								<p class="mb-2 text-[10px] font-black text-white/40">{formatTime(hour.time)}</p>
								<div class="mb-1 text-xl font-bold text-white">{convertTemp(hour.temp)}°</div>
								<div
									class="mb-3 text-[9px] font-bold {hour.rainChance > 30
										? 'text-[#9999FF]'
										: 'text-white/20'}"
								>
									{hour.rainChance}% <span class="text-[7px]">RAIN</span>
								</div>
								<div class="text-2xl contrast-125 filter">
									{getThermalEmoji(hour.temp, hour.rainChance)}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- 7-Day Atmospheric Outlook -->
				<div class="space-y-4">
					<h3 class="px-2 text-[11px] font-black tracking-[0.3em] text-white/40 uppercase">
						7-Day Atmospheric Outlook
					</h3>
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
						{#each weather.daily?.temperature_2m_max || [] as tempMax, i (i)}
							<div
								class="rounded-2xl border border-white/10 bg-white/2 p-5 text-center backdrop-blur-md transition-all duration-300 hover:border-[#9999FF]/30 hover:bg-white/4"
							>
								<p class="mb-3 text-[10px] font-black tracking-wider text-white/40 uppercase">
									{formatDate(weather.daily!.time[i])}
								</p>
								<div class="mb-1 text-2xl font-black text-white">{convertTemp(tempMax)}°</div>
								<div class="mb-4 text-[10px] font-bold text-white/30">
									{convertTemp(weather.daily!.temperature_2m_min[i])}° min
								</div>
								<div class="text-2xl">
									{getThermalEmoji(tempMax, weather.daily!.precipitation_probability_max[i])}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
