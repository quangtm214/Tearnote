import { router, useFocusEffect, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { ScreenFooter, LinkRow, ConfirmDialog, PrimaryButton, TextField, Pill, leave, type ConfirmRequest } from '@/ui';

/**
 * Write a Comfort. The two key rules are NOT here: "real accounts only" and "max 5 / 24h" are
 * enforced by RLS (docs/db.md). The app only turns the errors into messages.
 */
export default function WriteComfortScreen() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<TagId[]>([]);
  // source_lang: the translation batch translates from it. Defaults to the app language; the writer can change it.
  const [sourceLang, setSourceLang] = useState<Lang>(currentLang);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [done, setDone] = useState(false);
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null);
  const sentToLogin = useRef(false);

  // Losing a draft to an accidental Back hurts as much as losing a Reflection: confirm before leaving.
  // Going to login is a push, not a leave, so it does not ask.
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

  // push, not replace: after login the user returns here with the draft intact.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      isRealAccount().then((isReal) => {
        if (cancelled) return;
        if (isReal) return setCheckingAuth(false);
        // First time: go to login. Back here still logged out ("Later"): leave the write screen.
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
      // Local session, no network call: when offline, let the insert report a network error instead of opening login.
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setSessionExpired(true);
        reportError(t.write.sessionExpired);
        return;
      }

      // author_id is not null, so it must be sent even though RLS forces it to auth.uid().
      const { error } = await supabase.from('comforts').insert({
        author_id: user.id,
        body: body.trim(),
        source_lang: sourceLang,
        tags,
      });

      if (error) {
        // 42501 = blocked by RLS; policy comfort_insert has three conditions. The 5/24h quota is the
        // most common, but an anonymous account or an expired session returns the same code —
        // check again to avoid showing the wrong message.
        if (error.code === '42501' && (await isRealAccount())) {
          reportError(t.write.limitReached);
        } else if (error.code === '42501') {
          setSessionExpired(true);
          reportError(t.write.sessionExpired);
        } else {
          // supabase-js reports network errors in `error` with an empty code; a code means the server refused.
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
      {/* Android: KAV, iOS: ScrollView keyboard insets. Why both: new.tsx. */}
      <KeyboardAvoidingView style={s.screen} behavior="padding" enabled={Platform.OS === 'android'}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
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

          {/* Explicit consent before the Comfort enters the pool — overview.md §6. */}
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
  error: { ...text.body, color: album.alert },
});
