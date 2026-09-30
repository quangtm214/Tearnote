# Tag — contract giữa Entry và Comfort

Đây là nguồn sự thật cho danh sách Tag. Entry và Comfort dùng chung đúng danh sách này — đó là toàn bộ cơ chế match. Đổi danh sách sau khi có dữ liệu là migrate đau, nên coi nó là contract.

## Danh sách

Tag mô tả **hoàn cảnh**, không mô tả cảm xúc. Cường độ cảm xúc đã có slider riêng.

| id | vi | en | ja |
|---|---|---|---|
| `heartbreak` | Chuyện tình cảm | Love life | 恋愛のこと |
| `grief` | Mất người thân | Losing a loved one | 大切な人を亡くした |
| `pressure` | Áp lực công việc, học tập | Work or school pressure | 仕事や勉強のプレッシャー |
| `self_worth` | Thấy mình không đủ tốt | Feeling not good enough | 自分はダメだと感じる |
| `loneliness` | Cô đơn | Feeling lonely | さみしい |
| `family` | Chuyện gia đình | Family matters | 家族のこと |
| `overwhelm` | Kiệt sức, quá tải | Exhausted, overwhelmed | 疲れ果てて、もう限界 |
| `anxiety` | Lo về tương lai | Worried about the future | 将来への不安 |
| `moved` | Vì vui, vì cảm động | Happy or touched | うれしくて、感動して |
| `unknown` | Không rõ vì sao | Not sure why | 理由がわからない |

`id` là thứ lưu trong DB và dùng để match. Nhãn hiển thị nằm trong app, không lưu trong DB.

Ba cột `vi`, `en`, `ja` phải trùng từng chữ với `TAG_LABEL` trong `app/src/tags.ts` (test kiểm). Nhãn là thứ khiến người viết và người nhận hiểu một Tag giống nhau — kể cả khi hai người dùng hai ngôn ngữ — nên đổi nhãn cũng là đổi contract: `grief` là mất người thân chứ không phải mọi mất mát; `moved` phải nói rõ là vì vui, vì "xúc động" trong tiếng Việt dùng được cả cho buồn — mà `moved` không lùi về `unknown`.

Cột `vi` là nghĩa gốc; `en` và `ja` dịch theo nghĩa đó, không dịch theo id. Vì vậy không dùng "Grief" / 喪失 (mọi mất mát), "Heartbreak" / 失恋 (chỉ chia tay), "Moved" (tiếng Anh còn là "chuyển nhà", và không nói là vì vui), và không dùng "Anxiety" — nghe như tên một chẩn đoán (overview.md §6: không chẩn đoán).

## Luật

- **Entry** chọn tối đa 3 Tag. Không chọn gì thì mặc định là `unknown` — không ép người đang khóc phải phân loại mình.
- **Comfort** chọn tối đa 2 Tag. Ít Tag hơn thì pool đầy hơn.
- **Match**: Comfort có ít nhất một Tag trùng với Entry.
- **Pool trống thì lùi về `unknown`.** Comfort gắn `unknown` là lời động viên chung, không gắn hoàn cảnh cụ thể — nó vừa là một pool thật, vừa là lưới đỡ cho những Tag còn ít Comfort.
- **`moved` không lùi về `unknown`.** Người khóc vì hạnh phúc không nên nhận một lời an ủi viết cho nỗi buồn. Không có Comfort `moved` thì không trả gì cả.

## Vì sao không có Tag cho khủng hoảng / tự hại

Cố tình không có. Một Tag nghĩa là người dùng sẽ nhận lại một Comfort cho nó — mà gửi lời của người lạ cho người đang khủng hoảng là đúng thứ spec §5.2 cấm. Trường hợp đó thuộc về lối vào "cần trợ giúp ngay" (ADR 0005), không thuộc về hệ thống match.

## Còn nợ

Nhãn tiếng Nhật (và tiếng Anh) do Claude dịch, chưa có người bản ngữ soát. Tiếng Nhật bắt buộc soát trước khi có người dùng Nhật thật.
