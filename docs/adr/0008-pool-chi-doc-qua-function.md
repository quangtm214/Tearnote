# Pool Comfort chỉ đọc được qua một function

Người dùng không có quyền `select` trên bảng `comforts`. Việc nhận Comfort đi qua đúng một hàm `security definer`, hàm này tự ghi vào `deliveries` rồi trả về nội dung.

Nếu để client tự truy vấn pool, ẩn danh trở thành thứ do app tự nguyện giữ: ai gọi thẳng API của Supabase cũng lấy được `author_id` và dump được cả pool. Luật "không gửi trùng", "không nhận Comfort của chính mình" và luật fallback của `moved` cũng sẽ nằm rải rác trong client thay vì ở một chỗ.

Hệ quả: đổi cách chọn Comfort là một migration SQL, không phải một bản phát hành app. Đánh đổi có chủ đích — sửa được luật chọn mà không cần người dùng cập nhật.
