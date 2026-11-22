/**
 * Live weather from Open-Meteo (free, no API key). The farm is in Barangay
 * Yati, Cebu City, so the location is fixed there for now. The last good
 * reading is kept on the phone so the card still shows something with no signal.
 */
import 'expo-sqlite/localStorage/install';

import { useEffect, useSyncExternalStore } from 'react';

import { conditionFromCode, type Condition } from './weatherCodes';

export type { Condition } from './weatherCodes';

const LAT = 10.3157;
const LON = 123.8854;
const URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day' +
  '&hourly=temperature_2m,weather_code,is_day&forecast_hours=6' +
  '&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min' +
  '&timezone=Asia%2FManila&forecast_days=1';

const CACHE_KEY = 'uma.weather';
const FRESH_MS = 15 * 60_000;

export type HourWeather = { hour: string; tempC: number; condition: Condition; isDay: boolean };

export type Weather = {
  tempC: number;
  humidity: number;
  windKmh: number;
  isDay: boolean;
  condition: Condition;
  rainChance: number;
  highC: number;
  lowC: number;
  /** The current hour and the next five, for the strip on Home. */
  hours: HourWeather[];
  /** ISO time this reading was fetched. */
  fetchedAt: string;
};

type Forecast = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    is_day: number[];
  };
  daily: {
    precipitation_probability_max: (number | null)[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

async function fetchWeather(): Promise<Weather> {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Weather ${res.status}`);
  const j = (await res.json()) as Forecast;
  return {
    tempC: j.current.temperature_2m,
    humidity: j.current.relative_humidity_2m,
    windKmh: j.current.wind_speed_10m,
    isDay: j.current.is_day === 1,
    condition: conditionFromCode(j.current.weather_code),
    rainChance: j.daily.precipitation_probability_max[0] ?? 0,
    highC: j.daily.temperature_2m_max[0]!,
    lowC: j.daily.temperature_2m_min[0]!,
    hours: j.hourly.time.map((t, i) => ({
      hour: t.slice(11, 13),
      tempC: j.hourly.temperature_2m[i]!,
      condition: conditionFromCode(j.hourly.weather_code[i]!),
      isDay: j.hourly.is_day[i] === 1,
    })),
    fetchedAt: new Date().toISOString(),
  };
}

function readCache(): Weather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const w = raw ? (JSON.parse(raw) as Weather) : null;
    return w && Array.isArray(w.hours) ? w : null;
  } catch {
    return null;
  }
}

export type WeatherState = {
  weather: Weather | null;
  loading: boolean;
  /** True when the shown reading is old because the last fetch failed. */
  stale: boolean;
};

function isFresh(w: Weather | null) {
  return !!w && Date.now() - new Date(w.fetchedAt).getTime() < FRESH_MS;
}

// One shared store, like zones and language: every screen sees the same reading.
const cached = readCache();
let state: WeatherState = { weather: cached, loading: !isFresh(cached), stale: false };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function set(next: Partial<WeatherState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

/** Fetch now. Callers during a fetch share it; a failure keeps the last reading. */
export function refreshWeather() {
  inflight ??= (async () => {
    set({ loading: true });
    try {
      const w = await fetchWeather();
      localStorage.setItem(CACHE_KEY, JSON.stringify(w));
      set({ weather: w, stale: false, loading: false });
    } catch {
      set({ stale: true, loading: false });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useWeather() {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
  useEffect(() => {
    if (!isFresh(state.weather)) refreshWeather();
  }, []);
  return { ...s, refresh: refreshWeather };
}
