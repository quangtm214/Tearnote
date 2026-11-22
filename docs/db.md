# Cấu trúc dữ liệu

Hai kho tách biệt. Đọc [ADR 0004](./adr/0004-luu-tru-local-first.md) trước để hiểu vì sao.

- **SQLite trên máy** — source of truth của Entry. Luôn có, kể cả khi không đăng nhập.
- **Supabase (Postgres + Storage)** — pool Comfort, bản dịch, hotline, và bản sao Entry (kèm file) cho ai bật sao lưu.

Đã apply lên project thật và verify bằng SQL — xem cuối mục `request_comfort()`.

## Về "tài khoản"

Mỗi lần cài app sinh một **anonymous user** của Supabase — người dùng không đăng ký gì. Dòng `auth.users` đó là chỗ neo cho "đã gửi Comfort nào cho ai". Tài khoản thật (email) xuất hiện khi người dùng bật sync Entry, hoặc khi họ muốn viết Comfort.

| | Anonymous | Tài khoản thật |
|---|---|---|
| Ghi Entry, xem timeline, thống kê | có | có |
| Nhận Comfort (tối đa 3 / 24h) | có | có |
| **Viết Comfort** | **không** | có (tối đa 5 / 24h) |
| Sync Entry lên server | không | có, nếu bật |

Đăng nhập tài khoản có sẵn (hay mở link đặt lại mật khẩu) khi máy đang là anonymous user là **đổi danh tính**: Delivery của anonymous user cũ ở lại user đó, nên lời đã nhận trên máy không tính vào hạn 3 / 24h của tài khoản và có thể được giao lại — chấp nhận, vì chỉ tạo tài khoản mới (`updateUser` trên chính anonymous user) mới giữ được Delivery. Link đặt lại mật khẩu dùng PKCE: chỉ máy đã xin thư mới đổi được `code` lấy session.

Viết Comfort đòi tài khoản thật vì đó là thứ duy nhất người lạ đọc được: cần một danh tính không tái tạo được sau mỗi lần cài lại app, để việc chặn một người viết có ý nghĩa.

Xoá dữ liệu ⇒ `on delete cascade` ⇒ Comfort của họ biến mất khỏi pool. Đúng quyền thu hồi mà spec §5.2 yêu cầu. Người đã nhận vẫn giữ bản sao trong SQLite máy mình.

## Kiểu chung

| Kiểu | Giá trị |
|---|---|
| `tag_kind` | `sad` `joy` `unknown` |
| `lang` | `en` `vi` `ja` |
| `comfort_status` | `pending` `approved` `rejected` `retracted` |

Tag không còn là enum: danh sách nằm trong bảng [`tags`](#tags) do admin quản lý ([ADR 0009](./adr/0009-tag-do-admin-quan-ly.md)), cột `tags` của `comforts` / `entries` là `text[]` có trigger kiểm từng id tồn tại. Luật Tag ở [tags.md](./tags.md).

Thêm một ngôn ngữ = một giá trị `lang` (migration một dòng) + `LANGS` và một file dịch trong app (`app/src/i18n/`). Không thêm cột, không thêm bảng; batch đêm tự dịch backlog sang giá trị mới ([ADR 0003](./adr/0003-dich-comfort-theo-batch.md)). `LANGS` phải khớp enum (`i18n.test.ts` check).

---

# Server — Supabase

## `tags`

Danh sách Tag, admin sửa trên Table Editor của Supabase — [ADR 0009](./adr/0009-tag-do-admin-quan-ly.md). Seed ban đầu (10 Tag cũ) ở `0003_tags_table.sql`; app đóng gói sẵn cùng bản đó.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | text | PK, `^[a-z][a-z_]*$` | Cố định mãi mãi: nằm trong Comfort trên server và Entry trên mọi máy |
| `kind` | tag_kind | not null | `sad` / `joy` / `unknown`. `joy` = không fallback về `unknown` |
| `labels` | jsonb | not null | `{"vi": …, "en": …, "ja": …}`; mọi giá trị của `lang` phải có nhãn khác rỗng |
| `sort` | int | not null, default 0 | Thứ tự admin xếp |
| `active` | boolean | not null, default true | `false` = ẩn khỏi form; vẫn match, vẫn hiện nhãn ở Entry cũ |

**CHECK:** `(id = 'unknown') = (kind = 'unknown')` — `unknown` là Tag duy nhất có kind đó · `active or id <> 'unknown'` — không ẩn được `unknown`.

**Trigger `tags_guard`** (before insert/update/delete): cấm xoá (ẩn bằng `active = false`), cấm đổi `id`, đòi đủ nhãn cho mọi giá trị `enum_range(null::lang)`. Luật nằm ở trigger chứ không ở policy vì dashboard chạy bằng `postgres`, bỏ qua RLS. Thêm một `lang` thì migration đó phải điền nhãn cho mọi Tag.

## `comforts`

Lời động viên ẩn danh, bản gốc, bằng ngôn ngữ người viết.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `author_id` | uuid | not null, FK → `auth.users` **cascade** | Không bao giờ lộ ra ngoài. Bắt buộc là tài khoản thật, không phải anonymous |
| `body` | text | not null, độ dài 20–500 | |
| `source_lang` | lang | not null | Luôn dịch từ đây, không dịch chuyền. Người viết chọn trên màn viết, mặc định là ngôn ngữ app |
| `tags` | text[] | not null, 1–2 phần tử | Mỗi id phải có trong `tags` (trigger `check_tag_ids`, chỉ kiểm tồn tại, không kiểm `active`) |
| `status` | comfort_status | not null, default `pending` | `pending` chính là hàng đợi duyệt |
| `mod_note` | text | | Admin ghi lý do khi từ chối |
| `created_at` | timestamptz | not null, default `now()` | |

**Index:** GIN trên `tags` (partial, `status='approved'`) · `(status, created_at)`

**Chỉ tài khoản thật, tối đa 5 Comfort / 24h** — enforce ở tầng RLS, không phải trong app:

```sql
create policy comfort_insert on comforts for insert to authenticated
with check (
  author_id = auth.uid()
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  and (select count(*) from comforts c
       where c.author_id = auth.uid()
         and c.created_at > now() - interval '24 hours') < 5
);
```

Sliding window 24h chứ không phải "mỗi ngày" — tránh phải chọn ngày theo múi giờ nào cho một app đa quốc gia.

## `comfort_translations`

Bảng riêng chứ không phải cột trong `comforts` — thêm ngôn ngữ thứ tư là dịch lại backlog, xem [ADR 0003](./adr/0003-dich-comfort-theo-batch.md).

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `comfort_id` | uuid | PK(1/2), FK → `comforts` cascade | |
| `lang` | lang | PK(2/2) | |
| `body` | text | not null | Dịch từ `comforts.body` |
| `created_at` | timestamptz | not null, default `now()` | |

## `deliveries`

Đã gửi Comfort nào cho ai. **Khoá chính chính là rule "không gửi lại lần hai"** — không phải một câu `if` trong code.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `comfort_id` | uuid | PK(1/2), FK → `comforts` cascade | |
| `recipient_id` | uuid | PK(2/2), FK → `auth.users` cascade | |
| `delivered_at` | timestamptz | not null, default `now()` | |
| `thanked` | boolean | not null, default `false` | **Chỉ admin đọc.** Tác giả không bao giờ thấy con số này |

**Index:** `(recipient_id)`

## `hotlines`

Admin cập nhật; app vẫn đóng gói sẵn bản dự phòng — [ADR 0005](./adr/0005-hotline-offline-first.md).

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `country` | text | not null | ISO 3166-1 alpha-2 |
| `name` | text | not null | |
| `phone` | text | | check: `phone` hoặc `url` phải có ít nhất một |
| `url` | text | | |
| `hours` | text | | Giờ hoạt động, hiển thị nguyên văn |
| `sort` | int | not null, default 0 | |

**Index:** `(country, sort)`

**Còn nợ:** `name` và `hours` chỉ chứa được một ngôn ngữ. Bản đóng gói trong app (`app/src/hotlines.ts`) đã có đủ en/vi/ja; trước khi app đọc bảng này (hiện chưa đọc) phải thêm bản dịch cho nó.

## `entries`

**Chỉ tồn tại cho tài khoản thật đã bật sao lưu** ([ADR 0010](./adr/0010-sync-entry.md)). Bản sao của SQLite, không phải source of truth. **Mã hoá đầu-cuối:** server chỉ thấy `id`, chủ, thời điểm ghi lên và có bị xoá hay không.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | PK | Do máy sinh, không phải server |
| `user_id` | uuid | not null, FK → `auth.users` cascade | |
| `payload` | text | not null trừ tombstone | hex(nonce 24 byte ‖ XChaCha20-Poly1305 của JSON `{occurredAt, durationMin, intensity, tags, reflection, attachments}`) bằng khoá sao lưu của tài khoản. `attachments` = `[{"id", "kind": "image" \| "audio", "path"}]` theo thứ tự hiện; `path` trong bucket `entry-attachments`, `id` = id dòng `attachments` trên máy. Dạng JSON: `entryPayload` (`app/src/validation.ts`) |
| `deleted_at` | timestamptz | | Khác null = **tombstone**: Entry đã xoá, để máy khác của tài khoản xoá theo |
| `created_at` | timestamptz | not null, default `now()` | |
| `occurred_at`, `duration_min`, `intensity`, `tags`, `reflection`, `attachments` | | luôn null | Cột cũ trước khi mã hoá (`0004`). Giữ lại vì xoá cột cần migration phá huỷ được duyệt tay; CHECK bắt chúng null |

**Index:** `(user_id, occurred_at desc)` — vô dụng từ khi `occurred_at` luôn null, bỏ cùng các cột cũ.

**CHECK `entries_tombstone`:** `deleted_at` null ⇔ `payload` khác null, và các cột cũ luôn null (`0006_entry_payload.sql`). Server không bao giờ giữ nội dung đọc được.

**Khoá sao lưu** nằm trong `user_metadata.entry_key` = `{id, salt, box}` (hex): `box` là khoá 32 byte mã hoá bằng scrypt(mật khẩu, `salt`). `null` khi sao lưu tắt. Trên máy: SecureStore `entry_key_<user id>` = `<id>:<khoá hex>`, xoá khi đăng xuất.

## Storage `entry-attachments`

Ảnh và ghi âm của Entry đã sao lưu, **mã hoá cả file** (nonce ‖ ciphertext, cùng khoá với `payload`), `contentType` `application/octet-stream`. Private, tối đa 25 MB mỗi file. Đường dẫn `<user id>/<entry id>/<tên file trên máy>`. Policy `entry_files_own` (mọi lệnh): thư mục đầu = `auth.uid()` và không phải anonymous. App tải qua signed URL 60 giây rồi giải mã trên máy. Xoá tài khoản không tự xoá file (cascade không tới Storage).

## RLS

Bật cho tất cả các bảng.

| Bảng | Đọc | Ghi |
|---|---|---|
| `comforts` | chỉ của chính mình | insert: tài khoản thật, ≤ 5/24h; update chỉ để đổi sang `retracted` |
| `comfort_translations` | không ai | chỉ batch (service role) |
| `deliveries` | chỉ dòng mình là người nhận | update `thanked` của chính mình |
| `entries` | chỉ của mình, tài khoản thật | chỉ của mình, tài khoản thật |
| `hotlines` | ai cũng đọc | chỉ admin |
| `tags` | ai cũng đọc (`anon`, `authenticated`) | chỉ admin (dashboard / service role); không có policy ghi |

Người nhận không đọc được `comforts`, nên `author_id` không có đường nào ra ngoài. Ẩn danh do RLS giữ, không phải do app quên hiển thị — [ADR 0008](./adr/0008-pool-chi-doc-qua-function.md).

## `request_comfort()` — đường đọc duy nhất vào pool

Không ai `select` thẳng vào `comforts`. Cái này không diễn đạt được bằng bảng nên để nguyên SQL.

```sql
create function request_comfort(p_tags text[], p_lang lang)
returns table (comfort_id uuid, body text, translated boolean)
language sql security definer set search_path = public, pg_temp as $fn$
  with picked as (
    select c.id,
           coalesce(t.body, c.body) as body,
           t.comfort_id is not null as translated
    from comforts c
    left join comfort_translations t
      on t.comfort_id = c.id and t.lang = p_lang
    where c.status = 'approved'
      and c.author_id <> auth.uid()
      -- trùng tag; không có thì lùi về 'unknown', trừ khi Entry có Tag kind 'joy' (xem tags.md)
      and (c.tags && p_tags
           or (not exists (select 1 from tags g where g.id = any(p_tags) and g.kind = 'joy')
               and 'unknown' = any(c.tags)))
      -- không trả bản chưa có ngôn ngữ của người đọc
      and (t.comfort_id is not null or c.source_lang = p_lang)
      and not exists (
        select 1 from deliveries d
        where d.comfort_id = c.id and d.recipient_id = auth.uid())
      -- tối đa 3 Comfort nhận được trong 24h
      and (select count(*) from deliveries d2
           where d2.recipient_id = auth.uid()
             and d2.delivered_at > now() - interval '24 hours') < 3
    order by (c.tags && p_tags) desc, random()
    limit 1
  ), logged as (
    insert into deliveries (comfort_id, recipient_id)
    select id, auth.uid() from picked
    returning comfort_id
  )
  select id, body, translated from picked;
$fn$;
```

Năm rule hàm này enforce: không nhận Comfort của chính mình · không nhận lại cái đã nhận · tối đa 3 lần / 24h · không trả bản chưa dịch sang ngôn ngữ người đọc · Entry có Tag `joy` không fallback về `unknown`. Tag đã ẩn (`active = false`) vẫn match.

App truyền `p_lang` là ngôn ngữ app đang dùng.

Chỉ `authenticated` gọi được. Supabase cấp `execute` cho `anon` theo mặc định — đã revoke
(`0002_revoke_request_comfort_from_anon.sql`); chưa đăng nhập thì `auth.uid()` là null nên hàm
vốn đã không trả gì, nhưng để `anon` gọi được một `security definer` là thừa bề mặt tấn công.

**Đã verify bằng SQL thật trên project, không phải suy đoán.** Cả năm rule đều đúng như thiết kế.
Điểm từng nghi ngờ: CTE `insert ... returning` **có** ghi `deliveries` — Postgres đảm bảo CTE
sửa dữ liệu chạy đúng một lần dù không được tham chiếu, nên không cần viết lại bằng `plpgsql`.

`0003_tags_table.sql` (bảng `tags`, rule `joy`) đã apply 2026-11-03 qua SQL Editor (connector MCP từ chối
lệnh DDL có `drop`, nên không có dòng trong `supabase_migrations`). Verify bằng `execute_sql`, mọi dữ liệu test rollback:
Entry buồn pool rỗng nhận lời `unknown` · Entry `joy` (kể cả `joy` + buồn) không nhận gì · Tag đã ẩn vẫn match ·
hết 3/24h không nhận gì · pool rỗng không nhận gì · Tag không tồn tại bị từ chối ở `comforts` và `entries` (23503) ·
xoá Tag, đổi id, thiếu nhãn `ja`, `kind = 'unknown'` thứ hai, ẩn `unknown` đều bị chặn · Tag hợp lệ mới thêm được.

---

# App — SQLite

## `entries`

Source of truth. Tồn tại kể cả khi không có mạng, không có tài khoản.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | text | PK | uuid, dùng lại làm id khi sync |
| `occurred_at` | integer | not null | epoch ms |
| `duration_min` | integer | | |
| `intensity` | integer | not null, 1–5 | |
| `tags` | text | not null | JSON array các tag id |
| `reflection` | text | | Không rời khỏi máy trừ khi bật sync |
| `synced_at` | integer | | `null` = chưa có trên server của tài khoản trong `settings.sync_user` |
| `deleted_at` | integer | | Khác null = tombstone chờ đẩy lên server; chữ, ảnh, ghi âm, lời đã nhận đã xoá. Mọi màn lọc `deleted_at is null` |

`synced_at` là **toàn bộ** cơ chế sync: null thì đẩy lên, khác null thì thôi. Entry không sửa được sau khi lưu nên không có conflict — local luôn thắng, server chỉ là bản sao. Luồng đầy đủ ở `app/src/sync.ts` và [ADR 0010](./adr/0010-sync-entry.md).

**Xoá một Entry** (`deleteEntry`, `app/src/db.ts`): `synced_at` null là hard delete (`purgeEntry`) — `delete from entries` (`attachments`, `received_comforts` đi theo `on delete cascade`, cần `pragma foreign_keys = ON`) rồi xoá các file `attachments/…`. `synced_at` khác null thì xoá dòng `attachments`, `received_comforts`, file, `reflection`, `duration_min`, đặt `deleted_at`; lần sync sau xoá file trên Storage, ghi tombstone lên server rồi mới `purgeEntry`. Delivery trên server vẫn còn và vẫn tính vào limit 3 / 24h.

## `attachments`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | text | PK | |
| `entry_id` | text | not null, FK → `entries` cascade | |
| `kind` | text | not null, `image` \| `audio` | |
| `path` | text | not null | Tương đối so với thư mục document của app: `attachments/<id>.<đuôi>`. Không lưu đường dẫn tuyệt đối — iOS đổi đường dẫn container sau mỗi lần cập nhật app |
| `remote` | text | | Đường dẫn trong bucket `entry-attachments`, `null` nếu chưa đẩy lên. Khác null mà file trên máy chưa có = đang khôi phục, lần sync sau tải tiếp |

Tối đa 3 ảnh và 1 ghi âm ≤ 5 phút mỗi Entry — chỉ app enforce (`app/src/app/new.tsx`), không có CHECK: SQLite không đếm qua bảng được trong CHECK. File từ picker / máy ghi âm nằm trong cache cho tới lúc bấm Lưu; Lưu mới chép vào `attachments/` rồi ghi Entry và các dòng này trong một transaction. Thứ tự ảnh = thứ tự thêm (`rowid`); Timeline xếp polaroid theo thứ tự này.

## `settings`

Cài đặt của người dùng. Chỉ ở máy, không sync, không lên server.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `key` | text | PK | |
| `value` | text | not null | |

Key đang dùng:

- `receive_comforts` = `on` \| `off`. Thiếu key ⇒ coi như `on`.
  Tắt thì không còn nút xin Comfort ở bất kỳ Entry nào — overview.md §6.
- `timeline_last_opened` = id của Entry mở gần nhất. Mở lại app thì Timeline cuộn về đêm của Entry đó
  (DESIGN.md, Layout). Thiếu key hoặc Entry không còn ⇒ đứng ở đầu trang.
- `language` = `vi` \| `en` \| `ja` — ngôn ngữ chọn trong Cài đặt. Thiếu key ⇒ theo ngôn ngữ máy;
  máy dùng tiếng khác ⇒ `en` (`app/src/i18n/index.ts`).
- `help_fab_position` = JSON `{"side": "left" | "right", "lift": <số>}` — chỗ người dùng kéo nút trợ giúp
  tới. `lift` = dp từ đáy vùng màn (trên thanh điều hướng / inset đáy) tới đáy nút; mỗi màn tự kẹp vào khoảng
  của nó (ít nhất `space.md` trên footer, nhiều nhất `space.md` dưới status bar), không ghi lại. Thiếu key
  hoặc giá trị đọc không được ⇒ góc dưới phải (`fabPosition` trong `app/src/validation.ts`).
- `sync_user` = user id mà các dấu `synced_at` / `remote` trên máy đang nói tới; `''` hoặc thiếu = chưa sync với ai.
  Khác user đang đăng nhập (đã bật sao lưu) ⇒ quên hết dấu rồi đẩy lại lên tài khoản mới.
- `sync_last_at` = epoch ms của lượt sync xong gần nhất, hiện ở Cài đặt. `''` khi quên dấu.

Công tắc sao lưu **không** nằm ở bảng này: nó là cờ `entry_sync` trong `user_metadata` của tài khoản, để mọi máy của tài khoản theo cùng một công tắc (ADR 0010).

Key và value đều tiếng Anh. Máy cài bản cũ có key tiếng Việt (`nhan_comfort` = `bat` \| `tat`, `ngon_ngu`,
`timeline_dung`): mở app là `app/src/db.ts` chép sang key mới một lần (`bat` → `on`, `tat` → `off`) rồi xoá key cũ.
Key cũ còn sót bên cạnh key mới (bản app cũ ghi sau lần chép) thì key cũ thắng — đó là lựa chọn gần nhất.

## `tags`

Bản sao danh sách Tag của server ([ADR 0009](./adr/0009-tag-do-admin-quan-ly.md)). Form và mọi chỗ hiện nhãn đọc từ đây (qua danh sách trong bộ nhớ ở `app/src/tags.ts`), kể cả khi không mạng, không tài khoản.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | text | PK | Như `tags.id` trên server |
| `kind` | text | not null | `sad` \| `joy` \| `unknown` |
| `labels` | text | not null | JSON `{"vi": …, "en": …, "ja": …}`; thiếu ngôn ngữ app thì hiện `en` |
| `sort` | integer | not null | Thứ tự admin xếp |
| `active` | integer | not null | 0 = admin đã ẩn: form không bày, lần khóc cũ vẫn hiện nhãn |

- **Mở app:** `insert … on conflict do nothing` bản đóng gói `TAGS_BUNDLED` (= seed của `0003_tags_table.sql`) — máy mới cài, không mạng vẫn có đủ danh sách; bản app mới có thêm Tag thì thêm dòng mà không đè nhãn server.
- **Cập nhật** (`refreshTags` trong `app/src/supabase.ts`, gọi nền ở `_layout` gốc): tải **cả bảng** (gồm Tag đã ẩn), parse từng dòng bằng zod (`tagRow` — dòng bản app này đọc không được, ví dụ `kind` mới, thì bỏ qua chứ không bỏ cả danh sách), upsert trong một transaction. Lỗi mạng thì im lặng, giữ bản đang có. Không dùng `updated_at`: vài chục dòng rẻ hơn theo dõi thay đổi.
- **Không bao giờ xoá dòng.** Server cấm xoá Tag, nên upsert là đủ.
- Id không có trong bảng (dữ liệu sync từ máy khác trước khi tải danh sách) thì bỏ qua khi hiện nhãn.
- **Số lần chọn** cho hàng nhanh của `TagPicker` không lưu ở đâu: `tagUsage` (`app/src/db.ts`) đếm thẳng từ `entries.tags` (`json_each`, `deleted_at is null`), nên xoá lần khóc là số đếm tự đổi. Không đếm `unknown`: đó là giá trị `normalizeTags` ghi khi không chọn gì, không phải một lựa chọn.

## `received_comforts`

Comfort đã nhận, giữ để xem lại offline. Bản sao, không phải source of truth.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `comfort_id` | text | PK(2/2), not null | |
| `entry_id` | text | PK(1/2), not null, FK → `entries` cascade | **Chỉ tồn tại ở đây** — server không biết Comfort nào thuộc Entry nào |
| `body` | text | not null | Bằng ngôn ngữ app lúc nhận; đổi ngôn ngữ sau đó thì lời cũ giữ nguyên |
| `translated` | integer | not null, default 0 | Hiện nhãn "đã dịch tự động" |
| `received_at` | integer | not null | |
| `thanked` | integer | not null, default 0 | Để UI không cho cảm ơn hai lần |

Khoá chính là `(entry_id, comfort_id)`, không phải `comfort_id`: server chỉ chặn giao lại trong cùng một danh tính,
nên máy đổi danh tính (đăng xuất rồi thành anonymous mới, đăng nhập tài khoản khác) vẫn nhận lại được một lời
đã kẹp ở lần khóc khác. Khoá chính cũ làm `insert or ignore` nuốt mất lời đó — server đã trừ lượt mà màn hình trống.
Máy có bảng khoá chính cũ được chép sang khoá chính mới khi mở app (`app/src/db.ts`).

---

## Batch đêm

Hai bước, đúng thứ tự ([ADR 0002](./adr/0002-comfort-trong-mvp.md)):

| # | Bước | Truy vấn | Kết quả |
|---|---|---|---|
| 1 | Kiểm duyệt | `comforts` đang `pending` | → `approved` / `rejected`; nghi ngờ thì để nguyên `pending` cho admin |
| 2 | Dịch | `comforts` đã `approved`, thiếu dòng trong `comfort_translations` cho một `lang` | insert bản dịch, **dịch từ `body` gốc** |

Hai con số phải nhìn được — đó là cách duy nhất biết batch đã chết:

```sql
select count(*) from comforts where status = 'pending';
select count(*) from comforts c cross join unnest(enum_range(null::lang)) l
where c.status = 'approved'
  and not exists (select 1 from comfort_translations t
                  where t.comfort_id = c.id and t.lang = l)
  and c.source_lang <> l;
```
