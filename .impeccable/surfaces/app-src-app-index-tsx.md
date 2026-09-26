---
version: 1
slug: "app-src-app-index-tsx"
primary_target: "app/src/app/index.tsx"
related_targets: []
---

# Timeline — surface brief

## Scope
Màn mở app `app/src/app/index.tsx` ("Những lần đã khóc"). Mode: **Operate**. Màn đầu tiên chứng minh visual world "Album ảnh trang đen"; thay hẳn world một-bit trước đó (bị bỏ: lạnh, máy móc, retro, chữ pixel khó đọc, lưới giống tracker). Các màn khác kế thừa sau.

## Task
Người dùng vừa khóc xong, 2 giờ sáng, một tay: xem lại những lần đã khóc, mở một Entry để xin Comfort, hoặc ghi Entry mới. Lối trợ giúp luôn thấy được. Cảm giác đúng: một cuốn sổ riêng.

## Constraints
- Không chói lúc nửa đêm; không giống app wellness; không giống tracker; không bi đát/sến; không lạnh/máy móc; không retro/trò chơi.
- Chữ đọc được qua mắt nhoè: Reflection luôn là font hệ thống, cỡ thân 17.
- Material 3 / HIG giữ điều hướng, Back, sheet, switch; world là lớp theming.
- TalkBack/VoiceOver đọc được mọi tấm dán; font scale hệ thống không vỡ layout.

## Direction contract

THESIS: Tearnote là một cuốn album chỉ mình mở. Mỗi lần khóc là một tấm dán lên trang giấy đen; Comfort là một tấm nhỏ ai đó lặng lẽ kẹp vào trang của bạn. Từ chối: danh sách thẻ bo tròn + biểu đồ của mood tracker, và mọi dạng lưới/heatmap.

OWN-WORLD: Trang giấy bồi đen ấm #1A1614. Tấm dán giấy mờ #2B2622, góc vuông, giữ bằng bốn góc dán tam giác #B3AA9C, nổi khỏi trang bằng một bóng mềm thấp. Reflection chữ hệ thống #ECE5D8. Chú thích bút chì trắng bằng Patrick Hand #B3AA9C: ngày, giờ, thời lượng, Tag, và cường độ là 1–5 vạch bút chì. Giữa các đêm là tờ pơ-luya mờ (vệt sáng rất nhạt có mép). Hổ phách #E2A55A chỉ cho trợ giúp.

STORY: Mở app, người dùng thấy trang album mở đúng chỗ đã rời, đọc lại tấm mới nhất, chạm một tấm để xem và xin Comfort, hoặc dán tấm mới. Trợ giúp luôn ở cùng một chỗ.

FIRST VIEWPORT: Tiêu đề viết tay "Những lần đã khóc" (Patrick Hand, lớn) trên trang đen. Dưới đó ngày viết tay, rồi tấm dán mới nhất với Reflection đọc được ngay, chú thích bút chì dưới tấm. Chân màn cố định: nút chính "Ghi một lần khóc" là tấm giấy có góc dán; dưới nó nút hổ phách "Cần trợ giúp ngay" 64dp. Tương tác đặc trưng: chạm tấm → tấm nhấc khỏi trang (nâng nhẹ, bóng đậm dần) rồi mở Entry; giảm chuyển động thì mở thẳng. Comfort đã kẹp: một tấm nhỏ chờm lên góc dưới phải của tấm Entry.

FORM: Album ảnh trang đen, ứng viên số 6 trong danh sách grounded, seed 8e3acbe1. Raises: trạng thái Comfort đọc được trên từng tấm (tensegrity); một trục dọc, không lưới (deep dive); mở lại đúng trang đã rời (HyperCard); trang trống là khung góc dán đang chờ (drum machine); nhãn chịu ba ngôn ngữ (anime command center) — user chọn Patrick Hand cho tiếng Việt vì Yomogi tách chữ có dấu; tiếng Nhật sẽ nạp Yomogi riêng khi có i18n.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Chuyển động nhấc tấm hiện là trạng thái tức thời khi nhấn, chưa có bóng đậm dần theo thời gian.
- TalkBack chưa nghe thử trên máy thật (nhãn đã sửa trong code).
- Tiếng Nhật: Patrick Hand không có kana; nạp Yomogi (đã có trong assets/fonts) khi làm i18n.
- ~~Các màn khác vẫn ở world cũ~~ — đã chuyển hết sang world album (2026-09-26).
- Trang mục lục để thấy pattern theo thời gian: để sau, không nhồi vào Timeline.
