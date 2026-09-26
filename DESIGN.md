---
name: Tearnote
description: Album ảnh trang đen, chỉ một người mở; mỗi lần khóc là một tấm dán.
colors:
  trang: "#1A1614"
  tam: "#2B2622"
  kep: "#3A322C"
  chu: "#E4DCCF"
  but-chi: "#B3AA9C"
  po-luya: "rgba(228, 220, 207, 0.06)"
  vien-mo: "rgba(228, 220, 207, 0.12)"
  lich-0: "rgba(228, 220, 207, 0.06)"
  lich-1: "rgba(228, 220, 207, 0.22)"
  lich-2: "rgba(228, 220, 207, 0.40)"
  lich-3: "rgba(228, 220, 207, 0.58)"
  lich-4: "rgba(228, 220, 207, 0.78)"
  lich-5: "rgba(228, 220, 207, 1)"
  den: "#E2A55A"
typography:
  tieu-de:
    fontFamily: "PatrickHand"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: "46px"
  ngay:
    fontFamily: "PatrickHand"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: "33px"
  chu-thich:
    fontFamily: "PatrickHand"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: "29px"
  than:
    fontFamily: "system-ui, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "26px"
  nut:
    fontFamily: "system-ui, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: "22px"
  phu:
    fontFamily: "system-ui, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
rounded:
  tam: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  man: "20px"
components:
  tam-entry:
    backgroundColor: "{colors.tam}"
    textColor: "{colors.chu}"
    typography: "{typography.than}"
    rounded: "{rounded.tam}"
    padding: "24px"
  manh-kep:
    backgroundColor: "{colors.kep}"
    textColor: "{colors.chu}"
    typography: "{typography.chu-thich}"
    rounded: "{rounded.tam}"
    padding: "4px 16px"
  nut-chinh:
    backgroundColor: "{colors.tam}"
    textColor: "{colors.chu}"
    typography: "{typography.nut}"
    rounded: "{rounded.tam}"
    height: "56px"
  nut-tro-giup:
    backgroundColor: "{colors.trang}"
    textColor: "{colors.den}"
    typography: "{typography.nut}"
    rounded: "{rounded.tam}"
    height: "64px"
  nut-tro-giup-pressed:
    backgroundColor: "{colors.den}"
    textColor: "{colors.trang}"
  dong-loi:
    textColor: "{colors.chu}"
    typography: "{typography.nut}"
    padding: "16px 0"
    height: "48px"
  lua-chon:
    backgroundColor: "{colors.tam}"
    textColor: "{colors.but-chi}"
    typography: "{typography.nut}"
    rounded: "{rounded.tam}"
    padding: "0 16px"
    height: "48px"
  lua-chon-chon:
    backgroundColor: "{colors.chu}"
    textColor: "{colors.trang}"
  o-nhap:
    backgroundColor: "{colors.tam}"
    textColor: "{colors.chu}"
    typography: "{typography.than}"
    rounded: "{rounded.tam}"
    padding: "16px"
---

# Design System: Tearnote

> **Trạng thái:** mọi màn (`app/src/app/*`) đã ở world "Album ảnh trang đen". Token nằm ở `album` và `butChi` trong `app/src/theme.ts`; mảnh dùng chung (góc dán, tấm Entry, nút chính, nút trợ giúp, dòng lối, lựa chọn, chân màn) ở `app/src/ui.tsx`. World xanh mực cũ (`color`, `radius`, `caoVach`) đã xoá — đừng dựng lại.

## Overview

**Creative North Star: "Cuốn album chỉ mình mở"**

Tearnote là một cuốn album ảnh trang đen để trong ngăn kéo. Mỗi lần khóc là một tấm giấy dán lên trang, giữ bằng bốn góc dán tam giác; ngày tháng và chi tiết được ghi bằng bút chì trắng bên dưới. Comfort là một mẩu giấy nhỏ người lạ lặng lẽ kẹp vào trang. Giữa hai đêm có một tờ giấy pơ-luya mỏng. Tất cả đi theo một trục dọc duy nhất, đọc từ trên xuống như lật album.

Mọi tông đều ấm, lệch về nâu; không có xám xanh, không có trắng tinh. Độ tương phản vừa đủ để đọc qua mắt nhoè lúc 2 giờ sáng rồi dừng lại. Mật độ thưa: khoảng trống giữa các tấm là tín hiệu "không có gì gấp". Chữ viết tay chỉ dùng cho những gì một người sẽ ghi bằng bút chì trên album (tiêu đề, ngày, chú thích, mẩu giấy kẹp); còn thứ phải đọc được (Reflection, nút bấm) là font hệ thống.

Từ chối: danh sách thẻ bo tròn kèm biểu đồ của app mood tracker, và mọi dạng lưới hoặc heatmap — trừ đúng một chỗ: bảng năm ở màn Lịch (xem luật Một Trục). Điều hướng, Back, sheet, switch vẫn theo Material 3 / HIG; world là lớp theming, không thay quy ước nền tảng.

**Key Characteristics:**
- Trang giấy bồi đen ấm, tấm dán góc vuông, bốn góc dán tam giác.
- Nổi bằng bóng mềm thấp, không bằng viền.
- Bút chì trắng (Patrick Hand) cho chú thích; font hệ thống cho mọi thứ phải đọc kỹ.
- Cường độ là n nét bút chì đếm tay, không phải biểu đồ.
- Hổ phách chỉ có một chỗ: lối trợ giúp.

## Colors

Bảng màu giấy và bút chì trong bóng tối: nâu đen ấm, một tông chữ ngà, một tông bút chì, và đúng một màu được phép nổi.

### Primary
- **Đèn Còn Sáng** (`den`): hổ phách ấm, chỉ cho lối "Cần trợ giúp ngay" (~8:1 trên trang). Viền 1.5px khi nghỉ, tô kín khi nhấn. Cố ý không phải đỏ cảnh báo.

### Neutral
- **Trang Giấy Bồi** (`trang`): nền mọi màn trong world, và nền chân màn cố định.
- **Tấm Dán** (`tam`): mặt Entry và nút chính. Sáng hơn trang vừa đủ để thấy nó nằm trên trang.
- **Mẩu Giấy Kẹp** (`kep`): Comfort người lạ kẹp vào tấm. Sáng hơn tấm một nấc.
- **Chữ Ngà** (`chu`): chữ trên tấm (Reflection, nhãn nút), tiêu đề màn. ~11:1 trên tấm.
- **Bút Chì Trắng** (`but-chi`): ngày, chú thích, nét cường độ, dòng phụ. ~7.8:1 trên trang. Góc dán (`album.goc`) dùng cùng giá trị.
- **Giấy Pơ-luya** (`po-luya`): thân tờ ngăn giữa hai đêm; mép trên của nó là cùng tông ở độ đục 0.22.
- **Viền Mờ** (`vien-mo`): đường hairline duy nhất được dùng: mép trên chân màn, khung trang trống.
- **Thang Lịch** (`album.lich`): chỉ cho bảng năm. Sáu nấc của cùng tông `chu`, chỉ đổi độ đục: ô trống 0.06 (bằng `po-luya`) rồi 5 mức 0.22 / 0.40 / 0.58 / 0.78 / 1. Không thêm sắc độ mới, không dùng `den`.

### Named Rules
**The Một Ngọn Đèn Rule.** `den` chỉ xuất hiện ở lối trợ giúp. Không dùng cho trạng thái chọn, link, badge hay nhấn mạnh. Nếu một màn có hai chỗ hổ phách thì một chỗ sai. **Ngoại lệ duy nhất:** màn hotline (`help.tsx`) chính là lối trợ giúp, nên mỗi nút "Gọi …" là một nút trợ giúp hổ phách.

**The Không Xám Xanh Rule.** Mọi tông trung tính lệch về nâu. Không `#FFFFFF`, không `#000` làm nền.

## Typography

**Display Font:** Patrick Hand (`PatrickHand`, nạp ở `_layout.tsx`; lỗi nạp thì rơi về font hệ thống)
**Body Font:** font hệ thống (Roboto trên Android, San Francisco trên iOS), không khai báo family

**Character:** bút chì viết tay đặt cạnh chữ in sạch. Chữ tay kể bối cảnh; chữ hệ thống mang nội dung.

### Hierarchy
- **Tiêu đề** (`tieu-de`, Patrick Hand): tiêu đề màn, ví dụ "Những lần đã khóc".
- **Ngày** (`ngay`, Patrick Hand): đầu mỗi nhóm đêm, màu bút chì.
- **Chú thích** (`chu-thich`, Patrick Hand): giờ · thời lượng · Tag dưới tấm; chữ trên mẩu giấy kẹp; câu trang trống.
- **Thân** (`than`, hệ thống): Reflection. Cỡ mặc định của app.
- **Nút** (`nut`, hệ thống, 500): nhãn nút và dòng lối.
- **Phụ** (`phu`, hệ thống): dòng giải thích dưới lối, nhỏ nhất được phép.

### Named Rules
**The Bút Chì Chỉ Để Ghi Chú Rule.** Patrick Hand chỉ cho tiêu đề, ngày, chú thích và mẩu giấy kẹp. Reflection và nút bấm luôn là font hệ thống.

**The Một Family Một Ngôn Ngữ Rule.** Patrick Hand cho tiếng Việt (và Anh). Không dùng Yomogi cho tiếng Việt: chữ Latin rộng cố định làm tách chữ có dấu. Yomogi (`app/assets/fonts/Yomogi-Regular.ttf`, chưa nạp) dành cho tiếng Nhật khi có i18n.

**The Không Dưới 14 Rule.** Không cỡ chữ nào dưới 14; line height rộng (~1.5) vì dấu tiếng Việt chồng hai tầng. Layout phải chịu được font scale hệ thống.

## Layout

Một cột dọc duy nhất, lề ngang `man` (20). Khoảng giữa các tấm là `lg` (24); chú thích cách tấm `sm` (8), và `lg + sm` (32) khi tấm có mẩu giấy kẹp chờm xuống. Giữa hai đêm: tờ pơ-luya với `md` phía trên, `xl` phía dưới. Tiêu đề cách nội dung `lg`.

Chân màn cố định ngoài vùng cuộn (`ChanMan` trong `ui.tsx`), **ở mọi màn trừ màn hotline** — ADR 0005 đòi lối trợ giúp hiển thị thường trực: nút chính (nếu màn có, như Timeline) rồi nút trợ giúp, cách nhau `sm`, tách khỏi trang bằng một hairline `vien-mo`. Màn khác kết thúc vùng cuộn bằng dòng lối "Quay lại". Màn có ô nhập bọc nội dung trong `KeyboardAvoidingView` (behavior `padding`): Android edge-to-edge không tự co cửa sổ, thiếu nó là bàn phím che ô đang gõ. Vùng bấm tối thiểu 48, nút chính 56, trợ giúp 64 (`touch` trong theme). Mở lại app thì cuộn thẳng tới đêm của Entry mở gần nhất, không animate.

### Named Rules
**The Một Trục Rule.** Không lưới, không cột, không heatmap. Mọi thứ nằm trên một trục dọc theo thời gian. **Ngoại lệ duy nhất:** bảng năm ở màn Lịch — chủ repo chọn lưới vì nhìn cả năm một lượt mới thấy được mùa nào dày, tháng nào thưa. Ngoại lệ không lan sang màn khác; Timeline vẫn là một trục.

## Elevation & Depth

Hệ lai: tấm giấy nổi khỏi trang bằng bóng mềm thấp, còn phân lớp nền dùng độ sáng (`trang` → `tam` → `kep`). Không dùng viền để tạo lớp.

### Shadow Vocabulary
- **Nằm trên trang** (`shadowColor #000, offset 0/3, opacity 0.45, radius 6, elevation 3`): tấm Entry, nút chính, mẩu giấy kẹp (kẹp dùng elevation 6 để nằm trên tấm).
- **Nhấc khỏi trang** (`translateY -3, offset 0/8, opacity 0.6, radius 12, elevation 10`): trạng thái nhấn của tấm và nút chính.

### Named Rules
**The Bóng Là Giấy Rule.** Bóng chỉ để nói "tờ giấy này nằm trên trang". Mềm, thấp, đen, không lệch cứng, không màu.

## Shapes

Góc vuông cho mọi tờ giấy (tấm, mẩu kẹp, nút). Hình tam giác của bốn góc dán (14 trên tấm, 10 trên nút chính, chìa ra 2 ngoài mép) là silhouette nhận diện của world. Nét bút chì là thanh 2px bo 1. Bất đối xứng nhỏ có chủ đích: mẩu kẹp nghiêng -2°, pơ-luya nghiêng -0.8°, mỗi nét cường độ nghiêng và cao lệch nhau một chút. Không có bo góc nào trong world này.

## Components

### Buttons
- **Nút chính** ("Ghi một lần khóc", "Lưu lại", "Gửi"): là một tấm dán: nền `tam`, góc dán 10, bóng "nằm trên trang", chữ `nut` màu `chu`. Nhấn thì nhấc khỏi trang.
- **Nút trợ giúp** ("Cần trợ giúp ngay"): viền `den` 1.5px trên nền trang, chữ `den`; nhấn thì tô kín `den`, chữ chuyển `trang`. Luôn ở chân màn, luôn cùng chỗ.
- **Dòng lối** (ví dụ "Viết một lời cho người lạ", "Cài đặt", "Quay lại"): không nền, không viền; nhãn `nut` màu `chu`, dòng giải thích `phu` màu `but-chi` (tối đa 320 rộng). Nhấn thì mờ 0.6. Screen reader đọc nhãn, dòng giải thích là hint.

### Lựa chọn và ô nhập (màn ghi, viết lời, đăng nhập)
- **Lựa chọn** (Tag, thời điểm, thời lượng): mảnh `tam` góc vuông cao 48, chữ `nut` màu `but-chi`. Chọn thì tô `chu`, chữ đổi sang `trang` — tương phản đủ để thấy qua mắt nhoè mà không cần màu thứ hai. Hết lượt chọn thì các lựa chọn còn lại mờ 0.35. Screen reader: chọn một là `radio`, chọn nhiều (Tag) là `checkbox`.
- **Nhãn mục** ("Lúc nào?", "Vì chuyện gì?"): `ngay` (Patrick Hand) màu `but-chi`, vai trò header.
- **Chọn cường độ**: 5 vùng bấm 48, mỗi vùng một nét bút chì gấp đôi nét trên tấm; nét tới mức đã chọn màu `chu`, nét trên mức chỉ là `vien-mo`; cạnh đó ghi "3 / 5" bằng `chu-thich`.
- **Ô nhập**: nền `tam`, góc vuông, chữ `than` màu `chu`, placeholder và con trỏ `but-chi`. Không viền.
- **Nút gạt** (Cài đặt): Switch của nền tảng; bật: track `but-chi`, thumb `chu`; tắt: track `kep`, thumb `but-chi`.

### Tấm Entry (signature)
Tấm giấy góc vuông `tam`, padding `lg`, bốn góc dán, bóng thấp. Thân là Reflection (tối đa 6 dòng); không có Reflection thì Tag là thân và chú thích không lặp Tag. Dưới tấm là dòng chú thích bút chì (giờ · thời lượng · Tag) và, cuối dòng đầu, các nét cường độ. Toàn tấm là một vùng bấm với nhãn screen reader gộp đủ Reflection, chú thích, cường độ và trạng thái Comfort; dòng chú thích ẩn khỏi screen reader để không đọc lặp. Nhấn: nhấc khỏi trang (hiện là trạng thái tức thời, chưa có chuyển động theo thời gian).

### Nét cường độ
Cường độ 1–5 là đúng n nét bút chì đếm tay (`but-chi`, rộng 2, cao 12–15, nghiêng -4° đến 5°). Không vẽ ô trống cho mức chưa đạt, không cột, không thang.

### Mẩu giấy kẹp (trạng thái Comfort)
Ba trạng thái: không có gì (chưa xin Comfort) / mẩu `kep` ghi "có một lời kẹp ở đây" / mẩu `kep` ghi "đã cảm ơn" (khi mọi Comfort của Entry đã được cảm ơn). Mẩu chờm qua góc dưới phải của tấm, nghiêng -2°, chữ `chu-thich` màu `chu`, có bóng riêng.

### Tờ pơ-luya
Chỉ đặt **giữa** hai đêm, không trước đêm đầu. Cao 10, thân `po-luya`, mép trên 1px cùng tông ở 0.22, chìa quá lề `sm` mỗi bên, nghiêng -0.8°. Không khung, để không bị đọc thành ô nhập.

### Lời từ người lạ (màn một lần khóc, "Lời bạn đã viết")
Bản đầy đủ của mẩu kẹp: tấm `kep` góc vuông, padding `lg`, bóng "nằm trên trang" với elevation 6, thân `than` màu `chu` (đọc được, không viết tay), dòng phụ ("đã dịch tự động", "đã cảm ơn", Tag · trạng thái) bằng `chu-thich` màu `but-chi`. Không nghiêng — lời dài nghiêng thì khó đọc. Màn một lần khóc mở bằng tiêu đề là ngày, rồi tấm Entry đầy đủ Reflection (Timeline cắt ở 6 dòng), rồi nhãn mục "Lời từ người lạ".

### Màn hotline
Tiêu đề, một câu "gọi cấp cứu nếu đang nguy hiểm", rồi từng nước (nhãn mục `ngay`). Mỗi đường dây là một tấm `tam` có bóng: tên (`than`), giờ trực (`phu`), nút "Gọi …" hổ phách cao 64, link trang web gạch chân. Trong mỗi nước: cấp cứu, rồi số trực 24 giờ, rồi số có giờ trực.

### Trang trống
Khung chờ cao tối thiểu 160 với bốn góc dán và hairline `vien-mo`, câu chú thích bút chì canh giữa.

### Bảng năm (màn Lịch)
Ngoại lệ luật Một Trục. 12 cột tháng (`T1`…`T12`) × 31 hàng ngày, cột nhãn ngày bên trái; ô vuông góc 18, khe 3, không viền, không số trên ô, không bấm được. Một ô = **tổng** cường độ các Entry trong ngày đó (ngày theo giờ máy, như Timeline), quy ra 5 mức theo ngưỡng cố định 1–2 · 3–4 · 5–6 · 7–9 · 10+ (`NGUONG` trong `app/src/lich.ts`) và tô bằng `album.lich`. Ngày có thật mà không có Entry là ô `lich[0]`; ngày không tồn tại (30/2…) không tô gì. Nhãn cột/hàng là Patrick Hand 14 màu `but-chi`, line height khít ô vì chỉ là chữ số không dấu. Dưới bảng là chú thích màu: 5 ô kèm ngưỡng. Chọn năm bằng dòng lối "2026 ▾" mở một tấm `tam` trong `Modal` (nền đen 0.6), năm đang chọn màu `chu`, năm khác `but-chi`. Screen reader đọc một nhãn tóm tắt cho mỗi cột tháng, không đọc từng ô.

## Do's and Don'ts

### Do:
- **Do** dùng `album` và `butChi` từ `app/src/theme.ts` cho mọi màn mới hoặc màn đang chuyển world.
- **Do** giữ Reflection và nút bấm ở font hệ thống cỡ `than` / `nut`.
- **Do** cho mọi tờ giấy góc vuông và bóng "nằm trên trang"; nhấn thì "nhấc khỏi trang".
- **Do** biểu diễn cường độ bằng đúng n nét bút chì.
- **Do** giữ lối trợ giúp ở chân màn, cao 64, là chỗ duy nhất có `den`.

### Don't:
- **Don't** dựng lại world xanh mực cũ (`color`, `radius`, `caoVach` đã xoá) hay bo góc bất kỳ tờ giấy nào.
- **Don't** dùng `den` ở bất kỳ đâu ngoài lối trợ giúp (nút ở chân màn và các nút Gọi trên màn hotline).
- **Don't** dùng Patrick Hand cho Reflection hoặc nhãn nút; don't dùng Yomogi cho tiếng Việt.
- **Don't** vẽ biểu đồ, lưới, heatmap hay ô trống cho cường độ — ngoài bảng năm ở màn Lịch.
- **Don't** bo tròn tấm dán hoặc thay bóng bằng viền.
- **Don't** đặt tờ pơ-luya ở đâu khác ngoài giữa hai đêm.
