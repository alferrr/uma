# Style notes for explainer #2 (from `inspo2.mp4`)

Reference: 25.9 s (Uma cut: 26.7 s), 1024×576, 29.97 fps. Studied at 10 fps. Only motion language and structure are
borrowed; colours, type and assets are Uma's (Outfit, green `#16923F`, near-black `#141414`,
white, orange only as the app's own active state inside screenshots).

| Reference beat | Uma version (`src/Explainer2.tsx`) |
|---|---|
| Huge one-word punches, cutting between brand colour and white, each sliding up with a vertical motion trail ("craving / coffee / … / to go out?") | "plants" / "drying" / "plants drying out, but too many zones" / "to check?" in Outfit Bold, green ↔ white |
| Phone rises from below, un-tilting in 3D, with floating props and a brand-coloured headline | Phone with the real Home screen; props are real UI pieces cropped from the app (zone pills, the 54% sample reading, the sync row); headline "Uma keeps track." |
| Phone bursts into option cards; a thick ribbon stroke draws around them; focus pans to one card | The real check-in rows "Okay" and "Needs water"; green ribbon strokes; focus moves to "Needs water" |
| The chosen card's icon circle grows into a full-screen colour wipe | The "Needs water" icon circle grows into full green |
| Fan of screens flies up in 3D with motion blur; a white wave rises; words drop in | Five real screens fanned in 3D; white wave; "See every zone." |
| Phone slides in from the right with a white splash; words fade in one by one | Real Check-in screen; "Even with no signal." |
| "tap / order / done" punches; the "done" panel shrinks into the app icon tile | "scan / check / done"; the panel shrinks into the real Uma app icon (`assets/icon.png`) |
| End card: icon, two-line tagline, pill, faint brand-colour ribbons | Uma icon, "Watch every plant. / Lose less.", pill "Cebuano · English · Tagalog", faint green ribbons |

Easing: ease-out cubic for entrances, ease-in for exits, ease-in-out for morphs; fast moves get
directional trails instead of a generic blur.

## v2 fixes
- Beats now overlap so there's never an empty frame: the screen fan rises under the
  green wipe, and the slide-in phone's splash covers the fan's exit.
- Option cards are drawn in Uma's style (white, green outline, the app's check and drop
  icons in a green circle) instead of tiny screenshot rows.
- Props are pre-cropped real UI pieces that fly in from the sides with trails.
- Word punches fill the frame, as in the reference; slow push-ins on holds.
