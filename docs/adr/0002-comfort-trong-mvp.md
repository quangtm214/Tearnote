# Comfort nằm trong MVP, kiểm duyệt hai lớp

Comfort (lời động viên ẩn danh từ người lạ) là thứ duy nhất phân biệt Tearnote với các app đã có trên thị trường (Tracking My Tears, Cry Tracker, CryApp...), nên nó ở trong MVP thay vì lùi về giai đoạn 3 như spec ban đầu đề xuất — dù nó mang theo gần như toàn bộ rủi ro pháp lý và đạo đức của sản phẩm.

Kiểm duyệt hai lớp: LLM lọc trước, phần nghi ngờ đẩy sang admin duyệt tay. Ở giai đoạn chưa launch, ngưỡng đẩy sang người đặt rất thấp. Kiểm duyệt luôn chạy trước bước dịch — không dịch thứ sắp bị loại.

Đọc Comfort thì tài khoản ẩn danh là đủ. Viết Comfort thì bắt buộc có tài khoản thật: đó là thứ người lạ sẽ đọc, nên cần một danh tính không tái tạo được chỉ bằng cách gỡ app cài lại — nếu không thì việc chặn một người viết không có ý nghĩa gì. Giới hạn 5 Comfort viết và 3 Comfort nhận trong mỗi 24 giờ.

Hệ quả: cần một hệ thống admin để duyệt, và cần điều khoản sử dụng rõ ràng trước khi có người lạ đầu tiên dùng app.
