# Claims in explainer #2

| On-screen line | Backed by |
|---|---|
| "plants drying out, but too many zones to check?" | The problem in `product.md` §1–3 (framed as a question, no numbers) |
| "Uma keeps track." | Zones, last-checked times and who checked (`src/lib/db.ts`, zone cards, History) |
| Option cards "Okay" / "Needs water" | Real rows from the Check-in screen (`src/app/check-in/[id].tsx`) |
| "See every zone." | Home zone list and Map (`src/app/home.tsx`, `src/app/map.tsx`) |
| "Even with no signal." | Offline-first check-ins (`src/lib/db.ts`, `src/lib/sync.ts`); also the app's own Home headline |
| "scan / check / done" | QR Scan (`src/app/scan.tsx`), Check-in, Saved (`src/app/saved.tsx`) |
| "Uma" + "Watch your farm even with no signal." | Offline-first check-ins (`src/lib/db.ts`) and the app's Home headline |
| "Cebuano · English · Tagalog" | `src/lib/i18n.ts` |

The "54% Just right · Sample data" prop is the app's seeded sample reading and says so. No
statistics, store badges, "available now", NFC, or sensor hardware appear. Names on screen are
Alfer Mercado (owner, with permission) and workers Jenina and Euri, on "Yati Farm".
