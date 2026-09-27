---
name: check-change
description: Đọc tab Change của sheet TearNote-Bug-Change, làm các thay đổi Mới / Mở lại, mỗi thay đổi một nhánh + commit + PR, rồi ghi Commit/PR, ghi chú và chuyển sang "Chờ xác nhận". Dùng khi user gõ /check-change.
disable-model-invocation: true
---

# /check-change

Giống hệt `/check-bug` — **đọc [../check-bug/SKILL.md](../check-bug/SKILL.md) trước** để lấy spreadsheet id,
cách gọi Zapier, locale `;`, và quy trình. Chỉ khác ở những điểm dưới đây.

## Tab Change

Thay `Bug` bằng `Change` trong mọi range (`Change!A1:N500`, `Change!J<row>:M<row>`). Cột cùng vị trí:

| Cột | Tên | Ai ghi |
|---|---|---|
| A | ID | Công thức — không ghi |
| B–I | Ngày đề xuất, Màn hình, Thay đổi mong muốn, Hiện tại đang thế nào, Xong khi nào (tiêu chí), Ưu tiên, Loại, Ảnh/Link tham khảo | User |
| J | Trạng thái: `Mới`, `Đang làm`, `Chờ xác nhận`, `Đã xác nhận`, `Mở lại`, `Không làm` | Cả hai |
| K / L / M | Ngày làm / Commit / PR / Ghi chú | Claude |
| N | Ngày xác nhận | User — không đụng |

Thứ tự làm: Ưu tiên Cao → Vừa → Thấp, rồi ID tăng dần.

## Khác với bug

1. **Trạng thái đang làm** là `Đang làm` (không phải `Đang sửa`).
2. **Plan trước khi code.** Thay đổi thường đụng nhiều file: viết plan theo format trong CLAUDE.md
   (`Goal / Files / Verify`), đưa user xem cùng danh sách ở bước "Lấy bug", rồi mới làm.
3. **Cần user quyết thì dừng, không tự chọn.** Thay đổi đòi hỏi thêm dependency, thêm/bớt Tag, đổi
   contract (`docs/tags.md`, `docs/db.md`, migration), đổi world/token trong DESIGN.md, hoặc một hạng mục
   "chưa chốt" trong CLAUDE.md → hỏi user. Nếu user không có mặt: M = `Cần quyết định: <câu hỏi>`,
   giữ nguyên J, sang thay đổi tiếp.
4. **Mô tả mơ hồ** (không rõ "xong" là thế nào, cột F trống và không suy ra được) → M = `Cần thêm: <thiếu gì>`.
5. **Nhánh** `change/<ID>`.
6. **Commit**: `<type>(change-<ID>): <tóm tắt tiếng Anh>`, type theo bản chất thay đổi —
   `feat` (tính năng / hành vi mới), `style` (chỉ giao diện), `refactor`, `docs`, `perf`.
   Ví dụ `feat(change-3): add sign-up screen reachable from login`. Vẫn đúng luật commit: một dòng,
   tiếng Anh, ≤100 ký tự, không trailer.
7. **Quyết định mới** phát sinh khi làm (được user chốt) → ghi vào bảng "Quyết định đã chốt" trong
   CLAUDE.md trong cùng commit.
8. Ghi chú cột M: đã làm gì + cách user xem lại trên máy (màn nào, bấm gì).

Không tự chuyển sang `Không làm` — việc đó của user.
