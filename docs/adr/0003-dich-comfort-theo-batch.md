# Comfort dịch sẵn theo batch, bản dịch là bảng riêng

Tearnote hướng tới người dùng đa quốc gia, nên một Comfort viết bằng tiếng Việt phải đến được người đọc tiếng Anh và tiếng Nhật. Dịch tại thời điểm gửi thì chậm và tốn lặp lại; nên dịch sẵn theo batch mỗi đêm, và chỉ Comfort đã kiểm duyệt mới được dịch.

Bản dịch lưu ở bảng riêng (một dòng mỗi cặp Comfort × ngôn ngữ), không phải cột cố định trong bảng Comfort — vì thêm ngôn ngữ thứ tư nghĩa là dịch lại toàn bộ backlog. Luôn dịch từ bản gốc, không dịch chuyền qua ngôn ngữ trung gian.

Batch tạm thời chạy bằng routine của Claude trên cloud. Đây là chỗ chắp vá có chủ đích: cần một chỗ nhìn được số Comfort chưa dịch để biết khi nào batch chết. Khi launch thật thì thay bằng job tự host.
