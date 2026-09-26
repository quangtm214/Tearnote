import * as SQLite from 'expo-sqlite';
import { normalizeTags, type TagId } from './tags';

/**
 * SQLite trên máy — nguồn sự thật của Entry. Luôn có, kể cả khi không mạng, không tài khoản.
 * Server chỉ là bản sao (ADR 0004). Schema phải khớp docs/db.md.
 */
const db = SQLite.openDatabaseSync('tearnote.db');

db.execSync(`
  pragma journal_mode = WAL;
  pragma foreign_keys = ON;

  create table if not exists entries (
    id           text primary key,
    occurred_at  integer not null,                                 -- epoch ms, lúc khóc
    duration_min integer check (duration_min is null or duration_min >= 0),
    intensity    integer not null check (intensity between 1 and 5),
    tags         text not null,                                    -- JSON array TagId
    reflection   text,
    synced_at    integer,                                          -- null = chưa sao lưu
    deleted_at   integer                                           -- xoá mềm, để sync xoá bên kia
  );
  create index if not exists entries_occurred_idx on entries (occurred_at desc);

  create table if not exists attachments (
    id       text primary key,
    entry_id text not null references entries(id) on delete cascade,
    kind     text not null check (kind in ('image', 'audio')),
    path     text not null,
    remote   text
  );

  create table if not exists settings (
    key   text primary key,
    value text not null
  );

  create table if not exists received_comforts (
    comfort_id  text primary key,
    entry_id    text not null references entries(id) on delete cascade,
    body        text not null,
    translated  integer not null default 0,
    received_at integer not null,
    thanked     integer not null default 0
  );
`);

export type Entry = {
  id: string;
  occurredAt: number;
  durationMin: number | null;
  intensity: number;
  tags: TagId[];
  reflection: string | null;
};

type EntryRow = {
  id: string;
  occurred_at: number;
  duration_min: number | null;
  intensity: number;
  tags: string;
  reflection: string | null;
};

const toEntry = (r: EntryRow): Entry => ({
  id: r.id,
  occurredAt: r.occurred_at,
  durationMin: r.duration_min,
  intensity: r.intensity,
  tags: JSON.parse(r.tags),
  reflection: r.reflection,
});

/**
 * UUID v4 do SQLite sinh (randomblob dùng nguồn ngẫu nhiên an toàn của SQLite). Hermes không có
 * `crypto.randomUUID`, và id phải là uuid thật vì server dùng lại nó khi sync (docs/db.md).
 */
const UUID_V4 = `select lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4'
  || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1)
  || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))) as id`;

export function insertEntry(e: Omit<Entry, 'id'>): string {
  const id = db.getFirstSync<{ id: string }>(UUID_V4)!.id;
  db.runSync(
    `insert into entries (id, occurred_at, duration_min, intensity, tags, reflection)
     values (?, ?, ?, ?, ?, ?)`,
    id,
    e.occurredAt,
    e.durationMin,
    e.intensity,
    JSON.stringify(normalizeTags(e.tags)),
    e.reflection,
  );
  return id;
}

export function listEntries(): Entry[] {
  return db
    .getAllSync<EntryRow>(
      `select id, occurred_at, duration_min, intensity, tags, reflection
       from entries where deleted_at is null order by occurred_at desc`,
    )
    .map(toEntry);
}

export function getEntry(id: string): Entry | null {
  const r = db.getFirstSync<EntryRow>(
    `select id, occurred_at, duration_min, intensity, tags, reflection
     from entries where id = ? and deleted_at is null`,
    id,
  );
  return r ? toEntry(r) : null;
}

export type ReceivedComfort = {
  comfortId: string;
  entryId: string;
  body: string;
  translated: boolean;
  thanked: boolean;
};

/** entry_id chỉ tồn tại ở đây — server không biết Comfort nào thuộc Entry nào (ADR 0004). */
export function saveReceivedComfort(c: Omit<ReceivedComfort, 'thanked'>): void {
  db.runSync(
    `insert or ignore into received_comforts
       (comfort_id, entry_id, body, translated, received_at)
     values (?, ?, ?, ?, ?)`,
    c.comfortId,
    c.entryId,
    c.body,
    c.translated ? 1 : 0,
    Date.now(),
  );
}

export function listReceivedComforts(entryId: string): ReceivedComfort[] {
  return db
    .getAllSync<{
      comfort_id: string;
      entry_id: string;
      body: string;
      translated: number;
      thanked: number;
    }>(
      `select comfort_id, entry_id, body, translated, thanked
       from received_comforts where entry_id = ? order by received_at desc`,
      entryId,
    )
    .map((r) => ({
      comfortId: r.comfort_id,
      entryId: r.entry_id,
      body: r.body,
      translated: r.translated === 1,
      thanked: r.thanked === 1,
    }));
}

export function markThanked(comfortId: string): void {
  db.runSync(`update received_comforts set thanked = 1 where comfort_id = ?`, comfortId);
}

/**
 * Cài đặt của người dùng, dạng khoá–giá trị. Chỉ ở máy, không đồng bộ.
 * Mặc định nằm ở chỗ gọi, không nằm ở đây — DB không biết giá trị nào là hợp lý.
 */
export function getSetting(key: string): string | null {
  return db.getFirstSync<{ value: string }>(`select value from settings where key = ?`, key)?.value
    ?? null;
}

export function setSetting(key: string, value: string): void {
  db.runSync(
    `insert into settings (key, value) values (?, ?)
     on conflict (key) do update set value = excluded.value`,
    key,
    value,
  );
}

/**
 * Công tắc tắt hoàn toàn việc nhận Comfort — overview.md §6 gọi đây là một trong hai
 * lưới an toàn duy nhất, vì hệ thống không tự nhận ra ai đang khủng hoảng.
 * Mặc định BẬT: pool là lý do Tearnote tồn tại. Tắt rồi thì không còn nút xin ở đâu cả.
 */
export const nhanComfortBat = () => getSetting('nhan_comfort') !== 'tat';
export const datNhanComfort = (bat: boolean) => setSetting('nhan_comfort', bat ? 'bat' : 'tat');
