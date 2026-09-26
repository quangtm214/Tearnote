/**
 * Token hệ thống của Tearnote. Chỉ hằng số — không component, không context, không hook.
 *
 * Bối cảnh chi phối mọi giá trị dưới đây: người dùng mở app lúc 2 giờ sáng, vừa khóc xong,
 * cầm máy bằng một tay, trong bóng tối, mắt nhoè. Nền tối là mặc định duy nhất, không có light mode.
 */

/**
 * World "album ảnh trang đen" — mọi màn dùng nó (DESIGN.md).
 * Trang giấy bồi đen ấm, mỗi Entry là một tấm dán giữ bằng bốn góc; chú thích viết bút chì trắng.
 * Ấm chứ không lạnh: mọi tông lệch về nâu, không có xám xanh.
 */
export const album = {
  /** Trang album. */
  trang: '#1A1614',
  /** Tấm dán: Entry, nút chính. Sáng hơn trang vừa đủ để thấy nó nằm trên trang. */
  tam: '#2B2622',
  /** Tấm nhỏ người lạ kẹp vào: Comfort đã nhận. */
  kep: '#3A322C',
  /** Chữ thân trên tấm. ~11:1 trên tấm — đủ qua mắt nhoè, chưa tới trắng gắt. */
  chu: '#E4DCCF',
  /** Bút chì trắng: chú thích, ngày, vạch cường độ. ~7.8:1 trên trang. */
  butChi: '#B3AA9C',
  /** Góc dán ảnh — cùng tông bút chì trắng. */
  goc: '#B3AA9C',
  /** Giấy pơ-luya ngăn giữa các đêm: vệt sáng rất nhạt. */
  poLuya: 'rgba(228, 220, 207, 0.06)',
  /** Hairline duy nhất được dùng: mép trên chân màn, khung trang trống. */
  vienMo: 'rgba(228, 220, 207, 0.12)',
  /** Màu duy nhất được nổi: lối trợ giúp (~8:1 trên trang). */
  den: '#E2A55A',
  /**
   * Bảng năm ở màn Lịch — ngoại lệ duy nhất của luật Một Trục. Ô trống (ngày có thật, không Entry)
   * rồi 5 mức theo `NGUONG` trong `lich.ts`: cùng tông chữ ngà, chỉ đổi độ đục, không thêm màu.
   */
  lich: [
    'rgba(228, 220, 207, 0.06)',
    'rgba(228, 220, 207, 0.22)',
    'rgba(228, 220, 207, 0.40)',
    'rgba(228, 220, 207, 0.58)',
    'rgba(228, 220, 207, 0.78)',
    'rgba(228, 220, 207, 1)',
  ],
} as const;

/**
 * Chữ viết tay Patrick Hand (nạp ở _layout) cho tiêu đề và chú thích tiếng Việt. Reflection và
 * nút bấm vẫn là font hệ thống để đọc qua mắt nhoè. Không dùng Yomogi cho tiếng Việt: chữ Latin
 * của nó rộng cố định nên tách chữ có dấu ("l ần"). Yomogi (assets/fonts) để dành cho tiếng Nhật
 * khi có i18n — chưa nạp.
 */
export const butChi = {
  tieuDe: { fontFamily: 'PatrickHand', fontSize: 34, lineHeight: 46 },
  ngay: { fontFamily: 'PatrickHand', fontSize: 22, lineHeight: 33 },
  chuThich: { fontFamily: 'PatrickHand', fontSize: 19, lineHeight: 29 },
} as const;

/**
 * Thang cỡ chữ. Font hệ thống, đúng mặc định của React Native, không khai báo family ở đâu cả.
 * (Nếu sau này thêm font: cần một sans humanist hỗ trợ đủ dấu tiếng Việt và kana tiếng Nhật
 * trong CÙNG một family — ví dụ Noto Sans / Noto Sans JP. Đừng thêm trước khi có màn hình thật
 * để đo, và đừng dùng hai family cho ba ngôn ngữ vì nhịp chữ sẽ lệch giữa các locale.)
 *
 * Thang bắt đầu từ 17 chứ không phải 16, và không có nấc nào dưới 14.
 * Mắt nhoè lúc nửa đêm không đọc được caption 12. lineHeight rộng (~1.5) vì tiếng Việt có dấu
 * chồng hai tầng, dòng sát nhau là dấu dính vào dòng trên. Chỉ 3 weight: font hệ thống Android
 * (Roboto) render '600' không ổn định, nên dừng ở 400 / 500. Tiêu đề và nhãn mục là
 * Patrick Hand (`butChi`).
 */
export const text = {
  /** Chữ thân: Reflection, nội dung Comfort. Đây là cỡ mặc định của app. */
  than: { fontSize: 17, fontWeight: '400', lineHeight: 26 },
  /** Chữ trên nút bấm và tag. Đậm hơn thân một nấc để ngón tay biết chỗ bấm mà không cần viền. */
  nut: { fontSize: 17, fontWeight: '500', lineHeight: 22 },
  /** Chữ phụ: mốc thời gian, thời lượng. Nhỏ nhất được phép — không có nấc nào dưới đây. */
  phu: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
} as const;

/**
 * Khoảng cách — thoáng hơn app thường. Khoảng trắng là thứ duy nhất báo "không có gì gấp cả",
 * và ngón cái cầm một tay cần biên an toàn giữa các vùng bấm để không bấm nhầm.
 */
export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  /** Khoảng nghỉ giữa các khối lớn / giữa các Entry khác ngày. */
  xl: 40,
  /** Lề ngang của mọi màn hình. */
  man: 20,
} as const;

/**
 * Vùng bấm — 48dp là sàn tuyệt đối (khuyến nghị Android), không phải mục tiêu.
 * Bấm một tay trong bóng tối thì sai số cao hơn bình thường nhiều.
 */
export const touch = {
  /** Sàn cho mọi thứ bấm được: icon, tag, nấc cường độ. */
  toiThieu: 48,
  /** Nút hành động chính: lưu Entry, gửi Comfort. */
  chinh: 56,
  /** Nút hotline. To hơn vì lúc cần tới nó là lúc tay run nhất. */
  hotline: 64,
} as const;

