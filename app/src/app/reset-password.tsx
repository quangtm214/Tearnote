import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { t } from '@/i18n';
import { authErrorField, authErrorText, supabase } from '@/supabase';
import { album, pencil, space, text } from '@/theme';
import {
  FAB_CLEARANCE,
  FormScrollView,
  LinkRow,
  Loading,
  PrimaryButton,
  ScreenFooter,
  SecondaryButton,
  TextField,
  TopBar,
  showSnackbar,
} from '@/ui';
import { newPasswordForm, useFormCheck } from '@/validation';

// 'offline' = the code could not be checked (no network), not that it is bad: offer a retry.
type LinkState = 'checking' | 'ready' | 'invalid' | 'offline';

// The session is gone or the link's session ended: only a new email helps.
const DEAD_SESSION_CODES = new Set(['session_not_found', 'session_expired', 'bad_jwt', 'refresh_token_not_found']);

/**
 * Opened from the link in the reset email (account.tsx › forgot). PKCE: the link carries `?code=`, which only
 * the device that asked for the email can exchange (it holds the verifier) — a link opened elsewhere is invalid.
 * Never take raw tokens from a URL. `detectSessionInUrl` is off in supabase.ts, so this screen does the exchange.
 */
export default function ResetPasswordScreen() {
  // Router params, not Linking.useLinkingURL(): in Expo Go a link opened while the app runs reaches the
  // router but useLinkingURL stays null. With PKCE the code is a query param, which the router parses.
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [link, setLink] = useState<LinkState>('checking');
  const [attempt, setAttempt] = useState(0);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A code works once: a re-render or a repeated URL event must not exchange it twice.
  const exchanged = useRef<string | null>(null);
  const form = useFormCheck(newPasswordForm, { password });

  useEffect(() => {
    if (!code) return setLink('invalid');
    if (exchanged.current === code) return;
    setLink('checking');
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error && isAuthRetryableFetchError(error)) return setLink('offline');
        exchanged.current = code;
        setLink(error ? 'invalid' : 'ready');
      })
      .catch(() => setLink('offline'));
  }, [code, attempt]);

  async function save() {
    if (busy) return;
    setError(null);
    const result = form.submit();
    if (!('data' in result)) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser(result.data);
      if (error && !authErrorField(error)) return showSnackbar(t.common.networkError, 'offline');
      if (error && DEAD_SESSION_CODES.has(error.code ?? '')) return setLink('invalid');
      if (error) return setError(authErrorText(error, t.reset.error));
      showSnackbar(t.reset.saved);
      router.replace('/' as Href);
    } catch {
      showSnackbar(t.common.networkError, 'offline');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <TopBar />
      {/* Android: KAV, iOS: ScrollView keyboard insets. Why both: new.tsx. */}
      <KeyboardAvoidingView style={s.screen} behavior="padding" enabled={Platform.OS === 'android'}>
        <FormScrollView contentContainerStyle={s.content}>
          <Text style={[pencil.title, s.title]} accessibilityRole="header">
            {t.reset.title}
          </Text>
          {link === 'checking' ? (
            <View style={s.center}>
              <Loading label={t.common.loading} />
            </View>
          ) : link === 'offline' ? (
            <>
              <Text style={s.body}>{t.common.networkError}</Text>
              <View style={s.row}>
                <SecondaryButton label={t.reset.retry} icon="refresh" onPress={() => setAttempt(attempt + 1)} />
              </View>
            </>
          ) : link === 'invalid' ? (
            <>
              <Text style={s.body}>{t.reset.invalidLink}</Text>
              <LinkRow
                label={t.reset.openAccount}
                chevron
                onPress={() => router.replace({ pathname: '/account', params: { reason: 'settings' } })}
              />
            </>
          ) : (
            <>
              <Text style={s.label}>{t.reset.newPassword}</Text>
              <TextField
                value={password}
                onChangeText={setPassword}
                accessibilityLabel={t.reset.newPassword}
                autoCapitalize="none"
                autoCorrect={false}
                password
                textContentType="newPassword"
                autoComplete="new-password"
                hint={t.common.passwordHint}
                error={form.errorOf('password') ?? error}
                returnKeyType="go"
                onSubmitEditing={() => void save()}
                editable={!busy}
              />
            </>
          )}
        </FormScrollView>
        <ScreenFooter>
          {link === 'ready' ? <PrimaryButton label={t.reset.save} onPress={save} busy={busy} /> : null}
        </ScreenFooter>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  content: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: FAB_CLEARANCE, gap: space.md },
  title: { color: album.ink },
  body: { ...text.body, color: album.pencil },
  label: { ...text.caption, color: album.pencil, marginTop: space.sm },
  center: { paddingVertical: space.xl, alignItems: 'center' },
  row: { flexDirection: 'row' },
});
