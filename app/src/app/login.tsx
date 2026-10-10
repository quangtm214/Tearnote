import { router, useLocalSearchParams, type Href } from 'expo-router';
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
import { ScreenFooter, LinkRow, PrimaryButton, TextField } from '@/ui';

/**
 * ÄÄƒng nháº­p chá»‰ cáº§n cho hai viá»‡c: VIáº¾T Comfort vÃ  báº­t sync. Nháº­t kÃ½ cháº¡y khÃ´ng cáº§n
 * tÃ i khoáº£n (ADR 0004) â€” mÃ n nÃ y luÃ´n pháº£i cÃ³ lá»‘i thoÃ¡t.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  // Do mÃ n Táº¡o tÃ i khoáº£n gá»­i vá» khi xong (register.tsx).
  const { registered, email: newEmail } = useLocalSearchParams<{ registered?: string; email?: string }>();

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));

  const reportError = (msg: string) => {
    setError(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  useEffect(() => {
    // ÄÃ£ cÃ³ session tháº­t thÃ¬ mÃ n nÃ y háº¿t viá»‡c â€” tráº£ ngÆ°á»i dÃ¹ng vá» chá»— há» Ä‘áº¿n.
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

    if (!email.includes('@') || password.length < 6) {
      reportError(t.common.emailError);
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: password });
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
          {/* Enter á»Ÿ Ã´ email sang Ã´ máº­t kháº©u, Enter á»Ÿ Ã´ máº­t kháº©u lÃ  Ä‘Äƒng nháº­p. */}
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
