import { MAX_COMFORT_TAGS } from './tags';
import { check, comfortDraft, comfortRows, loginForm, myComfortRows, registerForm } from './validation';

// db.ts mở SQLite ngay khi import (qua i18n) — không có trong Jest.
jest.mock('./db', () => ({ getSetting: () => null, setSetting: () => {} }));

const ok = { email: 'a@b.com', password: '123456' };
const draft = { body: 'x'.repeat(20), tags: ['grief'], sourceLang: 'vi' };

describe('form đăng nhập', () => {
  it('email có khoảng trắng hai đầu thì được cắt sạch', () => {
    expect(check(loginForm, { ...ok, email: '  a@b.com ' })).toEqual({ data: ok });
  });

  it('email sai dạng báo emailInvalid', () => {
    for (const email of ['', 'abc', 'a@', '@b.com', 'a b@c.com']) {
      expect(check(loginForm, { ...ok, email })).toEqual({ field: 'email', code: 'emailInvalid' });
    }
  });

  it('mật khẩu 1 ký tự vẫn qua (tài khoản cũ), rỗng báo passwordRequired', () => {
    expect('data' in check(loginForm, { ...ok, password: '1' })).toBe(true);
    expect(check(loginForm, { ...ok, password: '' })).toEqual({ field: 'password', code: 'passwordRequired' });
  });

  it('email có hai dấu @ bị từ chối', () => {
    expect(check(loginForm, { ...ok, email: 'a@@b.com' })).toEqual({ field: 'email', code: 'emailInvalid' });
  });
});

describe('form tạo tài khoản', () => {
  it('mật khẩu dưới 6 ký tự báo passwordTooShort', () => {
    expect(check(registerForm, { ...ok, password: '12345', confirm: '12345' })).toEqual({
      field: 'password',
      code: 'passwordTooShort',
    });
  });

  it('nhập lại không khớp thì lỗi nằm ở ô confirm', () => {
    expect(check(registerForm, { ...ok, confirm: '654321' })).toEqual({ field: 'confirm', code: 'passwordMismatch' });
  });

  it('khớp thì qua', () => {
    expect('data' in check(registerForm, { ...ok, confirm: '123456' })).toBe(true);
  });
});

describe('dòng RPC request_comfort', () => {
  const row = { comfort_id: 'c1', body: 'xin chào', translated: false };

  it('đúng hình dạng thì qua, thiếu translated thì hỏng', () => {
    expect(comfortRows.safeParse([row]).success).toBe(true);
    expect(comfortRows.safeParse([{ comfort_id: 'c1', body: 'xin chào' }]).success).toBe(false);
  });
});

describe('dòng comforts của mình', () => {
  const row = { id: 'c1', body: 'xin chào', tags: ['grief'], status: 'pending' };

  it('đúng hình dạng thì qua, status lạ hoặc tag lạ thì hỏng', () => {
    expect(myComfortRows.safeParse([row]).success).toBe(true);
    expect(myComfortRows.safeParse([{ ...row, status: 'x' }]).success).toBe(false);
    expect(myComfortRows.safeParse([{ ...row, tags: ['nope'] }]).success).toBe(false);
  });
});

describe('lời gửi người lạ', () => {
  it('đủ điều kiện thì qua', () => {
    expect('data' in check(comfortDraft, draft)).toBe(true);
  });

  it('độ dài tính theo code point sau trim: 19 ngắn, 20 và 500 qua, 501 dài', () => {
    const body = (n: number) => ` ${'x'.repeat(n)} `;
    expect(check(comfortDraft, { ...draft, body: body(19) })).toMatchObject({ code: 'bodyTooShort' });
    expect('data' in check(comfortDraft, { ...draft, body: body(20) })).toBe(true);
    expect('data' in check(comfortDraft, { ...draft, body: body(500) })).toBe(true);
    expect(check(comfortDraft, { ...draft, body: body(501) })).toMatchObject({ code: 'bodyTooLong' });
  });

  it('emoji tính là 1, không phải 2', () => {
    expect('data' in check(comfortDraft, { ...draft, body: '😢'.repeat(20) })).toBe(true);
    expect('data' in check(comfortDraft, { ...draft, body: '😢'.repeat(500) })).toBe(true);
    expect(check(comfortDraft, { ...draft, body: '😢'.repeat(19) })).toMatchObject({ code: 'bodyTooShort' });
  });

  it('tag: 0 báo tagsNone, 1 và mức tối đa qua, thêm một báo tagsTooMany', () => {
    const tags = ['grief', 'family', 'anxiety'];
    expect(check(comfortDraft, { ...draft, tags: [] })).toMatchObject({ code: 'tagsNone' });
    expect('data' in check(comfortDraft, { ...draft, tags: tags.slice(0, 1) })).toBe(true);
    expect('data' in check(comfortDraft, { ...draft, tags: tags.slice(0, MAX_COMFORT_TAGS) })).toBe(true);
    expect(check(comfortDraft, { ...draft, tags: tags.slice(0, MAX_COMFORT_TAGS + 1) })).toMatchObject({
      code: 'tagsTooMany',
    });
  });

  it('ngôn ngữ ngoài LANGS bị từ chối', () => {
    expect(check(comfortDraft, { ...draft, sourceLang: 'fr' })).toMatchObject({ code: 'langInvalid' });
  });
});
