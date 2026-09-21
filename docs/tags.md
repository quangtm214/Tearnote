# Tag — contract giữa Entry và Comfort

Đây là nguồn sự thật cho danh sách Tag. Entry và Comfort dùng chung đúng danh sách này — đó là toàn bộ cơ chế match. Đổi danh sách sau khi có dữ liệu là migrate đau, nên coi nó là contract.

## Danh sách

Tag mô tả **hoàn cảnh**, không mô tả cảm xúc. Cường độ cảm xúc đã có slider riêng.

| id | vi | en | ja |
|---|---|---|---|
| `heartbreak` | Chia tay, chuyện tình cảm | Heartbreak | 失恋 |
| `grief` | Mất người thân | Grief | 喪失 |
| `pressure` | Áp lực công việc, học tập | Pressure | プレッシャー |
| `self_worth` | Tự ti, ghét bản thân | Self-worth | 自己嫌悪 |
| `loneliness` | Cô đơn | Loneliness | 孤独 |
| `family` | Gia đình | Family | 家族 |
| `overwhelm` | Kiệt sức, quá tải | Overwhelm | 疲弊 |
| `anxiety` | Lo âu về tương lai | Anxiety | 将来への不安 |
| `moved` | Xúc động, hạnh phúc | Moved | 感動 |
| `unknown` | Không rõ lý do | Unknown | 理由がわからない |

`id` là thứ lưu trong DB và dùng để match. Nhãn hiển thị nằm ở tầng i18n của app, không lưu trong DB.

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
