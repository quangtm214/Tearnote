| `unknown` | Không rõ vì sao || `moved` | Vì vui, vì cảm động || `anxiety` | Lo về tương lai || `overwhelm` | Kiệt sức, quá tải || `family` | Chuyện gia đình || `loneliness` | Cô đơn || `self_worth` | Thấy mình không đủ tốt || `pressure` | Áp lực công việc, học tập || `grief` | Mất người thân || `heartbreak` | Chuyện tình cảm |# Tag — contract giữa Entry và Comfort

Đây là nguồn sự thật cho danh sách Tag. Entry và Comfort dùng chung đúng danh sách này — đó là toàn bộ cơ chế match. Đổi danh sách sau khi có dữ liệu là migrate đau, nên coi nó là contract.

## Danh sách

Tag mô tả **hoàn cảnh**, không mô tả cảm xúc. Cường độ cảm xúc đã có slider riêng.

| id | vi | en | ja |
|---|---|---|---|
| `heartbreak` | Chuyện tình cảm | Heartbreak | 失恋 |
| `grief` | Mất người thân | Grief | 喪失 |
| `pressure` | Áp lực công việc, học tập | Pressure | プレッシャー |
| `self_worth` | Thấy mình không đủ tốt | Self-worth | 自己嫌悪 |
| `loneliness` | Cô đơn | Loneliness | 孤独 |
| `family` | Chuyện gia đình | Family | 家族 |
| `overwhelm` | Kiệt sức, quá tải | Overwhelm | 疲弊 |
| `anxiety` | Lo về tương lai | Anxiety | 将来への不安 |
| `moved` | Vì vui, vì cảm động | Moved | 感動 |
| `unknown` | Không rõ vì sao | Unknown | 理由がわからない |

`id` là thứ lưu trong DB và dùng để match. Nhãn hiển thị nằm ở tầng i18n của app, không lưu trong DB.

Cột `vi` phải trùng từng chữ với `TAG_LABEL_VI` trong `app/src/tags.ts` (test kiểm). Nhãn là thứ khiến người viết và người nhận hiểu một Tag giống nhau, nên đổi nhãn cũng là đổi contract: `grief` là mất người thân chứ không phải mọi mất mát; `moved` phải nói rõ là vì vui, vì "xúc động" trong tiếng Việt dùng được cả cho buồn — mà `moved` không lùi về `unknown`.

## Luật

- **Entry** chọn tối đa 3 Tag. Không chọn gì thì mặc định là `unknown` — không ép người đang khóc phải phân loại mình.
- **Comfort** chọn tối đa 2 Tag. Ít Tag hơn thì pool đầy hơn.
- **Match**: Comfort có ít nhất một Tag trùng với Entry.
- **Pool trống thì lùi về `unknown`.** Comfort gắn `unknown` là lời động viên chung, không gắn hoàn cảnh cụ thể — nó vừa là một pool thật, vừa là lưới đỡ cho những Tag còn ít Comfort.
- **`moved` không lùi về `unknown`.** Người khóc vì hạnh phúc không nên nhận một lời an ủi viết cho nỗi buồn. Không có Comfort `moved` thì không trả gì cả.

## Vì sao không có Tag cho khủng hoảng / tự hại

Cố tình không có. Một Tag nghĩa là người dùng sẽ nhận lại một Comfort cho nó — mà gửi lời của người lạ cho người đang khủng hoảng là đúng thứ spec §5.2 cấm. Trường hợp đó thuộc về lối vào "cần trợ giúp ngay" (ADR 0005), không thuộc về hệ thống match.

## Còn nợ

Nhãn tiếng Nhật cần người bản ngữ soát lại trước khi có người dùng Nhật thật.
