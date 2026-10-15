import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { authErrorText, supabase } from '@/supabase';
import { album, pencil, space, text } from '@/theme';
import { ScreenFooter, LinkRow, PrimaryButton, TextField } from '@/ui';
import { check, registerForm } from '@/validation';

/**
 * Create account — opened from login and returns there when done (dismissTo with the `registered`
 * param so login knows what to show, or closes itself).
 */
export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const reportError = (msg: string) => {
    setError(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  // 'done' = real account with a session; 'verify' = waiting for email verification.
  const backToLogin = (result: 'done' | 'verify') =>
    router.dismissTo({ pathname: '/login', params: { registered: result, email: email.trim() } });

  async function register() {
    if (busy) return;
    setError(null);

    const form = check(registerForm, { email, password, confirm });
    if ('code' in form) return reportError(t.validation[form.code]);
    const credentials = { email: form.data.email, password: form.data.password };

    setBusy(true);
    try {
      // With an anonymous session, UPGRADE that user instead of creating a new one: deliveries are keyed
      // by user id, so a new user loses "which Comforts were received", resets the 3/24h quota, and may
      // receive the same Comforts again. signUp is only for when there is no session.
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session?.user.is_anonymous === true) {
        const { data, error } = await supabase.auth.updateUser(credentials);
        if (error) return reportError(authErrorText(error, t.register.createError));
        // updateUser never returns a session. While verification is pending the address is in new_email;
        // if it changed immediately (verification off), refresh the JWT so is_anonymous becomes false —
        // otherwise RLS still treats the user as anonymous and blocks writing.
        if (data.user.new_email || !data.user.email) return backToLogin('verify');
        await supabase.auth.refreshSession();
        return backToLogin('done');
      }

      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) return reportError(authErrorText(error, t.register.createError));
      // With email verification on, Supabase hides an existing address: no error, but a user with no identities.
      if (data.user?.identities?.length === 0) return reportError(t.authError.emailExists);
      // No session returned = email verification is on for the project.
      backToLogin(data.session ? 'done' : 'verify');
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
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <Text style={[pencil.title, s.title]} accessibilityRole="header">
            {t.register.title}
          </Text>

          <Text style={s.explanation}>{t.register.explanation}</Text>

          <Text style={s.label}>{t.common.email}</Text>
          {/* Enter moves through the three fields; on the last one it creates the account. */}
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
            textContentType="newPassword"
            autoComplete="new-password"
            placeholder={t.common.passwordHint}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => confirmRef.current?.focus()}
            editable={!busy}
          />

          <Text style={s.label}>{t.register.confirmPassword}</Text>
          <TextField
            ref={confirmRef}
            value={confirm}
            onChangeText={setConfirm}
            accessibilityLabel={t.register.confirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="go"
            onSubmitEditing={() => void register()}
            editable={!busy}
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <LinkRow label={t.register.haveAccount} chevron onPress={() => router.back()} />
        </ScrollView>
        <ScreenFooter>
          <PrimaryButton label={t.register.title} onPress={register} busy={busy} />
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
  error: { ...text.body, color: album.ink },
});
