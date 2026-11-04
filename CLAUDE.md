# CLAUDE.md — Tearnote

**Trạng thái: schema đã deploy, app chạy được lát cắt Entry + Comfort. Chưa launch.**
File này cố tình ngắn. Mỗi khi chốt một quyết định hoặc làm xong một tầng, cập nhật đúng mục tương ứng bên dưới — không viết trước.

## Sản phẩm

<!-- 2-3 câu: app làm gì, cho ai, ràng buộc lớn nhất. Không có mục này thì
     mọi quyết định kỹ thuật bên dưới đều không kiểm chứng được. -->

Tearnote là app nhật ký cảm xúc ghi lại các cơn khóc, giúp người dùng nhận ra pattern cảm xúc của mình theo thời gian — và nhận lại lời động viên ẩn danh từ người lạ từng trải qua điều tương tự. Đa ngôn ngữ (Anh, Việt, Nhật). Xem docs/overview.md.

## Quyết định đã chốt

<!-- Chỉ ghi cái ĐÃ quyết. Chưa quyết thì để "chưa chốt" — đừng đoán hộ.
     Mỗi dòng kèm lý do ngắn, để sau này biết khi nào được phép đổi. -->

| Hạng mục | Chọn | Vì sao |
|---|---|---|
| Nền tảng (web / mobile / cả hai) | Mobile native, Android trước, iOS sau | Bối cảnh dùng là điện thoại lúc nửa đêm — cần notification, ghi âm, khoá app. Xem ADR 0001 |
| Ngôn ngữ + framework | TypeScript + React Native (Expo managed) | Dev trên Windows không build được iOS tại máy; Expo + EAS build cloud. Xem ADR 0001 |
| Lưu trữ dữ liệu | Local-first (SQLite trên máy); sync lên server là opt-in, cần đăng nhập | Entry là dữ liệu tâm lý nhạy cảm. Xem ADR 0004 |
| Auth | Supabase anonymous auth cho phần nhật ký; tài khoản thật bắt buộc để **viết** Comfort hoặc bật sync | Không ép đăng ký để dùng app, nhưng viết cho người lạ đọc thì cần danh tính bền. Xem ADR 0002, 0004, 0006 |
| Backend | Supabase (Postgres + auth + storage). Xem ADR 0006 | Server chỉ làm 4 việc nhỏ, không đáng tự build |
| Test runner | jest-expo | Đi kèm Expo, không thêm dependency |
| Package manager | npm, kèm `legacy-peer-deps` | Mặc định của Expo; pnpm hay vỡ với native module RN. `app/.npmrc` bật `legacy-peer-deps` vì expo 57 kéo react-dom 19.3 còn RN 0.86 pin react 19.2 — không có nó thì mọi `npm i` đều ERESOLVE |
| Chạy app khi máy tính tắt | EAS Update vào Expo Go: `expo-updates`, project `@quangtm/tearnote`, `runtimeVersion` policy `sdkVersion` (ra `exposdk:57.0.0`). Publish bản update mới: `cd app; npx eas-cli update --branch preview --environment preview --message "<msg>"`, mở trong Expo Go (đăng nhập tài khoản `quangtm`) › project › branch `preview` | User dùng iOS, không có Apple Developer nên không build được app iOS. Expo Go chỉ nhận update có runtime `exposdk:<sdk>`; policy `appVersion` thì Expo Go từ chối. `--environment preview` bỏ qua `app/.env`: biến `EXPO_PUBLIC_SUPABASE_*` lấy từ EAS env `preview` (`eas env:list preview`); đổi `.env` thì sửa cả bên đó |
| Visual world | "Album ảnh trang đen": `album` + `pencil` trong `app/src/theme.ts` | Chọn qua `/impeccable` (thay world một-bit — bị bỏ vì lạnh, retro, khó đọc); hướng chi tiết ở `.impeccable/surfaces/`. Đã phủ mọi màn; component dùng chung ở `app/src/ui.tsx`, world cũ đã xoá |
| Lưới / heatmap | Chỉ bảng năm ở màn Lịch — ngoại lệ duy nhất của luật Một Trục (DESIGN.md) | Nhìn cả năm một lượt mới thấy mùa nào dày. Màu = tổng cường độ trong ngày, ngưỡng cố định ở `app/src/calendar.ts` để màu cùng nghĩa giữa các năm |
| Từ vựng trên UI | "lần khóc" thay "Entry", "lời từ/cho người lạ" thay "Comfort"; bản en/ja ("a cry", "words from/for a stranger"; "泣いたこと", "見知らぬ人から/へのことば") cũng ở PRODUCT.md | Screen reader đọc chữ Anh sai giữa câu Việt; các khái niệm khác vốn đã Việt hoá trên UI |
| Nhãn Tag | Cột `vi` / `en` / `ja` của `docs/tags.md`, trùng từng chữ với `TAG_LABEL` trong `app/src/tags.ts` (có test check); en/ja dịch theo nghĩa cột vi | Nhãn quyết định người viết và người nhận hiểu Tag giống nhau, kể cả khi khác ngôn ngữ — đổi nhãn là đổi contract |
| Danh sách Tag (server: Change 23, app: Change 24) | Bảng `tags` trên Supabase (id cố định, `labels` jsonb, `sort`, `kind` sad/joy/unknown, `active`), admin sửa qua dashboard; `comforts`/`entries.tags` thành `text[]` + trigger kiểm tồn tại; app chép về SQLite + bản đóng gói `TAGS_BUNDLED`, tải cả bảng mỗi lần mở app; hàng nhanh đếm từ `entries` trên máy. Xem ADR 0009 | Thêm/ẩn chuyện không cần migration hay bản phát hành. Server: `0003_tags_table.sql` (đã apply + verify 2026-11-03, docs/db.md), trigger `tags_guard` cấm xoá / đổi id / thiếu nhãn. Khi app đọc bảng (Change 24) thì thay hàng "Nhãn Tag", mục Contract và "Contract Tag nằm ở ba chỗ" |
| Đa ngôn ngữ | File dịch TS tự viết ở `app/src/i18n/` (`vi.ts` là khuôn; `en.ts` / `ja.ts` thiếu key thì tsc đỏ), không thư viện. Mặc định theo ngôn ngữ máy (`I18nManager` / Intl của RN), máy dùng tiếng khác ⇒ `en`; đổi được ở Cài đặt (`settings.language`). Đổi = ghi đè `t` tại chỗ rồi đổi `key` của Stack ở `_layout` gốc | Không thêm dependency (không i18next, không expo-localization); ba ngôn ngữ không cần plural rules. Đổi `key` remount mọi màn mà vẫn giữ màn đang đứng. iOS chưa test: lệch ngôn ngữ máy thì thay bằng expo-localization |
| `source_lang` khi viết lời | Người viết chọn ở màn viết ("Bạn viết bằng tiếng gì?"), mặc định là ngôn ngữ app | Dùng app tiếng Nhật vẫn có thể viết tiếng Việt; `source_lang` sai là batch dịch sai nguồn |
| Điều hướng | `Tabs` của `expo-router/js-tabs`, thanh tự viết; tab = Nhật ký · Viết lời · Lịch · Cài đặt (`app/src/app/(tabs)/`); "Viết lời" (en "For strangers", ja "見知らぬ人へ", icon `note-edit-outline`) là màn "Lời cho người lạ" (`(tabs)/strangers.tsx`, route `strangers` để khỏi lẫn với `comfort/write`): giới thiệu, dòng lối "Lời bạn đã viết", nút chính "Viết một lời" mở `comfort/write` đè lên — riêng **nhãn tab** en/ja không dùng động từ "viết" để khỏi trùng nút "Ghi lại nhật ký" (nút "Write to a stranger" / 「見知らぬ人に書く」 thì được). Icon: `@expo/vector-icons` (MaterialCommunityIcons) | Thanh mặc định cao cố định 49, nhãn dưới 14 — vỡ luật chữ của DESIGN.md. Change 19 (audit UX): tab Viết lời là trang đầu cho phần lời người lạ (thay 2 dòng ở Cài đặt); màn viết vẫn mở chồng nên giữ nguyên luồng đăng nhập / Gửi / Xong |
| Dropdown / select | Tự viết bằng `Modal` của RN core, không thêm `@react-native-picker/picker` | Không thêm dependency; style được theo world album |
| Slider (chọn cường độ) | Tự viết bằng Gesture Responder của RN core trong `app/src/app/new.tsx`, không thêm `@react-native-community/slider`; màu đoạn dùng lại `album.calendar[1..5]` | Không thêm dependency; slider có sẵn không tô thanh nhiều nấc màu được |
| Icon SVG tự vẽ | `react-native-svg` (cài bằng `npx expo install`); icon là component `.tsx` dùng `Svg`/`Path` ngay trong source, không thêm `react-native-svg-transformer` | RN không tự vẽ SVG; Expo Go có sẵn native của gói này. Viết path trong `.tsx` thì không phải sửa metro config |
| Ảnh & ghi âm trong lần khóc | `expo-image-picker` (thư viện + chụp trong app), `expo-audio`, `expo-file-system`; tối đa 3 ảnh + 1 ghi âm ≤ 5 phút; Timeline hiện mọi ảnh thành hàng polaroid (DESIGN.md › Tấm Entry) | Chụp trong app thì ảnh thường không vào thư viện máy. File nằm cache tới lúc Lưu mới chép vào `attachments/`, `path` lưu tương đối (docs/db.md) |
| Font | `expo-font` + Patrick Hand (OFL) cho tiêu đề/chú thích tiếng Việt và tiếng Anh, Yomogi cho tiếng Nhật — Yomogi (~4MB) chỉ load khi app ở tiếng Nhật; Reflection và nút bấm là font hệ thống | Yomogi rộng cố định với chữ Latin nên tách chữ có dấu ("l ần"); Patrick Hand không có kana |
| Theo dõi bug / thay đổi | Google Sheet `TearNote-Bug-Change`: tab Bug → `/check-bug`, tab Change → `/check-change` (`.claude/skills/`) | Mỗi mục một nhánh + PR (`fix/bug-<ID>` commit `fix(bug-<ID>): ...`; `change/<ID>` commit `<type>(change-<ID>): ...`); Claude ghi sheet qua Zapier, user xác nhận |
| `@react-native/jest-preset` pin đúng version RN | `0.86.3`, không để `^` | `legacy-peer-deps` cho npm tự lấy 0.87.1 và jest chết ngay. Upgrade RN thì upgrade cả gói này |
| Hình khối | Token `radius` trong `app/src/theme.ts`: có góc dán ⇒ vuông; ngón tay chạm ⇒ `radius.touch` 14; giấy rời ⇒ `radius.paper` 6; hình tròn không tính | Góc dán che mọi bo ≤ 10, bo lớn làm mất silhouette; bo phân vai điều khiển ↔ nội dung. Review 2026-10-06, DESIGN.md › Shapes |
| Lối trợ giúp | Nút nổi `HelpFab` (gắn bởi `ScreenFooter` trong `app/src/ui.tsx`) ở mọi màn trừ hotline; kéo bằng `PanResponder` của RN core, thả thì hít mép trái/phải, vị trí lưu `settings.help_fab_position` (JSON `{side, lift}`, `lift` tính từ đáy vùng màn để nút cùng chỗ trên mọi màn; parse bằng zod `fabPosition`); footer chỉ còn nút chính. Màn mới có ScrollView thì spread `{...fabScrollProps}` (FormScrollView tự có) và chừa `FAB_CLEARANCE` ở cuối; chỉ cuộn bằng tay mới thu nút, `scrollTo` thì không | Audit UX 2026-10-27 (Change 16): nút trợ giúp 64 trong footer chiếm chỗ của nút chính; user muốn kéo nút tới chỗ hợp tay. Không thêm dependency. Vị trí FAB đo bằng `measure()` vì con `absolute` nằm trong padding của SafeAreaView còn `onLayout` thì tính từ ngoài. ADR 0005 |
| Nút chính ≠ lựa chọn; viền ô nhập; focus | Nút chính nền `album.clip`, nhấn `album.clipPressed`; Pill chưa chọn nền `album.hairline`; ô nhập viền `album.fieldBorder` (pencil 60%) lúc nghỉ; vòng focus `outline` pencil 2px cách 2px qua `FocusPressable` (`app/src/ui.tsx`); trần cỡ chữ 2.0 nút chính / trợ giúp / hộp thoại, 1.5 nhãn tab | Audit UX 2026-10-27 (Change 15): nút chính và lựa chọn chưa chọn trông như nhau; viền ô trong suốt hỏng WCAG 1.4.11; trần 1.6 chưa đủ 200% của WCAG 1.4.4. Nhãn tab chỉ 1.5 vì 4 cột chia đều, `accessibilityLabel` vẫn mang đủ tên. `outline` nằm ngoài layout nên focus (bàn phím / D-pad) không xê dịch gì |
| Dải báo xác nhận | `showSnackbar(text, kind?)` trong `app/src/ui.tsx` (store cấp module + `SnackbarHost` gắn một lần ở `app/src/app/_layout.tsx`), không thêm dependency; ở đầu màn, dưới `TopBar` nếu màn có (TopBar đếm màn đang focus); icon `check` / `trash-can-outline`, cùng nền `album.clip`; ~3 giây, câu mới thay câu cũ; tự gọi `announceForAccessibility` | Audit UX 2026-10-27 (Change 18): lưu, xoá, đăng xuất xong không có gì thấy được. Đầu màn vì đáy đã có footer + nút trợ giúp. Gọi trước khi điều hướng: host nằm ngoài Stack nên dải báo hiện trên màn kế tiếp |
| Hộp xác nhận | `ConfirmDialog` trong `app/src/ui.tsx` (Modal của RN core), không `Alert.alert` | Alert Android trắng giữa app tối; làm nó tối cần `expo-system-ui` (dependency mới) |
| Báo lỗi validate | Ngay dưới ô sai, qua prop `error` của `TextField` (`app/src/ui.tsx`); nhóm lựa chọn (Tag…) dùng `FieldError` ngay dưới nhóm — chính `TextField` cũng vẽ lỗi bằng `FieldError`; màu `album.alert` (đất nung `#E38B76`, `dat-nung` trong DESIGN.md) cho viền ô sai và câu lỗi dưới ô. Lỗi server của màn Tài khoản cũng đặt dưới đúng ô (`authErrorField` trong `app/src/supabase.ts`: mã email dưới ô email; `weak_password` / `invalid_credentials` / `same_password` dưới ô mật khẩu; mã khác là một dòng `album.alert` cuối form); mất mạng thì dải báo `offline` (`wifi-off`). Màn viết lời giữ dòng lỗi server cuối form | User chọn ở Change 12: lỗi phải thấy ngay chỗ sai và trông như sự cố. Không dùng `lamp` (luật Một Ngọn Đèn); thêm prop thay vì component mới vì mọi ô đã đi qua `TextField` |
| Lúc nào báo lỗi validate | `useFormCheck` trong `app/src/validation.ts` (`account.tsx` — một check cho mỗi chế độ để chuyển chế độ thì im lặng lại, `reset-password.tsx`, `comfort/write.tsx`): im lặng tới lần bấm gửi đầu, sau đó validate lại mỗi lần đổi chữ — lỗi tắt ngay khi đúng; mỗi ô báo lỗi của riêng nó (mọi chỗ thiếu hiện cùng lúc). Nút chính không bao giờ `disabled` vì thiếu dữ liệu, chỉ khi `busy`; nhóm lựa chọn báo lỗi bằng `FieldError` (`app/src/ui.tsx`), bấm gửi thì cuộn tới lỗi đầu | Change 13: lỗi còn treo sau khi đã sửa đúng. Không báo lúc đang gõ dở lần đầu để khỏi mắng người chưa gõ xong. Change 20 (audit UX): nút Gửi mờ ở màn viết trông như hỏng và không nói thiếu gì |
| Thanh trên + chuyển màn | `TopBar` trong `app/src/ui.tsx` ở mọi màn mở chồng (← gọi `leave`; prop `close` cho modal: × "Đóng", hiện là Tài khoản), vẫn giữ dòng "Quay lại" cuối trang; Stack gốc `animation: 'slide_from_right'`, Tài khoản (`account`) `presentation: 'modal'` (`app/src/app/_layout.tsx`; liệt kê `Stack.Screen` nào thì `(tabs)` phải đứng đầu — màn liệt kê đầu tiên thành màn mở app). Màn có `TopBar` bọc nội dung + `ScreenFooter` trong một `View` flex 1 dưới thanh, để nút trợ giúp nổi không đè lên ← | Audit UX 2026-10-27 (Change 17): nút lùi chỉ ở cuối trang thì phải cuộn hết mới thấy. Chỉ `slide_from_right` (push native) cho vuốt mép trái của iOS đi theo ngón tay; animation tự chọn (`fade`, `slide_from_bottom`) chỉ pop. Modal trên iOS là page sheet vuốt xuống để đóng — chưa test trên iOS |
| Chặn rời màn có nhập liệu | `usePreventRemove` từ `expo-router/react-navigation`, `useNavigation` từ `expo-router` | Có sẵn trong expo-router 57, bắt cả Back hệ thống; không thêm dependency |
| Xoá lần khóc | Hard delete (`deleteEntry` trong `app/src/db.ts`: dòng + file); `deleted_at` để dành cho sync | Chưa có sync; soft delete để nội dung nhạy cảm nằm lại máy. Xem docs/db.md |
| Tài khoản | Một modal `app/src/app/account.tsx` (Đăng nhập · Tạo tài khoản, param `reason` = `send` / `mine` / `settings` đổi câu giới thiệu), thay `login.tsx` + `register.tsx`; không "Để sau" (× là lối ra). Chỉ hỏi khi cần: `comfort/write.tsx` hết tự mở đăng nhập, bấm Gửi (nháp đã hợp lệ) mà chưa có tài khoản thật thì mở modal; quay lại với tài khoản thật thì gửi luôn (`sendAfterSignIn`). Tạo tài khoản khi đang anonymous vẫn là `updateUser` (giữ deliveries), xác minh bằng thư `email_change` — "Gửi lại thư" gọi lại `updateUser({ email })`; tài khoản mới thì `supabase.auth.resend({ type: 'signup' })`; khoá 60 giây. Đăng nhập (hay đặt lại mật khẩu) khi đang anonymous là **đổi danh tính**: deliveries của user anonymous ở lại user đó (docs/db.md › Về "tài khoản") — chấp nhận. Bỏ ô nhập lại mật khẩu: `TextField` có `password` (con mắt) và `hint`. Quên mật khẩu: `resetPasswordForEmail(email, { redirectTo: Linking.createURL('/reset-password') })` → `app/src/app/reset-password.tsx` đọc `?code=` bằng `useLocalSearchParams` (Expo Go: link mở lúc app đang chạy tới router nhưng `Linking.useLinkingURL` vẫn null) rồi `exchangeCodeForSession` + `updateUser({ password })`. Client `flowType: 'pkce'` (`app/src/supabase.ts`, `detectSessionInUrl` tắt): link chỉ dùng được trên máy đã xin thư, không bao giờ nhận token thô từ URL. Thư xác minh `signup` / `email_change` cũng mang `code` nhưng chỉ cần bấm để xác minh rồi đăng nhập bằng mật khẩu — app không cần màn xử lý. Supabase Auth › Redirect URLs phải có `exp://**` (Expo Go) và `tearnote://**` (bản build) | Audit UX 2026-10-27 / 2026-11-01 (Change 21): hai màn + tự đẩy sang đăng nhập khi mở màn viết là chặn cửa; user muốn viết trước, đăng nhập lúc gửi. Không thêm dependency (`expo-linking` có sẵn). Redirect URL do user thêm trên dashboard — MCP không cấu hình Auth được |
| Mã lỗi Supabase Auth | Một bảng `AUTH_ERROR_KEY` trong `app/src/supabase.ts` (mã → key `t.authError`), màn gọi `authErrorText(error, fallback)` | Supabase đổi tên mã thì chỉ sửa một chỗ; mã lạ fallback về câu chung của màn |
| Validation | zod (`app/src/validation.ts`) | Một chỗ giữ rule dùng chung cho form, và parse có kiểu dữ liệu server (`comfortRows`, "lời của tôi") thay cho `as`. Schema trả mã ổn định, chữ hiện qua `t.validation[code]` nên i18n vẫn nằm trong file dịch. Đăng nhập chỉ đòi mật khẩu không rỗng, email chỉ check lỏng — Supabase mới là nơi quyết định |
| Ảnh Trước / Sau trên PR | PR một commit, một vấn đề, thấy được trên màn hình ⇒ chụp emulator qua `adb`; ảnh push lên orphan branch `pr-screenshots`, link theo sha. Luật ở `.claude/rules/pull-requests.md` | User review bằng mắt nhanh hơn đọc diff; ảnh không vào nhánh code để PR giữ đúng một commit |
| Tên định danh | Tiếng Anh, kể cả key/value bảng `settings` (`receive_comforts` = `on`/`off`, `language`, `timeline_last_opened`, `help_fab_position`); comment cũng tiếng Anh (`.claude/rules/comments.md`). Tên bảng/cột SQL giữ nguyên. Đổi một chuỗi lưu bền thì kèm đoạn chuyển dữ liệu chạy một lần khi mở app (như key `settings` tiếng Việt cũ trong `app/src/db.ts`) | Change 22: key tiếng Việt lẫn trong code tiếng Anh; chuyển một lần trong `db.ts` nên không mất cài đặt trên máy cũ. Đổi tên SQL thì lệch schema với docs/db.md ⇄ migration |

Chưa chốt ⇒ **hỏi trước khi code**, đừng tự chọn giúp rồi để cả repo bám theo.

## Luật không được vi phạm

* Không thêm dependency mới khi chưa hỏi. Stdlib / tính năng có sẵn của nền tảng trước đã.
* Không tạo abstraction cho thứ mới dùng một lần. Chờ đến chỗ dùng thứ hai.
* Không "cải thiện" code lân cận, comment, format ngoài phạm vi yêu cầu.
* Chỉ xoá import/biến mà **thay đổi của bạn** làm thừa. Dead code có sẵn thì báo, đừng xoá.
* Bug phát hiện ngoài scope → ghi nhận, không tự sửa.
* Mỗi dòng đổi phải truy được về yêu cầu của user.

## Luật comment

Ở [.claude/rules/comments.md](.claude/rules/comments.md) — Claude Code tự load khi làm việc với code. Tóm tắt: comment tiếng Anh, chỉ nói *vì sao* / *đừng làm gì*.

## Luật commit

Enforce bằng `.husky/commit-msg`, nhưng đừng để hook phải chặn — viết đúng ngay từ đầu.

* **Một dòng title, hết.** Không phần thân, không bullet, không giải thích bên dưới. Lý do của thay đổi nằm ở code, comment và `docs/`, không nằm ở commit message.
* **Tối đa 100 ký tự.**
* **Toàn bộ bằng tiếng Anh**, kể cả khi mọi thứ khác trong repo là tiếng Việt.
* **Không `Co-Authored-By`, không trailer nào cả.** Commit đứng tên chủ repo, không đứng tên Claude hay bất kỳ agent nào.
* Không `--no-verify`. Hook chặn thì sửa message, đừng đi vòng.
* **Mỗi PR một commit.** Nhiều commit chỉ khi mỗi commit là một ticket khác nhau (PR chồng lên nhánh của
  ticket khác). Sửa tiếp trong cùng ticket (review, validate đỏ) → `git commit --amend`, rồi
  `git push --force-with-lease`; không thêm commit "fix review", không merge nhánh khác vào nhánh PR —
  cần code của ticket khác thì rebase lên nhánh đó.

```
feat(app): add settings screen with comfort opt-out switch
fix: reject anonymous accounts from writing comforts
docs: record pool rule verification results
```

## Trước khi code

1. **Tìm cái đã có trước khi viết mới.** Repo còn nhỏ nên đọc hết được — đọc, đừng đoán.
2. **Xác định phạm vi**: đụng mấy tầng, mấy file. Hơn 1 file hoặc nhiều tầng → viết plan.
3. Task nhỏ (đổi copy, sửa style, fix 1 hàm) → bỏ plan, nói rõ "task nhỏ, bỏ plan".

Plan format:

```
Goal:
Files:
Verify:
```

## Validate — chạy thật, không đoán

<!-- Điền ngay khi setup xong scaffold. Lệnh phải copy-paste chạy được.
     Kèm điều kiện bỏ qua, nếu không agent sẽ chạy full suite cho mọi sửa đổi nhỏ. -->

```powershell
cd app; npx tsc --noEmit    # typecheck
cd app; npm test            # jest-expo
cd app; npx expo start      # quét QR bằng Expo Go trên máy thật
cd app; npx eas-cli update --branch preview --environment preview --message "<msg>"  # chạy không cần máy tính
```

Phần server không có lệnh chạy được ở máy: check bằng MCP Supabase (`execute_sql` cho rule pool,
`get_advisors` cho RLS hở) rồi dán kết quả thật.

Không có lệnh verify được thì **nói rõ đã verify bằng cách nào**, đừng báo xong suông.

## Contract — source of truth

<!-- Điền khi xuất hiện cặp file BẮT BUỘC khớp nhau: types ⇄ schema DB,
     model ⇄ migration, proto ⇄ client, API spec ⇄ client types.
     Chưa có cặp nào thì để nguyên dòng này. -->

* [docs/tags.md](docs/tags.md) — luật Tag (kind, match, fallback, luật cho admin). Danh sách nằm trong bảng `tags` trên Supabase, admin sửa qua dashboard; đừng seed hay sửa Tag bằng migration mà không hỏi.
* [docs/db.md](docs/db.md) ⇄ migration Supabase ⇄ schema SQLite trong app. Ba chỗ này phải khớp; sửa một thì sửa cả ba.
* [DESIGN.md](DESIGN.md) — source of truth cho giao diện. Mọi màn mới hoặc chỉnh UI dùng token
  `album` / `pencil` trong `app/src/theme.ts` và luật trong DESIGN.md; không dùng token `color` cũ
  (chỉ còn cho các màn chưa chuyển). Đổi world hay thêm token thì cập nhật DESIGN.md cùng lúc.

## Edge case bắt buộc xét

<!-- Chỉ thêm case dự án này GẶP THẬT. Danh sách generic sẽ bị lướt qua.
     Với app ghi chú, các case thường xuất hiện sớm: -->

* Pool rỗng, và "hết lượt 3 Comfort / 24h" — hai chuyện khác nhau, phải là hai thông báo khác nhau.
* Mất mạng ở màn hotline: vẫn phải hiện được danh sách đóng gói sẵn (ADR 0005).
* Entry không chọn tag nào → `unknown`, không phải mảng rỗng.
* `moved` không bao giờ fallback về `unknown` khi tìm Comfort.

## Chỗ dễ vỡ

<!-- Điền khi có file được import từ nhiều nơi. -->

* **Contract Tag nằm ở ba chỗ**: `docs/tags.md` ⇄ enum `tag` trong `supabase/migrations/0001_init.sql`
  ⇄ `app/src/tags.ts`. Lệch một chỗ thì `app/src/tags.test.ts` đỏ — đó là việc của nó. Phía server
  chuyển sang bảng `tags` (seed ở `0003_tags_table.sql`, migration drop enum); test còn đọc khối enum ở 0001
  tới khi app đọc bảng (Change 24).
* **Danh sách ngôn ngữ nằm ở ba chỗ**: enum `lang` trong migration ⇄ `LANGS` trong
  `app/src/i18n/index.ts` ⇄ một file dịch mỗi ngôn ngữ. Lệch enum ⇄ `LANGS` thì
  `app/src/i18n/i18n.test.ts` đỏ; thiếu key trong file dịch hay thiếu `Record<Lang, …>` thì tsc đỏ.
* **Đừng chép `t.…` hay spread `...pencil.x` ra hằng số cấp module.** Đổi ngôn ngữ là ghi đè `t` /
  `pencil` tại chỗ rồi remount cây — bản đã chép kẹt ở ngôn ngữ cũ. Và thay object, đừng sửa bên
  trong: RN freeze style đã truyền qua prop (bản dev throw lỗi).
* **Chữ UI mới vào cả ba file dịch, không hardcode vào JSX.** Nhánh tách từ trước khi có i18n hay
  mang chữ Việt hardcode vào — `i18n.test.ts` quét `app/src/app/` và `ui.tsx` rồi đỏ. Chữ Anh hardcode thì
  test không bắt được: tự soát khi merge.
* **Rule pool nằm trong `request_comfort()`, không nằm trong app.** Đổi cách chọn Comfort thì viết
  migration, đừng sửa client. Luật "chuyện vui không fallback" đọc `tags.kind = 'joy'`, không còn chữ `'moved'`.
* **`received_comforts.entry_id` chỉ tồn tại trên máy.** Server không biết Comfort nào thuộc Entry
  nào, và cố ý như vậy.
* **Typed routes của Expo sinh sai trên Windows**: `(tabs)/index.tsx` thành `/index` thay vì `/`
  (generator cắt `/index` trước khi đổi `\` sang `/`). Runtime vẫn đúng; chỗ nào `router.replace('/')`
  thì viết `'/' as Href`, đừng đổi sang `'/index'` — máy không phải Windows sẽ đỏ.
* **Giới hạn độ dài Comfort có ở hai nơi**: CHECK `char_length(body) between 20 and 500` và
  `array_length(tags,1) between 1 and 2` trong migration, lặp lại thành hằng số trong
  `app/src/validation.ts` (`MIN_COMFORT_LENGTH`, `MAX_COMFORT_LENGTH`, `MAX_COMFORT_TAGS` từ `tags.ts`) để hiện counter ký tự. Sửa CHECK mà quên sửa hằng số thì người dùng
  gõ xong mới bị server từ chối.
* **Hạn 5 lời / 24 giờ khi viết có số 5 hardcode** trong `strangers.rules` + `write.limitReached` (cả ba file dịch) và DESIGN.md; nó phải theo policy `comfort_insert` trong migration. Đổi hạn thì sửa cả bốn chỗ.
* **Chữ `validation.passwordTooShort` / `common.passwordHint` / `validation.tagsTooMany` trong file dịch có số 6 / 6 / 2 hardcode.** Đổi `MIN_PASSWORD` / `MAX_COMFORT_TAGS` thì sửa cả ba file dịch cùng lúc.
* **Màn có nhập liệu chặn rời bằng `usePreventRemove`** (`new.tsx`, `comfort/write.tsx`). Lưu / Gửi xong phải đi qua `saved.current` / `done`, không thì hộp "Thoát mà chưa lưu?" hiện ngay sau khi lưu.
* **`maxFontSizeMultiplier` chỉ ở chrome** (`PrimaryButton`, `HelpFab`, `HelpButton` của nút Gọi, `ConfirmDialog`, nhãn tab). Đừng lan sang nội dung hay `LinkRow` — DESIGN.md › Typography.
* **Redirect URLs của Supabase Auth có `exp://**` chỉ để test bằng Expo Go.** Trước khi launch bỏ nó khỏi project thật, chỉ giữ scheme của bản build (`tearnote://**`) — wildcard `exp://` cho mọi app Expo Go nhận link đặt lại mật khẩu (PKCE vẫn chặn đổi code ở máy khác, nhưng đừng để cửa mở).
* **Xoá lần khóc phải xoá cả file** trong `attachments/` (`deleteEntry`). Ba key ja có `\n` (`newEntry.title`, `write.title`, `write.doneTitle`) chỉ dùng một chỗ — dùng lại ở chỗ khác là xuống dòng sai.
* **fetch của RN không có timeout.** Mọi request Supabase đi qua `fetchWithTimeout` (20 giây) trong `app/src/supabase.ts`;
  bỏ nó là nút "Nhận một lời" quay mãi khi mất mạng giữa chừng. Kết nối chết vẫn nằm trong pool OkHttp tới khi mở
  lại app — chỉ sửa dứt điểm được ở native (dev client), không phải trong JS.
* **`received_comforts` khoá chính `(entry_id, comfort_id)`**, không phải `comfort_id`: máy đổi danh tính trên server thì
  cùng một lời có thể tới hai lần khóc (docs/db.md). Đổi bảng này thì nhớ đoạn chép bảng cũ ở đầu `app/src/db.ts`.

## Trước khi báo DONE

* [ ] Đủ yêu cầu, không dư.
* [ ] Lệnh validate pass, **có output thật** dán kèm — hoặc nói rõ đã test thủ công thế nào.
* [ ] Không sửa file ngoài scope.
* [ ] Quyết định kỹ thuật mới phát sinh đã ghi vào bảng "Quyết định đã chốt".
* [ ] Nói rõ cái gì đã bỏ qua và vì sao.
