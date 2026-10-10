import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { supabase } from '@/supabase';
import { album, pencil, space, text } from '@/theme';
import { ScreenFooter, LinkRow, PrimaryButton, TextField, leave } from '@/ui';
import { check, loginForm } from '@/validation';

/**
 * Đăng nhập chỉ cần cho hai việc: VIẾT Comfort và bật sync. Nhật ký chạy không cần
 * tài khoản (ADR 0004) — màn này luôn phải có lối thoát.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  // Do màn Tạo tài khoản gửi về khi xong (register.tsx).
  const { registered, email: newEmail } = useLocalSearchParams<{ registered?: string; email?: string }>();

  const reportError = (msg: string) => {
    setError(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  useEffect(() => {
    // Đã có session thật thì màn này hết việc — trả người dùng về chỗ họ đến.
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
    setNotice(null);

    const form = check(loginForm, { email, password });
    if ('code' in form) return reportError(t.validation[form.code]);

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(form.data);
      if (error) return reportError(t.login.error);
      leave();
    } catch {
      reportError(t.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.screen} behavior="padding">
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={[pencil.title, s.title]} accessibilityRole="header">
            {t.common.signIn}
          </Text>

          <Text style={s.explanation}>{t.login.explanation}</Text>

          <Text style={s.label}>{t.common.email}</Text>
          {/* Enter ở ô email sang ô mật khẩu, Enter ở ô mật khẩu là đăng nhập. */}
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
            autoComplete="password"
            placeholder={t.common.passwordHint}
            returnKeyType="go"
            onSubmitEditing={() => void signIn()}
            editable={!busy}
          />

          {error ? <Text style={s.error}>{error}</Text> : null}
          {notice ? <Text style={s.error}>{notice}</Text> : null}

          <LinkRow label={t.login.createAccount} chevron onPress={() => router.push('/register')} />
          <LinkRow icon="arrow-left" label={t.login.later} onPress={leave} />
        </ScrollView>
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
  error: { ...text.body, color: album.ink },
});
