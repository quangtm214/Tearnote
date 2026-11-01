# Danh sách hotline phải hoạt động khi offline

Lối vào "cần trợ giúp ngay" hiển thị thường trực trong app: một nút nổi (FAB "Trợ giúp") ở mọi màn trừ chính màn hotline, cùng một chỗ trên mọi màn. Người dùng kéo được nó sang mép trái / phải và lên xuống cho hợp tay; vị trí được nhớ trên máy, không cần mạng. Nút chỉ ẩn khi bàn phím đang mở (DESIGN.md › Layout). Danh sách hotline theo quốc gia lấy từ server để admin cập nhật được mà không cần phát hành bản mới.

Nhưng app đóng gói sẵn một bản dự phòng tĩnh và cache bản tải về gần nhất: người dùng cần số này đúng vào lúc họ có thể đang không có mạng. Một nút cứu hộ phụ thuộc mạng là nút hỏng.
