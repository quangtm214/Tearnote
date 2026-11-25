import { Directory, File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@supabase/supabase-js';

import { bytesToHex, hexToBytes, open, openText, passwordKey, seal, sealText } from './crypto';
import {
  deleteAttachmentRow,
  entriesToUpload,
  filesToDownload,
  forgetSync,
  getSetting,
  hasAttachment,
  insertSyncedEntry,
  localEntryStates,
  markSynced,
  markUnsynced,
  purgeEntry,
  randomBytes,
  setAttachmentRemote,
  setSetting,
  tombstoneIds,
} from './db';
import { supabase } from './supabase';
import { entryPayload, remoteEntryRow, wrappedKey } from './validation';

/**
 * Entry sync: an end-to-end encrypted copy of the journal on the server, so a real account gets it back on a
 * new device. Off by default, turned on per account (ADR 0010). The device stays the source of truth
 * (ADR 0004): Entries never change after saving, so sync only adds and deletes — no conflicts to resolve.
 */

const BUCKET = 'entry-attachments';
/** user_metadata flag: the switch is per account, so every device of that account follows it. */
const FLAG = 'entry_sync';
/** user_metadata: the backup key wrapped by the password (`wrappedKey`); null while backup is off. */
const KEY_META = 'entry_key';
/** Settings key: the user id this device's `synced_at` / `remote` marks refer to; '' = none. */
const SYNC_USER = 'sync_user';
/** Settings key: epoch ms of the last sync that finished with nothing left over. */
const LAST_AT = 'sync_last_at';
const PAGE = 1000;

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

/** Reads the local session: the switch shows the right state offline too. */
export const isSyncOn = (session: Session) =>
  !!session && session.user.is_anonymous !== true && session.user.user_metadata?.[FLAG] === true;

/**
 * This device already backs up to another account. Its Entries are never copied into a second account:
 * a shared phone must not leak one person's journal to another. It clears when that account signs in
 * again and turns backup off.
 */
export const isSyncBlocked = (session: Session) => {
  const owner = getSetting(SYNC_USER) ?? '';
  return isSyncOn(session) && owner !== '' && owner !== session!.user.id;
};

export const lastSyncAt = () => Number(getSetting(LAST_AT)) || null;

/** What a pull does with each Entry. Pure, so it is tested (sync.test.ts). */
export function planPull(
  local: { id: string; synced: boolean; deleted: boolean }[],
  remote: { id: string; deleted: boolean }[],
) {
  const localById = new Map(local.map((e) => [e.id, e]));
  const remoteIds = new Set(remote.map((e) => e.id));
  return {
    // New on the server: written on another device.
    insert: remote.filter((r) => !r.deleted && !localById.has(r.id)).map((r) => r.id),
    // Deleted on another device.
    purge: remote.filter((r) => r.deleted && localById.has(r.id)).map((r) => r.id),
    // Marked uploaded but the server lost it (sync turned off and on): upload again. Never delete for a
    // missing row — an empty server must not empty the journal.
    reupload: local.filter((e) => e.synced && !e.deleted && !remoteIds.has(e.id)).map((e) => e.id),
  };
}

// --- Backup key -------------------------------------------------------------------------------------------

// SecureStore item per account: "<key id>:<hex key>".
const keyItem = (uid: string) => `entry_key_${uid}`;

/** The backup key held on this device, only if it is the one the account uses now. */
async function deviceKey(user: User): Promise<Uint8Array | null> {
  const wrapped = wrappedKey.safeParse(user.user_metadata?.[KEY_META]);
  if (!wrapped.success) return null;
  const [id, hex] = (await SecureStore.getItemAsync(keyItem(user.id)))?.split(':') ?? [];
  // Backup turned off and on elsewhere makes a new key: sealing with the old one would lock the other devices out.
  return id === wrapped.data.id && hex ? hexToBytes(hex) : null;
}

async function wrap(password: string, key: Uint8Array, id: string) {
  const salt = randomBytes(16);
  return { id, salt: bytesToHex(salt), box: bytesToHex(seal(await passwordKey(password, salt), key)) };
}

/**
 * Puts the backup key on this device with the password just typed (account.tsx, reset-password.tsx).
 * `create` makes the key when the account has none (turning backup on). Returns false when the account has
 * a key that this password cannot open and this device does not hold — the backup stays locked here.
 */
export async function unlockBackup(password: string, create: boolean): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) return false;
  const user = data.user;
  const wrapped = wrappedKey.safeParse(user.user_metadata?.[KEY_META]);
  let id: string;
  let key: Uint8Array | null = null;
  if (wrapped.success) {
    id = wrapped.data.id;
    try {
      key = open(await passwordKey(password, hexToBytes(wrapped.data.salt)), hexToBytes(wrapped.data.box));
    } catch {
      // Wrapped by an older password (reset by email): a device that still holds the key wraps it again.
      key = await deviceKey(user);
      if (!key) return false;
      const { error } = await supabase.auth.updateUser({ data: { [KEY_META]: await wrap(password, key, id) } });
      if (error) return false;
    }
  } else {
    if (!create) return true;
    id = bytesToHex(randomBytes(8));
    key = randomBytes(32);
    const { error } = await supabase.auth.updateUser({ data: { [KEY_META]: await wrap(password, key, id) } });
    if (error) return false;
  }
  await SecureStore.setItemAsync(keyItem(user.id), `${id}:${bytesToHex(key)}`);
  locked = false;
  emit();
  return true;
}

/** Whether turning backup on can skip asking for the password. */
export async function hasBackupKey() {
  const { data } = await supabase.auth.getSession();
  return !!data.session && !!(await deviceKey(data.session.user));
}

/** Before signing out: the key leaves with the account; signing in again with the password brings it back. */
export async function lockBackup() {
  const { data } = await supabase.auth.getSession();
  if (data.session) await SecureStore.deleteItemAsync(keyItem(data.session.user.id));
}

// --- Runs -------------------------------------------------------------------------------------------------

const listeners = new Set<() => void>();
/** Called when a sync run starts and ends: screens reload Entries and the status line. */
export function onSync(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
const emit = () => listeners.forEach((fn) => fn());

let running: Promise<void> | null = null;
let again = false;
// While turning off, no run may upload what is being deleted.
let disabling = false;
// Backup on, but this device has no key (signed in without typing the password here, or the password changed).
let locked = false;
export const isSyncing = () => running !== null;
export const isSyncLocked = () => locked;

/**
 * Safe to call anytime (app start, after save / delete / sign-in): one run at a time, and a call during a
 * run triggers one more run after it. Never throws; a failed run leaves the rest for the next one.
 */
export function requestSync(): Promise<void> {
  if (disabling) return Promise.resolve();
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      try {
        await runSync();
      } catch {
        // Offline or server error: what is left stays marked and the next run retries.
      }
    } while (again && !disabling);
  })().finally(() => {
    running = null;
    emit();
  });
  emit();
  return running;
}

async function runSync() {
  // getUser asks the server: the switch may have changed on another device since this session's JWT.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) return;
  const uid = data.user.id;
  const owner = getSetting(SYNC_USER) ?? '';
  if (data.user.user_metadata?.[FLAG] !== true) {
    locked = false;
    // Turned off (here or on another device): finish deleting the server copy, then forget the marks.
    if (owner === uid) {
      await deleteServerCopy(uid);
      forget();
    }
    return;
  }
  if (owner !== '' && owner !== uid) return; // isSyncBlocked
  const key = await deviceKey(data.user);
  locked = !key;
  if (!key) return;
  if (owner === '') setSetting(SYNC_USER, uid);

  let complete = await pushDeletes(uid);
  complete = (await pushNew(uid, key)) && complete;
  if (!(await sameUser(uid))) return;
  if (await pull(uid, key)) again = true;
  complete = (await downloadFiles(key)) && complete;
  if (complete) setSetting(LAST_AT, String(Date.now()));
}

/** Signing out or in during a run switches the JWT under it: stop before writing for the wrong account. */
async function sameUser(uid: string) {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id === uid;
}

function forget() {
  forgetSync();
  setSetting(SYNC_USER, '');
  setSetting(LAST_AT, '');
}

/** Files first, then the row becomes a tombstone (no payload — CHECK entries_tombstone). */
async function deleteRemote(uid: string, id: string) {
  const folder = `${uid}/${id}`;
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(folder);
  if (listError) throw listError;
  if (files.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(files.map((f) => `${folder}/${f.name}`));
    if (error) throw error;
  }
  const { error } = await supabase
    .from('entries')
    .upsert({ id, user_id: uid, deleted_at: new Date().toISOString(), payload: null });
  if (error) throw error;
}

/** Each step below returns false when something was skipped, so the run is not reported as finished. */
async function pushDeletes(uid: string) {
  let complete = true;
  for (const id of tombstoneIds()) {
    try {
      await deleteRemote(uid, id);
      purgeEntry(id);
    } catch {
      complete = false;
    }
  }
  return complete;
}

// One Entry failing (e.g. a server rule) must not block the others, so errors are per Entry.
async function pushNew(uid: string, key: Uint8Array) {
  let complete = true;
  for (const e of entriesToUpload()) {
    try {
      const attachments = [];
      for (const a of e.attachments) {
        let remote = a.remote;
        if (!remote) {
          const file = new File(Paths.document, a.path);
          // Never downloaded before its marks were forgotten: nothing left to upload.
          if (!file.exists) {
            deleteAttachmentRow(a.id);
            continue;
          }
          remote = `${uid}/${e.id}/${a.path.split('/').pop()}`;
          const { error } = await supabase.storage
            .from(BUCKET)
            .upload(remote, seal(key, await file.bytes()).buffer as ArrayBuffer, {
              upsert: true,
              contentType: 'application/octet-stream',
            });
          if (error) throw error;
          setAttachmentRemote(a.id, remote);
        }
        attachments.push({ id: a.id, kind: a.kind, path: remote });
      }
      const payload = sealText(
        key,
        JSON.stringify({
          occurredAt: e.occurredAt,
          durationMin: e.durationMin,
          intensity: e.intensity,
          tags: e.tags,
          reflection: e.reflection,
          attachments,
        }),
      );
      const { error } = await supabase.from('entries').upsert({ id: e.id, user_id: uid, payload, deleted_at: null });
      if (error) throw error;
      // Deleted on this device while uploading: the purge found nothing to tombstone, so undo the upload.
      if (!markSynced(e.id)) await deleteRemote(uid, e.id);
    } catch {
      complete = false;
    }
  }
  return complete;
}

/** Returns true when some Entries must be uploaded again. */
async function pull(uid: string, key: Uint8Array): Promise<boolean> {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('entries')
      .select('id, payload, deleted_at')
      .eq('user_id', uid)
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    // A row this app version cannot read fails the whole pull: acting on a partial list could re-upload or skip.
    rows.push(...remoteEntryRow.array().parse(data));
    if (data.length < PAGE) break;
  }
  const plan = planPull(localEntryStates(), rows.map((r) => ({ id: r.id, deleted: r.deleted_at !== null })));
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const id of plan.insert) {
    const { attachments, ...entry } = entryPayload.parse(JSON.parse(openText(key, byId.get(id)!.payload!)));
    insertSyncedEntry(
      { id, ...entry },
      attachments.map((a) => ({ id: a.id, kind: a.kind, remote: a.path })),
    );
  }
  plan.purge.forEach(purgeEntry);
  plan.reupload.forEach(markUnsynced);
  return plan.reupload.length > 0;
}

async function downloadFiles(key: Uint8Array) {
  const missing = filesToDownload();
  if (!missing.length) return true;
  new Directory(Paths.document, 'attachments').create({ idempotent: true });
  const sealed = new File(Paths.cache, 'sync-download');
  let complete = true;
  for (const f of missing) {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.remote, 60);
      if (error) throw error;
      await File.downloadFileAsync(data.signedUrl, sealed, { idempotent: true });
      // An HTTP error body fails to open too, so a bad download never becomes a photo.
      const bytes = open(key, await sealed.bytes());
      // Entry deleted while downloading: do not leave its file behind.
      if (hasAttachment(f.path)) {
        const out = new File(Paths.document, f.path);
        out.create({ overwrite: true });
        await out.write(bytes);
      }
    } catch {
      complete = false;
    }
  }
  if (sealed.exists) sealed.delete();
  return complete;
}

/**
 * Lists Storage, not the rows, so files whose row write failed are deleted too. Rows first: a row must never
 * point at a deleted file.
 */
async function deleteServerCopy(uid: string) {
  const { error } = await supabase.from('entries').delete().eq('user_id', uid);
  if (error) throw error;
  for (;;) {
    const { data: folders, error: listError } = await supabase.storage.from(BUCKET).list(uid, { limit: PAGE });
    if (listError) throw listError;
    if (!folders.length) return;
    for (const folder of folders) {
      const { data: files, error: filesError } = await supabase.storage.from(BUCKET).list(`${uid}/${folder.name}`);
      if (filesError) throw filesError;
      const { data: removed, error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove(files.map((f) => `${uid}/${folder.name}/${f.name}`));
      if (removeError) throw removeError;
      // Storage answers a remove blocked by policy with an empty list, not an error: stop instead of looping.
      if (!removed.length) throw new Error('nothing removed');
    }
  }
}

/**
 * Turn on for the signed-in real account; needs the backup key on this device (unlockBackup with create).
 * Returns false when the server could not be reached.
 */
export async function enableSync(): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({ data: { [FLAG]: true } });
  if (error) return false;
  void requestSync();
  return true;
}

/**
 * Turn off = lower the flag and drop the key first, so no device uploads again, then delete the server copy.
 * Turning on again makes a new key. If the delete fails it is finished by the next run on any device that
 * synced with this account (runSync). Returns false only when the flag could not be changed.
 */
export async function disableSync(): Promise<boolean> {
  disabling = true;
  try {
    await running;
    const { data, error } = await supabase.auth.updateUser({ data: { [FLAG]: false, [KEY_META]: null } });
    if (error) return false;
    locked = false;
    await SecureStore.deleteItemAsync(keyItem(data.user.id));
    if (getSetting(SYNC_USER) === data.user.id) {
      try {
        await deleteServerCopy(data.user.id);
        forget();
      } catch {
        // Finished by a later run.
      }
    }
    return true;
  } finally {
    disabling = false;
    emit();
  }
}
