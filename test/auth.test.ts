import { describe, expect, it } from 'vitest';
import { parseUserId } from '../src/middleware/auth';

describe('parseUserId', () => {
  it('accepts positive decimal ids', () => {
    expect(parseUserId('1')).toBe('1');
    expect(parseUserId('42')).toBe('42');
  });

  it('accepts ids above Number.MAX_SAFE_INTEGER', () => {
    expect(parseUserId('9007199254740992')).toBe('9007199254740992');
  });

  it('rejects non-numeric values', () => {
    expect(parseUserId('not-a-user')).toBeUndefined();
    expect(parseUserId('1abc')).toBeUndefined();
    expect(parseUserId('')).toBeUndefined();
  });

  it('rejects zero and negative ids', () => {
    expect(parseUserId('0')).toBeUndefined();
    expect(parseUserId('-1')).toBeUndefined();
  });
});
