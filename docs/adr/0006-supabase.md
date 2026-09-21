# Supabase làm backend

Server của Tearnote chỉ cần làm bốn việc: trả Comfort theo Tag, nhận Comfort mới, phục vụ hàng đợi kiểm duyệt, và lưu bản sao Entry cho ai bật sync. Không realtime, không traffic lớn. Dựng Node + Postgres riêng nghĩa là tự làm lại auth, storage, migration, deploy cho một khối lượng việc không xứng.

Supabase cho sẵn Postgres, auth ẩn danh có thể nâng cấp thành tài khoản thật (đúng cái ADR 0004 cần), storage cho voice note, và pgvector nếu sau này cần match theo ngữ nghĩa. Giai đoạn đầu, admin duyệt Comfort bằng chính bảng của Supabase — chưa cần xây UI admin.

Loại Next.js API routes (spec §7 gợi ý): client là React Native, kéo cả một framework frontend vào chỉ để làm server là thừa.

Hệ quả: khoá vào Postgres và vào Supabase auth. Rời đi được nhưng tốn.
