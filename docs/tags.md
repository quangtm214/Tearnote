# Tag — contract giữa Entry và Comfort

Đây là luật của Tag. Entry và Comfort dùng chung một danh sách — đó là toàn bộ cơ chế match.

**Danh sách nằm trong bảng `tags` trên Supabase, admin sửa qua dashboard** ([ADR 0009](./adr/0009-tag-do-admin-quan-ly.md), cột ở [db.md](./db.md#tags)). Không cần migration hay bản phát hành để thêm, ẩn hay sửa nhãn một chuyện — nên admin là chốt chặn duy nhất cho các luật dưới đây: DB không chặn được một Tag sai luật.

Tag mô tả **hoàn cảnh**, không mô tả cảm xúc. Cường độ cảm xúc đã có slider riêng.

## `kind`

| kind | Nghĩa | Fallback khi pool trống |
|---|---|---|
| `sad` | Chuyện buồn | Lùi về `unknown` |
| `joy` | Chuyện vui (khóc vì hạnh phúc, cảm động) | **Không bao giờ** — Entry có bất kỳ Tag `joy` nào thì không nhận lời `unknown` |
| `unknown` | Chưa rõ — chỉ đúng một Tag, id `unknown`, không ẩn được (DB CHECK) | — |

`kind` cũng là cách màn chọn chuyện chia nhóm. Đổi `kind` của một Tag có sẵn là đổi luật fallback cho mọi Entry mang Tag đó, ngay lập tức.

## Luật cho admin

- **`id` cố định mãi mãi**, chữ thường + `_`. Nó nằm trong Comfort trên server và trong Entry trên mọi máy.
- **Ẩn, không xoá** (`active = false`). DB cấm xoá và cấm đổi id. Tag đã ẩn không còn trong form nhưng lần khóc cũ vẫn hiện đúng nhãn, và vẫn match lời cũ.
- **Nhãn là contract**: sửa nghĩa một nhãn là đổi nghĩa mọi lời đã gắn nó. Muốn nghĩa khác thì thêm Tag mới.
- **Mọi ngôn ngữ phải có nhãn** (DB bắt). `vi` là nghĩa gốc; `en`, `ja` dịch theo nghĩa đó (xem dưới).
- **Không thêm Tag cho khủng hoảng / tự hại** (mục cuối).

`id` là thứ lưu trong Comfort / Entry và dùng để match; nhãn nằm trong `tags.labels`. Danh sách ban đầu là seed trong `supabase/migrations/0003_tags_table.sql`, app đóng gói đúng bản đó (`TAGS_BUNDLED` trong `app/src/tags.ts`, `tags.test.ts` so hai bên) cho lần mở đầu không mạng.

Nhãn là thứ khiến người viết và người nhận hiểu một Tag giống nhau — kể cả khi hai người dùng hai ngôn ngữ — nên đổi nhãn cũng là đổi contract: `grief` là mất người thân chứ không phải mọi mất mát; `moved` phải nói rõ là vì vui, vì "xúc động" trong tiếng Việt dùng được cả cho buồn — mà `moved` không fallback về `unknown`. Nhãn `vi` là nghĩa gốc; `en` và `ja` dịch theo nghĩa đó, không dịch theo id. Vì vậy không dùng "Grief" / 喪失 (mọi mất mát), "Heartbreak" / 失恋 (chỉ chia tay), "Moved" (tiếng Anh còn là "chuyển nhà", và không nói là vì vui), và không dùng "Anxiety" — nghe như tên một chẩn đoán (overview.md §6: không chẩn đoán).

## Rule

- **Entry** chọn tối đa 3 Tag. Không chọn gì thì mặc định là `unknown` — không ép người đang khóc phải phân loại mình.
- **Comfort** chọn tối đa 2 Tag. Ít Tag hơn thì pool đầy hơn.
- **Match**: Comfort có ít nhất một Tag trùng với Entry.
- **Pool trống thì fallback về `unknown`.** Comfort gắn `unknown` là lời động viên chung, không gắn hoàn cảnh cụ thể — nó vừa là một pool thật, vừa là lưới đỡ cho những Tag còn ít Comfort.
- **Tag `joy` không fallback về `unknown`.** Người khóc vì hạnh phúc không nên nhận một lời an ủi viết cho nỗi buồn. Không có Comfort trùng Tag thì không trả gì cả.
- Tất cả rule match nằm trong `request_comfort()` ([db.md](./db.md)), không nằm trong app.

## Vì sao không có Tag cho khủng hoảng / tự hại

Cố tình không có, và admin không được thêm. Một Tag nghĩa là người dùng sẽ nhận lại một Comfort cho nó — mà gửi lời của người lạ cho người đang khủng hoảng là đúng thứ spec §5.2 cấm. Trường hợp đó thuộc về lối vào "cần trợ giúp ngay" (ADR 0005), không thuộc về hệ thống match.

## Còn nợ

Nhãn tiếng Nhật (và tiếng Anh) do Claude dịch, chưa có người bản ngữ soát. Tiếng Nhật bắt buộc soát trước khi có người dùng Nhật thật — giờ admin sửa thẳng trong bảng `tags`, không cần bản phát hành.
