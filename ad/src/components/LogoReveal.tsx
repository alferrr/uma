import { Img, staticFile, useCurrentFrame } from 'remotion';

import { calm, rise } from '../ease';
import { C, FONT } from '../theme';

/** "Meet [logo] Uma": words and the real sprout mark land one after another. */
export function LogoReveal({ size }: { size: number }) {
  const f = useCurrentFrame();
  const meet = rise(f, 4, 16);
  const logo = calm(f, 14);
  const name = rise(f, 26, 16);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.28,
        color: C.text,
        letterSpacing: -size * 0.02,
      }}
    >
      <span
        style={{ fontWeight: 300, opacity: meet, transform: `translateY(${(1 - meet) * 30}px)` }}
      >
        Meet
      </span>
      <Img
        src={staticFile('brand/uma-logo.svg')}
        style={{
          width: size * 1.05,
          height: size * 1.05,
          transform: `scale(${logo}) rotate(${(1 - logo) * -40}deg)`,
          opacity: Math.min(1, logo * 1.5),
        }}
      />
      <span
        style={{
          fontWeight: 700,
          color: C.green,
          opacity: name,
          transform: `translateY(${(1 - name) * 30}px)`,
        }}
      >
        Uma
      </span>
    </div>
  );
}
