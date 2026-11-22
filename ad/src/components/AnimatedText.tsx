import type { CSSProperties } from 'react';
import { interpolateColors, useCurrentFrame } from 'remotion';

import { fall, rise } from '../ease';
import { C, FONT } from '../theme';

type Props = {
  /** Words wrapped in **double stars** are bold green, the rest light near-black. `|` breaks the line. */
  text: string;
  start: number;
  /** Frame the words start leaving; omit to stay. */
  exit?: number;
  size: number;
  align?: 'left' | 'center';
  stagger?: number;
  style?: CSSProperties;
};

/**
 * Word-by-word entrance like the reference: each word rises and fades in, and
 * settles its colour from brand green to its final colour. Exits slide left.
 */
export function AnimatedText({ text, start, exit, size, align = 'left', stagger = 7, style }: Props) {
  const f = useCurrentFrame();
  const words: { w: string; strong: boolean }[] = [];
  let strong = false;
  for (const raw of text.replace(/\|/g, ' | ').split(/\s+/).filter(Boolean)) {
    let w = raw;
    const opens = w.startsWith('**');
    if (opens) w = w.slice(2);
    if (opens) strong = true;
    const closes = w.endsWith('**');
    if (closes) w = w.slice(0, -2);
    words.push({ w, strong });
    if (closes) strong = false;
  }

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: -size * 0.02,
        textAlign: align,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        columnGap: size * 0.26,
        ...style,
      }}
    >
      {words.map(({ w, strong: s }, i) => {
        if (w === '|') return <div key={i} style={{ flexBasis: '100%', height: 0 }} />;
        const t = rise(f, start + i * stagger, 16);
        const out = exit === undefined ? 1 : fall(f, exit + i * 3, 10);
        const settle = rise(f, start + i * stagger + 4, 14);
        const color = s ? C.green : interpolateColors(settle, [0, 1], [C.green, C.text]);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontWeight: s ? 700 : 300,
              color,
              opacity: t * out,
              transform: `translate(${(1 - out) * -28}px, ${(1 - t) * size * 0.35}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}
