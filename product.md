# Uma: Product Brief

Status: proposed and untested. Nothing in this document has been built or validated in the field yet.

## 1. What Uma is

Uma is an iPhone app for a small grower in Cebu to keep track of every plant zone on their land, so they lose fewer plants before harvest. A worker taps an NFC tag or scans a QR code at a zone, records what they see, and the owner sees the whole farm on one map. It works with no Wi-Fi in the garden and syncs when the phone is back online.

Core problem (from the design-thinking activity): a household or small grower loses plants "without a debt they cannot see". Plants die or dry out unnoticed because nobody has a record of which zone was last checked, when, and in what state.

## 2. Who it is for

- **Owner**: has a big plot and few hands. Wants to see which zones need a visit today without walking the whole land in the afternoon heat.
- **Worker**: walks the zones, checks plants, records the result in a few taps. May have limited reading comfort, so icons, colors and big buttons carry meaning, with words as support.

Source: explorative interview with plant growers in Barangay Yati, Cebu City (November 9). The "Farmer A" notes used in the empathy map are simulated, not real.

## 3. Needs the product answers

- Keep track of every plant on a big land.
- Lose fewer plants before harvest.
- Cover the land with only a few hands.
- Spend fewer hours in the afternoon heat.

## 4. Prototype scope

In scope for the class prototype:

- One pot, `POT-01`, one iPhone, one sensor node.
- Everything else on screen is labeled sample data.
- Sign-in is a mock (no real account backend needed to demo).

Out of scope for now: multiple farms, payments, push notifications, analytics, an Android app, a web app, LoRa gateway.

## 5. Core features

1. **Zone check-in.** Tap an NFC tag or scan a QR code on a zone's stake to open that zone.
2. **Status.** Pick one: Okay, Needs water, Dead plants. If dead plants, enter how many.
3. **Soil moisture.** Wet, Just right, Dry. Filled from the sensor when available, or by the worker's finger test when not.
4. **Last checked.** Every zone shows when it was last checked and by whom.
5. **Overdue and attention list.** Zones not checked, dry, or with dead plants rise to the top.
6. **Farm map.** A top-down picture of the farm; zones are tappable and colored by status. Tapping opens zone details.
7. **Offline first.** Check-ins save on the phone with a unique ID and sync later.
8. **Sensor readings.** A buried moisture sensor reads on a schedule and the phone collects readings over Bluetooth.
9. **Three languages.** Cebuano, English, Tagalog, chosen on first launch and changeable in Settings.

## 6. Screens (10)

Designed as two canvases (Cebuano and English), same layout.

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Welcome | Logo, headline, "Get Started" |
| 2 | Sign in | Email or phone, password, note that internet is needed for first sign-in |
| 3 | Sign up | Name, contact, password, role (Owner or Worker) |
| 4 | Language | Cebuano, English, Tagalog |
| 5 | Home | Greeting, search, moisture strip, filter chips, "My Zones" card |
| 6 | Map | Aerial farm with zone status labels and a bottom summary |
| 7 | Zone details | Aerial zone view with a bottom sheet and the Check in button |
| 8 | Scan | "Tap the tag at the zone", QR option, last checked shortcut |
| 9 | Check-in | Status, dead count, moisture, Save |
| 10 | Saved | Confirmation, unsynced count, returns to Scan |

Not designed yet: Settings, sync sheet, PIN screen, empty states, error states.

Flow: Welcome → Sign in (or Sign up) → Language → Home → Map or Scan → Zone → Check-in → Saved → Scan.

## 7. Visual design

Follows the user's chosen reference (a farming app with photo heroes and frosted glass).

- Font: Outfit (closest free match to the reference's geometric sans). Light and bold weights mixed in headlines.
- Colors: green `#16923F`, orange `#F7931E` for selected and active states, background `#F4F4F1`, text `#141414`, muted `#6E6E6A`.
- Components: frosted-glass controls over imagery, rounded pill buttons with a white arrow circle and `>>>`, large rounded cards, bottom sheets.
- Images: field and sunset pictures are drawn in SVG as placeholders. Replace with the team's own farm photos.

## 8. Technical plan

Platform: iPhone only, native app built with React Native (Expo), because the user does not want a web app and Safari has no Web NFC or Web Bluetooth.

Libraries:

- `expo-font` and `@expo-google-fonts/outfit`: type
- `react-native-svg`: field illustrations
- `expo-blur`: frosted glass
- `expo-sqlite`: offline storage
- `expo-camera`: QR scanning
- `react-native-ble-plx`: sensor over Bluetooth
- `react-native-nfc-manager`: NFC tags

Running it:

- Expo Go is enough for screens and flow.
- Bluetooth and NFC need a development build (`npx expo run:ios`).
- Simulator has no NFC, Bluetooth or camera. Use fake buttons there and test hardware on a real iPhone.
- Free Apple ID: the app expires after 7 days. NFC reading likely needs the paid Apple Developer account.

## 9. Hardware (proposed, untested)

- ESP32 DevKit (ESP32-WROOM-32), capacitive soil moisture sensor v1.2 (not resistive), jumper wires, USB data cable, power bank. Optional NTAG213 NFC tags.
- Sensor stays buried on a stake. Seal the top edge with epoxy or heat-shrink.
- Reads on a timer using deep sleep. The draft sketch sleeps 30 minutes; set it to 60 for hourly.
- Calibration values in the sketch (`RAW_DRY`, `RAW_WET`) are placeholders and must be measured on the real sensor and soil.
- Sensor has no clock chip, so it broadcasts readings with "seconds ago" ages and the phone assigns real timestamps.
- Scaling later: many nodes plus a LoRa gateway, since there is no Wi-Fi in the field.

## 10. Data model

Tables: `area`, `zone`, `batch`, `check_in`, `worker` (user), `device`, `sensor_node`, `sensor_reading`.

Key fields:

- `check_in`: `id` (unique, generated on the phone), `zone_id`, `worker_id`, `status` (ok, needs_water, dead), `dead_count`, `moisture` (wet, ok, dry), `source` (sensor or finger), `checked_at`, `synced_at`.
- `sensor_reading`: `id`, `node_id`, `zone_id`, `raw`, `percent`, `label`, `read_at`.
- `zone`: `id`, `code` (for example POT-01), `plant`, `map_points` (polygon as percentages of the map image), `last_checked_at`.
- `user`: `id`, `name`, `contact`, `role` (owner or worker), `language`.

## 11. Sync and API

Phone writes locally first, then uploads when online. Records are idempotent: sending the same record ID twice does not create a duplicate.

- `POST /api/sync`: upload pending check-ins
- `POST /api/moisture`: upload sensor readings
- `GET /api/zones`: zones and map shapes
- `GET /api/overdue`: zones needing a visit

The prototype can run with no server by keeping everything in SQLite.

## 12. Language and copy

Cebuano, English and Tagalog strings are in the canvases. Cebuano and Tagalog wording is a first draft and must be checked by native speakers before any user test.

| English | Cebuano | Tagalog |
|---------|---------|---------|
| Needs water | Kinahanglan tubig | Kailangan ng tubig |
| Dead plants | May patay | May patay na halaman |
| Not checked | Wala pa na-check | Hindi pa nasusuri |
| Wet / Just right / Dry | Basa / Husto / Uga | Basa / Tama lang / Tuyo |
| Last checked | Katapusang gi-check | Huling na-check |
| Check in | Mag-check in | Mag-check in |
| Save / Saved | I-save / Na-save | I-save / Na-save |

Status always uses an icon plus a word, never color alone.

## 13. Build order

1. Theme (colors, Outfit, glass, pill button) and the Welcome screen.
2. All 10 screens with sample data and the click-through flow.
3. Local storage so check-ins persist offline.
4. Sensor over Bluetooth on a real iPhone.
5. NFC tags last.
6. Optional: sync to a server.

## 14. Honest limits and open questions

- Everything here is a proposal. No field test has happened.
- Farmer A data is simulated. Zone data other than `POT-01` is sample data.
- Plant type for `POT-01` is not decided.
- Hardware cost is not totaled; only verified prices should go in the cost sheet.
- Native-speaker review of Cebuano and Tagalog is still needed.
- To test with real users: observe whether a worker can complete a check-in with no instruction, and whether the owner can name which zones need a visit from the map alone. These are things to measure, not results.
