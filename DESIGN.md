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
  tam-nhac: "#322C27"
  che: "rgba(10, 8, 7, 0.72)"
  dat-nung: "#E38B76"
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
  giay: "6px"
  tay: "14px"
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
    rounded: "{rounded.giay}"
    padding: "4px 16px"
  nut-chinh:
    backgroundColor: "{colors.tam}"
    textColor: "{colors.chu}"
    typography: "{typography.nut}"
    rounded: "{rounded.tay}"
    height: "56px"
  nut-chinh-pressed:
    backgroundColor: "{colors.kep}"
  nut-tro-giup:
    backgroundColor: "{colors.trang}"
    textColor: "{colors.den}"
    typography: "{typography.nut}"
    rounded: "{rounded.tay}"
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
    rounded: "{rounded.tay}"
    padding: "0 16px"
    height: "48px"
  lua-chon-chon:
    backgroundColor: "{colors.chu}"
    textColor: "{colors.trang}"
  o-nhap:
    backgroundColor: "{colors.tam}"
    textColor: "{colors.chu}"
    typography: "{typography.than}"
    rounded: "{rounded.tay}"
    padding: "14px"
  o-nhap-focus:
    borderColor: "{colors.but-chi}"
  nut-phu:
    backgroundColor: "{colors.vien-mo}"
    textColor: "{colors.chu}"
    typography: "{typography.nut}"
    rounded: "{rounded.tay}"
    padding: "0 16px"
    height: "48px"
  hop-thoai:
    backgroundColor: "{colors.kep}"
    rounded: "{rounded.giay}"
    padding: "24px"
  tam-loi:
    backgroundColor: "{colors.kep}"
    rounded: "{rounded.giay}"
    padding: "24px"
  nghe-lai:
    backgroundColor: "{colors.tam}"
    textColor: "{colors.chu}"
    typography: "{typography.nut}"
    rounded: "{rounded.tay}"
    padding: "0 24px"
    height: "56px"
---

# Design System: Tearnote

> **Trạng thái:** mọi màn (`app/src/app/*`) đã ở world "Album ảnh trang đen". Token nằm ở `album` và `pencil` trong `app/src/theme.ts`; mảnh dùng chung (góc dán, tấm Entry, nút chính, nút trợ giúp, dòng lối, nút phụ `SecondaryButton`, lựa chọn, ô nhập `TextField`, footer, dải Nghe lại, hộp thoại `ConfirmDialog`, tấm lời `ComfortCard`) ở `app/src/ui.tsx`. World xanh mực cũ (`color`, `radius`, `caoVach`) đã xoá — đừng dựng lại. Bo góc của world này là `radius` (`paper` 6, `touch` 14), khác `radius` cũ.

## Overview

**Creative North Star: "Cuốn album chỉ mình mở"**

Tearnote là một cuốn album ảnh trang đen để trong ngăn kéo. Mỗi lần khóc là một tấm giấy dán lên trang, giữ bằng bốn góc dán tam giác; ngày tháng ghi bằng bút chì trắng trên trang, chi tiết ghi ngay trên tấm. Comfort là một mẩu giấy nhỏ người lạ lặng lẽ kẹp vào trang. Giữa hai đêm có một tờ giấy pơ-luya mỏng. Tất cả đi theo một trục dọc duy nhất, đọc từ trên xuống như lật album.

Mọi tông đều ấm, lệch về nâu; không có xám xanh, không có trắng tinh. Độ tương phản vừa đủ để đọc qua mắt nhoè lúc 2 giờ sáng rồi dừng lại. Mật độ thưa: khoảng trống giữa các tấm là tín hiệu "không có gì gấp". Chữ viết tay chỉ dùng cho những gì một người sẽ ghi bằng bút chì trên album (tiêu đề, ngày, chú thích, mẩu giấy kẹp); còn thứ phải đọc được (Reflection, nút bấm) là font hệ thống.

Từ chối: danh sách card bo tròn kèm biểu đồ của app mood tracker, và mọi dạng lưới hoặc heatmap — trừ đúng một chỗ: bảng năm ở màn Lịch (xem luật Một Trục). Điều hướng, Back, sheet, switch vẫn theo Material 3 / HIG; world là lớp theming, không thay quy ước nền tảng.

**Key Characteristics:**
- Trang giấy bồi đen ấm; thứ được dán lên trang (tấm, ảnh) vuông với bốn góc dán tam giác; thứ ngón tay chạm thì bo mềm.
- Chiều sâu là bậc sáng `trang` → `tam` → `kep`; bóng chỉ phụ trợ; không dùng viền để tạo lớp.
- Bút chì trắng (Patrick Hand) cho chú thích; font hệ thống cho mọi thứ phải đọc kỹ.
- Cường độ trên tấm là một giọt nước mắt vẽ bút chì, đầy dần theo mức — không phải biểu đồ.
- Hổ phách chỉ có một chỗ: lối trợ giúp.

## Colors

Bảng màu giấy và bút chì trong bóng tối: nâu đen ấm, một tông chữ ngà, một tông bút chì, và đúng một màu được phép nổi.

### Primary
- **Đèn Còn Sáng** (`den`): hổ phách ấm, chỉ cho lối "Cần trợ giúp ngay" (~8:1 trên trang). Viền 1.5px khi nghỉ, tô kín khi nhấn. Cố ý không phải đỏ cảnh báo.

### Báo lỗi
- **Đất Nung** (`dat-nung`, `album.alert` trong theme): đỏ đất nung ấm, chỉ cho lỗi — chữ và viền ô nhập sai, dòng lỗi của form (~7:1 trên trang). Không phải đỏ cảnh báo chói; không dùng cho trạng thái chọn, nhấn mạnh hay trang trí. Không tính là màu nổi thứ hai của luật Một Ngọn Đèn: nó chỉ hiện khi có sự cố.

### Neutral
- **Trang Giấy Bồi** (`trang`): nền mọi màn trong world, và nền footer cố định.
- **Tấm Dán** (`tam`): mặt Entry và nút chính. Sáng hơn trang vừa đủ để thấy nó nằm trên trang.
- **Mẩu Giấy Kẹp** (`kep`): Comfort người lạ kẹp vào tấm. Sáng hơn tấm một nấc.
- **Chữ Ngà** (`chu`): chữ trên tấm (Reflection, nhãn nút), tiêu đề màn. ~11:1 trên tấm.
- **Bút Chì Trắng** (`but-chi`): ngày, chú thích, giọt cường độ, dòng phụ. ~7.8:1 trên trang. Góc dán (`album.corner`) dùng cùng giá trị.
- **Giấy Pơ-luya** (`po-luya`): thân tờ ngăn giữa hai đêm; mép trên của nó là cùng tông ở opacity 0.22.
- **Viền Mờ** (`vien-mo`): đường hairline duy nhất được dùng: mép trên footer, khung trang trống; ngoài hairline, nó là lớp phủ nền của nút phụ, indicator của tab đang mở và nút hành động trong hộp thoại.
- **Tấm Đang Nhấn** (`tam-nhac`): tấm Entry khi đang nhấn — sáng lên giữa `tam` và `kep`.
- **Màn Che** (`che`): nền sau hộp thoại, nền dấu × trên ảnh nhỏ — đen ấm 0.72, không `#000`.
- **Thang Lịch** (`album.calendar`): chỉ cho bảng năm và thanh chọn cường độ ở màn ghi — cả hai cùng nghĩa "nặng hơn". Sáu nấc của cùng tông `chu`, chỉ đổi opacity: ô trống 0.06 (bằng `po-luya`) rồi 5 mức 0.22 / 0.40 / 0.58 / 0.78 / 1. Không thêm sắc độ mới, không dùng `den`.

### Named Rules
**The Một Ngọn Đèn Rule.** `den` chỉ xuất hiện ở lối trợ giúp. Không dùng cho trạng thái chọn, link, badge hay nhấn mạnh. Nếu một màn có hai chỗ hổ phách thì một chỗ sai. **Ngoại lệ duy nhất:** màn hotline (`help.tsx`) chính là lối trợ giúp, nên mỗi nút "Gọi …" là một nút trợ giúp hổ phách.

**The Không Xám Xanh Rule.** Mọi tông trung tính lệch về nâu. Không `#FFFFFF`, không `#000` làm nền.

## Typography

**Display Font:** Patrick Hand (`PatrickHand`) cho tiếng Việt và tiếng Anh, Yomogi (`Yomogi`) cho tiếng Nhật — load ở `_layout.tsx`, Yomogi (~4MB) chỉ load khi app ở tiếng Nhật; load lỗi thì fallback về font hệ thống
**Body Font:** font hệ thống (Roboto trên Android, San Francisco trên iOS), không khai báo family, cùng một family cho mọi ngôn ngữ

**Character:** bút chì viết tay đặt cạnh chữ in sạch. Chữ tay kể bối cảnh; chữ hệ thống mang nội dung.

### Hierarchy
- **Tiêu đề** (`tieu-de`, Patrick Hand): tiêu đề màn, ví dụ "Những lần đã khóc".
- **Ngày** (`ngay`, Patrick Hand): đầu mỗi nhóm đêm, màu bút chì.
- **Chú thích** (`chu-thich`, Patrick Hand): giờ · thời lượng · Tag ở dòng cuối trong tấm; chữ trên mẩu giấy kẹp; câu trang trống.
- **Thân** (`than`, hệ thống): Reflection. Cỡ mặc định của app.
- **Nút** (`nut`, hệ thống, 500): nhãn nút và dòng lối.
- **Phụ** (`phu`, hệ thống): dòng giải thích dưới lối, nhỏ nhất được phép.

### Named Rules
**The Bút Chì Chỉ Để Ghi Chú Rule.** Patrick Hand chỉ cho tiêu đề, ngày, chú thích và mẩu giấy kẹp. Reflection và nút bấm luôn là font hệ thống.

**The Một Family Một Ngôn Ngữ Rule.** Luật này chỉ cho chữ tay: Patrick Hand cho tiếng Việt và tiếng Anh, Yomogi (`app/assets/fonts/Yomogi-Regular.ttf`) cho tiếng Nhật vì Patrick Hand không có kana. Không dùng Yomogi cho tiếng Việt: chữ Latin rộng cố định làm tách chữ có dấu. `pencil` tự đổi family khi đổi ngôn ngữ (`setHandwriting` trong `theme.ts`), nên luôn dùng mảng style `[pencil.x, s.y]` — đừng spread `...pencil.x` vào StyleSheet cấp module. Chữ thân thì ngược lại: một family hệ thống cho mọi ngôn ngữ.

**The Không Dưới 14 Rule.** Không cỡ chữ nào dưới 14; line height rộng (~1.5) vì dấu tiếng Việt chồng hai tầng. Layout phải chịu được font scale hệ thống. **Ngoại lệ có chủ đích:** chrome cố định có trần cỡ chữ — `maxFontSizeMultiplier` 1.6 cho nhãn nút chính, nút trợ giúp, nút hộp thoại; 1.3 cho nhãn thanh điều hướng — để footer không nuốt gần nửa màn ở cỡ chữ 200%; nhãn hàng/cột bảng năm không theo cỡ chữ hệ thống (cao đúng một ô). Nội dung và dòng lối không có trần.

**The Tiêu Đề Tiếng Nhật Rule.** Yomogi 34 chứa ~9 ký tự một dòng ở máy 360dp. Tiêu đề dài hơn thì rút chữ (key dùng chung) hoặc ngắt `\n` trong file dịch ở ranh cụm (chỉ key dùng đúng một chỗ: `ghi.tieuDe`, `viet.tieuDe`, `viet.xongTieuDe`). Không hạ cỡ chữ tay — Yomogi mảnh, nhỏ là mờ.

## Layout

Một cột dọc duy nhất, lề ngang `man` (20). Khoảng giữa các tấm là `lg` (24), và `xl` (40) khi tấm có mẩu giấy kẹp chờm xuống; chú thích nằm trong tấm, cách thân `md` (16). Giữa hai đêm: tờ pơ-luya với `md` phía trên, `xl` phía dưới. Tiêu đề cách nội dung `lg`.

Footer cố định ngoài vùng cuộn (`ScreenFooter` trong `ui.tsx`), **ở mọi màn trừ màn hotline** — ADR 0005 đòi lối trợ giúp hiển thị thường trực: nút chính của màn (Ghi lại nhật ký, Lưu lại, Gửi, Đăng nhập, Tạo tài khoản) rồi nút trợ giúp, cách nhau `sm`, padding trên/dưới 12, tách khỏi trang bằng **một** hairline `vien-mo` — thanh điều hướng không có hairline riêng. Màn có hành động chính thì nút đó luôn ở footer, không ở cuối vùng cuộn; ngoại lệ là "Nhận một lời từ người lạ", nằm trong trang (ADR 0007: app không đẩy). Ba màn Nhật ký, Lịch, Cài đặt là tab: dưới footer có thêm thanh điều hướng, không có "Quay lại". Màn khác kết thúc vùng cuộn bằng dòng lối "Quay lại". Màn có ô nhập bọc nội dung trong `KeyboardAvoidingView` (behavior `padding`, chỉ bật trên Android): Android edge-to-edge không tự co cửa sổ, thiếu nó là bàn phím che ô đang gõ. Trên iOS vùng cuộn tự chèn khoảng bàn phím và cuộn ô đang gõ lên (`automaticallyAdjustKeyboardInsets`), và mỗi lần gõ thì `FormScrollView` trong `ui.tsx` kéo ô đang gõ trở lại trên bàn phím (kể cả khi người dùng đã cuộn đi, hay ô nhiều dòng cao dần); footer nằm dưới bàn phím tới khi ẩn bàn phím. Màn có nhập liệu (ghi lần khóc, viết lời) hỏi lại bằng hộp thoại trước khi rời nếu còn chữ, ảnh hay ghi âm chưa lưu. Form: Enter ở ô giữa chuyển sang ô kế (`next`), ô cuối gửi (`go`). Vùng bấm tối thiểu 48, nút chính 56, trợ giúp 64 (`touch` trong theme). Mở lại app thì cuộn thẳng tới đêm của Entry mở gần nhất, không animate; lưu xong một lần khóc thì cuộn tới đêm của nó.

### Named Rules
**The Một Trục Rule.** Không lưới, không cột, không heatmap. Mọi thứ nằm trên một trục dọc theo thời gian. **Ngoại lệ duy nhất:** bảng năm ở màn Lịch — chủ repo chọn lưới vì nhìn cả năm một lượt mới thấy được mùa nào dày, tháng nào thưa. Ngoại lệ không lan sang màn khác; Timeline vẫn là một trục.

## Elevation & Depth

Chiều sâu là bậc sáng `trang` → `tam` → `kep`. Bóng giữ làm phụ trợ, nhưng đo trên máy thật nó chỉ lệch ~2/255 trên `trang` — đừng dựa vào bóng để nói "nổi". Nhấn là **sáng lên một bậc**: tấm Entry sang `tam-nhac` (kèm nhấc −3), nút chính / dải Nghe lại / lựa chọn sang `kep`. Không dùng viền để tạo lớp (viền focus của ô nhập là trạng thái, không phải lớp).

### Shadow Vocabulary
- **Nằm trên trang** (`shadowColor #000, offset 0/3, opacity 0.45, radius 6, elevation 3`): tấm Entry, dải Nghe lại, mẩu giấy kẹp, tấm lời, card hotline, hộp thoại (mẩu kẹp, tấm lời và hộp thoại dùng elevation 6). Nút chính không có bóng.
- **Nhấc khỏi trang** (`translateY -3, offset 0/8, opacity 0.6, radius 12, elevation 10`): trạng thái nhấn của tấm Entry (cùng nền `tam-nhac`).

### Named Rules
**The Bóng Là Giấy Rule.** Bóng chỉ để nói "tờ giấy này nằm trên trang". Mềm, thấp, đen, không lệch cứng, không màu.

## Shapes

**Giấy vuông, tay mềm.** Thứ có góc dán (tấm Entry, ảnh nhỏ ở màn ghi, khung chờ) góc vuông — góc dán 14 che mọi bo ≤ 10, bo ≥ 12 làm góc tấm lùi khỏi góc dán và mất silhouette. Thứ ngón tay chạm (nút chính, nút trợ giúp, nút phụ, lựa chọn, ô nhập, dải Nghe lại, indicator của tab, nút hộp thoại) bo `radius.touch` 14. Giấy rời không góc dán (mẩu kẹp, tấm lời, card hotline, hộp thoại, polaroid trên tấm) bo `radius.paper` 6. Hình tròn (đĩa play, thumb, dấu ×) là hình, không phải mức bo. Không mức nào khác ngoài hai mức này và ba ngoại lệ cục bộ: ô bảng năm bo 3, ảnh trong khung polaroid bo 3 (nửa bo khung, để góc ảnh theo góc khung), đoạn thanh cường độ bo 4. Không viên thuốc (bo ≥ 20). Hình tam giác của bốn góc dán (14 trên tấm, 10 trên ảnh nhỏ, chìa ra 2 ngoài mép) là silhouette nhận diện của world — góc dán chỉ ở thứ được dán, không bao giờ trên nút. Nét bút chì là thanh 2px bo 1. Bất đối xứng nhỏ có chủ đích: mẩu kẹp nghiêng -2°, pơ-luya nghiêng -0.8°, kẹp giấy trên tấm lời 8°, polaroid theo vị trí -3° · 2° · -1.5°.

## Components

### Buttons
- **Nút chính** ("Ghi lại nhật ký", "Lưu lại", "Gửi", "Đăng nhập", "Tạo tài khoản"): nền `tam`, bo 14, không góc dán, không bóng, chữ `nut` màu `chu`; nhấn thì nền sáng lên `kep`. Ở footer. Khi chờ lâu (xin lời) thì kèm chữ cạnh spinner ("Đang tìm một lời…").
- **Nút trợ giúp** ("Cần trợ giúp ngay"): viền `den` 1.5px trên nền trang, bo 14, icon `lifebuoy` 24 trước nhãn, chữ và icon `den`; nhấn thì tô kín `den`, chữ và icon chuyển `trang`. Luôn ở footer, luôn cùng chỗ. Nút "Gọi …" ở màn hotline cùng kiểu, icon `phone-outline`.
- **Dòng lối** (ví dụ "Viết một lời cho người lạ", "Lời bạn đã viết", "Quay lại"): không nền, không viền, cả hàng là vùng bấm; nhãn `nut` màu `chu`, dòng giải thích `phu` màu `but-chi` (tối đa 320 rộng). `icon` (24, `chu`) đứng trước khi lối làm một việc ngay (Quay lại / Để sau `arrow-left`, Đăng xuất `logout`, Thôi `close`, Xoá `trash-can-outline`, Thử lại `refresh`); `mui` (chevron phải 24, `but-chi`) ở cuối khi lối dẫn sang màn khác. Nhấn thì mờ 0.6. Screen reader đọc nhãn, dòng giải thích là hint.
- **Nút phụ** (`SecondaryButton`): hành động tại chỗ (Chụp ảnh, Chọn ảnh, Ghi âm, Dừng ghi, Bỏ ghi âm, Cảm ơn, Thu hồi): mảnh nền `vien-mo` bo 14 cao 48, icon 20 `but-chi` tuỳ chọn, chữ `nut` `chu`; nhấn mờ 0.6; hết lượt thì mờ 0.35 và tắt, không ẩn (vị trí không nhảy).

### Hộp thoại (`ConfirmDialog`)
Thay mọi `Alert` hệ thống (Alert Android trắng giữa app tối; làm nó tối cần `expo-system-ui`). `Modal` của RN core: tờ `kep` bo 6 neo đáy, nền che `che`; câu hỏi `ngay` màu `chu` (header), câu phụ `than` màu `but-chi`; hai nút full-width cao 56 bo 14 xếp dọc — hành động ("Bỏ", "Xoá", "Thoát", "Thu hồi"; nền `vien-mo`, chữ `chu`) ở trên, nút an toàn ("Giữ lại", "Ghi tiếp", "Viết tiếp"; tô `chu`, chữ `trang`) ở **dưới cùng**, dưới ngón cái: muốn bỏ thì phải với lên. Chạm nền / Back = nút an toàn. Không đỏ, không chữ hoa.

### Thanh điều hướng (`app/src/app/(tabs)/_layout.tsx`)
Dưới cùng, sau footer; nền `trang`, **không** hairline riêng (hairline của footer đã tách trang), padding theo inset đáy. Bốn mục chia đều: Nhật ký · Viết lời (en "For strangers", ja "見知らぬ人へ" — en/ja không dùng động từ "viết" để khỏi trùng nút "Ghi lại nhật ký") · Lịch · Cài đặt — icon MaterialCommunityIcons 24 trong khung indicator 56×32 bo 14, trên nhãn `phu` (trần cỡ chữ 1.3), vùng bấm tối thiểu 48; mục canh trên để nhãn hai dòng không lệch icon. Mục đang mở: khung tô `vien-mo` + icon tô đặc + màu `chu`; mục khác: icon viền, màu `but-chi`. Nhấn thì mờ 0.6. "Viết lời" (icon `note-edit-outline`) không phải tab — nó mở màn viết đè lên (không có thanh này). Không dùng `den`.

### Lựa chọn và ô nhập (màn ghi, viết lời, đăng nhập)
- **Lựa chọn** (Tag, thời điểm, thời lượng, ngôn ngữ): mảnh `tam` bo 14 cao 48, chữ `nut` màu `but-chi`; nhấn thì nền `kep` (đang chọn thì mờ 0.85). Lựa chọn ngôn ngữ (Cài đặt; "Bạn viết bằng tiếng gì?" ở màn viết lời) ghi tên ngôn ngữ bằng chính nó: Tiếng Việt · English · 日本語. Chọn thì tô `chu`, chữ đổi sang `trang` — tương phản đủ để thấy qua mắt nhoè mà không cần màu thứ hai. Hết lượt chọn thì các lựa chọn còn lại mờ 0.35. Screen reader: chọn một là `radio`, chọn nhiều (Tag) là `checkbox`.
- **Nhãn mục** ("Lúc nào?", "Vì chuyện gì?"): `ngay` (Patrick Hand) màu `but-chi`, role header.
- **Chọn cường độ**: slider tự viết (Gesture Responder của RN core), vùng chạm cao 48 chiếm hết bề ngang. Thanh là 5 đoạn cao 8, gap 3, bo 4; đoạn tới mức đã chọn tô `album.calendar[1..5]` (đậm dần về cuối), đoạn trên mức là `vien-mo`. Thumb tròn 28 màu `chu`, viền 2 màu `trang` như khoét khỏi thanh, bóng "nằm trên trang", tâm ở giữa đoạn đang chọn. Kéo hoặc chạm, bắt vào 5 nấc; cạnh đó là giọt cường độ xem trước (đầy dần khi kéo — đúng hình sẽ nằm trên tấm) rồi "3 / 5" bằng `chu-thich`. Screen reader: `adjustable`, vuốt lên/xuống để tăng/giảm.
- **Ô nhập** (`TextField`, mọi ô dùng nó): nền `tam`, bo 14, chữ `than` màu `chu`, placeholder và con trỏ `but-chi`. Viền 2px luôn có — trong suốt khi nghỉ, `but-chi` khi đang gõ (focus thấy được mà không xê dịch chữ). Validate sai (prop `error`): viền `dat-nung`, ngay dưới ô (cách `xs`) là icon `alert-circle-outline` 18 + câu lỗi `phu` màu `dat-nung`; screen reader được đọc câu lỗi khi bấm gửi. Mỗi lần gửi chỉ báo lỗi đầu tiên. Lỗi từ server (sai mật khẩu, mất mạng…) vẫn là dòng `than` màu `dat-nung` cuối form. Ô Reflection ở màn ghi cao cố định 3 dòng `than`; viết dài hơn thì cuộn bên trong ô, không đẩy phần còn lại của form xuống.
- **Kèm ảnh hay ghi âm** (màn ghi, sau ô Reflection): ba nút phụ có icon "Chụp ảnh" (`camera-outline`) · "Chọn ảnh" (`image-outline`) · "Ghi âm" (`microphone-outline`) nằm một hàng (xuống dòng khi chật), gap `sm`, luôn hiện. Ảnh đã chọn là ảnh nhỏ vuông 96, hạ sáng 0.85, góc dán 10 vẽ **đè** lên mép ảnh như ảnh thật giữ trong album, dấu × tròn 24 nền `che` ở góc trên phải (trang trí; cả ảnh là một vùng bấm), gap giữa các ảnh 12; bấm ảnh thì hộp thoại "Bỏ ảnh này?" (Bỏ / Giữ lại). Đủ 3 ảnh thì hai nút ảnh mờ 0.35; đang ghi thì cả ba mờ. Đang ghi: chú thích `chu-thich` màu `chu` "Đang ghi âm · 0:12 / 5:00", dưới là nút phụ "Dừng ghi"; ghi xong thì thay bằng dải Nghe lại và nút phụ "Bỏ ghi âm".
- **Nút gạt** (Cài đặt): Switch của nền tảng; bật: track `but-chi`, thumb `chu`; tắt: track `kep`, thumb `but-chi`. Cả hàng (nhãn + dòng phụ + công tắc) là một vùng bấm role `switch`.
- **Ngôn ngữ** (cuối Cài đặt): nhãn mục `ngay` màu `but-chi` "Ngôn ngữ" rồi một hàng lựa chọn (chọn một). Bấm là cả giao diện render lại ở ngôn ngữ mới, vẫn đứng ở Cài đặt.

### Tấm Entry (signature)
Tấm giấy góc vuông `tam`, padding `lg`, bốn góc dán, bóng thấp. Có ảnh thì ảnh nằm đầu tấm, cách thân `md`, hạ sáng 0.85 (ảnh chụp sáng rực giữa trang đen lúc 2 giờ sáng là chói). Mọi ảnh (tối đa 3) là polaroid rời xếp một hàng — ảnh vuông cắt 1:1 bo 3 trong khung `but-chi` (không trắng: chói), padding 5 và đáy 16, bo `radius.paper` 6, rộng tối đa 120, chồng lên tấm trước 10, nghiêng theo vị trí, bóng thấp — ở Timeline lẫn màn một lần khóc, để chữ không bị ảnh đẩy xuống. Màn một lần khóc: mỗi polaroid là một nút riêng (nằm ngoài vùng đọc gộp, nhấn mờ 0.6); chạm thì ảnh hiện lớn đúng tỉ lệ (khung ảnh vừa đúng tấm ảnh, bo `radius.paper` 6; không hạ sáng — ở 0.85 trang phía sau lộ qua ảnh) giữa nền `che` phủ cả màn, dấu × 28 `chu` ở góc trên phải; chạm bất kỳ đâu hay Back để đóng. Thân là Reflection (tối đa 6 dòng); không có Reflection thì Tag là thân và chú thích không lặp Tag. Dòng cuối **trong** tấm, cách thân `md`, là chú thích bút chì (giờ · thời lượng · Tag · "n ảnh" · "ghi âm" — viết thường hết, kể cả Tag: "09:04 · nửa tiếng · chuyện gia đình"; Tag chỉ giữ chữ hoa đầu khi làm thân tấm) và, cuối dòng đầu của nó, giọt cường độ — nằm trong tấm để không lơ lửng giữa hai tấm, lẫn sang tấm bên dưới. Ở Timeline toàn tấm là một vùng bấm (ở màn một lần khóc: một vùng đọc, không "bấm được") với nhãn screen reader gộp đủ Reflection, chú thích, cường độ và trạng thái Comfort; dòng chú thích ẩn khỏi screen reader để không đọc lặp. Nhấn: nền sáng lên `tam-nhac` và nhấc −3 (trạng thái tức thời, chưa có chuyển động theo thời gian).

### Giọt cường độ
Cường độ 1–5 trên tấm là **một** giọt nước mắt SVG (`TearDrop` trong `app/src/ui.tsx`, `react-native-svg`), khung 20×28, viền `but-chi` 1.5 hơi lệch hai bên như vẽ tay; phần trong tô `but-chi` đầy dần theo mức — 1 là đáy giọt, 5 là đầy — mặt nước gợn nhẹ để đọc thành nước chứ không thành thanh đo. Không đếm nét, không cột, không đặt nhiều giọt cạnh nhau.

### Mẩu giấy kẹp (trạng thái Comfort)
Ba trạng thái: không có gì (chưa xin Comfort) / mẩu `kep` ghi "có một lời kẹp ở đây" / mẩu `kep` ghi "đã cảm ơn" (khi mọi Comfort của Entry đã được cảm ơn). Mẩu chờm qua góc dưới phải của tấm, bo 6, nghiêng -2°, chữ `chu-thich` màu `chu`, có bóng riêng.

### Tờ pơ-luya
Chỉ đặt **giữa** hai đêm, không trước đêm đầu. Cao 10, thân `po-luya`, mép trên 1px cùng tông ở 0.22, chìa quá lề `sm` mỗi bên, nghiêng -0.8°. Không khung, để không bị đọc thành ô nhập.

### Lời từ người lạ (màn một lần khóc, "Lời bạn đã viết")
Bản đầy đủ của mẩu kẹp (`ComfortCard`): tấm `kep` bo 6, padding `lg`, bóng "nằm trên trang" với elevation 6, một chiếc kẹp giấy (`paperclip` 32, `but-chi`, nghiêng 8°) cắm ở mép trên trái, nhô 16; thân `than` màu `chu` (đọc được, không viết tay), dòng phụ ("đã dịch tự động", "đã cảm ơn", Tag · trạng thái) bằng `chu-thich` màu `but-chi`. "Cảm ơn" và "Thu hồi" là nút phụ. Không nghiêng — lời dài nghiêng thì khó đọc. Màn một lần khóc mở bằng tiêu đề là ngày, rồi tấm Entry đầy đủ Reflection và hàng polaroid (Timeline cắt ở 6 dòng), rồi dải Nghe lại nếu có ghi âm, rồi nhãn mục "Lời từ người lạ"; cuối trang là dòng lối "Xoá lần khóc này" rồi "Quay lại".

### Nghe lại (ghi âm của một lần khóc)
Dải giấy `tam` cao 56, bo 14, bóng "nằm trên trang", **không** góc dán (nó để bấm, không phải thứ được dán). Trái sang phải: đĩa tròn 36 màu `chu` chứa icon play / pause 22 màu `trang`, nhãn `nut` "Nghe lại" / "Tạm dừng", thời gian `chu-thich` màu `but-chi` sát phải ("0:42"; đang phát thì "0:12 / 0:42"). Nhấn: nền `kep`. Nằm **ngoài** tấm Entry: tấm là một vùng đọc gộp cho screen reader, nút bên trong sẽ bị nuốt. Screen reader đọc "Nghe lại đoạn ghi âm, dài 42 giây".

### Màn hotline
Tiêu đề, một câu "gọi cấp cứu nếu đang nguy hiểm", rồi từng nước (nhãn mục `ngay`). Mỗi đường dây là một tấm `tam` bo 6 có bóng: tên (`than`), giờ trực (`phu`), nút "Gọi …" viền hổ phách cao 64 bo 14 kèm icon `phone-outline` (mọi nút Gọi cùng kiểu, không tô kín nút đầu), link trang web gạch chân. Trong mỗi nước: cấp cứu, rồi số trực 24 giờ, rồi số có giờ trực. Thứ tự nước: vùng của máy nếu có trong danh sách, không thì theo ngôn ngữ app (vi → VN, ja → JP, en → US), các nước còn lại giữ thứ tự (`topCountry` trong `hotlines.ts`). Danh sách luôn phẳng, đủ mọi nước, không gọi mạng.

### Trang trống
Khung chờ cao tối thiểu 160 với bốn góc dán và hairline `vien-mo`, câu chú thích bút chì canh giữa.

### Xoá một lần khóc
Dòng lối `trash-can-outline` "Xoá lần khóc này" cuối màn một lần khóc, trước "Quay lại". Hỏi lại bằng hộp thoại; câu phụ nói rõ mất gì (và lời người lạ nếu có). Xoá thật khỏi máy, kể cả file ảnh và ghi âm. Không đỏ, không thùng rác, không hoàn tác, không hỏi lý do.

### Bảng năm (màn Lịch)
Ngoại lệ luật Một Trục. 12 cột tháng × 31 hàng ngày, cột nhãn ngày bên trái; nhãn cột theo ngôn ngữ và không quá ~22 rộng để vừa ô: `T1`…`T12` (vi), `J F M …` (en), `1`…`12` (ja — "10月" không vừa); ô chữ nhật rộng theo cột (~26×16 ở 411dp), cao 16, gap 2, bo 3 — vừa đủ 31 hàng trong một màn Pixel 6 — không viền, không số trên ô, không bấm được. Một ô = **tổng** cường độ các Entry trong ngày đó (ngày theo giờ máy, như Timeline), quy ra 5 mức theo ngưỡng cố định 1–2 · 3–4 · 5–6 · 7–9 · 10+ (`THRESHOLDS` trong `app/src/calendar.ts`) và tô bằng `album.calendar`. Ngày có thật mà không có Entry là ô `calendar[0]`; ngày không tồn tại (30/2…) không tô gì. Nhãn cột/hàng là Patrick Hand 14 màu `but-chi`, line height khít ô vì chỉ là chữ số không dấu, không theo cỡ chữ hệ thống (ở 200% "10" còn "1"). Hôm nay (bảng năm hiện tại): ô có vòng 1.5 — `chu` khi mức < 3, `trang` khi mức ≥ 3 — và nhãn tháng / ngày của hôm nay màu `chu`. Dưới bảng là dòng "Tổng cường độ trong ngày" rồi chú thích màu: 5 ô kèm ngưỡng. Năm nằm cùng hàng với tiêu đề, bên phải: một năm thì chỉ là chữ; từ hai năm trở lên thì `‹ 2026 ›` (nút 48×48, hết đầu / cuối thì mờ 0.35). Không có hộp chọn năm. Screen reader đọc một nhãn tóm tắt cho mỗi cột tháng, không đọc từng ô.

## Do's and Don'ts

### Do:
- **Do** dùng `album` và `pencil` từ `app/src/theme.ts` cho mọi màn mới hoặc màn đang chuyển world.
- **Do** giữ Reflection và nút bấm ở font hệ thống cỡ `than` / `nut`.
- **Do** giữ vuông thứ có góc dán, bo 14 thứ ngón tay chạm, bo 6 giấy rời; nhấn thì sáng lên một bậc.
- **Do** biểu diễn cường độ trên tấm bằng một giọt nước mắt đầy dần.
- **Do** giữ lối trợ giúp ở footer, cao 64, là chỗ duy nhất có `den`.

### Don't:
- **Don't** dựng lại world xanh mực cũ (`color`, `radius`, `caoVach` đã xoá); don't bo tấm có góc dán; don't gắn góc dán lên nút.
- **Don't** dùng `Alert` hệ thống — dùng `ConfirmDialog`; don't dùng màu đỏ cho thao tác xoá / bỏ.
- **Don't** dùng `den` ở bất kỳ đâu ngoài lối trợ giúp (nút ở footer và các nút Gọi trên màn hotline).
- **Don't** dùng Patrick Hand cho Reflection hoặc nhãn nút; don't dùng Yomogi cho tiếng Việt.
- **Don't** vẽ biểu đồ, lưới, heatmap hay ô trống cho cường độ — ngoài bảng năm ở màn Lịch.
- **Don't** dùng viền để tạo lớp (viền focus của ô nhập là trạng thái); don't dùng hình viên thuốc (bo ≥ 20).
- **Don't** đặt tờ pơ-luya ở đâu khác ngoài giữa hai đêm.

## Lịch sử thay đổi

- 2026-10-07 — Review toàn app (ba vai visual / UX / nội dung thảo luận ba vòng; quyết định chi tiết ở `tearnote-evidence/review-2026-10-06/design/decisions.md`, ngoài repo): "giấy vuông, tay mềm" (`radius.touch` 14 / `radius.paper` 6), nút chính bỏ góc dán và sáng lên khi nhấn, `ConfirmDialog` thay Alert, `TextField` có focus, `SecondaryButton`, tấm lời có kẹp giấy, nút chính của mọi màn ở footer, hỏi lại trước khi rời màn có nhập liệu, xoá một lần khóc, Lịch đủ 31 hàng + hôm nay, hotline đưa nước của máy lên đầu.
