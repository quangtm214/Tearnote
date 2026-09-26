/**
 * Bản dự phòng đóng gói trong app. ADR 0005: nút "cần trợ giúp ngay" phụ thuộc mạng
 * là một nút hỏng — đúng lúc cần nhất thì sóng yếu, hết data, hoặc server chết.
 *
 * Bản trên server (bảng `hotlines`) mới là bản cập nhật; file này chỉ để app luôn
 * hiện được thứ gì đó. Khi lấy được từ server thì thay, còn không thì dùng cái này.
 *
 * Trong mỗi nước: cấp cứu trước, rồi số trực 24 giờ, rồi số có giờ trực — người mở màn này
 * lúc nửa đêm phải thấy số gọi được ngay trước. Giờ viết thành chữ cho screen reader đọc đúng.
 */
export type Hotline = {
  country: string;
  name: string;
  phone?: string;
  url?: string;
  hours?: string;
};

const CA_NGAY = '24 giờ, mọi ngày';

export const HOTLINES_FALLBACK: Hotline[] = [
  { country: 'VN', name: 'Cấp cứu', phone: '115', hours: CA_NGAY },
  { country: 'VN', name: 'Tổng đài Quốc gia Bảo vệ Trẻ em', phone: '111', hours: CA_NGAY },
  {
    country: 'VN',
    name: 'Đường dây nóng Ngày Mai (sức khoẻ tâm thần)',
    phone: '096 306 1414',
    hours: 'Thứ Tư đến Chủ nhật, 13:00–20:30',
  },
  { country: 'JP', name: 'Cấp cứu', phone: '119', hours: CA_NGAY },
  {
    country: 'JP',
    name: 'こころの健康相談統一ダイヤル (sức khoẻ tâm thần, nói tiếng Nhật)',
    phone: '0570-064-556',
    hours: 'Tuỳ tỉnh, thành',
  },
  {
    country: 'JP',
    name: 'TELL Lifeline (nói tiếng Anh)',
    phone: '03-5774-0992',
    url: 'https://telljp.com',
    hours: '9:00–23:00',
  },
  { country: 'US', name: 'Cấp cứu', phone: '911', hours: CA_NGAY },
  {
    country: 'US',
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    url: 'https://988lifeline.org',
    hours: CA_NGAY,
  },
  { country: 'GB', name: 'Cấp cứu', phone: '999', hours: CA_NGAY },
  {
    country: 'GB',
    name: 'Samaritans',
    phone: '116 123',
    url: 'https://samaritans.org',
    hours: CA_NGAY,
  },
];
