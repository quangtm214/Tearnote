import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthError } from '@supabase/supabase-js';

import { t } from '@/i18n';
import { authErrorField, authErrorText, supabase } from '@/supabase';
import { album, pencil, space, text } from '@/theme';
import {
  FAB_CLEARANCE,
  FormScrollView,
  LinkRow,
  Pill,
  PrimaryButton,
  ScreenFooter,
  SecondaryButton,
  TextField,
  TopBar,
  leave,
  showSnackbar,
} from '@/ui';
import { loginForm, registerForm, useFormCheck } from '@/validation';

type Mode = 'signIn' | 'create' | 'verify';
// 'form' = an error that belongs to no field: one line at the end of the form.
type ServerError = { field: 'email' | 'password' | 'form'; message: string; exists?: boolean };

// Supabase allows one confirmation email per address per 60 s.
const RESEND_COOLDOWN_S = 60;

/**
 * Sign in and create account on one modal, asked for only when needed: sending a Comfort, "Words you wrote",
 * or from Settings (`reason`). The journal never needs an account (ADR 0004). DESIGN.md › "Tài khoản".
 */
export default function AccountScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const intro = t.account.intro[reason === 'send' || reason === 'mine' ? reason : 'settings'];
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [server, setServer] = useState<ServerError | null>(null);
  // An anonymous user is upgraded with updateUser, which confirms with an 'email_change' email, not 'signup'.
  const [verifyType, setVerifyType] = useState<'signup' | 'email_change'>('signup');
  const [cooldown, setCooldown] = useState(0);
  const passwordRef = useRef<TextInputInstance>(null);
  // One check per mode, so switching modes starts quiet again.
  const signInCheck = useFormCheck(loginForm, { email, password });
  const createCheck = useFormCheck(registerForm, { email, password });
  const form = mode === 'create' ? createCheck : signInCheck;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const switchMode = (next: Mode) => {
    setServer(null);
    setMode(next);
  };
  const editEmail = (value: string) => {
    setServer(null);
    setEmail(value);
  };
  const editPassword = (value: string) => {
    setServer(null);
    setPassword(value);
  };

  const report = (error: AuthError, fallback: string) => {
    const message = authErrorText(error, fallback);
    const field = authErrorField(error);
    if (!field) return showSnackbar(message, 'offline');
    const exists = error.code === 'email_exists' || error.code === 'user_already_exists';
    setServer({ field, message, exists });
    AccessibilityInfo.announceForAccessibility(message);
  };

  const finish = () => {
    showSnackbar(t.account.signedIn);
    leave();
  };

  const toVerify = (type: 'signup' | 'email_change') => {
    setVerifyType(type);
    setCooldown(RESEND_COOLDOWN_S);
    setMode('verify');
  };

  async function signIn() {
    const result = signInCheck.submit();
    if (!('data' in result)) return;
    const { error } = await supabase.auth.signInWithPassword(result.data);
    if (error) return report(error, t.account.signInError);
    finish();
  }

  async function create() {
    const result = createCheck.submit();
    if (!('data' in result)) return;
    const credentials = result.data;
    // With an anonymous session, UPGRADE that user instead of creating a new one: deliveries are keyed
    // by user id, so a new user loses "which Comforts were received", resets the 3/24h quota, and may
    // receive the same Comforts again. signUp is only for when there is no session.
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user.is_anonymous === true) {
      const { data, error } = await supabase.auth.updateUser(credentials);
      if (error) return report(error, t.account.createError);
      // updateUser never returns a session. While verification is pending the address is in new_email;
      // if it changed immediately (verification off), refresh the JWT so is_anonymous becomes false —
      // otherwise RLS still treats the user as anonymous and blocks writing.
      if (data.user.new_email || !data.user.email) return toVerify('email_change');
      await supabase.auth.refreshSession();
      return finish();
    }
    const { data, error } = await supabase.auth.signUp(credentials);
    if (error) return report(error, t.account.createError);
    // With email verification on, Supabase hides an existing address: no error, but a user with no identities.
    if (data.user?.identities?.length === 0) {
      setServer({ field: 'email', message: t.authError.emailExists, exists: true });
      return AccessibilityInfo.announceForAccessibility(t.authError.emailExists);
    }
    // No session returned = email verification is on for the project.
    if (data.session) finish();
    else toVerify('signup');
  }

  async function submit() {
    if (busy) return;
    if (mode === 'verify') return switchMode('signIn');
    setServer(null);
    setBusy(true);
    try {
      await (mode === 'signIn' ? signIn() : create());
    } catch {
      showSnackbar(t.common.networkError, 'offline');
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (busy) return;
    if (!loginForm.shape.email.safeParse(email).success) {
      setServer({ field: 'email', message: t.account.forgotNeedsEmail });
      return AccessibilityInfo.announceForAccessibility(t.account.forgotNeedsEmail);
    }
    setBusy(true);
    try {
      // Expo Go gets exp://…/--/reset-password, a build gets tearnote://reset-password; both must be in
      // Supabase Auth › Redirect URLs (CLAUDE.md).
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Linking.createURL('/reset-password'),
      });
      if (error) report(error, t.account.resetError);
      else showSnackbar(t.account.resetSent);
    } catch {
      showSnackbar(t.common.networkError, 'offline');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setCooldown(RESEND_COOLDOWN_S);
    setServer(null);
    try {
      // An upgraded anonymous user has no 'signup' to resend: asking for the same email change sends the mail again.
      const { error } =
        verifyType === 'email_change'
          ? await supabase.auth.updateUser({ email: email.trim() })
          : await supabase.auth.resend({ type: 'signup', email: email.trim() });
      if (error) report(error, t.account.createError);
      else showSnackbar(t.account.resent);
    } catch {
      showSnackbar(t.common.networkError, 'offline');
    }
  }

  const primaryLabel = mode === 'verify' ? t.account.verified : mode === 'create' ? t.account.create : t.common.signIn;
  // The server's (or "Forgot password?"'s) answer first: it is newer than the form check and says more.
  const emailError = (server?.field === 'email' ? server.message : null) ?? form.errorOf('email');
  const passwordError = (server?.field === 'password' ? server.message : null) ?? form.errorOf('password');
  const formError = server?.field === 'form' ? <Text style={s.error}>{server.message}</Text> : null;

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <TopBar close />
      {/* Android: KAV, iOS: ScrollView keyboard insets. Why both: new.tsx. */}
      <KeyboardAvoidingView style={s.screen} behavior="padding" enabled={Platform.OS === 'android'}>
        <FormScrollView contentContainerStyle={s.content}>
          {mode === 'verify' ? (
            <>
              <Text style={[pencil.title, s.title]} accessibilityRole="header">
                {t.account.checkInbox}
              </Text>
              <Text style={s.body}>
                {t.account.verifySent} <Text style={s.email}>{email.trim()}</Text>
              </Text>
              <Text style={s.body}>{t.account.verifyNext}</Text>
              <Text style={s.caption}>{t.account.spamHint}</Text>
              <View style={s.resend}>
                <SecondaryButton
                  label={cooldown > 0 ? t.account.resendIn(cooldown) : t.account.resend}
                  icon="email-outline"
                  disabled={cooldown > 0}
                  onPress={resend}
                />
              </View>
              {formError}
              <LinkRow icon="arrow-left" label={t.account.otherEmail} onPress={() => switchMode('create')} />
            </>
          ) : (
            <>
              <Text style={[pencil.title, s.title]} accessibilityRole="header">
                {t.account.title}
              </Text>
              <Text style={s.caption}>{intro}</Text>

              <View style={s.modes} accessibilityRole="radiogroup" accessibilityLabel={t.account.modeLabel}>
                <Pill label={t.common.signIn} single selected={mode === 'signIn'} onPress={() => switchMode('signIn')} />
                <Pill label={t.account.create} single selected={mode === 'create'} onPress={() => switchMode('create')} />
              </View>

              <Text style={s.label}>{t.common.email}</Text>
              {/* Enter on email moves to password; Enter on password submits. */}
              <TextField
                value={email}
                onChangeText={editEmail}
                accessibilityLabel={t.common.email}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                // `username` so password managers pair the email with the password below.
                textContentType="username"
                autoComplete="email"
                placeholder={t.common.emailPlaceholder}
                error={emailError}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!busy}
              />
              {server?.exists ? (
                <LinkRow label={t.account.signInWithEmail} chevron onPress={() => switchMode('signIn')} />
              ) : null}

              <Text style={s.label}>{t.common.password}</Text>
              <TextField
                ref={passwordRef}
                value={password}
                onChangeText={editPassword}
                accessibilityLabel={t.common.password}
                autoCapitalize="none"
                autoCorrect={false}
                password
                textContentType={mode === 'create' ? 'newPassword' : 'password'}
                autoComplete={mode === 'create' ? 'new-password' : 'password'}
                hint={mode === 'create' ? t.common.passwordHint : undefined}
                error={passwordError}
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                editable={!busy}
              />
              {mode === 'signIn' ? <LinkRow label={t.account.forgot} onPress={forgot} /> : null}
              {formError}
            </>
          )}
        </FormScrollView>
        <ScreenFooter>
          <PrimaryButton label={primaryLabel} onPress={submit} busy={busy} />
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
  email: { color: album.ink },
  caption: { ...text.caption, color: album.pencil },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  label: { ...text.caption, color: album.pencil, marginTop: space.sm },
  resend: { flexDirection: 'row', marginTop: space.sm },
  error: { ...text.body, color: album.alert },
});
