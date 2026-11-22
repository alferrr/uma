/**
 * Placeholder imagery drawn in SVG (see product.md §7).
 * Swap these for the team's own farm photos when they are ready.
 */
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useId, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** Gradient ids must be unique per page on web, where several SVGs share one DOM. */
function useGradientIds<T extends string>(...names: T[]): Record<T, string> {
  const base = useId().replace(/[^a-zA-Z0-9]/g, '');
  return Object.fromEntries(names.map((n) => [n, `${n}${base}`])) as Record<T, string>;
}

/** Takes the caller's position style; the Svg fills it. */
function Frame({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return <View style={[styles.frame, style]}>{children}</View>;
}

const styles = StyleSheet.create({ frame: { flex: 1, alignSelf: 'stretch', overflow: 'hidden' } });

type ArtProps = {
  style?: StyleProp<ViewStyle>;
  width?: number | string;
  height?: number | string;
};

const ROW_GREENS = ['#1E8A3A', '#2FA34A', '#17742F', '#3BAE55', '#22913F', '#5FB86A', '#146A2B'];

/** Crop rows running toward a vanishing point, fading into the page background. */
export function FieldRows({
  style,
  width = '100%',
  height = '100%',
  dark = false,
}: ArtProps & { dark?: boolean }) {
  const ids = useGradientIds('fade', 'shade', 'sun');
  const vx = 200;
  const vy = 0;
  const count = 28;
  const spanLeft = -700;
  const spanRight = 1100;
  const step = (spanRight - spanLeft) / count;

  return (
    <Frame style={style}>
      <Svg width={width} height={height} viewBox="0 0 400 640" preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id={ids.fade} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={dark ? '#0B2A16' : '#F4F4F1'} stopOpacity={1} />
            <Stop offset="0.3" stopColor={dark ? '#0B2A16' : '#F4F4F1'} stopOpacity={0.95} />
            <Stop offset="0.5" stopColor={dark ? '#123A20' : '#E9EFE2'} stopOpacity={0.55} />
            <Stop offset="0.75" stopColor={dark ? '#123A20' : '#E9EFE2'} stopOpacity={0.1} />
            <Stop offset="1" stopColor={dark ? '#0B2A16' : '#F4F4F1'} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id={ids.shade} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.6" stopColor="#06361A" stopOpacity={0} />
            <Stop offset="1" stopColor="#06361A" stopOpacity={0.55} />
          </LinearGradient>
          <RadialGradient id={ids.sun} cx="0.72" cy="0.55" r="0.45">
            <Stop offset="0" stopColor="#F3E6A8" stopOpacity={0.45} />
            <Stop offset="1" stopColor="#F3E6A8" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={400} height={640} fill="#2E9C48" />
        {Array.from({ length: count }, (_, i) => {
          const x1 = spanLeft + i * step;
          const x2 = x1 + step;
          return (
            <Polygon
              key={i}
              points={`${vx},${vy} ${x1},640 ${x2},640`}
              fill={ROW_GREENS[i % ROW_GREENS.length]}
            />
          );
        })}
        {Array.from({ length: count + 1 }, (_, i) => (
          <Line
            key={`l${i}`}
            x1={vx}
            y1={vy}
            x2={spanLeft + i * step}
            y2={640}
            stroke="#7A5A2E"
            strokeOpacity={0.25}
            strokeWidth={1}
          />
        ))}
        <Rect x={0} y={0} width={400} height={640} fill={`url(#${ids.sun})`} />
        <Rect x={0} y={0} width={400} height={640} fill={`url(#${ids.shade})`} />
        <Rect x={0} y={0} width={400} height={640} fill={`url(#${ids.fade})`} />
      </Svg>
    </Frame>
  );
}

/** Top-down green crop rows, as seen from a drone. */
export function GreenStripes({ style, width = '100%', height = '100%' }: ArtProps) {
  const ids = useGradientIds('vignette', 'light');
  const lines = 70;
  return (
    <Frame style={style}>
      <Svg width={width} height={height} viewBox="0 0 400 350" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id={ids.vignette} cx="0.5" cy="0.45" r="0.75">
            <Stop offset="0.35" stopColor="#000" stopOpacity={0} />
            <Stop offset="1" stopColor="#03230F" stopOpacity={0.55} />
          </RadialGradient>
          <LinearGradient id={ids.light} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#5DCB6F" stopOpacity={0.25} />
            <Stop offset="1" stopColor="#5DCB6F" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={400} height={350} fill="#1F8E36" />
        {Array.from({ length: lines }, (_, i) => (
          <Rect
            key={i}
            x={0}
            y={i * 5}
            width={400}
            height={2.2}
            fill={i % 3 === 0 ? '#16722A' : '#24993D'}
            opacity={0.9}
          />
        ))}
        <Rect x={0} y={0} width={400} height={350} fill={`url(#${ids.light})`} />
        {/* irrigation path */}
        <Rect x={197} y={0} width={2.4} height={350} fill="#6B3E1E" opacity={0.75} />
        <Rect x={0} y={0} width={400} height={350} fill={`url(#${ids.vignette})`} />
      </Svg>
    </Frame>
  );
}

/** Golden-hour wheat field. */
export function SunsetField({ style, width = '100%', height = '100%' }: ArtProps) {
  const ids = useGradientIds('sky', 'glow');
  const stalks = [
    { x: 14, h: 120, s: 1 },
    { x: 40, h: 95, s: 0.8 },
    { x: 62, h: 70, s: 0.6 },
    { x: 290, h: 80, s: 0.65 },
    { x: 330, h: 140, s: 1.1 },
    { x: 352, h: 150, s: 1.15 },
    { x: 378, h: 125, s: 1 },
    { x: 395, h: 100, s: 0.85 },
    { x: 250, h: 55, s: 0.5 },
    { x: 100, h: 50, s: 0.45 },
  ];
  return (
    <Frame style={style}>
      <Svg width={width} height={height} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2B2418" />
            <Stop offset="0.45" stopColor="#8A6A33" />
            <Stop offset="0.7" stopColor="#C79A4C" />
            <Stop offset="1" stopColor="#6E5427" />
          </LinearGradient>
          <RadialGradient id={ids.glow} cx="0.55" cy="0.62" r="0.4">
            <Stop offset="0" stopColor="#FFF4D6" stopOpacity={0.95} />
            <Stop offset="0.3" stopColor="#F7D48A" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#F7D48A" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={400} height={300} fill={`url(#${ids.sky})`} />
        <Rect width={400} height={300} fill={`url(#${ids.glow})`} />
        <Rect x={0} y={240} width={400} height={60} fill="#5A431D" opacity={0.6} />
        {stalks.map(({ x, h, s }) => {
          const top = 300 - h;
          return (
            <G key={x} opacity={0.55 + s * 0.3}>
              <Line x1={x} y1={300} x2={x} y2={top} stroke="#E6C27A" strokeWidth={1.5 * s} />
              {Array.from({ length: 6 }, (_, k) => (
                <G key={k}>
                  <Ellipse
                    cx={x - 3 * s}
                    cy={top + 6 * s + k * 7 * s}
                    rx={2.6 * s}
                    ry={4 * s}
                    fill="#E9C77F"
                  />
                  <Ellipse
                    cx={x + 3 * s}
                    cy={top + 9 * s + k * 7 * s}
                    rx={2.6 * s}
                    ry={4 * s}
                    fill="#D9B263"
                  />
                </G>
              ))}
            </G>
          );
        })}
        <Circle cx={220} cy={186} r={8} fill="#FFF8E6" opacity={0.9} />
      </Svg>
    </Frame>
  );
}

type TileTone = 'green' | 'grey' | 'yellow' | 'brown' | 'dark';

const TILE: Record<TileTone, { base: string; line: string; alt: string }> = {
  green: { base: '#2A9A41', line: '#1F7E33', alt: '#35AB4D' },
  dark: { base: '#1C6F30', line: '#145A26', alt: '#237D38' },
  grey: { base: '#A9AFA4', line: '#8E948A', alt: '#B9BEB4' },
  yellow: { base: '#C9B24A', line: '#A8922F', alt: '#D9C35B' },
  brown: { base: '#8C6038', line: '#6F4826', alt: '#9C6E43' },
};

/** Top-down crop plot with vertical rows, tinted by zone status. */
export function CropTile({ tone, style }: { tone: TileTone; style?: StyleProp<ViewStyle> }) {
  const c = TILE[tone];
  return (
    <Frame style={style}>
      <Svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="none">
        <Rect width={200} height={200} fill={c.base} />
        {Array.from({ length: 40 }, (_, i) => (
          <Rect
            key={i}
            x={i * 5}
            y={0}
            width={2.2}
            height={200}
            fill={i % 3 === 0 ? c.line : c.alt}
            opacity={0.85}
          />
        ))}
      </Svg>
    </Frame>
  );
}

/** Close aerial view of one zone: rows, a path and a yellow strip (Zone details). */
export function ZoneAerial({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Frame style={style}>
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <Rect width={400} height={800} fill="#2A9A41" />
        {Array.from({ length: 80 }, (_, i) => (
          <Rect
            key={i}
            x={i * 5}
            y={0}
            width={2.2}
            height={800}
            fill={i % 3 === 0 ? '#1F7E33' : '#35AB4D'}
            opacity={0.85}
          />
        ))}
        <Rect x={0} y={300} width={400} height={50} fill="#A19A6E" />
        <Rect x={0} y={322} width={400} height={3} fill="#6E6748" opacity={0.6} />
        <Rect x={0} y={350} width={400} height={30} fill="#9BA94A" />
        <Rect x={0} y={380} width={400} height={70} fill="#D2B94E" />
        <Rect x={0} y={450} width={400} height={50} fill="#9BA94A" />
        {Array.from({ length: 80 }, (_, i) => (
          <Rect
            key={`y${i}`}
            x={i * 5}
            y={350}
            width={1.6}
            height={150}
            fill="#7E8B33"
            opacity={0.35}
          />
        ))}
      </Svg>
    </Frame>
  );
}
