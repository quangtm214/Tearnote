# Luật PR: ảnh Trước / Sau

Mục đích: user nhìn ảnh là biết PR đổi gì trên màn hình, review nhanh hơn đọc diff.

## Khi nào cần ảnh

Cần, khi **cả ba** đúng:

* PR sửa một bug hoặc làm một thay đổi (`fix/bug-<ID>`, `change/<ID>`, hay việc user giao lẻ).
* PR chỉ có **một commit** và giải quyết **một vấn đề**.
* Thay đổi **thấy được trên màn hình** của app: giao diện, chữ, luồng bấm, thông báo lỗi.

Không cần: config, dependency, refactor, docs, test, rule cho Claude, migration / SQL thuần server.

Không chụp được thì bỏ qua, không chặn PR — ví dụ emulator không boot (thiếu RAM), lỗi chỉ có trên máy
thật / iOS, cần thao tác TalkBack bằng tay. Khi bỏ qua thì ghi một dòng trong PR: `Ảnh: bỏ qua — <lý do>`.

## Chụp

Emulator Android (AVD `tearnote`, `tearnote-play` nếu cần TalkBack) qua `adb` — chi tiết boot, deep link,
đổi ngôn ngữ trong memory `android-emulator-review`. Không mở Android Studio.

1. **Trước — chụp trước khi sửa code**, trên đúng code gốc của nhánh: tái hiện bug / mở màn sắp đổi.
2. **Sau — chụp sau khi sửa và validate xanh**, cùng màn, cùng dữ liệu, cùng trạng thái, cùng ngôn ngữ máy,
   để hai ảnh so được cạnh nhau. Metro chạy `CI=1` không watch: sửa code xong phải khởi động lại Metro.
3. Mỗi bên 1–3 ảnh, đặt tên `before-1.png`, `after-1.png`…
   Lệnh chụp: `cmd /c "adb exec-out screencap -p > before-1.png"` (dấu `>` của PowerShell làm hỏng file nhị phân).
4. Repo **public**: ảnh chỉ chứa dữ liệu test — không email thật, không nội dung riêng tư.
5. Xong thì `adb emu kill` (emulator ăn RAM và phình pagefile).

## Đưa ảnh lên PR

Ảnh **không** vào nhánh code (PR phải giữ đúng một commit). Push lên orphan branch `pr-screenshots`,
thư mục = tên nhánh PR, bằng plumbing — không đổi nhánh, không đụng working tree:

```powershell
$branch = git branch --show-current; $dir = '<thư mục chứa ảnh>'
git fetch origin pr-screenshots   # lần đầu nhánh chưa có thì lỗi — bỏ qua
$env:GIT_INDEX_FILE = "$env:TEMP\shots.index"; if (Test-Path $env:GIT_INDEX_FILE) { Remove-Item $env:GIT_INDEX_FILE }
$parent = git rev-parse -q --verify refs/remotes/origin/pr-screenshots
if ($parent) { git read-tree $parent } else { git read-tree --empty }
Get-ChildItem "$dir\*.png" | ForEach-Object { $b = git hash-object -w $_.FullName; git update-index --add --cacheinfo "100644,$b,$branch/$($_.Name)" }
$tree = git write-tree
$msg = "chore: add screenshots for $branch"
$commit = if ($parent) { git commit-tree $tree -p $parent -m $msg } else { git commit-tree $tree -m $msg }
Remove-Item Env:GIT_INDEX_FILE; git push origin "${commit}:refs/heads/pr-screenshots"
```

Link ảnh theo **sha commit**, không theo tên nhánh — link theo nhánh bị cache, push lại ảnh cùng tên vẫn hiện ảnh cũ:
`https://raw.githubusercontent.com/quangtm214/Tearnote/<commit>/<branch>/before-1.png`

Trong body PR, ngay sau phần tóm tắt:

```markdown
## Ảnh

| Trước | Sau |
|---|---|
| <img src="…/before-1.png" width="300"> | <img src="…/after-1.png" width="300"> |

Màn: <màn nào> · Cách tới: <bấm gì / deep link> · Ngôn ngữ máy: <vi/en/ja>
```

## Khung body PR

1. Tóm tắt một dòng: `**Change <ID>** · <màn> · <trước ra sao>. Giờ <sau ra sao>.` (bug thì `**Bug <ID>**`).
2. `## Ảnh` như trên.
3. `## Đã làm`: bullet — đổi gì ở đâu, vì sao chọn cách đó; docs / file dịch đi kèm. Sau đó thêm `Giới hạn: …`
   hoặc `Ngoài phạm vi, chưa sửa: …` nếu có.
4. Dòng `Validate: …` với kết quả thật.

Không viết mục `## Xem lại trên máy` — dòng "Cách tới" dưới ảnh đã đủ.
