import { interpolate, interpolateColors, useCurrentFrame } from 'remotion';

import { easeIn, easeOut } from '../ease';
import { C, FONT } from '../theme';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

type Props = {
  /** `**bold green**` words, `|` for a line break. */
  text: string;
  start: number;
  exit?: number;
  size: number;
  stagger?: number;
  align?: 'center' | 'left' | 'right';
};

/**
 * The reference's kinetic type: each word grows from tiny to oversized and
 * green (raised a little), then settles to size and near-black. Font size, not
 * transform, animates, so the line re-centres live as words arrive. Exit: words
 * in order turn light grey, shrink and drift up-left.
 */
export function WordPop({ text, start, exit, size, stagger = 4, align = 'center' }: Props) {
  const f = useCurrentFrame();
  const tokens: { w: string; strong: boolean }[] = [];
  let strong = false;
  for (const raw of text.replace(/\|/g, ' | ').split(/\s+/).filter(Boolean)) {
    let w = raw;
    if (w.startsWith('**')) {
      strong = true;
      w = w.slice(2);
    }
    const closes = w.endsWith('**');
    if (closes) w = w.slice(0, -2);
    tokens.push({ w, strong });
    if (closes) strong = false;
  }

  let n = 0;
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 600,
        letterSpacing: -size * 0.015,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        justifyContent: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end',
        textAlign: align,
        lineHeight: 1.15,
        height: size * 1.15 * (text.split('|').length),
        alignContent: 'center',
      }}
    >
      {tokens.map(({ w, strong: s }, i) => {
        if (w === '|') return <div key={i} style={{ flexBasis: '100%', height: 0 }} />;
        const k = n++;
        const t = f - (start + k * stagger);
        if (t < 0) return null;
        const scale = interpolate(t, [0, 6, 13], [0.15, 1.32, 1], { easing: easeOut, ...clamp });
        const lift = interpolate(t, [0, 6, 13], [0.1, -0.28, 0], { easing: easeOut, ...clamp });
        const settled = interpolate(t, [5, 13], [0, 1], clamp);
        let color = s ? C.green : interpolateColors(settled, [0, 1], [C.green, C.text]);
        let opacity = interpolate(t, [0, 3], [0, 1], clamp);
        let dx = 0;
        let dy = lift * size;
        let shrink = 1;
        if (exit !== undefined) {
          const e = interpolate(f, [exit + k * 3, exit + k * 3 + 10], [0, 1], { easing: easeIn, ...clamp });
          color = interpolateColors(e, [0, 1], [color, '#C9C9C4']);
          opacity *= 1 - interpolate(e, [0.45, 1], [0, 1], clamp);
          dx = -e * size * 0.35;
          dy -= e * size * 0.3;
          shrink = 1 - e * 0.3;
        }
        return (
          <span
            key={i}
            style={{
              fontSize: size * scale,
              fontWeight: s ? 700 : 500,
              color,
              opacity,
              marginRight: size * 0.24 * Math.min(1, scale),
              display: 'inline-block',
              transform: `translate(${dx}px, ${dy}px) scale(${shrink})`,
              transformOrigin: 'left bottom',
              whiteSpace: 'nowrap',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

/** Letter-by-letter typing, each letter fading from `from` colour to its final colour. */
export function TypeIn({
  text,
  start,
  size,
  color,
  from,
  weight = 700,
  every = 2,
}: {
  text: string;
  start: number;
  size: number;
  color: string;
  from: string;
  weight?: number;
  every?: number;
}) {
  const f = useCurrentFrame();
  return (
    <span style={{ fontFamily: FONT, fontSize: size, fontWeight: weight, letterSpacing: -size * 0.02, whiteSpace: 'nowrap' }}>
      {text.split('').map((ch, i) => {
        const t = f - (start + i * every);
        const o = interpolate(t, [0, 4], [0, 1], clamp);
        const c = interpolateColors(interpolate(t, [2, 12], [0, 1], clamp), [0, 1], [from, color]);
        return (
          <span key={i} style={{ opacity: o, color: c }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}
