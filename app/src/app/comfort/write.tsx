import { router, useFocusEffect, useNavigation, type Href } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LANGS, currentLang, tagLabel, t, NATIVE_NAMES, type Lang } from '@/i18n';
import { isRealAccount, supabase } from '@/supabase';
import { MAX_COMFORT_TAGS, TAG_IDS, type TagId } from '@/tags';
import { album, pencil, space, text } from '@/theme';
import { ScreenFooter, LinkRow, ConfirmDialog, PrimaryButton, TextField, Pill, type ConfirmRequest } from '@/ui';

const MIN_LENGTH = 20;
const MAX_LENGTH = 500;

/**
 * Viáº¿t Comfort. Hai luáº­t quan trá»ng nháº¥t KHÃ”NG náº±m á»Ÿ Ä‘Ã¢y mÃ  á»Ÿ DB:
 * "chá»‰ tÃ i khoáº£n tháº­t" vÃ  "tá»‘i Ä‘a 5 / 24h" do RLS Ã©p (docs/db.md). App chá»‰ dá»‹ch lá»—i ra lá»i.
 */
export default function WriteComfortScreen() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<TagId[]>([]);
  // source_lang: batch dá»‹ch tá»« Ä‘Ã¢y. Máº·c Ä‘á»‹nh ngÃ´n ngá»¯ app, nhÆ°ng ngÆ°á»i viáº¿t cÃ³ thá»ƒ viáº¿t tiáº¿ng khÃ¡c.
  const [sourceLang, setSourceLang] = useState<Lang>(currentLang);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [done, setDone] = useState(false);
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null);
  const sentToLogin = useRef(false);

  // Lá»i Ä‘ang viáº¿t máº¥t vÃ¬ cháº¡m nháº§m Back cÅ©ng Ä‘au nhÆ° má»™t Reflection: há»i láº¡i trÆ°á»›c khi rá»i.
  // Sang mÃ n ÄÄƒng nháº­p (Ä‘Äƒng nháº­p láº¡i) lÃ  push, khÃ´ng pháº£i rá»i, nÃªn khÃ´ng há»i.
  const navigation = useNavigation();
  usePreventRemove(body.trim() !== '' && !done, ({ data }) =>
    setDialog({
      question: t.write.leaveQuestion,
      detail: t.write.leaveDetail,
      confirmLabel: t.common.leave,
      keepLabel: t.write.keepWriting,
      onConfirm: () => navigation.dispatch(data.action),
    }),
  );

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));

  // push chá»© khÃ´ng replace: Ä‘Äƒng nháº­p xong thÃ¬ quay vá» Ä‘Ãºng mÃ n nÃ y, chá»¯ Ä‘Ã£ gÃµ cÃ²n nguyÃªn.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      isRealAccount().then((isReal) => {
        if (cancelled) return;
        if (isReal) return setCheckingAuth(false);
        // Láº§n Ä‘áº§u thÃ¬ sang Ä‘Äƒng nháº­p; quay vá» mÃ  váº«n chÆ°a Ä‘Äƒng nháº­p ("Äá»ƒ sau") thÃ¬ rá»i mÃ n viáº¿t.
        if (sentToLogin.current) leave();
        else {
          sentToLogin.current = true;
          router.push('/login');
        }
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  // Äáº¿m theo code point cho khá»›p CHECK char_length(body) cá»§a Postgres â€” emoji lÃ  1, khÃ´ng pháº£i 2.
  const length = [...body.trim()].length;
  const canSend = length >= MIN_LENGTH && length <= MAX_LENGTH && tags.length > 0 && !sending;

  function toggleTag(tag: TagId) {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((x) => x !== tag)
        : prev.length >= MAX_COMFORT_TAGS
          ? prev
          : [...prev, tag],
    );
  }

  const reportError = (msg: string) => {
    setError(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  async function send() {
    if (!canSend) return;
    setError(null);
    setSessionExpired(false);
    setSending(true);
    try {
      // Session trÃªn mÃ¡y, khÃ´ng gá»i máº¡ng: máº¥t máº¡ng thÃ¬ Ä‘á»ƒ insert bÃ¡o lá»—i máº¡ng, Ä‘á»«ng Ä‘Ã¡ sang login.
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setSessionExpired(true);
        reportError(t.write.sessionExpired);
        return;
      }

      // author_id lÃ  cá»™t not null nÃªn váº«n pháº£i truyá»n, dÃ¹ RLS Ã©p nÃ³ = auth.uid().
      const { error } = await supabase.from('comforts').insert({
        author_id: user.id,
        body: body.trim(),
        source_lang: sourceLang,
        tags,
      });

      if (error) {
        // 42501 = RLS cháº·n, vÃ  policy comfort_insert cÃ³ ba Ä‘iá»u kiá»‡n. Háº¿t lÆ°á»£t 5/24h lÃ 
        // lÃ½ do hay gáº·p nháº¥t, nhÆ°ng tÃ i khoáº£n anonymous hoáº·c session háº¿t háº¡n cÅ©ng tráº£
        // Ä‘Ãºng mÃ£ nÃ y â€” há»i láº¡i Ä‘á»ƒ khá»i hiá»‡n má»™t cÃ¢u sai.
        if (error.code === '42501' && (await isRealAccount())) {
          reportError(t.write.limitReached);
        } else if (error.code === '42501') {
          setSessionExpired(true);
          reportError(t.write.sessionExpired);
        } else {
          // supabase-js tráº£ lá»—i máº¡ng qua `error` vá»›i code rá»—ng; cÃ³ code lÃ  server tá»« chá»‘i.
          reportError(error.code ? t.write.sendError : t.common.networkError);
        }
        return;
      }
      setDone(true);
    } catch {
      reportError(t.common.networkError);
    } finally {
      setSending(false);
    }
  }

  if (checkingAuth) {
    return (
      <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
        <View style={s.center}>
          <ActivityIndicator color={album.pencil} accessibilityLabel={t.common.loading} />
        </View>
        <ScreenFooter />
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
        <View style={s.doneContent}>
          <Text style={[pencil.title, s.title]} accessibilityRole="header">
            {t.write.doneTitle}
          </Text>
          <Text style={s.explanation}>{t.write.doneDetail}</Text>
          <PrimaryButton label={t.write.done} onPress={leave} />
        </View>
        <ScreenFooter />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.screen} behavior="padding">
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={[pencil.title, s.title]} accessibilityRole="header">
            {t.write.title}
          </Text>
          <Text style={s.explanation}>{t.write.intro}</Text>
          <Text style={s.caption}>{t.write.guidance}</Text>

          <TextField
            style={s.textArea}
            value={body}
            onChangeText={setBody}
            accessibilityLabel={t.write.inputLabel}
            multiline
            textAlignVertical="top"
            maxLength={MAX_LENGTH}
            placeholder={t.write.inputPlaceholder}
            editable={!sending}
          />
          <Text style={s.counter} accessibilityLabel={t.write.counterA11y(length, MAX_LENGTH)}>
            {length}/{MAX_LENGTH}
            {length < MIN_LENGTH ? t.write.shortBy(MIN_LENGTH - length) : ''}
          </Text>

          <Text style={[pencil.date, s.label]} accessibilityRole="header">
            {t.write.languageLabel}
          </Text>
          <View style={s.tagRow} accessibilityRole="radiogroup">
            {LANGS.map((l) => (
              <Pill
                key={l}
                label={NATIVE_NAMES[l]}
                single
                selected={sourceLang === l}
                disabled={sending}
                onPress={() => setSourceLang(l)}
              />
            ))}
          </View>

          <Text style={[pencil.date, s.label]} accessibilityRole="header">
            {t.write.topicLabel}
          </Text>
          <Text style={s.caption}>{t.write.pickTags(MAX_COMFORT_TAGS, tagLabel('unknown'))}</Text>
          <View style={s.tagRow}>
            {TAG_IDS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <Pill
                  key={tag}
                  label={tagLabel(tag)}
                  selected={selected}
                  disabled={sending || (!selected && tags.length >= MAX_COMFORT_TAGS)}
                  onPress={() => toggleTag(tag)}
                />
              );
            })}
          </View>

          {/* Äá»“ng Ã½ rÃµ rÃ ng trÆ°á»›c khi lá»i vÃ o pool â€” overview.md Â§6. */}
          {length >= MIN_LENGTH && tags.length === 0 ? <Text style={s.caption}>{t.write.needTag}</Text> : null}
          <Text style={[s.caption, s.consent]}>{t.write.consent(LANGS.filter((l) => l !== sourceLang))}</Text>

          {error ? <Text style={s.error}>{error}</Text> : null}
          {sessionExpired ? (
            <LinkRow label={t.write.signInAgain} chevron onPress={() => router.push('/login')} />
          ) : null}

          <LinkRow icon="arrow-left" label={t.common.back} onPress={leave} />
        </ScrollView>
        <ScreenFooter>
          <PrimaryButton label={t.write.send} onPress={send} disabled={!canSend && !sending} busy={sending} />
        </ScreenFooter>
      </KeyboardAvoidingView>
      <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  screen: { flex: 1, backgroundColor: album.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: space.xl, gap: space.md },
  doneContent: {
    flex: 1,
    paddingHorizontal: space.screen,
    paddingVertical: space.lg,
    gap: space.md,
    justifyContent: 'center',
  },
  title: { color: album.ink },
  explanation: { ...text.body, color: album.pencil },
  label: { color: album.pencil, marginTop: space.md },
  caption: { ...text.caption, color: album.pencil },
  consent: { marginTop: space.md },
  textArea: { minHeight: 160, paddingVertical: space.md - 2 },
  counter: { ...text.caption, color: album.pencil },
  error: { ...text.body, color: album.ink },
});
