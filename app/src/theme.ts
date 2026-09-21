/**
 * Token hệ thống của Tearnote. Chỉ hằng số — không component, không context, không hook.
 *
 * Bối cảnh chi phối mọi giá trị dưới đây: người dùng mở app lúc 2 giờ sáng, vừa khóc xong,
 * cầm máy bằng một tay, trong bóng tối, mắt nhoè. Nền tối là mặc định duy nhất, không có light mode.
 */

/**
 * Màu — "phòng ngủ lúc 2 giờ sáng", không phải "dark mode của app SaaS".
 * Nền là xanh mực chứ không phải đen tuyệt đối: đen tuyệt đối trên OLED gây smear khi scroll,
 * và rìa chữ trắng trên nền #000 chói hơn nhiều với mắt vừa khóc xong.
 * Phân tầng bằng độ sáng, không bằng viền — tránh đường kẻ sắc trong bóng tối.
 */
export const color = {
  /** Nền toàn app. Xanh mực đêm, tối nhưng có sắc độ để mắt không phải "neo" vào khoảng đen chết. */
  demKhuya: '#121A24',
  /** Bề mặt nổi: thẻ Entry trong timeline, ô nhập, sheet. Chỉ sáng hơn nền vừa đủ để tách lớp. */
  matGiay: '#1C2632',
  /** Chữ chính. Trắng ngà hơi lạnh — KHÔNG dùng #FFFFFF, quá gắt trong bóng tối. */
  chuChinh: '#E4E8ED',
  /** Chữ phụ: mốc thời gian, chú thích, tag chưa chọn. Vẫn đạt ~4.8:1 trên nền để đọc được qua mắt nhoè. */
  chuPhu: '#8D9AA9',
  /** Trạng thái đã chọn / đang hoạt động (tag đã chọn, nấc cường độ, con trỏ). Xanh tím như ánh trăng qua rèm — hiện diện nhưng không reo mừng. */
  anhTrang: '#9FADD9',
  /** DUY NHẤT được phép nổi bật: lối vào "cần trợ giúp ngay". Vàng hổ phách ấm như đèn còn sáng — cố ý KHÔNG phải đỏ cảnh báo, người đang khủng hoảng không cần bị doạ thêm. */
  denConSang: '#E3B071',
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
 * (Roboto) render '600' không ổn định, nên dừng ở 400 / 500 / 700.
 */
export const text = {
  /** Tiêu đề màn hình. Cỡ lớn để định vị được mà không cần đọc kỹ. */
  tieuDe: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  /** Câu hỏi trong form, tiêu đề nhóm: "Hôm nay vì chuyện gì?" */
  nhan: { fontSize: 20, fontWeight: '500', lineHeight: 28 },
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
 * Bo góc — cố ý KHÔNG dùng một bán kính cho tất cả. Bán kính mã hoá loại phần tử:
 * thẻ nội dung mềm, ô nhập vuông vức hơn để trông "viết được", tag là viên thuốc.
 */
export const radius = {
  /** Thẻ Entry, thẻ Comfort. */
  the: 14,
  /** Ô nhập liệu, nút chữ nhật. */
  o: 10,
  /** Tag cảm xúc, nấc cường độ. */
  vien: 999,
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

/**
 * Cường độ 1–5 → chiều cao vạch. Một thang duy nhất: màn ghi Entry và màn timeline phải vẽ
 * cùng tỉ lệ, nếu không người dùng thấy hai mức khác nhau cho cùng một Entry.
 */
export const caoVach = (intensity: number) => 16 + intensity * 12;
