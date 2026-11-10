# Danh sách Tag là bảng `tags` do admin quản lý

**Trạng thái:** đã làm — server ở Change 23 (`0003_tags_table.sql`), app ở Change 24 (`app/src/tags.ts`, bảng `tags` trong SQLite). Thay hợp đồng ba chỗ cũ (`docs/tags.md` ⇄ enum `tag` ⇄ `app/src/tags.ts`).

Tag đang hardcode ở ba nơi: thêm, ẩn hay sửa nhãn một chuyện là một migration + một bản phát hành app + sửa docs. Design system mới (`TagPicker` / `TagSheet`) đã tính cho danh sách dài dần, 8 hay 30 mục. Danh sách chuyển vào bảng `tags` trên Supabase, admin sửa trực tiếp; app tải về SQLite và đóng gói sẵn một bản dự phòng — đúng khuôn của hotline (ADR 0005).

Không đổi: Tag mô tả hoàn cảnh; match = trùng ít nhất một Tag; pool rỗng thì lùi về `unknown`; chuyện vui không bao giờ lùi về `unknown`; Entry không chọn gì là `['unknown']`; mọi rule chọn Comfort vẫn nằm trong `request_comfort()` (ADR 0008).

## 1. Schema

```sql
create type tag_kind as enum ('sad', 'joy', 'unknown');

create table tags (
  id     text primary key check (id ~ '^[a-z][a-z_]*$'),
  kind   tag_kind not null,
  labels jsonb not null,            -- {"vi": "…", "en": "…", "ja": "…"}
  sort   int not null default 0,
  active boolean not null default true,
  -- 'unknown' is the only kind=unknown tag, and it can never be hidden:
  -- the app writes it for Entries with no Tag, request_comfort falls back to it.
  check ((id = 'unknown') = (kind = 'unknown')),
  check (active or id <> 'unknown')
);
```

- **`id` cố định mãi mãi.** Nó nằm trong Comfort trên server và trong Entry trên mọi máy. Trigger `before update or delete` trên `tags` chặn đổi `id` và chặn xoá: bỏ một chuyện = `active = false`.
- **`labels` là jsonb**, không phải ba cột: thêm ngôn ngữ vẫn không đổi schema (docs/db.md). Cùng trigger đó kiểm mọi giá trị của enum `lang` đều có nhãn khác rỗng — dùng `enum_range(null::lang)`, nên thêm ngôn ngữ thì luật tự áp; migration thêm ngôn ngữ phải điền nhãn cho mọi Tag trong cùng transaction.
- **`kind`** thay chữ `'moved'` hardcode: `sad` (chuyện buồn), `joy` (chuyện vui), `unknown` (chưa rõ). Cũng là cách `TagSheet` chia nhóm.
- **`sort`** là thứ tự admin xếp, cho `TagSheet` và cho hàng nhanh lần đầu.
- **Không có `updated_at`** — xem mục 4.

### Thay enum trong `comforts.tags` / `entries.tags`: `text[]` + trigger

Chọn `text[]` kèm trigger `before insert or update of tags` kiểm từng phần tử có trong `tags` (chỉ kiểm tồn tại, không kiểm `active`: Entry cũ được sync mang Tag đã ẩn, và lời viết bằng app chưa tải danh sách mới không đáng bị từ chối).

Không chọn bảng nối (`comfort_tags`):
- `request_comfort()` giữ nguyên `&&` trên mảng và GIN index; bảng nối thì viết lại thành `exists` + join.
- Client vẫn insert một dòng `comforts`; policy `comfort_insert` (tài khoản thật, 5/24h) không đổi. Bảng nối cần RLS riêng hoặc một RPC để ghi Comfort + Tag cùng lúc.
- CHECK `array_length(tags, 1)` 1–2 / 1–3 giữ nguyên; bảng nối thì phải đếm bằng trigger.

Cái giá: mảng không có foreign key thật, nên trigger kiểm tồn tại + luật "không xoá Tag" thay cho FK.

### Migration (`0003_tags_table.sql`, một transaction)

1. Tạo `tag_kind`, `tags`, trigger bảo vệ, policy; seed 10 Tag hiện có, nhãn lấy nguyên văn từ `docs/tags.md`: `moved` → `joy`, `unknown` → `unknown`, còn lại `sad`; `sort` 10, 20, … theo thứ tự hiện tại.
2. `alter table comforts alter column tags type text[] using tags::text[]`, tương tự `entries`. Giá trị enum đổi sang chữ y hệt, không dòng nào đổi nội dung; GIN index được dựng lại tự động.
3. Gắn trigger kiểm Tag vào `comforts` và `entries`.
4. `drop function request_comfort(tag[], lang)`, tạo lại với `p_tags text[]`, lặp lại `revoke`/`grant` của 0001 + 0002 (kể cả revoke `anon`).
5. `drop type tag`.

App đang chạy gửi `p_tags` là mảng chuỗi và gọi RPC theo tên tham số, nên bản cũ vẫn chạy với hàm mới: deploy migration trước, phát hành app sau.

## 2. `request_comfort()` dùng `kind`

Chỉ đổi điều kiện fallback:

```sql
and (c.tags && p_tags
     or (not exists (select 1 from tags g where g.id = any(p_tags) and g.kind = 'joy')
         and 'unknown' = any(c.tags)))
```

- Entry có **bất kỳ** Tag `joy` nào thì không lùi về `unknown` — đúng hành vi hiện tại khi Entry có `moved`, kể cả Entry vừa vui vừa buồn.
- `'unknown'` vẫn viết thẳng: đó là id dành riêng, hai CHECK ở trên giữ nó luôn tồn tại và luôn `active`.
- Tag đã ẩn vẫn match bình thường: `active` chỉ quyết định form có bày nó ra không. Lời cũ gắn Tag đã ẩn vẫn đến được Entry cũ cùng Tag.
- Năm rule cũ (không nhận lời của chính mình, không nhận lại, 3/24h, chưa có bản dịch thì không trả, chuyện vui không fallback) giữ nguyên.

Hai thông báo "pool rỗng" / "hết lượt" vẫn tách như cũ. `joyOnly` ở `comfort/[entryId].tsx` đổi từ `tags = ['moved']` thành "mọi Tag của Entry đều `kind = 'joy'`", tra trong danh sách trên máy.

## 3. RLS và nơi admin quản lý

```sql
alter table tags enable row level security;
create policy tag_read on tags for select to anon, authenticated using (true);
```

Không policy ghi ⇒ chỉ dashboard (role `postgres`) và service role ghi được, giống `hotlines`. Admin sửa bằng **Table Editor của Supabase** (ADR 0006 đã chọn cách này cho duyệt Comfort). Khi số thứ cần quản lý đủ nhiều (Tag, duyệt Comfort, hotline) mới xây trang admin riêng — lúc đó cần role admin trong RLS, ghi ADR mới.

Dashboard chạy bằng `postgres`, bỏ qua RLS, nên mọi luật bảo vệ (không xoá, không đổi id, đủ nhãn, `unknown` duy nhất) nằm ở CHECK và trigger, không ở policy.

## 4. App local-first

- **SQLite `tags`** (`id` PK, `kind`, `labels` JSON text, `sort`, `active` 0/1) là bản sao danh sách. Mọi form và mọi chỗ hiện nhãn đọc từ đây — kể cả khi không mạng, không tài khoản (ADR 0004).
- **Bản đóng gói sẵn:** `TAGS_BUNDLED` trong `app/src/tags.ts`, đúng bằng seed của migration. Mỗi lần mở app `insert or ignore` vào SQLite: máy mới cài, offline vẫn có đủ danh sách; bản app mới có thêm Tag thì thêm dòng mà không đè nhãn admin đã sửa.
- **Cập nhật:** lúc mở app, chạy nền, tải **cả bảng** (gồm Tag đã ẩn) rồi upsert trong một transaction; lỗi mạng thì im lặng, dùng bản đang có. Dòng tải về parse bằng zod trước khi ghi (như `comfortRows`). Không dùng `updated_at`: vài chục dòng là một request nhỏ, còn tải theo mốc cần thêm cột, trigger và một mốc lưu trên máy. Thêm khi danh sách lên hàng trăm.
- **Không bao giờ xoá dòng trên máy.** Server cấm xoá Tag nên upsert là đủ. Entry cũ mang Tag đã ẩn vẫn hiện đúng nhãn vì dòng còn đó với `active = 0`; form chỉ lấy `active = 1`.
- **Nhãn** đọc lúc gọi: `labels[ngôn ngữ app]`, thiếu thì `labels.en`. Không chép ra hằng số cấp module (CLAUDE.md › Chỗ dễ vỡ). Id không có trong danh sách (chỉ xảy ra với dữ liệu sync từ máy khác trước khi tải danh sách) thì bỏ qua khi hiện.
- **Kiểu:** `TagId` thành `string`; `z.enum(TAG_IDS)` trong `validation.ts` thành `z.string()` — trigger trên server là cửa kiểm thật. `normalizeTags` vẫn trả `['unknown']` khi không chọn gì.
- **Form:** màn ghi lần khóc bỏ Tag `kind = 'unknown'` (không chọn = không rõ); màn viết lời có đủ.

## 5. Hàng nhanh của `TagPicker`

Đếm thẳng từ `entries` trên máy, không thêm bảng hay key `settings`:

```sql
select j.value as id, count(*) as n from entries e, json_each(e.tags) j
where e.deleted_at is null and j.value <> 'unknown' group by j.value
```

Hàng nhanh = Tag `active` hợp với màn, xếp theo `n` giảm dần rồi `sort`, lấy 6; cộng mọi Tag đang chọn, và Tag đã chọn rồi bỏ trong lần mở màn này (để Pill không biến mất dưới ngón tay); nút "Chuyện khác…" chỉ hiện khi còn Tag chưa nằm trên hàng. Máy chưa có lần khóc nào thì toàn bộ theo `sort`. Màn viết lời dùng cùng bộ đếm: người viết thường viết về chuyện chính mình từng khóc. Xoá lần khóc thì bộ đếm tự đổi vì đếm từ source of truth. `TagSheet` không đổi thứ tự theo số lần dùng (design system: tìm được theo trí nhớ).

## 6. Test thay cho `tags.test.ts`

Bỏ ba test hợp đồng (enum ⇄ docs ⇄ `TAG_LABEL`): danh sách không còn ba bản để lệch. Thay bằng:

- `TAGS_BUNDLED` khớp seed trong `0003_tags_table.sql` (id, kind, nhãn, sort) — cặp code ⇄ SQL duy nhất còn lại, giữ lần mở đầu offline bằng đúng trạng thái ban đầu của server. Admin sửa danh sách sau đó thì bản đóng gói được phép cũ hơn: nó chỉ là bản dự phòng.
- Bất biến của bản đóng gói: id không trùng; đúng một Tag `kind = 'unknown'` và id của nó là `'unknown'`; mỗi Tag có nhãn khác rỗng cho mọi `LANGS`.
- Hàm hàng nhanh (đếm → xếp → cộng Tag đang chọn) và `joyOnly` theo `kind`: mỗi cái một test thuần.
- Giữ các test `normalizeTags`.
- Server: verify bằng `execute_sql` và dán kết quả vào PR — Comfort gắn Tag không tồn tại bị từ chối; xoá Tag, đổi id, thiếu nhãn `ja` bị từ chối; Entry `joy` không nhận lời `unknown`; Entry buồn pool rỗng nhận lời `unknown`; Tag đã ẩn vẫn match.

## Hệ quả

- Thêm / ẩn / sửa nhãn một chuyện không cần migration hay bản phát hành. Claude không seed hay sửa Tag bằng migration khi chưa hỏi.
- **Luật nội dung chuyển từ review code sang admin**, ghi trong `docs/tags.md` (bỏ bảng danh sách, giữ luật): Tag mô tả hoàn cảnh không mô tả cảm xúc; **không có Tag cho khủng hoảng / tự hại** (thuộc lối trợ giúp, ADR 0005); nhãn en/ja dịch theo nghĩa cột vi; ẩn chứ không xoá. Không gì trong DB chặn được một Tag sai luật — admin là chốt chặn.
- Đổi `kind` của một Tag có sẵn đổi luật fallback cho mọi Entry mang Tag đó ngay lập tức. Nhãn vẫn là contract: sửa nghĩa một nhãn là đổi nghĩa mọi lời đã gắn nó — thêm Tag mới thay vì sửa nghĩa Tag cũ.
- Tới lúc code thì sửa cùng PR: `docs/db.md` (bảng `tags` hai phía, kiểu `tag` bỏ, `text[]`, `request_comfort()`), `docs/tags.md`, CLAUDE.md (bảng quyết định hàng "Nhãn Tag", mục Contract và Chỗ dễ vỡ "Contract Tag nằm ở ba chỗ").
- Nhãn tiếng Nhật vẫn chưa có người bản ngữ soát — giờ admin sửa được mà không cần bản phát hành.
