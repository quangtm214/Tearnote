# Mobile native (React Native + Expo), Android trước

Spec ban đầu đề xuất web (Next.js). Chúng tôi chọn mobile native vì bối cảnh dùng thật của Tearnote là mở app lúc nửa đêm trên điện thoại: cần notification, ghi âm mượt, khoá app bằng sinh trắc học và mở nhanh — web PWA không cho những thứ đó.

Chọn Expo (managed) thay vì bare React Native vì môi trường dev là Windows: Xcode chỉ chạy trên macOS, nên không thể build hay ký app iOS tại máy. Expo + EAS Build cho phép build iOS trên cloud về sau mà không cần đổi kiến trúc. Ship Android trước; source phải tránh mọi thứ Android-only để iOS bật lên sau là việc build, không phải việc viết lại.

Hệ quả: cần tài khoản Apple Developer ($99/năm) khi tới lượt iOS. Đổi ý sang web sau này = viết lại toàn bộ tầng UI.
