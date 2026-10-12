import { type AuthError, createClient, isAuthRetryableFetchError } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { t } from './i18n';

/**
 * The server does 4 things: the Comfort pool, translations, hotlines, and an Entry copy for users who
 * turn on sync. Entries are NOT uploaded automatically — ADR 0004.
 */

// ponytail: SecureStore allows ~2KB per value. The current session fits; if the JWT grows
// (custom claims), split it across keys. Do not switch to AsyncStorage —
// a plaintext auth token on the device is a regression, not a simplification.
const store = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

/**
 * RN fetch (OkHttp) has no timeout: if the network drops while a pooled connection exists, the next
 * request hangs forever, even after the network is back, and the request-Comfort button spins forever.
 * Abort after 20s so the screen can show "cannot connect"; supabase-js returns it in `error` like any
 * other network error.
 */
// ponytail: aborting does not evict the dead connection from OkHttp's pool — on the emulator (airplane mode
// on/off keeps the IP) later requests keep failing until the app restarts. The real fix is native OkHttp
// config (`pingInterval`), which needs a dev client instead of Expo Go; do it for the release build.
const TIMEOUT_MS = 20_000;
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  init?.signal?.addEventListener('abort', () => controller.abort());
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    global: { fetch: fetchWithTimeout },
    auth: {
      storage: store,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

/**
 * Each install gets an anonymous user. It anchors "which Comforts were delivered to whom";
 * it is not a sign-up. A real (email) account is only needed to WRITE Comforts or turn on sync.
 *
 * Safe to call repeatedly: does nothing when a session exists.
 */
export async function ensureSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) await supabase.auth.signInAnonymously();
}

/**
 * Real account = logged in with email; only real accounts may write Comforts.
 * Reads the local session, not `getUser()`: a network call would treat offline users as logged out.
 * Only used to pick screens and copy — RLS enforces the actual rule (docs/db.md).
 */
export async function isRealAccount(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session && data.session.user.is_anonymous !== true;
}

/**
 * Every Supabase Auth error code the app shows its own text for — the one place to edit when Supabase
 * renames a code. Codes not listed fall back to the screen's general message.
 */
const AUTH_ERROR_KEY = new Map<string, keyof typeof t.authError>([
  ['email_address_invalid', 'emailRejected'],
  ['email_exists', 'emailExists'],
  ['user_already_exists', 'emailExists'],
  ['weak_password', 'weakPassword'],
  ['over_email_send_rate_limit', 'emailNotSent'],
  ['email_address_not_authorized', 'emailNotSent'],
]);

/** Network failures come back in `error` instead of being thrown, so a screen's catch never sees them. */
export function authErrorText(error: AuthError, fallback: string): string {
  if (isAuthRetryableFetchError(error)) return t.common.networkError;
  const key = AUTH_ERROR_KEY.get(error.code ?? '');
  return key ? t.authError[key] : fallback;
}
