# Claims in the Uma explainer

Every line shown on screen, and what in the app backs it. The app is a **prototype**; the ad
says so on the end card.

| On-screen line | Backed by | Notes |
|---|---|---|
| "Plants dry out unnoticed." | `product.md` §1–2 (problem from the grower interviews) | Framed as the problem, no numbers. |
| "Which zone? Checked when?" | `product.md` §1 | The question Uma answers; no statistic. |
| "Meet Uma" | App name and real logo (`src/components/icons.tsx` `LeafLogo`) | |
| "Scan the zone's QR code" | `src/app/scan.tsx` (camera QR scanning), `src/app/qr/[id].tsx` (printable code) | Screens shown: the real Scan screen and the real QR label screen. The simulator has no camera, so no live camera feed is shown; the scan line is a motion-graphics overlay. |
| "The zone opens" | `src/app/scan.tsx` → `src/app/zone/[id].tsx` | Real Zone details screenshot. |
| "See its soil moisture" / "54%" count-up | `src/app/zone/[id].tsx` shows the zone's latest `sensor_readings` value | Reading is **sample data**, labelled "Sample data" in the app and "Sample reading" in the ad. No sensor hardware is shown. |
| "Moisture already filled in" | `src/app/check-in/[id].tsx` pre-fills moisture from the latest reading | Same sample reading. |
| "Saved in a few taps" | `src/app/check-in/[id].tsx` (status + Save), `src/app/saved.tsx` | "A few taps", not a number, because a dead-plant count adds taps. |
| "Spot the zone that needs water." | Map status labels (`src/app/map.tsx`), pills cropped from the real map | Z-04 shows "Water". |
| "The whole farm at a glance" | `src/app/map.tsx`, `src/app/home.tsx` | Demo farm with 6 zones. |
| "Works offline." | Check-ins save to SQLite first (`src/lib/db.ts`) | Profile shows "1 record not synced yet". |
| "Syncs when back online." | `src/lib/sync.ts`; Profile "All records synced" | Both Profile states are real screenshots. |
| "In three languages." + "Cebuano · English · Tagalog" | `src/lib/i18n.ts` | Only English is shown on screen, as requested. |
| "Watch every plant" (CTA pill), "Watch every plant. Lose less." | The app's own Welcome headline | |
| "Prototype" | Project status in `product.md` | |

## Not claimed

No statistics, customer counts, testimonials, awards, partner logos, NFC, or sensor hardware.

## Data on screen

One farm, "Yati Farm" (after Barangay Yati in `product.md`), with 6 zones in mixed states, seeded
into the simulator's local database. The owner is Alfer Mercado (alfermercado@gmail.com), shown
with his permission; the workers are Jenina and Euri. Soil-moisture readings are sample data. The
weather card is the app's live Cebu City forecast at capture time (shown only in the app screens
captured, not used as a claim).
