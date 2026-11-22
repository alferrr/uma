# Style notes from `inspo.mp4`

Measured with `ffprobe`: 14.42 s, 1024×576, 30 fps, H.264 + AAC. Frames sampled every 0.5 s
into `_ref/` (`f_001.png` … `f_029.png`; contact sheets `sheet1.png`, `sheet2.png`).

Only structure, pacing and motion language are borrowed. No footage, text, brand, colours or
assets from the reference are used.

## Scene map (what the reference actually does)

| Time | Frames | What happens |
|---|---|---|
| 0.0–2.0 s | 1–4 | **Kinetic question.** Words arrive one by one, small and green, then settle larger and black. They leave by sliding left and fading, word by word. |
| 2.0–4.5 s | 5–9 | **"Meet [logo] brand".** "Meet" lands, the logo mark pops in, the brand word follows. Then a fast **push-in with motion blur** carries into the next scene. |
| 4.5–6.5 s | 10–12 | **Phone rises** from below into the centre. Two short labels fade in either side of the phone. A soft glow sits behind the phone, and a cursor taps the screen. |
| 6.5–7.0 s | 13–14 | **Swipe transition**: a broad brand-colour stroke sweeps across, carrying a crop of the screen. |
| 7.0–9.5 s | 15–18 | **UI close-up**: a search field types, list rows stagger in, the view drifts upward. |
| 8.5–9.5 s | 17–18 | **Focus pull**: one row lifts and sharpens, the rest blur. A cursor clicks it. |
| 9.5–10.5 s | 19–21 | **CTA pill** ("Order now →") collapses into its arrow circle, which grows. |
| 10.5–14.4 s | 22–29 | **End card**: a dot grows into the logo mark, centred and small, then a partner mark with a soft glow. |

## Pacing

- About 10 beats in 14 s, 1–2.5 s each. Nothing holds still for long, but every line stays
  on screen long enough to read.
- Cuts land when a motion finishes. No hard cuts mid-move.

## Motion language

- **Text**: per-word stagger (about 3–6 frames apart), each word rising a little and fading in,
  with a colour settle from brand green to near-black. Exits mirror the entrance.
- **Easing**: ease-out on entrances, ease-in on exits. Springs are critically damped; there is
  no overshoot or wobble.
- **Screens**: always inside a phone, entering from below with a slight scale-up. Close-ups
  crop into one UI element instead of showing the whole screen.
- **Emphasis**: depth of field (one element sharp, the rest soft), a cursor tap, a soft glow.
- **Transitions**: push-in with blur, a sweeping brand stroke, a pill morphing into an icon.

## How the Uma ad applies it (v2, matched frame-by-frame at 10 fps)

- **Kinetic type** (`WordPop`): each word grows from tiny to about 130% size in green, raised a
  little, then settles to size in near-black over about 13 frames, 4 frames apart. Font size
  animates (not a transform), so the line re-centres live as words arrive, exactly like the
  reference. Exit: words in order turn light grey, shrink and drift up-left.
- **"Meet [logo] Uma"**: letters type in one by one (green→black, grey→green), the sprout mark's
  ring draws itself from the bottom, then a slow push-in and a whip-pan left with directional trails.
- **Phone rises** from below into a green glow, with a short label either side (stacked above in 9:16).
- **One morphing screen** (`Screen`): a single element whose frame and crop interpolate between
  poses: phone → zoomed card → small card on the swoosh → card → phone. Screenshot changes
  crossfade inside it, so screens morph rather than cut.
- **Swoosh**: a thick green stroke sweeps across while the card rides it and turns into the next screen.
- **Focus-pull list**: zone pills cropped from the real map rise in, the others blur, a pointer
  taps one, and that pill grows into the full map.
- **CTA**: green panel, pill collapses into its arrow, the arrow circle grows into white.
- **End**: a dot draws into the logo ring, "Uma" types in, then the tagline and a PROTOTYPE tag.
- Mint wash only behind the type scenes, like the reference; the rest is white. Uma tokens:
  Outfit, green `#16923F`, orange `#F7931E` for the highlight ring and count-up only.
