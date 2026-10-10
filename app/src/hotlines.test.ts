import { topCountry } from './hotlines';

describe('nước lên đầu màn hotline', () => {
  it('vùng của máy có trong danh sách thì lên đầu, bất kể ngôn ngữ app', () => {
    expect(topCountry('GB', 'vi')).toBe('GB');
    expect(topCountry('JP', 'en')).toBe('JP');
  });

  it('máy không có vùng, hoặc vùng không có trong danh sách, thì theo ngôn ngữ app', () => {
    expect(topCountry(undefined, 'ja')).toBe('JP');
    expect(topCountry('FR', 'en')).toBe('US');
    expect(topCountry(undefined, 'vi')).toBe('VN');
  });
});
