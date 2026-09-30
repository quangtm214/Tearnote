import type { Lang } from './i18n';

/**
 * Bản dự phòng đóng gói trong app. ADR 0005: nút "cần trợ giúp ngay" phụ thuộc mạng
 * là một nút hỏng — đúng lúc cần nhất thì sóng yếu, hết data, hoặc server chết.
 *
 * Bản trên server (bảng `hotlines`) mới là bản cập nhật; file này chỉ để app luôn
 * hiện được thứ gì đó. Khi lấy được từ server thì thay, còn không thì dùng cái này.
 * Bảng server hiện chỉ có một ngôn ngữ cho `name`/`hours` — phải thêm bản dịch trước khi
 * app đọc nó (docs/db.md).
 *
 * Trong mỗi nước: cấp cứu trước, rồi số trực 24 giờ, rồi số có giờ trực — người mở màn này
 * lúc nửa đêm phải thấy số gọi được ngay trước. Giờ viết thành chữ cho screen reader đọc đúng.
 * Tên riêng giữ nguyên; phần mô tả thì dịch.
 */
type Chu = Record<Lang, string>;

export type Hotline = {
  country: string;
  name: Chu;
  phone?: string;
  url?: string;
  hours?: Chu;
};

const CA_NGAY: Chu = { vi: '24 giờ, mọi ngày', en: '24 hours, every day', ja: '24時間・毎日' };
const CAP_CUU: Chu = { vi: 'Cấp cứu', en: 'Emergency', ja: '救急' };

export const HOTLINES_FALLBACK: Hotline[] = [
  { country: 'VN', name: CAP_CUU, phone: '115', hours: CA_NGAY },
  {
    country: 'VN',
    name: {
      vi: 'Tổng đài Quốc gia Bảo vệ Trẻ em',
      en: 'National Child Protection Hotline',
      ja: '子ども保護全国ホットライン',
    },
    phone: '111',
    hours: CA_NGAY,
  },
  {
    country: 'VN',
    name: {
      vi: 'Đường dây nóng Ngày Mai (sức khoẻ tâm thần)',
      en: 'Ngày Mai Hotline (mental health)',
      ja: 'Ngày Mai ホットライン（メンタルヘルス）',
    },
    phone: '096 306 1414',
    hours: {
      vi: 'Thứ Tư đến Chủ nhật, 13:00–20:30',
      en: 'Wednesday to Sunday, 13:00–20:30',
      ja: '水曜〜日曜、13:00〜20:30',
    },
  },
  { country: 'JP', name: CAP_CUU, phone: '119', hours: CA_NGAY },
  {
    country: 'JP',
    name: {
      vi: 'こころの健康相談統一ダイヤル (sức khoẻ tâm thần, nói tiếng Nhật)',
      en: 'こころの健康相談統一ダイヤル (mental health, in Japanese)',
      ja: 'こころの健康相談統一ダイヤル（日本語）',
    },
    phone: '0570-064-556',
    hours: { vi: 'Tuỳ tỉnh, thành', en: 'Varies by prefecture', ja: '都道府県により異なる' },
  },
  {
    country: 'JP',
    name: {
      vi: 'TELL Lifeline (nói tiếng Anh)',
      en: 'TELL Lifeline (in English)',
      ja: 'TELL Lifeline（英語）',
    },
    phone: '03-5774-0992',
    url: 'https://telljp.com',
    hours: { vi: '9:00–23:00', en: '9:00–23:00', ja: '9:00〜23:00' },
  },
  { country: 'US', name: CAP_CUU, phone: '911', hours: CA_NGAY },
  {
    country: 'US',
    name: {
      vi: '988 Suicide & Crisis Lifeline',
      en: '988 Suicide & Crisis Lifeline',
      ja: '988 Suicide & Crisis Lifeline',
    },
    phone: '988',
    url: 'https://988lifeline.org',
    hours: CA_NGAY,
  },
  { country: 'GB', name: CAP_CUU, phone: '999', hours: CA_NGAY },
  {
    country: 'GB',
    name: { vi: 'Samaritans', en: 'Samaritans', ja: 'Samaritans' },
    phone: '116 123',
    url: 'https://samaritans.org',
    hours: CA_NGAY,
  },
];
