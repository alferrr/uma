/**
 * Three-language strings (product.md §12). Cebuano and Tagalog are first
 * drafts and must be checked by native speakers before any user test.
 */
import 'expo-sqlite/localStorage/install';

import { useSyncExternalStore } from 'react';

export type Lang = 'ceb' | 'en' | 'tl';

const en = {
  chooseYour: 'Choose your',
  language: 'Language',
  changeInSettings: 'You can change this in Settings.',
  continue: 'Continue',
  goodMorning: 'Good morning',
  goodAfternoon: 'Good afternoon',
  goodEvening: 'Good evening',
  heroLine1: 'Watch every plant,',
  heroLine2: 'even with no signal',
  searchZones: 'Search zones',
  soilMoisture: 'Soil moisture',
  sensor: 'Sensor',
  sampleData: 'Sample data',
  moistureLabel: { wet: 'Moisture high', ok: 'Moisture just right', dry: 'Soil is dry' },
  all: 'All',
  myZones: 'My Zones',
  seeAll: 'See all',
  noZones: 'No zones match.',
  status: { ok: 'Okay', needs_water: 'Needs water', dead: 'Dead plants', not_checked: 'Not checked' },
  statusShort: { ok: 'Okay', needs_water: 'Water', dead: 'Dead', not_checked: 'Not checked' },
  dead: 'dead',
  moisture: { wet: 'Wet', ok: 'Just right', dry: 'Dry' },
  hoursAgo: (n: number) => (n < 1 ? 'just now' : n < 24 ? `${n} h ago` : `${Math.floor(n / 24)} d ago`),
  never: 'Never checked',
  lastChecked: 'Last checked',
  farmName: 'Uma Farm',
  sampleLayout: 'Sample layout',
  zonesNeedVisit: (n: number) => (n === 1 ? '1 zone' : `${n} zones`),
  needVisitToday: 'need a visit today',
  checkIn: 'Check in',
  whatsThe: "What's the",
  statusQ: 'status?',
  howManyDead: 'How many dead?',
  save: 'Save',
  checkSaved: 'Check',
  saved: 'saved',
  notSynced: (n: number) => (n === 1 ? '1 record not synced yet' : `${n} records not synced yet`),
  allSynced: 'All records synced',
  backNow: 'Back now',
  returnsIn: (n: number) => `Returns home in ${n} ${n === 1 ? 'second' : 'seconds'}`,
  signOut: 'Sign out',
  changeLanguage: 'Change language',
  cancel: 'Cancel',
  account: 'Account',
};

type Strings = typeof en;

const ceb: Strings = {
  ...en,
  chooseYour: 'Pilia ang imong',
  language: 'Pinulongan',
  changeInSettings: 'Mausab nimo kini sa Settings.',
  continue: 'Padayon',
  goodMorning: 'Maayong buntag',
  goodAfternoon: 'Maayong hapon',
  goodEvening: 'Maayong gabii',
  heroLine1: 'Bantayi ang matag tanom,',
  heroLine2: 'bisan walay signal',
  searchZones: 'Pangita og zone',
  soilMoisture: 'Kabasa sa yuta',
  sampleData: 'Sample nga datos',
  moistureLabel: { wet: 'Basa kaayo', ok: 'Husto ang kabasa', dry: 'Uga ang yuta' },
  all: 'Tanan',
  myZones: 'Akong mga Zone',
  seeAll: 'Tan-awa tanan',
  noZones: 'Walay zone nga nakit-an.',
  status: { ok: 'Okay', needs_water: 'Kinahanglan tubig', dead: 'May patay', not_checked: 'Wala pa na-check' },
  statusShort: { ok: 'Okay', needs_water: 'Tubig', dead: 'Patay', not_checked: 'Wala pa' },
  dead: 'patay',
  moisture: { wet: 'Basa', ok: 'Husto', dry: 'Uga' },
  hoursAgo: (n) => (n < 1 ? 'karon lang' : n < 24 ? `${n} ka oras na` : `${Math.floor(n / 24)} ka adlaw na`),
  never: 'Wala pa na-check',
  lastChecked: 'Katapusang gi-check',
  sampleLayout: 'Sample nga layout',
  zonesNeedVisit: (n) => `${n} ka zone`,
  needVisitToday: 'kinahanglan bisitahon karon',
  checkIn: 'Mag-check in',
  whatsThe: 'Unsa ang',
  statusQ: 'kahimtang?',
  howManyDead: 'Pila ang patay?',
  save: 'I-save',
  checkSaved: 'Na-save',
  saved: 'ang check',
  notSynced: (n) => `${n} ka rekord wala pa ma-sync`,
  allSynced: 'Na-sync na tanan',
  backNow: 'Balik na',
  returnsIn: (n) => `Mobalik sa home sulod sa ${n} segundo`,
  signOut: 'Mogawas',
  changeLanguage: 'Usba ang pinulongan',
  cancel: 'Kanselahon',
  account: 'Account',
};

const tl: Strings = {
  ...en,
  chooseYour: 'Piliin ang iyong',
  language: 'Wika',
  changeInSettings: 'Mababago mo ito sa Settings.',
  continue: 'Magpatuloy',
  goodMorning: 'Magandang umaga',
  goodAfternoon: 'Magandang hapon',
  goodEvening: 'Magandang gabi',
  heroLine1: 'Bantayan ang bawat halaman,',
  heroLine2: 'kahit walang signal',
  searchZones: 'Maghanap ng zone',
  soilMoisture: 'Halumigmig ng lupa',
  sampleData: 'Sample na datos',
  moistureLabel: { wet: 'Masyadong basa', ok: 'Tama lang ang halumigmig', dry: 'Tuyo ang lupa' },
  all: 'Lahat',
  myZones: 'Aking mga Zone',
  seeAll: 'Tingnan lahat',
  noZones: 'Walang tugmang zone.',
  status: { ok: 'Okay', needs_water: 'Kailangan ng tubig', dead: 'May patay na halaman', not_checked: 'Hindi pa nasusuri' },
  statusShort: { ok: 'Okay', needs_water: 'Tubig', dead: 'Patay', not_checked: 'Hindi pa' },
  dead: 'patay',
  moisture: { wet: 'Basa', ok: 'Tama lang', dry: 'Tuyo' },
  hoursAgo: (n) => (n < 1 ? 'ngayon lang' : n < 24 ? `${n} oras na` : `${Math.floor(n / 24)} araw na`),
  never: 'Hindi pa nasusuri',
  lastChecked: 'Huling na-check',
  sampleLayout: 'Sample na layout',
  zonesNeedVisit: (n) => `${n} zone`,
  needVisitToday: 'kailangang bisitahin ngayon',
  checkIn: 'Mag-check in',
  whatsThe: 'Ano ang',
  statusQ: 'kalagayan?',
  howManyDead: 'Ilan ang patay?',
  save: 'I-save',
  checkSaved: 'Na-save',
  saved: 'ang check',
  notSynced: (n) => `${n} rekord ang hindi pa na-sync`,
  allSynced: 'Na-sync na lahat',
  backNow: 'Bumalik na',
  returnsIn: (n) => `Babalik sa home sa loob ng ${n} segundo`,
  signOut: 'Mag-sign out',
  changeLanguage: 'Palitan ang wika',
  cancel: 'Kanselahin',
  account: 'Account',
};

export const STRINGS: Record<Lang, Strings> = { ceb, en, tl };

const KEY = 'uma.language';
let current: Lang | null = (localStorage.getItem(KEY) as Lang | null) ?? null;
const listeners = new Set<() => void>();

/** Where to go after sign-in: pick a language first on a fresh install. */
export function afterSignInRoute() {
  return current ? ('/home' as const) : ('/language' as const);
}

export function setLanguage(lang: Lang) {
  current = lang;
  localStorage.setItem(KEY, lang);
  listeners.forEach((l) => l());
}

/** Null until the user has picked a language on first launch. */
export function useLanguage() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

export function useT() {
  return STRINGS[useLanguage() ?? 'en'];
}
