# Sao lưu nhật ký: bật theo tài khoản, máy vẫn là source of truth

**Trạng thái:** đã làm — server `0004_entry_sync.sql` + `0006_entry_payload.sql`, app `app/src/sync.ts` + `app/src/crypto.ts`. Cụ thể hoá ADR 0004 ("sync là opt-in").

Mục đích duy nhất: đổi máy (hay cài lại app) mà không mất nhật ký. Không phải cộng tác, không phải sửa trên nhiều máy cùng lúc.

## Quyết định

- **Công tắc theo tài khoản, không theo máy.** Cờ `entry_sync` nằm trong `user_metadata` của Supabase Auth. Đăng nhập tài khoản đã bật trên máy mới là nhật ký tự về, không phải tìm công tắc. Tắt ở một máy là tắt cho cả tài khoản: máy khác đọc cờ (`getUser`, không đọc JWT cũ) ở lần sync sau rồi dừng. Không thêm bảng cho một cờ. Cờ và khoá bọc nằm trong `user_metadata`, người dùng tự sửa được qua API — chỉ hại chính họ.
- **Cần tài khoản thật** (RLS `entry_own` và policy Storage chặn anonymous). Bật lần đầu hỏi bằng `ConfirmDialog` nói rõ cái gì được chép lên — đó là "đồng ý rõ ràng" của ADR 0004.
- **Tắt = hạ cờ + bỏ khoá trước, rồi xoá bản sao trên server** (dòng rồi file). Hỏi trước bằng `ConfirmDialog`. Hạ cờ trước để không máy nào đẩy thêm trong lúc xoá; xoá hỏng giữa chừng thì lượt sync sau của bất kỳ máy nào từng sync tài khoản đó xoá nốt.
- **Lần khóc không sửa được sau khi lưu**, nên sync chỉ có thêm và xoá: không conflict, không vector clock. Một lượt sync: đẩy tombstone → đẩy lần khóc mới (file trước, dòng sau) → kéo về → tải file còn thiếu.
- **Xoá lan sang máy khác bằng tombstone.** Lần khóc đã lên server mà bị xoá: trên máy chỉ còn `deleted_at` tới lúc đẩy được; trên server dòng còn `id` + `deleted_at`, không còn `payload` — CHECK `entries_tombstone` bắt buộc, không phải lời hứa của app. Máy khác thấy tombstone thì xoá theo.
- **Server trống không bao giờ xoá nhật ký trên máy.** Lần khóc đã đánh dấu sync mà server không có (tắt rồi bật lại) thì đẩy lại, không xoá (`planPull`, có test).
- **Máy nhớ đã sync với ai** (`settings.sync_user`). Đăng nhập tài khoản khác mà tài khoản đó bật sao lưu: quên mọi dấu `synced_at` rồi đẩy lại hết lên tài khoản mới. Nghĩa là **đăng nhập trên một máy = gộp nhật ký máy đó vào tài khoản** — nhật ký thuộc về máy, tài khoản chỉ là chỗ cất.
- **File** ở bucket private `entry-attachments`, đường dẫn `<user id>/<entry id>/<tên file trên máy>`; policy chỉ cho chủ thư mục. Tải về qua signed URL 60 giây. File tải hỏng thì dòng `attachments` vẫn có `remote`, lần sau tải lại.
- **Mã hoá đầu-cuối, khoá mở bằng mật khẩu** (user chọn, 2026-11-22). Server chỉ giữ dữ liệu không đọc được:
  - Mỗi tài khoản có một **khoá sao lưu** ngẫu nhiên 32 byte. Lần khóc thành `payload` = XChaCha20-Poly1305 của JSON (`entryPayload` trong `app/src/validation.ts`); file ảnh / ghi âm cũng mã hoá cả file trước khi upload. Thư viện `@noble/ciphers` + `@noble/hashes` (JS thuần — Hermes không có WebCrypto); số ngẫu nhiên lấy từ `randomblob` của SQLite.
  - Khoá sao lưu được **bọc** bằng khoá suy từ mật khẩu (scrypt N=2^14, salt riêng) và cất ở `user_metadata.entry_key` (`{id, salt, box}`). Trên máy, khoá trần nằm trong SecureStore theo user, xoá khi đăng xuất.
  - Mật khẩu chỉ dùng lúc vừa gõ (đăng nhập / tạo tài khoản / đặt lại), không lưu. Đăng nhập không gõ mật khẩu trên máy này thì sao lưu **bị khoá** ở máy này: Cài đặt hiện "Nhập mật khẩu".
  - Đặt lại mật khẩu bằng email: máy còn giữ khoá thì bọc lại bằng mật khẩu mới. Không máy nào giữ khoá = **mất bản sao lưu** — muốn sao lưu tiếp thì tắt rồi bật (khoá mới, bản cũ bị xoá). Chấp nhận ở MVP.
  - Tắt rồi bật ở máy khác đổi `id` khoá: máy còn khoá cũ thấy lệch `id` thì coi như bị khoá, không mã hoá bằng khoá cũ.
  - Sau này thêm mã khôi phục (recovery code) thì chỉ cần bọc thêm cùng khoá sao lưu bằng mã đó — không phải mã hoá lại dữ liệu.

## Không sync

- **Lời người lạ đã nhận** (`received_comforts`): server cố ý không biết lời nào thuộc lần khóc nào (docs/db.md). Đổi máy thì mất phần này.
- **`settings`** (ngôn ngữ, vị trí nút trợ giúp…): rẻ để đặt lại.

## Hệ quả

- Storage tính tiền theo dung lượng: tối đa 3 ảnh + 1 ghi âm 5 phút mỗi lần khóc. Bucket giới hạn 25 MB mỗi file.
- Xoá tài khoản (chưa có tính năng) phải xoá cả thư mục Storage — `on delete cascade` không tới Storage.
- Tombstone ở lại server mãi (vài chục byte mỗi dòng).
- Chạy sync: mở app, sau Lưu / Xoá, sau đăng nhập, sau khi bật. Không chạy nền khi app đóng.
