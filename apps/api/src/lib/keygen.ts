/**
 * License key generator. Uses cryptographically secure randomness. Format:
 *
 *   CS-<tier-letter>-<8 alnum>-<8 alnum>
 *
 * Example: CS-G-A7K2F9Q3-M8N4XY5L
 *
 * The tier letter is a soft hint for humans reading logs; the authoritative
 * tier for any key is always resolved from the licenses table by lookup.
 * The alnum blocks use uppercase A-Z (no lowercase, no digits that look
 * like letters: 0, 1 excluded to avoid O/0 and I/1 confusion in handwritten
 * copies) for 32^16 bits of entropy per key.
 */

import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, no 0/O/1/I

function block(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}

export function generateLicenseKey(tier: 'free' | 'starter' | 'growth' | 'agency'): string {
  const letter: Record<string, string> = {
    free: 'F',
    starter: 'S',
    growth: 'G',
    agency: 'A',
  };
  return `CS-${letter[tier] ?? 'X'}-${block(8)}-${block(8)}`;
}

const KEY_RE = /^CS-[FSGA]-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

export function isValidKeyFormat(key: string): boolean {
  return KEY_RE.test(key);
}
