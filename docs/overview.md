# Tearnote — Tổng quan dự án

Tài liệu này mô tả Tearnote là gì, MVP gồm những gì và cố tình bỏ những gì. Từ vựng chuẩn nằm ở [CONTEXT.md](../CONTEXT.md); lý do đằng sau từng quyết định nằm ở [docs/adr/](./adr/).

Trạng thái: chưa có code. Mọi quyết định dưới đây đã chốt qua thảo luận, chưa cái nào được kiểm chứng bằng thực tế.

## 1. Sản phẩm

Tearnote là app nhật ký cảm xúc ghi lại các cơn khóc — thời điểm, cường độ, lý do, suy nghĩ lúc đó — để người dùng nhận ra pattern cảm xúc của mình theo thời gian, và nhận lại lời động viên ẩn danh từ người lạ từng trải qua điều tương tự.

Trên thị trường đã có Tracking My Tears, Cry Tracker, Tear Tales, Ductts, CryApp. Tất cả dừng ở thống kê và biểu đồ. Thứ duy nhất phân biệt Tearnote là **Comfort**: nỗi buồn của một người trở thành sự an ủi cho người khác.

Nếu Comfort bị cắt, Tearnote không còn lý do tồn tại.

## 2. Người dùng

- Người dồn nén cảm xúc, cần một nơi xả an toàn và riêng tư
- Người muốn quan sát sức khoẻ tinh thần của mình theo thời gian
- Người cần một chút kết nối, nhưng không muốn chia sẻ với người quen

Đa quốc gia. Ba ngôn ngữ ở v1: **Anh, Việt, Nhật**. Cấu trúc dữ liệu phải cho phép thêm ngôn ngữ mà không sửa schema.

## 3. Phạm vi MVP

### Có

- Ghi Entry: thời điểm, thời lượng, cường độ, Tag, Reflection tự do, ảnh, voice note
- Timeline xem lại + thống kê cơ bản (tần suất, Tag hay gặp)
- Viết Comfort gửi vào pool chung — cần tài khoản thật, tối đa 5 / 24h
- Xin Comfort cho một Entry — người dùng chủ động, không tự đẩy; tối đa 3 / 24h
- Kiểm duyệt Comfort hai lớp: LLM lọc, phần nghi ngờ admin duyệt tay
- Dịch Comfort sang cả ba ngôn ngữ theo batch đêm
- Lối vào "cần trợ giúp ngay" hiển thị thường trực, hoạt động cả khi offline
- Công tắc tắt hoàn toàn việc nhận Comfort
- Sync Entry lên server: tuỳ chọn, cần đăng nhập và đồng ý rõ ràng

### Không có — cố tình

| Bỏ | Vì sao |
|---|---|
| Echo (AI phản chiếu cho người viết) | Sẽ là ngách riêng, dự định tự host LLM + RAG. Không nhồi vào MVP |
| AI phân loại mood / severity từ Entry | Người dùng tự chọn Tag. Tag sau này thành đầu vào cho AI |
| Gợi ý nhạc, Spotify, podcast | Spotify OAuth là một dự án con, và nó không phải thứ khiến người ta quay lại |
| Match Comfort theo ngữ nghĩa / embedding | v1 match theo Tag. Thô nhưng đủ, và đúng nguyên tắc không match chi tiết 1-1 |
| "Crying Wrapped", so sánh giai đoạn | Cần dữ liệu tích luỹ nhiều tháng mới có nghĩa |
| iOS | Build sau qua EAS. Source không được có gì Android-only |
| UI admin riêng | Giai đoạn đầu duyệt bằng bảng của Supabase |

## 4. Kiến trúc

```
app/      Expo (React Native + TypeScript), Android trước
          SQLite = nguồn sự thật cho Entry
server/   Supabase: Postgres + auth + storage
          Pool Comfort, bản dịch, hàng đợi kiểm duyệt, hotline, backup Entry
batch     Routine Claude chạy đêm: kiểm duyệt rồi dịch Comfort — tạm thời
```

Một repo, `app/` và `server/` tách rõ. Không dùng công cụ monorepo cho tới khi thật sự vướng.

**Ranh giới dữ liệu — quan trọng nhất:** nội dung Entry không rời khỏi máy trừ khi người dùng bật sync. Thứ luôn được gửi lên server chỉ là **Tag** — đủ để tìm Comfort, không đủ để biết người ta đã viết gì.

## 5. Ba luồng chính

**Ghi Entry.** Người dùng chọn cường độ và Tag, viết Reflection nếu muốn. Ghi thẳng vào SQLite. Nếu bật sync thì đẩy lên server ở nền và đánh dấu Entry đó đã sao lưu.

**Viết Comfort.** Chỉ người có tài khoản thật mới viết được — đọc thì ẩn danh cũng đủ, nhưng viết cho người lạ đọc thì cần một danh tính không tái tạo được sau mỗi lần cài lại app. Người dùng viết một lời động viên ngắn, chọn Tag cho nó. Comfort vào trạng thái chờ. Batch đêm kiểm duyệt trước, dịch sau. Chỉ Comfort đã duyệt mới vào pool. Tác giả xem lại và thu hồi được Comfort mình đã viết.

**Nhận Comfort.** Người dùng mở một Entry và chủ động xin. Server nhận Tag, trả về một Comfort đã duyệt trùng Tag mà người đó chưa từng nhận, bằng ngôn ngữ của họ. Người nhận có thể "cảm ơn". Không có chat, không lộ danh tính hai chiều.

## 6. Ràng buộc bắt buộc

Đây là những thứ không được đánh đổi để ship nhanh hơn.

- **Lối vào trợ giúp phải chạy offline.** Hotline lấy từ server nhưng app đóng gói sẵn bản dự phòng và cache bản mới nhất. Người ta cần số đó đúng lúc có thể không có mạng.
- **Kiểm duyệt chạy trước dịch.** Không dịch thứ sắp bị loại.
- **Không chẩn đoán.** Không gắn nhãn "trầm cảm", "rối loạn lo âu" cho người dùng.
- **Đồng ý rõ ràng trước khi Comfort vào pool.** Người viết phải biết nó sẽ được gửi cho người lạ, và phải thu hồi được.
- **Phải có điều khoản sử dụng trước khi người lạ đầu tiên dùng app.**

## 7. Chắp vá có chủ đích

Ghi lại để không quên, không phải để bào chữa.

- **Batch dịch chạy bằng routine Claude.** Không phải hạ tầng. Cần một chỗ nhìn được số Comfort chưa dịch để biết khi nào nó chết. Thay bằng job tự host trước khi launch.
- **Không có phát hiện khủng hoảng.** Hệ thống không biết ai đang trong khủng hoảng, nên nó dựa hoàn toàn vào việc người dùng tự bấm nút trợ giúp hoặc tự tắt nhận Comfort. Đây là lỗ hổng đã biết, và là lý do Echo/severity nên được ưu tiên ngay sau MVP.
- **Danh sách Tag là contract.** Entry và Comfort dùng chung nó. Đổi Tag sau khi có dữ liệu là migrate đau. Chốt kỹ trước khi viết dòng code đầu tiên.
- **Pool Comfort trống lúc đầu.** Tính năng khác biệt duy nhất không hoạt động cho tới khi có đủ người viết — mà người viết còn phải chịu khó tạo tài khoản, nên nguồn cung hẹp hơn nguồn cầu ngay từ đầu. Cần một lượng Comfort mồi trước khi có người dùng thật.

## 8. Sau MVP

Theo thứ tự ưu tiên:

1. Echo + phân loại severity — tự host LLM, RAG. Đây là ngách riêng, không phải một tính năng nhỏ
2. iOS qua EAS Build
3. UI admin để duyệt Comfort và cập nhật hotline
4. Batch dịch tự host
5. Thống kê nâng cao, "Wrapped"
6. Gợi ý nhạc

## 9. Chưa chốt

- Danh sách Tag cụ thể (8–12 tag rộng)
- Ràng buộc độ dài Comfort, một người được viết bao nhiêu
- Người dùng xin được bao nhiêu Comfort mỗi ngày
- Cấu trúc bảng chi tiết
- Chi phí AI cho kiểm duyệt + dịch
