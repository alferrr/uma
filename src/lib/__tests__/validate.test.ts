import { describe, expect, it } from '@jest/globals';

import { isEmail, isEmailOrPhone, isPhMobile } from '../validate';

describe('isEmail', () => {
  it('accepts normal addresses and trims spaces', () => {
    expect(isEmail('grower@example.com')).toBe(true);
    expect(isEmail('  grower@example.com ')).toBe(true);
  });
  it('rejects things that are not emails', () => {
    expect(isEmail('grower')).toBe(false);
    expect(isEmail('grower@example')).toBe(false);
    expect(isEmail('a b@example.com')).toBe(false);
  });
});

describe('isPhMobile', () => {
  it('accepts 09, 639 and +639 numbers, with spaces or dashes', () => {
    expect(isPhMobile('09171234567')).toBe(true);
    expect(isPhMobile('639171234567')).toBe(true);
    expect(isPhMobile('+639171234567')).toBe(true);
    expect(isPhMobile('0917-123-4567')).toBe(true);
    expect(isPhMobile('0917 123 4567')).toBe(true);
  });
  it('rejects landlines and wrong lengths', () => {
    expect(isPhMobile('0321234567')).toBe(false);
    expect(isPhMobile('0917123456')).toBe(false);
    expect(isPhMobile('091712345678')).toBe(false);
  });
});

describe('isEmailOrPhone', () => {
  it('accepts either', () => {
    expect(isEmailOrPhone('grower@example.com')).toBe(true);
    expect(isEmailOrPhone('09171234567')).toBe(true);
    expect(isEmailOrPhone('hello')).toBe(false);
  });
});
