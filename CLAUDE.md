# CLAUDE.md — Tearnote

**Trạng thái: schema đã deploy, app chạy được lát cắt Entry + Comfort. Chưa launch.**
File này cố tình ngắn. Mỗi khi chốt một quyết định hoặc dựng xong một tầng, cập nhật đúng mục tương ứng bên dưới — không viết trước.

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
| Backend | Supabase (Postgres + auth + storage). Xem ADR 0006 | Server chỉ làm 4 việc nhỏ, không đáng tự dựng |
| Test runner | jest-expo | Đi kèm Expo, không thêm dependency |
| Package manager | npm, kèm `legacy-peer-deps` | Mặc định của Expo; pnpm hay vỡ với native module RN. `app/.npmrc` bật `legacy-peer-deps` vì expo 57 kéo react-dom 19.3 còn RN 0.86 khoá react 19.2 — không có nó thì mọi `npm i` đều ERESOLVE |
| `@react-native/jest-preset` ghim đúng version RN | `0.86.3`, không để `^` | `legacy-peer-deps` cho npm tự lấy 0.87.1 và jest chết ngay. Nâng RN thì nâng cả gói này |

Chưa chốt ⇒ **hỏi trước khi code**, đừng tự chọn giúp rồi để cả repo bám theo.

## Luật không được vi phạm

* Không thêm dependency mới khi chưa hỏi. Stdlib / tính năng có sẵn của nền tảng trước đã.
* Không dựng abstraction cho thứ mới dùng một lần. Chờ đến chỗ dùng thứ hai.
* Không "cải thiện" code lân cận, comment, format ngoài phạm vi yêu cầu.
* Chỉ xoá import/biến mà **thay đổi của bạn** làm thừa. Dead code có sẵn thì báo, đừng xoá.
* Bug phát hiện ngoài scope → ghi nhận, không tự sửa.
* Mỗi dòng đổi phải truy được về yêu cầu của user.

## Luật commit

Ép bằng `.husky/commit-msg`, nhưng đừng để hook phải chặn — viết đúng ngay từ đầu.

* **Một dòng title, hết.** Không phần thân, không bullet, không giải thích bên dưới. Lý do của thay đổi nằm ở code, comment và `docs/`, không nằm ở commit message.
* **Tối đa 100 ký tự.**
* **Toàn bộ bằng tiếng Anh**, kể cả khi mọi thứ khác trong repo là tiếng Việt.
* **Không `Co-Authored-By`, không trailer nào cả.** Commit đứng tên chủ repo, không đứng tên Claude hay bất kỳ agent nào.
* Không `--no-verify`. Hook chặn thì sửa message, đừng đi vòng.

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

<!-- Điền ngay khi dựng xong scaffold. Lệnh phải copy-paste chạy được.
     Kèm điều kiện bỏ qua, nếu không agent sẽ chạy full suite cho mọi sửa đổi nhỏ. -->

```powershell
cd app; npx tsc --noEmit    # typecheck
cd app; npm test            # jest-expo
cd app; npx expo start      # quét QR bằng Expo Go trên máy thật
```

Phần server không có lệnh chạy được ở máy: kiểm bằng MCP Supabase (`execute_sql` cho luật pool,
`get_advisors` cho RLS hở) rồi dán kết quả thật.

Không có lệnh verify được thì **nói rõ đã kiểm bằng cách nào**, đừng báo xong suông.

## Contract — nguồn sự thật

<!-- Điền khi xuất hiện cặp file BẮT BUỘC khớp nhau: types ⇄ schema DB,
     model ⇄ migration, proto ⇄ client, API spec ⇄ client types.
     Chưa có cặp nào thì để nguyên dòng này. -->

* [docs/tags.md](docs/tags.md) — danh sách Tag. Entry và Comfort dùng chung; đây là toàn bộ cơ chế match. Đừng thêm/bớt Tag mà không hỏi.
* [docs/db.md](docs/db.md) ⇄ migration Supabase ⇄ schema SQLite trong app. Ba chỗ này phải khớp; sửa một thì sửa cả ba.

## Edge case bắt buộc xét

<!-- Chỉ thêm case dự án này GẶP THẬT. Danh sách generic sẽ bị lướt qua.
     Với app ghi chú, các case thường xuất hiện sớm: -->

* Pool rỗng, và "hết lượt 3 Comfort / 24h" — hai chuyện khác nhau, phải là hai thông báo khác nhau.
* Mất mạng ở màn hotline: vẫn phải hiện được danh sách đóng gói sẵn (ADR 0005).
* Entry không chọn tag nào → `unknown`, không phải mảng rỗng.
* `moved` không bao giờ lùi về `unknown` khi tìm Comfort.

## Chỗ dễ vỡ

<!-- Điền khi có file được import từ nhiều nơi. -->

* **Contract Tag nằm ở ba chỗ**: `docs/tags.md` ⇄ enum `tag` trong `supabase/migrations/0001_init.sql`
  ⇄ `app/src/tags.ts`. Lệch một chỗ thì `app/src/tags.test.ts` đỏ — đó là việc của nó.
* **Luật pool nằm trong `request_comfort()`, không nằm trong app.** Đổi cách chọn Comfort thì viết
  migration, đừng sửa client.
* **`received_comforts.entry_id` chỉ tồn tại trên máy.** Server không biết Comfort nào thuộc Entry
  nào, và cố ý như vậy.
* **Giới hạn độ dài Comfort có ở hai nơi**: CHECK `char_length(body) between 20 and 500` và
  `array_length(tags,1) between 1 and 2` trong migration, lặp lại thành hằng số trong
  `app/src/app/comfort/write.tsx` để hiện bộ đếm. Sửa CHECK mà quên sửa hằng số thì người dùng
  gõ xong mới bị server từ chối.

## Trước khi báo DONE

* [ ] Đủ yêu cầu, không dư.
* [ ] Lệnh validate pass, **có output thật** dán kèm — hoặc nói rõ đã kiểm thủ công thế nào.
* [ ] Không sửa file ngoài scope.
* [ ] Quyết định kỹ thuật mới phát sinh đã ghi vào bảng "Quyết định đã chốt".
* [ ] Nói rõ cái gì đã bỏ qua và vì sao.
