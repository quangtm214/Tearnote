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
import { check, comfortDraft, countChars, MAX_COMFORT_LENGTH, MIN_COMFORT_LENGTH } from '@/validation';
import { ScreenFooter, LinkRow, ConfirmDialog, PrimaryButton, TextField, Pill, type ConfirmRequest } from '@/ui';

/**
 * Viết Comfort. Hai luật quan trọng nhất KHÔNG nằm ở đây mà ở DB:
 * "chỉ tài khoản thật" và "tối đa 5 / 24h" do RLS ép (docs/db.md). App chỉ dịch lỗi ra lời.
 */
export default function WriteComfortScreen() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<TagId[]>([]);
  // source_lang: batch dịch từ đây. Mặc định ngôn ngữ app, nhưng người viết có thể viết tiếng khác.
  const [sourceLang, setSourceLang] = useState<Lang>(currentLang);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [done, setDone] = useState(false);
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null);
  const sentToLogin = useRef(false);

  // Lời đang viết mất vì chạm nhầm Back cũng đau như một Reflection: hỏi lại trước khi rời.
  // Sang màn Đăng nhập (đăng nhập lại) là push, không phải rời, nên không hỏi.
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

  // push chứ không replace: đăng nhập xong thì quay về đúng màn này, chữ đã gõ còn nguyên.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      isRealAccount().then((isReal) => {
        if (cancelled) return;
        if (isReal) return setCheckingAuth(false);
        // Lần đầu thì sang đăng nhập; quay về mà vẫn chưa đăng nhập ("Để sau") thì rời màn viết.
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

  const length = countChars(body);
  const canSend = 'data' in check(comfortDraft, { body, tags, sourceLang }) && !sending;

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
      // Session trên máy, không gọi mạng: mất mạng thì để insert báo lỗi mạng, đừng đá sang login.
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setSessionExpired(true);
        reportError(t.write.sessionExpired);
        return;
      }

      // author_id là cột not null nên vẫn phải truyền, dù RLS ép nó = auth.uid().
      const { error } = await supabase.from('comforts').insert({
        author_id: user.id,
        body: body.trim(),
        source_lang: sourceLang,
        tags,
      });

      if (error) {
        // 42501 = RLS chặn, và policy comfort_insert có ba điều kiện. Hết lượt 5/24h là
        // lý do hay gặp nhất, nhưng tài khoản anonymous hoặc session hết hạn cũng trả
        // đúng mã này — hỏi lại để khỏi hiện một câu sai.
        if (error.code === '42501' && (await isRealAccount())) {
          reportError(t.write.limitReached);
        } else if (error.code === '42501') {
          setSessionExpired(true);
          reportError(t.write.sessionExpired);
        } else {
          // supabase-js trả lỗi mạng qua `error` với code rỗng; có code là server từ chối.
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
            maxLength={MAX_COMFORT_LENGTH}
            placeholder={t.write.inputPlaceholder}
            editable={!sending}
          />
          <Text style={s.counter} accessibilityLabel={t.write.counterA11y(length, MAX_COMFORT_LENGTH)}>
            {length}/{MAX_COMFORT_LENGTH}
            {length < MIN_COMFORT_LENGTH ? t.write.shortBy(MIN_COMFORT_LENGTH - length) : ''}
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

          {/* Đồng ý rõ ràng trước khi lời vào pool — overview.md §6. */}
          {length >= MIN_COMFORT_LENGTH && tags.length === 0 ? <Text style={s.caption}>{t.write.needTag}</Text> : null}
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
