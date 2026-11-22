import { createContext, useContext, type ReactNode } from 'react';
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { easeOut } from '../ease';
import { SHOT } from '../theme';

const ScaleContext = createContext(1);
/** Screenshot pixels → on-screen pixels inside the current DeviceFrame. */
export const useShotScale = () => useContext(ScaleContext);

type Props = {
  /** Real simulator screenshot in assets/screens. */
  src: string;
  /** Crossfade to a second real screenshot from `swapAt`. */
  next?: string;
  swapAt?: number;
  /** Width of the screen area in px; height follows the screenshot. */
  width: number;
  children?: ReactNode;
};

/** A clean phone bezel around a real screenshot. Overlays use screenshot coordinates. */
export function DeviceFrame({ src, next, swapAt = 0, width, children }: Props) {
  const f = useCurrentFrame();
  const scale = width / SHOT.w;
  const height = SHOT.h * scale;
  const bezel = Math.round(width * 0.035);
  const radius = width * 0.13;
  const swap = next
    ? interpolate(f, [swapAt, swapAt + 12], [0, 1], {
        easing: easeOut,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;
  const img = (file: string, opacity: number) => (
    <Img
      src={staticFile(`screens/${file}`)}
      style={{ position: 'absolute', inset: 0, width, height, opacity }}
    />
  );
  return (
    <div
      style={{
        padding: bezel,
        borderRadius: radius + bezel,
        background: '#1B1B1A',
        boxShadow: '0 40px 90px rgba(20,20,20,0.14), 0 8px 24px rgba(20,20,20,0.08)',
      }}
    >
      <div
        style={{ position: 'relative', width, height, borderRadius: radius, overflow: 'hidden' }}
      >
        {img(src, 1)}
        {next && img(next, swap)}
        <ScaleContext.Provider value={scale}>{children}</ScaleContext.Provider>
      </div>
    </div>
  );
}
