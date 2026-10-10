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

/**
 * Táº¡o tÃ i khoáº£n â€” má»Ÿ tá»« mÃ n ÄÄƒng nháº­p, xong thÃ¬ quay vá» Ä‘Ã³ (dismissTo kÃ¨m param `tao`
 * Ä‘á»ƒ mÃ n ÄÄƒng nháº­p biáº¿t bÃ¡o gÃ¬ hoáº·c tá»± thoÃ¡t).
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

  // 'xong' = Ä‘Ã£ cÃ³ tÃ i khoáº£n tháº­t vÃ  session; 'xacMinh' = cÃ²n chá» xÃ¡c minh email.
  const backToLogin = (result: 'done' | 'verify') =>
    router.dismissTo({ pathname: '/login', params: { registered: result, email } });

  async function register() {
    if (busy) return;
    setError(null);

    if (!email.includes('@') || password.length < 6) {
      return reportError(t.common.emailError);
    }
    if (password !== confirm) return reportError(t.register.mismatch);

    setBusy(true);
    try {
      // ÄÄƒng kÃ½ khi Ä‘ang cÃ³ session anonymous pháº£i NÃ‚NG Cáº¤P chÃ­nh user Ä‘Ã³, khÃ´ng táº¡o user má»›i:
      // deliveries neo vÃ o user id: táº¡o má»›i lÃ  máº¥t lá»‹ch sá»­ "Ä‘Ã£ nháº­n Comfort nÃ o", tráº§n 3/24h
      // reset, vÃ  ngÆ°á»i dÃ¹ng nháº­n láº¡i Ä‘Ãºng lá»i Ä‘Ã£ Ä‘á»c. signUp chá»‰ dÃ¹ng khi chÆ°a cÃ³ session.
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session?.user.is_anonymous === true) {
        const { data, error } = await supabase.auth.updateUser({ email, password: password });
        if (error) return reportError(t.register.createError);
        // updateUser khÃ´ng bao giá» tráº£ session. CÃ²n chá» xÃ¡c minh thÃ¬ email má»›i náº±m á»Ÿ new_email;
        // Ä‘Ã£ Ä‘á»•i ngay (dá»± Ã¡n táº¯t xÃ¡c minh) thÃ¬ lÃ m má»›i JWT Ä‘á»ƒ claim is_anonymous háº¿t lÃ  true â€”
        // khÃ´ng thÃ¬ RLS váº«n coi Ä‘Ã¢y lÃ  tÃ i khoáº£n áº©n danh vÃ  cháº·n viáº¿t.
        if (data.user.new_email || !data.user.email) return backToLogin('verify');
        await supabase.auth.refreshSession();
        return backToLogin('done');
      }

      const { data, error } = await supabase.auth.signUp({ email, password: password });
      if (error) return reportError(t.register.createError);
      // KhÃ´ng cÃ³ session tráº£ vá» = dá»± Ã¡n Ä‘ang báº­t xÃ¡c minh email.
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
          {/* Enter Ä‘i qua Ä‘á»§ ba Ã´; Ã´ cuá»‘i lÃ  táº¡o tÃ i khoáº£n. */}
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
