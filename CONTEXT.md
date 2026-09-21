# Tearnote

Ứng dụng nhật ký cảm xúc, ghi lại các cơn khóc để người dùng nhận ra pattern cảm xúc của mình theo thời gian, và nhận lại sự an ủi — từ AI và từ người lạ.

## Language

**Entry**:
Một lần ghi nhận cơn khóc: thời điểm, thời lượng, cường độ, lý do, cảm xúc.
_Avoid_: log, record, session, "bản ghi"

**Reflection**:
Đoạn text tự do do chính người dùng viết bên trong một Entry — suy nghĩ của họ lúc đó.
_Avoid_: note, journal, content

**Echo**:
Đoạn phản chiếu ngắn do AI sinh ra và gửi lại cho chính người viết Entry đó. Không ai khác đọc được.
_Avoid_: note, AI response, feedback, gợi ý

**Comfort**:
Lời động viên ngắn do một người dùng viết ra cho người lạ, được gửi ẩn danh hai chiều tới người dùng khác đang có Entry với ngữ cảnh cảm xúc tương tự.
_Avoid_: note, message, lời nhắn, encouragement note

**Tag**:
Một nhãn cảm xúc rộng, chọn từ danh sách cố định, dùng để mô tả Entry và để tìm Comfort phù hợp. Là từ vựng chung giữa Entry và Comfort.
_Avoid_: category, label, mood, lý do
Danh sách chốt: [docs/tags.md](./docs/tags.md)

**Delivery**:
Một lần gửi cụ thể: Comfort nào, tới người nào, cho Entry nào. Cùng một Comfort không được gửi lại cho người đã nhận nó.
_Avoid_: send, gửi note, match
