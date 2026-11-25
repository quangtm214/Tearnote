import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { bytesToHex, bytesToUtf8, concatBytes, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';

import { randomBytes } from './db';

/**
 * End-to-end encryption of the backup (ADR 0010): what leaves the device is sealed with the account's
 * backup key, which the server only holds wrapped by the password. Pure JS (@noble): Hermes has no WebCrypto.
 */

const NONCE = 24;

/** nonce || XChaCha20-Poly1305 ciphertext. A random 24-byte nonce never repeats in practice. */
export function seal(key: Uint8Array, data: Uint8Array) {
  const nonce = randomBytes(NONCE);
  return concatBytes(nonce, xchacha20poly1305(key, nonce).encrypt(data));
}

/** Throws when the key is wrong or the bytes were changed. */
export const open = (key: Uint8Array, box: Uint8Array) =>
  xchacha20poly1305(key, box.subarray(0, NONCE)).decrypt(box.subarray(NONCE));

export const sealText = (key: Uint8Array, text: string) => bytesToHex(seal(key, utf8ToBytes(text)));
export const openText = (key: Uint8Array, hex: string) => bytesToUtf8(open(key, hexToBytes(hex)));

// N = 2^14 (16 MB): a few seconds in Hermes on a mid-range phone, run only when the password is typed.
// ponytail: stronger N once a native KDF is available (dev client).
export const passwordKey = (password: string, salt: Uint8Array) =>
  scryptAsync(password, salt, { N: 2 ** 14, r: 8, p: 1, dkLen: 32 });

export { bytesToHex, hexToBytes };
