---
name: check-bug
description: Đọc sheet TearNoteBug, sửa các bug Mới / Mở lại, mỗi bug một nhánh + commit + PR, rồi ghi Commit/PR, ghi chú và chuyển sang "Chờ xác nhận". Dùng khi user gõ /check-bug hoặc bảo "kiểm tra bug", "sửa bug trong sheet".
disable-model-invocation: true
---

# /check-bug

Sheet: `TearNoteBug`, spreadsheet id `1nErKf9eBY7PCtQAnMxMjh5pCqzQ2on4zk0MdR24HOEM`, tab `Bug`.
Ghi/đọc qua **Zapier Google Sheets** (Google Drive MCP chỉ đọc được). Tool Zapier là deferred —
nạp bằng ToolSearch `select:mcp__Zapier-MCP__execute_zapier_read_action,mcp__Zapier-MCP__execute_zapier_write_action`.

## Cột tab Bug

| Cột | Tên | Ai ghi |
|---|---|---|
| A | ID | Công thức `ARRAYFORMULA` ở A2 — **không bao giờ ghi vào cột A** |
| B–I | Ngày thấy, Màn hình, Mô tả, Cách tái hiện, Mong đợi, Mức độ, Thiết bị, Ảnh/Video | User |
| J | Trạng thái | Cả hai |
| K | Ngày sửa | Claude |
| L | Commit / PR | Claude |
| M | Ghi chú sửa | Claude |
| N | Ngày xác nhận | User — không đụng |

Số dòng trên sheet = ID + 1.

## Gọi Zapier

Mọi lệnh dùng `selected_api: "GoogleSheetsV2CLIAPI"`, `action: "_zap_raw_request"`, `fail_on_errors: "true"`.

- **Đọc** — `execute_zapier_read_action`, `tool_name: "google_sheets_make_api_get_request"`,
  `url: https://sheets.googleapis.com/v4/spreadsheets/<id>/values/Bug!A1:N500`
- **Ghi** — `execute_zapier_write_action`, `tool_name: "google_sheets_make_api_mutating_request"`,
  `method: PUT`, `url: .../values/Bug!J<row>:M<row>`, `querystring: {"valueInputOption":"USER_ENTERED"}`,
  `body: {"range":"Bug!J<row>:M<row>","values":[["<J>","<K>","<L>","<M>"]]}`

Locale sheet là `vi_VN`: nếu có ghi công thức thì ngăn đối số bằng `;`, không phải `,`.
Ngày ghi dạng `yyyy-mm-dd`. Sau mỗi lần ghi, đọc lại dòng đó để chắc đã vào.

## Quy trình

1. **Chuẩn bị.** `git status` — có file tracked đang sửa dở thì dừng, hỏi user (file untracked thì kệ).
   `git checkout master` rồi `git pull`.
2. **Lấy bug.** Đọc tab Bug. Bug cần xử lý = dòng có Mô tả (D) và Trạng thái (J) là `Mới`, `Mở lại`
   hoặc để trống. Ưu tiên Mức độ Cao → Vừa → Thấp, rồi ID tăng dần. Không có bug nào → báo và dừng.
   Liệt kê danh sách cho user thấy trước khi bắt đầu.
3. **Với từng bug**, lần lượt:
   1. Ghi J = `Đang sửa` (giữ nguyên K, L, M đang có).
   2. Đọc kỹ Mô tả / Cách tái hiện / Mong đợi / Màn hình. Tìm nguyên nhân gốc trong code theo
      CLAUDE.md (đọc trước, không đoán). Mở lại (`Mở lại`) thì đọc Ghi chú sửa và commit cũ ở cột L trước.
   3. **Không đủ thông tin để tái hiện hoặc không chắc đó là bug** → không sửa bừa. Ghi J = trạng thái
      cũ, M = `Cần thêm: <thiếu gì>` rồi sang bug tiếp. Không tự chuyển sang `Không sửa` — việc đó của user.
   4. Tạo nhánh từ master: `git checkout -b fix/bug-<ID>`.
   5. Sửa theo mọi luật trong CLAUDE.md (phạm vi tối thiểu, không thêm dependency, v.v.).
   6. Validate thật: `cd app; npx tsc --noEmit` và `cd app; npm test`. Đỏ thì sửa tiếp; không xanh được
      thì không commit — ghi M = `Chưa sửa được: <lý do>`, trả J về trạng thái cũ, về master, sang bug tiếp.
   7. Commit, message đúng luật commit của repo (một dòng, tiếng Anh, ≤100 ký tự, không trailer):
      `fix: <ID> <tóm tắt tiếng Anh>` — ví dụ `fix: 7 keep selected tags when saving entry offline`.
      Không dùng `#<ID>` (GitHub sẽ link nhầm sang issue/PR số đó).
   8. `git push -u origin fix/bug-<ID>` rồi `gh pr create --base master --title "<message commit>" --body "<body>"`.
      Body: bug nào (ID + màn hình + mô tả ngắn), nguyên nhân, cách sửa, cách user test lại trên máy.
   9. Ghi sheet dòng `<ID+1>`:
      J = `Chờ xác nhận`, K = ngày hôm nay, L = `<sha 7 ký tự> · <URL PR>`,
      M = 1–2 câu tiếng Việt: nguyên nhân + đã sửa gì + test lại thế nào.
   10. `git checkout master` trước khi sang bug tiếp.
4. **Báo cáo** cuối: bảng ID → kết quả (PR / cần thêm thông tin / chưa sửa được), kèm output validate thật.

## Không làm

- Không merge PR — user merge sau khi xác nhận.
- Không ghi cột A, B–I, N; không xoá hay sắp xếp dòng (ID đi theo vị trí dòng).
- Không gộp nhiều bug vào một nhánh/commit.
