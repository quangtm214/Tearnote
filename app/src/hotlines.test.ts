import { nuocDau } from './hotlines';

describe('nước lên đầu màn hotline', () => {
  it('vùng của máy có trong danh sách thì lên đầu, bất kể ngôn ngữ app', () => {
    expect(nuocDau('GB', 'vi')).toBe('GB');
    expect(nuocDau('JP', 'en')).toBe('JP');
  });

  it('máy không có vùng, hoặc vùng không có trong danh sách, thì theo ngôn ngữ app', () => {
    expect(nuocDau(undefined, 'ja')).toBe('JP');
    expect(nuocDau('FR', 'en')).toBe('US');
    expect(nuocDau(undefined, 'vi')).toBe('VN');
  });
});
