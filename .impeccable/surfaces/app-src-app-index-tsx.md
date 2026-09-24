---
version: 1
slug: "app-src-app-index-tsx"
primary_target: "app/src/app/index.tsx"
related_targets: []
---

# Timeline — surface brief

## Scope
Màn mở app `app/src/app/index.tsx` ("Những lần đã khóc"). Mode: **Operate**. Đây là màn đầu tiên chứng minh visual world mới; các màn khác kế thừa world này sau.

## Task
Người dùng vừa khóc xong, 2 giờ sáng, một tay: xem lại những lần đã khóc, nhận ra pattern theo thời gian, mở một Entry để xin Comfort, hoặc ghi Entry mới. Lối trợ giúp luôn thấy được.

## Constraints
- Không chói lúc nửa đêm; không giống app wellness; không giống tracker y tế; không bi đát/sến.
- Material 3 / HIG giữ điều hướng, Back, sheet, switch; world là lớp theming.
- TalkBack/VoiceOver đọc được mọi ô khảm (ngày, cường độ, Tag).
- Font scale hệ thống không được vỡ layout.

## Direction contract

THESIS: Cường độ là mật độ chấm. Mỗi đêm có khóc thành một ô dither; nhiều tuần thành một bức khảm để người dùng tự thấy pattern. Từ chối kiểu mặc định: danh sách thẻ bo tròn + biểu đồ tần suất của mood tracker.

OWN-WORLD: Nền đen #0B0B0C, một tông pixel dịu #A9A59B; mọi tông giữa là dither Bayer của hai màu đó, không có xám đặc. Màu duy nhất: đèn trợ giúp hổ phách #C99A4E, chỉ ở nút trợ giúp. Viền 1px vuông, không bo, không bóng. Thanh tiêu đề sọc dither, chữ pixel in hoa. Chọn = viền kiến bò; nhấn = đảo tông; tắt = dither thưa. Xoá/thu hồi đứng cô lập bằng khoảng trống.

STORY: Mở app, người dùng thấy bức khảm những đêm đã khóc, hiểu pattern không cần biểu đồ, chạm một ô để xem lại, hoặc ghi Entry mới. Trợ giúp luôn sáng ở cùng một chỗ.

FIRST VIEWPORT: Thanh tiêu đề dither "NHỮNG LẦN ĐÃ KHÓC". Nửa trên: lưới khảm 7 cột theo tuần, ô ~40dp, mật độ dither = cường độ cao nhất đêm đó, đêm trống là ô viền, cờ ở chỗ dừng lần trước. Nửa dưới: Entry theo một lưới nhãn cố định giờ · thời lượng · Tag, Reflection 3 dòng. Chân màn cố định: nút mặc định viền đôi "GHI MỘT ENTRY", dưới nó nút hổ phách "CẦN TRỢ GIÚP NGAY" 64dp — ở tầm ngón cái vì lúc cần là lúc tay run nhất (đổi từ góc trên phải). Tương tác đặc trưng: chạm ô → khung zoom từng nấc phóng từ ô thành cửa sổ Entry; chuyển động dùng steps(), giảm chuyển động thì cắt thẳng.

FORM: medium-native-one-bit-desktop, hướng dẫn đầu lượt táo bạo (reroll 1), seed c6245015. Raises: cờ chỗ dừng (cutting bench), một lưới nhãn (sneaker box), màu duy nhất là đèn trợ giúp (cloud edge), xoá/thu hồi cô lập (dev console).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Tiếng Nhật: VT323 không có kana; ghép DotGothic16 khi có i18n.
- Các màn khác (new, comfort/*, help, settings, login) vẫn ở world cũ.
