import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

/** Uma mark: a sprout growing from the soil, inside a ring. */
export function LeafLogo({ size = 56, color = '#16923F', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Circle cx={28} cy={28} r={26} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M28 40V22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path
        d="M28 30c-6.5 0-10-3.6-10-9.5 6.5 0 10 3.6 10 9.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M28 27c0-5.9 3.5-9.5 10-9.5 0 5.9-3.5 9.5-10 9.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path d="M18 40h20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ArrowRight({ size = 22, color = '#16923F', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12h15M13 6l6 6-6 6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronLeft({ size = 22, color = '#FFFFFF', strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5l-7 7 7 7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Chevrons({ color = 'rgba(255,255,255,0.85)' }: { color?: string }) {
  return (
    <Svg width={44} height={14} viewBox="0 0 44 14" fill="none">
      {[2, 17, 32].map((x) => (
        <Path
          key={x}
          d={`M${x} 2l5 5-5 5`}
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

export function WifiIcon({ size = 16, color = '#6E6E6A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.6 16a5 5 0 0 1 6.8 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={19.3} r={1.3} fill={color} />
    </Svg>
  );
}

type StrokeIconProps = IconProps & { d: string };

function StrokeIcon({ d, size = 20, color = '#141414', strokeWidth = 1.8 }: StrokeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const CheckIcon = (p: IconProps) => <StrokeIcon {...p} d="M5 12.5l4.5 4.5L19 7.5" />;
export const DropIcon = (p: IconProps) => (
  <StrokeIcon {...p} d="M12 3.5c3.6 4.3 5.5 7.4 5.5 10a5.5 5.5 0 0 1-11 0c0-2.6 1.9-5.7 5.5-10Z" />
);
export const WarningIcon = (p: IconProps) => (
  <StrokeIcon {...p} d="M12 4 2.8 19.5h18.4L12 4ZM12 10v4.5M12 17.2v.1" />
);
export const QuestionIcon = (p: IconProps) => (
  <StrokeIcon
    {...p}
    d="M9.2 9a2.9 2.9 0 1 1 4 2.7c-.8.4-1.2 1-1.2 1.8v.5M12 17.2v.1M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z"
  />
);
export const ClockIcon = (p: IconProps) => (
  <StrokeIcon {...p} d="M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
);
export const SproutIcon = (p: IconProps) => (
  <StrokeIcon
    {...p}
    d="M12 20v-8M12 12c-4 0-6-2.2-6-5.8 4 0 6 2.2 6 5.8ZM12 10c0-3.6 2-5.8 6-5.8 0 3.6-2 5.8-6 5.8Z"
  />
);
export const SearchIcon = (p: IconProps) => (
  <StrokeIcon {...p} d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14ZM16.5 16.5 20 20" />
);
export const PinIcon = (p: IconProps) => (
  <StrokeIcon
    {...p}
    d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11ZM12 12.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z"
  />
);
export const ArrowUpRight = (p: IconProps) => <StrokeIcon {...p} d="M7 17 17 7M9 7h8v8" />;
export const ChevronRight = (p: IconProps) => <StrokeIcon {...p} d="M9 5l7 7-7 7" />;
export const PlusIcon = (p: IconProps) => <StrokeIcon {...p} d="M12 5v14M5 12h14" />;
export const MinusIcon = (p: IconProps) => <StrokeIcon {...p} d="M5 12h14" />;
export const ChevronDown = (p: IconProps) => <StrokeIcon {...p} d="M6 9l6 6 6-6" />;

export const SunIcon = (p: IconProps) => (
  <StrokeIcon
    {...p}
    d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"
  />
);
export const CloudIcon = (p: IconProps) => (
  <StrokeIcon
    {...p}
    d="M7.5 18.5a4.5 4.5 0 0 1-.4-8.98A6 6 0 0 1 18.4 10.4 4.1 4.1 0 0 1 17.5 18.5h-10Z"
  />
);
export const PartlyCloudyIcon = (p: IconProps) => (
  <StrokeIcon
    {...p}
    d="M8 3v1.5M3.3 5.3l1 1M2 10h1.5M12.7 5.3l-1 1M8.5 20a3.5 3.5 0 0 1-.3-7A4.8 4.8 0 0 1 17.5 13.5 3.3 3.3 0 0 1 17 20H8.5Z"
  />
);
export const RainIcon = (p: IconProps) => (
  <StrokeIcon
    {...p}
    d="M7.5 15a4 4 0 0 1-.3-8A5.3 5.3 0 0 1 17.6 8 3.6 3.6 0 0 1 17 15H7.5ZM8 18.5l-1 2M12 18.5l-1 2M16 18.5l-1 2"
  />
);
export const StormIcon = (p: IconProps) => (
  <StrokeIcon
    {...p}
    d="M7.5 14a4 4 0 0 1-.3-8A5.3 5.3 0 0 1 17.6 7 3.6 3.6 0 0 1 17 14M13 12.5l-2.5 3.5h3l-2 3.5"
  />
);
export const FogIcon = (p: IconProps) => <StrokeIcon {...p} d="M4 8h16M6 12h12M4 16h16M8 20h8" />;
export const WindIcon = (p: IconProps) => (
  <StrokeIcon {...p} d="M3 9h10a2.5 2.5 0 1 0-2.5-2.5M3 15h14a2.5 2.5 0 1 1-2.5 2.5M3 12h7" />
);
export const UmbrellaIcon = (p: IconProps) => (
  <StrokeIcon {...p} d="M3 12a9 9 0 0 1 18 0H3ZM12 12v6.5a2 2 0 0 1-4 0" />
);
export const MoonIcon = (p: IconProps) => (
  <StrokeIcon {...p} d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
);
