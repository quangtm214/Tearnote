/**
 * Bản dự phòng đóng gói trong app. ADR 0005: nút "cần trợ giúp ngay" phụ thuộc mạng
 * là một nút hỏng — đúng lúc cần nhất thì sóng yếu, hết data, hoặc server chết.
 *
 * Bản trên server (bảng `hotlines`) mới là bản cập nhật; file này chỉ để app luôn
 * hiện được thứ gì đó. Khi lấy được từ server thì thay, còn không thì dùng cái này.
 */
export type Hotline = {
  country: string;
  name: string;
  phone?: string;
  url?: string;
  hours?: string;
};

export const HOTLINES_FALLBACK: Hotline[] = [
  {
    country: 'VN',
    name: 'Đường dây nóng Ngày Mai (sức khoẻ tâm thần)',
    phone: '096 306 1414',
    hours: '13:00–20:30, thứ 4 đến CN',
  },
  { country: 'VN', name: 'Tổng đài Quốc gia Bảo vệ Trẻ em', phone: '111', hours: '24/7' },
  {
    country: 'JP',
    name: 'こころの健康相談統一ダイヤル',
    phone: '0570-064-556',
    hours: '都道府県により異なる',
  },
  {
    country: 'JP',
    name: 'TELL Lifeline (tiếng Anh)',
    phone: '03-5774-0992',
    url: 'https://telljp.com',
    hours: '9:00–23:00',
  },
  {
    country: 'US',
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    url: 'https://988lifeline.org',
    hours: '24/7',
  },
  {
    country: 'GB',
    name: 'Samaritans',
    phone: '116 123',
    url: 'https://samaritans.org',
    hours: '24/7',
  },
];
