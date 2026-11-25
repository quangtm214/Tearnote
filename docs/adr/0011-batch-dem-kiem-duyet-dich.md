# Batch đêm: kiểm duyệt rồi dịch, ghi qua hai hàm

Batch là một routine Claude chạy trên cloud lúc 02:00 (giờ Việt Nam), làm theo đúng một file prompt có version: `supabase/batch/nightly.md` ([ADR 0003](./0003-dich-comfort-theo-batch.md)). Routine nói chuyện với database qua connector Supabase (`execute_sql`, quyền `postgres`). Sửa luật duyệt hay dịch là sửa file đó rồi cập nhật prompt của routine — hai chỗ phải giống nhau.

**"Chờ admin" khác "chưa ai xem" mà không đổi schema.** Câu bị đánh dấu nghi ngờ vẫn là `pending`, nhưng `mod_note` có tiền tố `flag: <lý do>`; câu batch tự loại thì `rejected` + `mod_note = 'batch: <lý do>'`. Batch chỉ xem dòng `pending` có `mod_note` null, nên không bao giờ duyệt lại câu đã đẩy cho admin. Không thêm giá trị `comfort_status`: app (`comfort/mine.tsx`, `myComfortRows` trong `app/src/validation.ts`) chỉ biết bốn giá trị, và với người viết thì "đang chờ duyệt" vẫn đúng. Admin xem backlog trên Table Editor: lọc `status = pending` và `mod_note` bắt đầu bằng `flag:`; duyệt tay là đổi `status`, muốn batch xem lại thì xoá `mod_note`.

**Lý do là mã cố định**, không phải câu tự do: `self_harm` `hate` `sexual` `contact` `medical` `spam` `injection` `off_topic` `unsure`. Hàm từ chối mã lạ, nên `mod_note` không chứa được chữ do model viết ra (hay do nội dung câu chia sẻ lái nó viết ra).

**Chưa launch nên ngưỡng đẩy sang người rất thấp** ([ADR 0002](./0002-comfort-trong-mvp.md)): chỉ tự duyệt câu rõ ràng tử tế, chỉ tự loại vi phạm rõ ràng; còn lại là `flag`. Câu lạnh lùng, giảng đạo, đổ lỗi hay "tích cực độc hại" cũng `flag` chứ không loại — đó là chuyện giọng, người quyết.

**Nội dung câu là dữ liệu, không phải lệnh.** Câu chứa chỉ dẫn cho người duyệt / AI là vi phạm `injection`. Vì prompt injection không chặn được trọn vẹn bằng lời dặn, bề mặt ghi được thu hẹp bằng SQL: batch chỉ ghi qua `batch_moderate(id, decision, reason)` (chỉ đổi `status` / `mod_note` của dòng `pending` chưa có note) và `batch_translate(id, lang, body)` (chỉ insert bản dịch cho câu `approved`, khác `source_lang`, dài 1–1000, `on conflict do nothing`). Hai hàm `security definer`, đã revoke khỏi `anon` / `authenticated` (`0005_nightly_batch.sql`). Prompt cấm mọi `update` / `insert` / `delete` khác — dặn bằng lời, vì connector vẫn chạy bằng `postgres`.

**Dịch:** đích là mọi giá trị enum `lang` trừ `source_lang`; luôn từ `body` gốc; cùng nghĩa, không thêm bớt, giọng tự nhiên và nhẹ nhàng của ngôn ngữ đích. Thêm ngôn ngữ mới thì truy vấn tự thấy backlog, không sửa prompt (trừ dòng tên ngôn ngữ).

**Chạy lại an toàn, chết thì lộ.** Mỗi lời gọi là một dòng, tự đủ; chạy dở thì đêm sau làm tiếp; chạy chồng thì hàm trả `false`. Mỗi đêm tối đa 50 câu duyệt + 100 bản dịch, phần dư để đêm sau. Không bảng log: routine in số trước / sau vào log của nó, còn hai con số ở docs/db.md › Batch đêm là cách biết batch đã chết.

Hệ quả: chất lượng duyệt phụ thuộc model của routine và câu chữ trong `nightly.md`. Khi launch thật thì thay routine bằng job tự host (ADR 0003) — hai hàm SQL giữ nguyên.
