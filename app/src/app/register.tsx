import { router } from 'expo-router';
import { useRef, useState } from 'react';
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
import { ScreenFooter, LinkRow, PrimaryButton, TextField } from '@/ui';
import { check, registerForm } from '@/validation';

/**
 * Tạo tài khoản — mở từ màn Đăng nhập, xong thì quay về đó (dismissTo kèm param `tao`
 * để màn Đăng nhập biết báo gì hoặc tự thoát).
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

  // 'xong' = đã có tài khoản thật và session; 'xacMinh' = còn chờ xác minh email.
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
      // Đăng ký khi đang có session anonymous phải NÂNG CẤP chính user đó, không tạo user mới:
      // deliveries neo vào user id: tạo mới là mất lịch sử "đã nhận Comfort nào", trần 3/24h
      // reset, và người dùng nhận lại đúng lời đã đọc. signUp chỉ dùng khi chưa có session.
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session?.user.is_anonymous === true) {
        const { data, error } = await supabase.auth.updateUser(credentials);
        if (error) return reportError(t.register.createError);
        // updateUser không bao giờ trả session. Còn chờ xác minh thì email mới nằm ở new_email;
        // đã đổi ngay (dự án tắt xác minh) thì làm mới JWT để claim is_anonymous hết là true —
        // không thì RLS vẫn coi đây là tài khoản ẩn danh và chặn viết.
        if (data.user.new_email || !data.user.email) return backToLogin('verify');
        await supabase.auth.refreshSession();
        return backToLogin('done');
      }

      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) return reportError(t.register.createError);
      // Không có session trả về = dự án đang bật xác minh email.
      backToLogin(data.session ? 'done' : 'verify');
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
            {t.register.title}
          </Text>

          <Text style={s.explanation}>{t.register.explanation}</Text>

          <Text style={s.label}>{t.common.email}</Text>
          {/* Enter đi qua đủ ba ô; ô cuối là tạo tài khoản. */}
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
