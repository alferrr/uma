# Uma roll-up banner

- **Print file:** `uma-rollup-850x2000.pdf`, one page, **860 × 2010 mm** = 850 × 2000 mm trim
  plus **5 mm bleed** on every side. Fonts (Outfit) are embedded.
- **Previews:** `preview.png` (small), `preview-large.png` (40 dpi).
- **Source:** `banner.html`. Edit it, then re-export from this folder:
  ```
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer \
    --allow-file-access-from-files --virtual-time-budget=8000 \
    --print-to-pdf="$PWD/uma-rollup-850x2000.pdf" "file://$PWD/banner.html"
  ```

## Layout and print notes

- All text sits at least 45 mm inside the trim. The lowest text ends about 1790 mm from the
  top, clear of the bottom ~160 mm that disappears into the stand's base.
- App screens are real simulator captures (1260 px wide) printed 190 mm wide: about 170 dpi,
  sharp at booth viewing distance.
- Colours are RGB (Uma green `#16923F`). Ask the printer to convert to their CMYK profile
  and send a proof; bright green can print slightly duller in CMYK.
- If your stand is 80 × 200 cm or 100 × 200 cm, change the sizes in `@page` and `.banner`
  and re-export; the layout is centred.

Content follows the second explainer (`../CLAIMS2.md`); the moisture value shown in a
screen is labelled "Sample data".
