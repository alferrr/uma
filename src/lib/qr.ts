/**
 * Zone QR codes. Each code holds a link like `uma://zone/<zone id>`, so the
 * in-app scanner can read it and the phone's own camera app opens Uma there.
 * No device dependencies, so this is unit tested.
 */
import createQr from 'qrcode-generator';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function zoneLink(zoneId: string) {
  return `uma://zone/${zoneId}`;
}

/**
 * The zone id in a scanned code, or null if it is not an Uma zone code.
 * Accepts `uma://zone/<id>`, an Expo Go link ending in `/--/zone/<id>`, or a bare id.
 */
export function parseZoneLink(data: string): string | null {
  const text = data.trim();
  if (UUID.test(text)) return text.toLowerCase();
  const match = text.match(/^(?:uma:\/\/|exps?:\/\/.+\/--\/)zone\/([^/?#]+)/i);
  const id = match?.[1];
  return id && UUID.test(id) ? id.toLowerCase() : null;
}

/** The QR code as one SVG path of 1×1 squares, with a 4-module quiet zone. */
export function qrPath(text: string): { size: number; d: string } {
  const qr = createQr(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const margin = 4;
  let d = '';
  for (let row = 0; row < n; row++) {
    let col = 0;
    while (col < n) {
      if (!qr.isDark(row, col)) {
        col++;
        continue;
      }
      // Join dark squares in a row into one rectangle to keep the path short.
      let run = 1;
      while (col + run < n && qr.isDark(row, col + run)) run++;
      d += `M${col + margin} ${row + margin}h${run}v1h-${run}z`;
      col += run;
    }
  }
  return { size: n + margin * 2, d };
}

/** Standalone SVG markup, used in the print page. */
export function qrSvg(text: string, px: number) {
  const { size, d } = qrPath(text);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" ` +
    `viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`
  );
}
