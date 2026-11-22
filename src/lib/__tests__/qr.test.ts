import { describe, expect, it } from '@jest/globals';
import createQr from 'qrcode-generator';

import { parseZoneLink, qrPath, qrSvg, zoneLink } from '../qr';

const ID = 'e6c46aa1-96cb-4ab8-9a4b-21b44570c8fd';

describe('zone links', () => {
  it('round-trips a zone id', () => {
    expect(parseZoneLink(zoneLink(ID))).toBe(ID);
  });
  it('accepts a bare id, upper case, and surrounding spaces', () => {
    expect(parseZoneLink(` ${ID.toUpperCase()} `)).toBe(ID);
  });
  it('accepts an Expo Go link', () => {
    expect(parseZoneLink(`exp://192.168.1.5:8081/--/zone/${ID}`)).toBe(ID);
  });
  it('rejects anything that is not an Uma zone', () => {
    expect(parseZoneLink('https://example.com')).toBeNull();
    expect(parseZoneLink('uma://zone/not-an-id')).toBeNull();
    expect(parseZoneLink('uma://farm/' + ID)).toBeNull();
    expect(parseZoneLink('')).toBeNull();
  });
});

describe('qrPath', () => {
  it('draws exactly the dark modules of the code, inside a 4-module margin', () => {
    const text = zoneLink(ID);
    const { size, d } = qrPath(text);

    const qr = createQr(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    expect(size).toBe(n + 8);

    // Rebuild the grid from the path and compare it module by module.
    const drawn = new Set<string>();
    for (const [, x, y, w] of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
      for (let i = 0; i < Number(w); i++) drawn.add(`${Number(y) - 4},${Number(x) - 4 + i}`);
    }
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) expect(drawn.has(`${r},${c}`)).toBe(qr.isDark(r, c));
    }
  });
});

describe('qrSvg', () => {
  it('makes a square SVG at the asked size', () => {
    const svg = qrSvg(zoneLink(ID), 300);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('width="300" height="300"');
  });
});
