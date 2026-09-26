# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Android build trước, iOS sau qua EAS. Một sản phẩm, nhưng giao diện theo quy ước của từng OS (Material trên Android, HIG trên iOS). Source không được có gì Android-only (ADR 0001).

## Users

- Người dồn nén cảm xúc, cần một nơi xả an toàn và riêng tư.
- Người muốn quan sát sức khoẻ tinh thần của mình theo thời gian.
- Người cần một chút kết nối, nhưng không muốn chia sẻ với người quen.

Bối cảnh dùng điển hình: điện thoại, nửa đêm, vừa khóc xong, cầm một tay, trong bóng tối, mắt nhoè. Đa quốc gia; v1 hỗ trợ Anh, Việt, Nhật.

## Product Purpose

Nhật ký ghi lại các cơn khóc (Entry: thời điểm, thời lượng, cường độ, Tag, Reflection) để người dùng nhận ra pattern cảm xúc của mình theo thời gian, và nhận lại Comfort — lời động viên ẩn danh từ người lạ từng trải qua hoàn cảnh tương tự.

Thành công: người dùng có một chỗ xả an toàn, quay lại ghi tiếp, và khi chủ động xin thì nhận được một Comfort đúng hoàn cảnh.

## Positioning

Các app cùng loại (Tracking My Tears, Cry Tracker, Tear Tales, Ductts, CryApp) dừng ở thống kê và biểu đồ. Tearnote có **Comfort**: nỗi buồn của một người trở thành sự an ủi cho người khác, match theo Tag hoàn cảnh, ẩn danh hai chiều, không chat. Cắt Comfort thì sản phẩm không còn lý do tồn tại.

## Operating Context

- **Ghi Entry**: chọn cường độ 1–5, tối đa 3 Tag (không chọn → `unknown`), Reflection tự do. Lưu thẳng SQLite trên máy.
- **Nhận Comfort**: người dùng mở một Entry và chủ động xin — không bao giờ tự đẩy (ADR 0007). Tối đa 3 / 24h. Có thể "cảm ơn".
- **Viết Comfort**: cần tài khoản thật; 20–500 ký tự, 1–2 Tag; vào hàng chờ kiểm duyệt (LLM + admin) rồi dịch batch đêm. Tác giả thu hồi được.
- **Cần trợ giúp ngay**: lối vào hotline hiển thị thường trực, chạy được khi offline (ADR 0005).
- **Cài đặt**: công tắc tắt hoàn toàn việc nhận Comfort; sync Entry là opt-in.

## Capabilities and Constraints

- Local-first: nội dung Entry không rời máy trừ khi bật sync. Server chỉ luôn nhận Tag.
- Tag mô tả hoàn cảnh, không mô tả cảm xúc; danh sách là contract (docs/tags.md). Không có Tag khủng hoảng / tự hại — trường hợp đó thuộc về lối vào hotline.
- `moved` (khóc vì hạnh phúc) không bao giờ nhận Comfort viết cho nỗi buồn.
- Pool rỗng và hết lượt 3/24h là hai tình huống khác nhau, hai thông báo khác nhau.
- Không chẩn đoán: không gắn nhãn "trầm cảm", "rối loạn lo âu".
- Không có phát hiện khủng hoảng — hệ thống dựa vào việc người dùng tự bấm trợ giúp hoặc tự tắt nhận Comfort.
- Chưa có: i18n (copy hiện hardcode tiếng Việt), hotline lấy từ server, điều khoản sử dụng (chặn launch), ảnh và voice note trong Entry, thống kê tần suất / Tag hay gặp. Đã có: Lịch — bảng cường độ cả năm.

## Brand Commitments

- Tên: **Tearnote**.
- Giọng văn: nhẹ, ít lời, không khuyên. Như người ngồi cạnh im lặng — câu ngắn, không cổ vũ, không emoji, không "bạn làm tốt lắm".
- Từ vựng chuẩn (code, docs): Entry, Reflection, Comfort, Tag, Delivery (CONTEXT.md). Không lộ ra UI: trên UI tiếng Việt, Entry là "lần khóc", Comfort là "lời từ người lạ" (khi nhận) / "lời cho người lạ" (khi viết); không dùng chữ Entry, Comfort, Tag, pool, server; xưng "bạn".

## Evidence on Hand

- Icon và splash: `app/assets/images/`.
- Danh sách hotline đóng gói sẵn: `app/src/hotlines.ts`.
- Chưa có: người dùng thật, testimonial, số liệu, Comfort mồi trong pool, điều khoản sử dụng. Nhãn Tag tiếng Nhật chưa được người bản ngữ soát. Không bịa những thứ này.

## Product Principles

1. **Người dùng chủ động, app không đẩy.** Không tự gửi Comfort, không nhắc nhở gây áp lực, không ép phân loại cảm xúc.
2. **Riêng tư mặc định.** Thứ duy nhất rời máy khi chưa bật sync là Tag.
3. **Trợ giúp không phụ thuộc mạng.** Lối vào hotline luôn hiện, luôn chạy.
4. **Ẩn danh hai chiều, không kết nối trực tiếp.** Comfort là một chiều; không chat, không hồ sơ.
5. **Không phán xét, không chẩn đoán.**

## Accessibility & Inclusion

- Mọi luồng chính dùng được hoàn toàn bằng screen reader (TalkBack; VoiceOver khi có iOS), đặc biệt lối vào hotline.
- Copy phải chịu được ba ngôn ngữ (Anh, Việt, Nhật) — tiếng Việt có dấu chồng, tiếng Nhật có kana/kanji.
