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
