---
paths:
  - "app/**/*.{ts,tsx,js}"
  - "supabase/**/*.sql"
  - ".husky/*"
---

# Luật comment

Áp cho comment trong code (`.ts`/`.tsx`, SQL, shell). Docs (`docs/`, ADR, DESIGN.md, CLAUDE.md) vẫn tiếng Việt.

**Ngôn ngữ: tiếng Anh**, câu ngắn, từ thông dụng, không thành ngữ — dịch qua lại giữa hai thứ tiếng là lệch nghĩa.
Thuật ngữ miền viết đúng tên trong code: Entry, Comfort, Tag, Reflection, pool, Timeline — không dùng chữ UI
("a cry", "lần khóc"). Trích nguyên văn chữ Việt/Nhật để minh hoạ thì đặt trong `"..."`.
`i18n.test.ts` đỏ khi comment `.ts`/`.tsx` có chữ Việt ngoài ngoặc kép.

**Comment chỉ nói điều code không tự nói được.** Code cho thấy *làm gì*; comment trả lời *vì sao* hoặc *đừng làm gì*.
Mỗi comment phải thuộc ít nhất một loại:

1. **Vì sao chọn cách này** khi cách hiển nhiên hơn đã bị loại. `// No date picker: avoids a dependency.`
2. **Bẫy nền tảng / thư viện**: hành vi lạ của RN, Android, TalkBack, Hermes, OkHttp, Expo… mà sửa "cho gọn" sẽ vỡ.
3. **Ràng buộc nằm ngoài file**: phải khớp chỗ khác (migration, `docs/db.md`, file dịch), hoặc rule thật do server/RLS enforce.
   Trỏ tới nơi giữ rule, đừng chép lại nội dung.
4. **Nghĩa của giá trị không tự giải thích**: đơn vị, `null` nghĩa là gì, số "lạ" (`bottom: -18`).
5. **Đường tắt có chủ đích**: tiền tố `ponytail:` + giới hạn + cách nâng cấp.
6. **Header `/** */`** cho file và cho export dùng chung, khi tên + kiểu chưa đủ nói vai trò.

Không comment:

* Diễn lại code (`// set loading`), hay nhắc lại tên hàm.
* Lịch sử ("trước đây…", "đã đổi tên từ…") — việc của git. Ngoại lệ: code chuyển dữ liệu cũ thì tả dạng cũ.
* Code bị comment-out; TODO trôi nổi — việc cần làm vào sheet Bug/Change, hoặc `ponytail:` nếu là giới hạn đã biết.
* Văn tả thiết kế / ẩn dụ dài — thuộc DESIGN.md; comment giữ một câu lý do và trỏ `DESIGN.md › <mục>`.
* Chép lại ADR hay docs — trỏ tới (`ADR 0004`, `docs/db.md`).

Hình thức:

* `/** */` trên export và đầu file; `//` trong thân hàm; `{/* */}` trong JSX; `--` trong SQL.
* Ưu tiên một câu. Quá 3 dòng thì xét chuyển vào docs.
* Ví dụ output viết theo locale `en` (`"Saturday, September 26"`).
* Identifier nhắc trong comment phải tồn tại: đổi tên hay đổi code thì sửa / xoá comment đi kèm trong cùng commit.
