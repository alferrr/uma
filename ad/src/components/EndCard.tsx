import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { calm, easeOut, rise } from '../ease';
import { C, FONT } from '../theme';

/** Like the reference's close: a green dot grows into the logo, then name, tagline, status. */
export function EndCard({ scale }: { scale: number }) {
  const f = useCurrentFrame();
  const dot = interpolate(f, [0, 12, 22], [0, 1, 0], {
    easing: easeOut,
    extrapolateRight: 'clamp',
  });
  const logo = calm(f, 12);
  const name = rise(f, 28, 16);
  const line = rise(f, 40, 16);
  const tag = rise(f, 54, 14);
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 40 * scale,
          height: 40 * scale,
          borderRadius: '50%',
          background: C.green,
          transform: `scale(${dot * 3})`,
          opacity: dot,
        }}
      />
      <Img
        src={staticFile('brand/uma-logo.svg')}
        style={{
          width: 170 * scale,
          height: 170 * scale,
          transform: `scale(${logo})`,
          opacity: logo,
        }}
      />
      <div
        style={{
          marginTop: 26 * scale,
          fontSize: 120 * scale,
          fontWeight: 700,
          color: C.text,
          letterSpacing: -2.4 * scale,
          lineHeight: 1,
          opacity: name,
          transform: `translateY(${(1 - name) * 24}px)`,
        }}
      >
        Uma
      </div>
      <div
        style={{
          marginTop: 20 * scale,
          fontSize: 46 * scale,
          fontWeight: 300,
          color: C.text,
          opacity: line,
          transform: `translateY(${(1 - line) * 20}px)`,
        }}
      >
        Watch every plant. <b style={{ fontWeight: 700, color: C.green }}>Lose less.</b>
      </div>
      <div
        style={{
          marginTop: 34 * scale,
          padding: `${10 * scale}px ${26 * scale}px`,
          borderRadius: 999,
          background: C.panel,
          color: C.muted,
          fontSize: 26 * scale,
          fontWeight: 500,
          letterSpacing: 1.5 * scale,
          textTransform: 'uppercase',
          opacity: tag,
        }}
      >
        Prototype
      </div>
    </AbsoluteFill>
  );
}
