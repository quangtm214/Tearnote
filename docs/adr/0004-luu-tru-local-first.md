# Local-first, sync lên server là opt-in

Entry chứa dữ liệu tâm lý rất nhạy cảm. Mặc định nội dung Entry (Reflection, ảnh, voice note) ở lại trên máy trong SQLite và không rời khỏi đó. Người dùng không cần đăng nhập để dùng toàn bộ phần nhật ký.

Nếu người dùng tạo tài khoản và đồng ý rõ ràng, Entry được sao lưu lên server để khôi phục khi đổi máy. Mỗi Entry ghi rõ nó thuộc loại nào để người dùng luôn biết cái gì đang nằm ở đâu.

Server luôn nhận được Tag của Entry kể cả khi không sync nội dung — đó là thứ tối thiểu để tìm Comfort phù hợp. Server không bao giờ đọc được chữ người dùng viết trừ khi họ bật sync.
