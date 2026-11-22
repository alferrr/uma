import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { qrPath } from '@/lib/qr';

/** A scannable QR code, black on white with its quiet zone. */
export function QrCode({ value, size }: { value: string; size: number }) {
  const { size: n, d } = useMemo(() => qrPath(value), [value]);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${n} ${n}`}>
      <Rect width={n} height={n} fill="#FFFFFF" />
      <Path d={d} fill="#000000" />
    </Svg>
  );
}
