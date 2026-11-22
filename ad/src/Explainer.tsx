import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { AnimatedText } from './components/AnimatedText';
import { DeviceFrame } from './components/DeviceFrame';
import { EndCard } from './components/EndCard';
import { Callout, Highlight, ScanLine, type Rect } from './components/Highlight';
import { LogoReveal } from './components/LogoReveal';
import { Scene } from './components/Scene';
import { calm, fall, rise } from './ease';
import { loadFonts } from './fonts';
import { C, FONT, type Layout } from './theme';

loadFonts();

/** Spots in the real screenshots (screenshot pixels) that the ad points at. */
const SPOT: Record<string, Rect> = {
  scanWindow: { x: 255, y: 1035, w: 752, h: 752 },
  zoneMoisture: { x: 800, y: 1445, w: 365, h: 115 },
  checkinMoisture: { x: 440, y: 1700, w: 770, h: 450 },
  mapSummary: { x: 40, y: 2080, w: 1180, h: 515 },
  homeFirstZone: { x: 60, y: 2600, w: 1140, h: 136 },
  profileSync: { x: 75, y: 2325, w: 1110, h: 195 },
};

/** Beats in order. Neighbouring beats overlap by OVERLAP frames for a soft crossfade. */
const OVERLAP = 10;
const BEATS = [
  { id: 'problem', frames: 140 },
  { id: 'meet', frames: 90 },
  { id: 'scan', frames: 200 },
  { id: 'moisture', frames: 150 },
  { id: 'checkin', frames: 190 },
  { id: 'farm', frames: 180 },
  { id: 'offline', frames: 130 },
  { id: 'languages', frames: 90 },
  { id: 'end', frames: 130 },
] as const;

export const TOTAL_FRAMES =
  BEATS.reduce((sum, b) => sum + b.frames, 0) - OVERLAP * (BEATS.length - 1);

type Dims = {
  layout: Layout;
  text: number;
  screen: number;
  twoUp: number;
};

const DIMS: Record<Layout, Dims> = {
  landscape: { layout: 'landscape', text: 84, screen: 380, twoUp: 330 },
  portrait: { layout: 'portrait', text: 76, screen: 520, twoUp: 400 },
};

/** Stack children on top of each other (for lines that swap in place). */
const Stack = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ display: 'grid', ...style }}>
    {Array.isArray(children)
      ? children.map((c, i) => (
          <div key={i} style={{ gridArea: '1 / 1' }}>
            {c}
          </div>
        ))
      : children}
  </div>
);

/** Text column and phone area, side by side (16:9) or stacked (9:16). */
function Split({ d, text, phone }: { d: Dims; text: ReactNode; phone: ReactNode }) {
  if (d.layout === 'landscape') {
    return (
      <AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            left: 150,
            top: 0,
            bottom: 0,
            width: 720,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 40,
          }}
        >
          {text}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 900,
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {phone}
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top: 150,
          height: 400,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 30,
        }}
      >
        {text}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 590,
          bottom: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {phone}
      </div>
    </AbsoluteFill>
  );
}

/** Phone rising from below into place, like the reference. */
function Rise({ children, delay = 0, still = false }: { children: ReactNode; delay?: number; still?: boolean }) {
  const f = useCurrentFrame();
  const p = still ? 1 : calm(f, delay);
  return (
    <div style={{ position: 'relative', transform: `translateY(${(1 - p) * 320}px)`, opacity: Math.min(1, p * 1.4) }}>
      {children}
    </div>
  );
}

const align = (d: Dims) => (d.layout === 'landscape' ? 'left' : 'center');

// ───────────────────────── beats ─────────────────────────

function Problem({ d }: { d: Dims }) {
  const size = d.layout === 'landscape' ? 104 : 88;
  return (
    <Scene duration={140}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <Stack>
          <AnimatedText text="Plants dry out|**unnoticed.**" start={6} exit={62} size={size} align="center" />
          <AnimatedText text="Which zone?|**Checked when?**" start={74} size={size} align="center" />
        </Stack>
      </AbsoluteFill>
    </Scene>
  );
}

function Meet({ d }: { d: Dims }) {
  return (
    <Scene duration={90} pushIn>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <LogoReveal size={d.layout === 'landscape' ? 150 : 120} />
      </AbsoluteFill>
    </Scene>
  );
}

/** The real printed-label part of the QR screen, cropped from the screenshot. */
function QrLabel({ width, start, scanAt }: { width: number; start: number; scanAt: number }) {
  const f = useCurrentFrame();
  const crop = { x: 75, y: 915, w: 1110, h: 995 };
  const k = width / crop.w;
  const t = rise(f, start, 18);
  const local = f - scanAt;
  const sweep = local >= 0 && local <= 52 ? (local % 26) / 26 : -1;
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height: crop.h * k,
        borderRadius: 28,
        overflow: 'hidden',
        background: C.white,
        boxShadow: '0 30px 70px rgba(20,20,20,0.16)',
        opacity: t,
        transform: `translateX(${(1 - t) * -60}px) rotate(-5deg)`,
      }}
    >
      <Img
        src={staticFile('screens/qr.png')}
        style={{ position: 'absolute', width: 1260 * k, left: -crop.x * k, top: -crop.y * k }}
      />
      {sweep >= 0 && (
        <div
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            top: `${10 + sweep * 62}%`,
            height: 4,
            borderRadius: 2,
            background: C.green,
            boxShadow: `0 0 18px ${C.green}`,
          }}
        />
      )}
    </div>
  );
}

function Scan({ d }: { d: Dims }) {
  const label = d.layout === 'landscape' ? 300 : 250;
  return (
    <Scene duration={200}>
      <Split
        d={d}
        text={
          <Stack>
            <AnimatedText text="Scan the zone's|**QR code.**" start={18} exit={112} size={d.text} align={align(d)} />
            <AnimatedText text="The zone|**opens.**" start={126} size={d.text} align={align(d)} />
          </Stack>
        }
        phone={
          <Rise delay={2}>
            <DeviceFrame src="scan.png" next="zone.png" swapAt={118} width={d.screen}>
              <ScanLine rect={SPOT.scanWindow} start={58} />
            </DeviceFrame>
            <div style={{ position: 'absolute', left: -label * 0.78, top: '40%' }}>
              <QrLabel width={label} start={34} scanAt={58} />
            </div>
          </Rise>
        }
      />
    </Scene>
  );
}

function Moisture({ d }: { d: Dims }) {
  const callout = (
    <Callout value={54} suffix="%" label="Soil moisture" note="Sample reading" start={30} size={d.layout === 'landscape' ? 1 : 0.85} />
  );
  return (
    <Scene duration={150}>
      <Split
        d={d}
        text={
          <>
            <AnimatedText text="See its|**soil moisture.**" start={8} size={d.text} align={align(d)} />
            {d.layout === 'landscape' && callout}
          </>
        }
        phone={
          <Rise still>
            <DeviceFrame src="zone.png" width={d.screen}>
              <Highlight rect={SPOT.zoneMoisture} start={22} radius={30} />
            </DeviceFrame>
            {d.layout === 'portrait' && (
              <div style={{ position: 'absolute', left: -150, top: 60 }}>{callout}</div>
            )}
          </Rise>
        }
      />
    </Scene>
  );
}

function CheckIn({ d }: { d: Dims }) {
  return (
    <Scene duration={190}>
      <Split
        d={d}
        text={
          <Stack>
            <AnimatedText text="Moisture already|**filled in.**" start={10} exit={108} size={d.text} align={align(d)} />
            <AnimatedText text="Saved in a|**few taps.**" start={122} size={d.text} align={align(d)} />
          </Stack>
        }
        phone={
          <Rise delay={0}>
            <DeviceFrame src="checkin.png" next="saved.png" swapAt={114} width={d.screen}>
              <Highlight rect={SPOT.checkinMoisture} start={34} end={104} radius={60} />
            </DeviceFrame>
          </Rise>
        }
      />
    </Scene>
  );
}

function Farm({ d }: { d: Dims }) {
  const f = useCurrentFrame();
  const second = rise(f, 10, 18);
  const phones = (
    <div style={{ display: 'flex', gap: d.layout === 'landscape' ? 40 : 30, alignItems: 'center' }}>
      <Rise delay={0}>
        <DeviceFrame src="map.png" width={d.twoUp}>
          <Highlight rect={SPOT.mapSummary} start={46} end={100} radius={90} />
        </DeviceFrame>
      </Rise>
      <div style={{ opacity: second, transform: `translateY(${(1 - second) * 60}px)` }}>
        <DeviceFrame src="home.png" width={d.twoUp}>
          <Highlight rect={SPOT.homeFirstZone} start={118} radius={60} />
        </DeviceFrame>
      </div>
    </div>
  );
  return (
    <Scene duration={180}>
      {d.layout === 'landscape' ? (
        <AbsoluteFill>
          <div style={{ position: 'absolute', left: 150, top: 0, bottom: 0, width: 640, display: 'flex', alignItems: 'center' }}>
            <Stack>
              <AnimatedText text="The whole farm|**at a glance.**" start={8} exit={104} size={d.text} />
              <AnimatedText text="Zones needing|a visit **first.**" start={116} size={d.text} />
            </Stack>
          </div>
          <div style={{ position: 'absolute', left: 820, right: 40, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {phones}
          </div>
        </AbsoluteFill>
      ) : (
        <Split
          d={d}
          text={
            <Stack>
              <AnimatedText text="The whole farm|**at a glance.**" start={8} exit={104} size={d.text} align="center" />
              <AnimatedText text="Zones needing|a visit **first.**" start={116} size={d.text} align="center" />
            </Stack>
          }
          phone={phones}
        />
      )}
    </Scene>
  );
}

function Offline({ d }: { d: Dims }) {
  return (
    <Scene duration={130}>
      <Split
        d={d}
        text={
          <Stack>
            <AnimatedText text="Works|**offline.**" start={8} exit={64} size={d.text} align={align(d)} />
            <AnimatedText text="Syncs when|**back online.**" start={76} size={d.text} align={align(d)} />
          </Stack>
        }
        phone={
          <Rise delay={0}>
            <DeviceFrame src="profile-pending.png" next="profile-synced.png" swapAt={70} width={d.screen}>
              <Highlight rect={SPOT.profileSync} start={22} radius={70} />
            </DeviceFrame>
          </Rise>
        }
      />
    </Scene>
  );
}

function Languages({ d }: { d: Dims }) {
  const f = useCurrentFrame();
  const size = d.layout === 'landscape' ? 1 : 0.9;
  const chips = ['Cebuano', 'English', 'Tagalog'];
  return (
    <Scene duration={90}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 56 * size }}>
        <AnimatedText text="In **three languages.**" start={6} size={d.layout === 'landscape' ? 96 : 84} align="center" />
        <div style={{ display: 'flex', gap: 22 * size, flexWrap: 'wrap', justifyContent: 'center' }}>
          {chips.map((c, i) => {
            const t = rise(f, 24 + i * 8, 16);
            const active = c === 'English';
            return (
              <div
                key={c}
                style={{
                  fontFamily: FONT,
                  fontSize: 44 * size,
                  fontWeight: 500,
                  padding: `${20 * size}px ${44 * size}px`,
                  borderRadius: 999,
                  background: active ? C.orange : C.panel,
                  color: active ? C.white : C.text,
                  opacity: t,
                  transform: `translateY(${(1 - t) * 30}px)`,
                }}
              >
                {c}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

function End({ d }: { d: Dims }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: rise(f, 0, 8) * fall(f, 200, 10) }}>
      <EndCard scale={d.layout === 'landscape' ? 1 : 0.95} />
    </AbsoluteFill>
  );
}

const RENDER: Record<(typeof BEATS)[number]['id'], (p: { d: Dims }) => React.JSX.Element> = {
  problem: Problem,
  meet: Meet,
  scan: Scan,
  moisture: Moisture,
  checkin: CheckIn,
  farm: Farm,
  offline: Offline,
  languages: Languages,
  end: End,
};

export function Explainer({ layout }: { layout: Layout }) {
  const d = DIMS[layout];
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.white }}>
      {BEATS.map((b) => {
        const Beat = RENDER[b.id];
        const seq = (
          <Sequence key={b.id} from={from} durationInFrames={b.frames} name={b.id}>
            <Beat d={d} />
          </Sequence>
        );
        from += b.frames - OVERLAP;
        return seq;
      })}
    </AbsoluteFill>
  );
}

/** Start frame of each beat, for stills and checks. */
export const BEAT_STARTS = (() => {
  let from = 0;
  return BEATS.map((b) => {
    const s = { id: b.id, from, frames: b.frames };
    from += b.frames - OVERLAP;
    return s;
  });
})();
