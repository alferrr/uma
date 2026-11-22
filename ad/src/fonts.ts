import { continueRender, delayRender, staticFile } from 'remotion';

import { FONT } from './theme';

const WEIGHTS: [string, number][] = [
  ['Outfit_300Light.ttf', 300],
  ['Outfit_400Regular.ttf', 400],
  ['Outfit_500Medium.ttf', 500],
  ['Outfit_600SemiBold.ttf', 600],
  ['Outfit_700Bold.ttf', 700],
];

let loaded = false;

/** Load the app's Outfit files before the first frame renders. */
export function loadFonts() {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('Loading Outfit');
  Promise.all(
    WEIGHTS.map(async ([file, weight]) => {
      const face = new FontFace(FONT, `url(${staticFile(`fonts/${file}`)})`, {
        weight: String(weight),
      });
      document.fonts.add(await face.load());
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}
