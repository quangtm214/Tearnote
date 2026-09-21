# Cấu trúc dữ liệu

Hai kho tách biệt. Đọc [ADR 0004](./adr/0004-luu-tru-local-first.md) trước để hiểu vì sao.

- **SQLite trên máy** — nguồn sự thật của Entry. Luôn có, kể cả khi không đăng nhập.
- **Supabase (Postgres)** — pool Comfort, bản dịch, hotline, và bản sao Entry cho ai bật sync.

Đã apply lên project thật và kiểm bằng SQL — xem cuối mục `request_comfort()`.

## Về "tài khoản"

Mỗi lần cài app sinh một **anonymous user** của Supabase — người dùng không đăng ký gì. Dòng `auth.users` đó là chỗ neo cho "đã gửi Comfort nào cho ai". Tài khoản thật (email) xuất hiện khi người dùng bật sync Entry, hoặc khi họ muốn viết Comfort.

| | Anonymous | Tài khoản thật |
|---|---|---|
| Ghi Entry, xem timeline, thống kê | có | có |
| Nhận Comfort (tối đa 3 / 24h) | có | có |
| **Viết Comfort** | **không** | có (tối đa 5 / 24h) |
| Sync Entry lên server | không | có, nếu bật |

Viết Comfort đòi tài khoản thật vì đó là thứ duy nhất người lạ đọc được: cần một danh tính không tái tạo được sau mỗi lần cài lại app, để việc chặn một người viết có ý nghĩa.

Xoá dữ liệu ⇒ `on delete cascade` ⇒ Comfort của họ biến mất khỏi pool. Đúng quyền thu hồi mà spec §5.2 yêu cầu. Người đã nhận vẫn giữ bản sao trong SQLite máy mình.

## Kiểu chung

| Kiểu | Giá trị |
|---|---|
| `tag` | `heartbreak` `grief` `pressure` `self_worth` `loneliness` `family` `overwhelm` `anxiety` `moved` `unknown` |
| `lang` | `en` `vi` `ja` |
| `comfort_status` | `pending` `approved` `rejected` `retracted` |

Enum chứ không phải text tự do: contract ở [tags.md](./tags.md) do DB ép, không phải app tự giữ. Thêm giá trị về sau là `alter type ... add value`.

---

# Server — Supabase

## `comforts`

Lời động viên ẩn danh, bản gốc, bằng ngôn ngữ người viết.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `author_id` | uuid | not null, FK → `auth.users` **cascade** | Không bao giờ lộ ra ngoài. Bắt buộc là tài khoản thật, không phải anonymous |
| `body` | text | not null, độ dài 20–500 | |
| `source_lang` | lang | not null | Luôn dịch từ đây, không dịch chuyền |
| `tags` | tag[] | not null, 1–2 phần tử | |
| `status` | comfort_status | not null, default `pending` | `pending` chính là hàng đợi duyệt |
| `mod_note` | text | | Admin ghi lý do khi từ chối |
| `created_at` | timestamptz | not null, default `now()` | |

**Index:** GIN trên `tags` (partial, `status='approved'`) · `(status, created_at)`

**Chỉ tài khoản thật, tối đa 5 Comfort / 24h** — ép ở tầng RLS, không phải trong app:

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

Cửa sổ trượt 24h chứ không phải "mỗi ngày" — tránh phải chọn ngày theo múi giờ nào cho một app đa quốc gia.

## `comfort_translations`

Bảng riêng chứ không phải cột trong `comforts` — thêm ngôn ngữ thứ tư là dịch lại backlog, xem [ADR 0003](./adr/0003-dich-comfort-theo-batch.md).

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `comfort_id` | uuid | PK(1/2), FK → `comforts` cascade | |
| `lang` | lang | PK(2/2) | |
| `body` | text | not null | Dịch từ `comforts.body` |
| `created_at` | timestamptz | not null, default `now()` | |

## `deliveries`

Đã gửi Comfort nào cho ai. **Khoá chính chính là luật "không gửi lại lần hai"** — không phải một câu `if` trong code.

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

## `entries`

**Chỉ tồn tại cho người đã bật sync.** Bản sao của SQLite, không phải nguồn sự thật.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | PK | Do máy sinh, không phải server |
| `user_id` | uuid | not null, FK → `auth.users` cascade | |
| `occurred_at` | timestamptz | not null | Lúc khóc, không phải lúc ghi |
| `duration_min` | int | ≥ 0 | |
| `intensity` | smallint | not null, 1–5 | |
| `tags` | tag[] | not null, 1–3 phần tử | |
| `reflection` | text | | |
| `attachments` | text[] | | Đường dẫn trong Supabase Storage |
| `created_at` | timestamptz | not null, default `now()` | |

**Index:** `(user_id, occurred_at desc)`

## RLS

Bật cho tất cả các bảng.

| Bảng | Đọc | Ghi |
|---|---|---|
| `comforts` | chỉ của chính mình | insert: tài khoản thật, ≤ 5/24h; update chỉ để đổi sang `retracted` |
| `comfort_translations` | không ai | chỉ batch (service role) |
| `deliveries` | chỉ dòng mình là người nhận | update `thanked` của chính mình |
| `entries` | chỉ của mình | chỉ của mình |
| `hotlines` | ai cũng đọc | chỉ admin |

Người nhận không đọc được `comforts`, nên `author_id` không có đường nào ra ngoài. Ẩn danh do RLS giữ, không phải do app quên hiển thị — [ADR 0008](./adr/0008-pool-chi-doc-qua-function.md).

## `request_comfort()` — đường đọc duy nhất vào pool

Không ai `select` thẳng vào `comforts`. Cái này không diễn đạt được bằng bảng nên để nguyên SQL.

```sql
create function request_comfort(p_tags tag[], p_lang lang)
returns table (comfort_id uuid, body text, translated boolean)
language sql security definer as $fn$
  with picked as (
    select c.id,
           coalesce(t.body, c.body) as body,
           t.comfort_id is not null as translated
    from comforts c
    left join comfort_translations t
      on t.comfort_id = c.id and t.lang = p_lang
    where c.status = 'approved'
      and c.author_id <> auth.uid()
      -- trùng tag; không có thì lùi về 'unknown', trừ 'moved' (xem tags.md)
      and (c.tags && p_tags
           or (not ('moved' = any(p_tags)) and 'unknown' = any(c.tags)))
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

Năm luật hàm này ép: không nhận Comfort của chính mình · không nhận lại cái đã nhận · tối đa 3 lần / 24h · không trả bản chưa dịch sang ngôn ngữ người đọc · `moved` không lùi về `unknown`.

Chỉ `authenticated` gọi được. Supabase cấp `execute` cho `anon` theo mặc định — đã revoke
(`0002_revoke_request_comfort_from_anon.sql`); chưa đăng nhập thì `auth.uid()` là null nên hàm
vốn đã không trả gì, nhưng để `anon` gọi được một `security definer` là thừa bề mặt tấn công.

**Đã kiểm bằng SQL thật trên project, không phải suy đoán.** Cả năm luật đều đúng như thiết kế.
Điểm từng nghi ngờ: CTE `insert ... returning` **có** ghi `deliveries` — Postgres đảm bảo CTE
sửa dữ liệu chạy đúng một lần dù không được tham chiếu, nên không cần viết lại bằng `plpgsql`.

---

# App — SQLite

## `entries`

Nguồn sự thật. Tồn tại kể cả khi không có mạng, không có tài khoản.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | text | PK | uuid, dùng lại làm id khi sync |
| `occurred_at` | integer | not null | epoch ms |
| `duration_min` | integer | | |
| `intensity` | integer | not null, 1–5 | |
| `tags` | text | not null | JSON array các tag id |
| `reflection` | text | | Không rời khỏi máy trừ khi bật sync |
| `synced_at` | integer | | `null` = chưa sao lưu lên server |
| `deleted_at` | integer | | Xoá mềm, để sync biết mà xoá bên kia |

`synced_at` là **toàn bộ** cơ chế sync: null thì đẩy lên, khác null thì thôi. Không vector clock, không resolve conflict — local luôn thắng, server chỉ là bản sao.

## `attachments`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | text | PK | |
| `entry_id` | text | not null, FK → `entries` cascade | |
| `kind` | text | not null, `image` \| `audio` | |
| `path` | text | not null | Đường dẫn file trên máy |
| `remote` | text | | Đường dẫn Storage, `null` nếu chưa sync |

## `settings`

Cài đặt của người dùng. Chỉ ở máy, không đồng bộ, không lên server.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `key` | text | PK | |
| `value` | text | not null | |

Khoá đang dùng: `nhan_comfort` = `bat` \| `tat`. Thiếu khoá ⇒ coi như `bat`.
Tắt thì không còn nút xin Comfort ở bất kỳ Entry nào — overview.md §6.

## `received_comforts`

Comfort đã nhận, giữ để xem lại offline. Bản sao, không phải nguồn sự thật.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `comfort_id` | text | PK | |
| `entry_id` | text | not null, FK → `entries` cascade | **Chỉ tồn tại ở đây** — server không biết Comfort nào thuộc Entry nào |
| `body` | text | not null | |
| `translated` | integer | not null, default 0 | Hiện nhãn "đã dịch tự động" |
| `received_at` | integer | not null | |
| `thanked` | integer | not null, default 0 | Để UI không cho cảm ơn hai lần |

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
