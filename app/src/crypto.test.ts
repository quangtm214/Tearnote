import { open, openText, passwordKey, seal, sealText } from './crypto';

jest.mock('./db', () => ({ randomBytes: (n: number) => crypto.getRandomValues(new Uint8Array(n)) }));

const key = new Uint8Array(32).fill(7);

test('text round-trips and the nonce makes each box different', () => {
  const a = sealText(key, 'khóc 泣いた');
  expect(openText(key, a)).toBe('khóc 泣いた');
  expect(sealText(key, 'khóc 泣いた')).not.toBe(a);
});

test('a wrong key or a changed byte fails to open', () => {
  const box = seal(key, new Uint8Array([1, 2, 3]));
  expect(() => open(new Uint8Array(32), box)).toThrow();
  box[box.length - 1] ^= 1;
  expect(() => open(key, box)).toThrow();
});

test('the password key unwraps the backup key only with the same password', async () => {
  const salt = new Uint8Array(16).fill(1);
  const wrapped = seal(await passwordKey('secret123', salt), key);
  expect(open(await passwordKey('secret123', salt), wrapped)).toEqual(key);
  const other = await passwordKey('secret124', salt);
  expect(() => open(other, wrapped)).toThrow();
});
