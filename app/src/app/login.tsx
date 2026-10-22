import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { authErrorText, supabase } from '@/supabase';
import { album, pencil, space, text } from '@/theme';
import { ScreenFooter, FormScrollView, LinkRow, PrimaryButton, TextField, leave } from '@/ui';
import { check, loginForm } from '@/validation';

/**
 * Login is only needed to WRITE Comforts and to turn on sync. The journal works without an
 * account (ADR 0004) — this screen must always have a way out.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Validation error, shown under its own field; `error` is the server's answer.
  const [invalid, setInvalid] = useState<{ field: string; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  // Sent back by register.tsx when it finishes.
  const { registered, email: newEmail } = useLocalSearchParams<{ registered?: string; email?: string }>();

  const reportError = (msg: string) => {
    setError(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  useEffect(() => {
    // With a real session this screen is done — send the user back where they came from.
    if (registered === 'done') return leave();
    if (registered !== 'verify') return;
    const msg = t.login.verificationSent;
    if (newEmail) setEmail(newEmail);
    setError(null);
    setNotice(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  }, [registered, newEmail]);

  async function signIn() {
    if (busy) return;
    setError(null);
    setInvalid(null);
    setNotice(null);

    const form = check(loginForm, { email, password });
    if ('code' in form) {
      const message = t.validation[form.code];
      setInvalid({ field: form.field, message });
      return AccessibilityInfo.announceForAccessibility(message);
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(form.data);
      if (error) return reportError(authErrorText(error, t.login.error));
      leave();
    } catch {
      reportError(t.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {/* Android: KAV, iOS: ScrollView keyboard insets. Why both: new.tsx. */}
      <KeyboardAvoidingView style={s.screen} behavior="padding" enabled={Platform.OS === 'android'}>
        <FormScrollView contentContainerStyle={s.content}>
          <Text style={[pencil.title, s.title]} accessibilityRole="header">
            {t.common.signIn}
          </Text>

          <Text style={s.explanation}>{t.login.explanation}</Text>

          <Text style={s.label}>{t.common.email}</Text>
          {/* Enter on email moves to password; Enter on password logs in. */}
          <TextField
            value={email}
            onChangeText={setEmail}
            accessibilityLabel={t.common.email}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder={t.common.emailPlaceholder}
            error={invalid?.field === 'email' ? invalid.message : null}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!busy}
          />

          <Text style={s.label}>{t.common.password}</Text>
          <TextField
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            accessibilityLabel={t.common.password}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            autoComplete="password"
            placeholder={t.common.passwordHint}
            error={invalid?.field === 'password' ? invalid.message : null}
            returnKeyType="go"
            onSubmitEditing={() => void signIn()}
            editable={!busy}
          />

          {error ? <Text style={s.error}>{error}</Text> : null}
          {notice ? <Text style={s.notice}>{notice}</Text> : null}

          <LinkRow label={t.login.createAccount} chevron onPress={() => router.push('/register')} />
          <LinkRow icon="arrow-left" label={t.login.later} onPress={leave} />
        </FormScrollView>
        <ScreenFooter>
          <PrimaryButton label={t.common.signIn} onPress={signIn} busy={busy} />
        </ScreenFooter>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  content: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: space.xl, gap: space.md },
  title: { color: album.ink },
  explanation: { ...text.body, color: album.pencil },
  label: { ...text.caption, color: album.pencil, marginTop: space.sm },
  error: { ...text.body, color: album.alert },
  notice: { ...text.body, color: album.ink },
});
