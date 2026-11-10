import { router, useFocusEffect, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
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
import { formTags, MAX_COMFORT_TAGS, UNKNOWN_TAG } from '@/tags';
import { album, pencil, space, text } from '@/theme';
import { comfortDraft, countChars, MAX_COMFORT_LENGTH, MIN_COMFORT_LENGTH, useFormCheck } from '@/validation';
import { ScreenFooter, FAB_CLEARANCE, FieldError, FormScrollView, LinkRow, ConfirmDialog, PrimaryButton, TextField, Pill, TopBar, leave, type ConfirmRequest } from '@/ui';

/**
 * Write a Comfort. The two key rules are NOT here: "real accounts only" and "max 5 / 24h" are
 * enforced by RLS (docs/db.md). The app only turns the errors into messages.
 */
export default function WriteComfortScreen() {
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  // source_lang: the translation batch translates from it. Defaults to the app language; the writer can change it.
  const [sourceLang, setSourceLang] = useState<Lang>(currentLang);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [done, setDone] = useState(false);
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null);
  // Set when Send opened the account modal; on return with a real account the Comfort is sent right away.
  const sendAfterSignIn = useRef(false);
  const inFlight = useRef(false);
  const scroll = useRef<ScrollView>(null);
  // y of each checked field inside the scroll content, to scroll to the first error on submit.
  const fieldY = useRef({ body: 0, tags: 0 });

  // Losing a draft to an accidental Back hurts as much as losing a Reflection: confirm before leaving.
  // Opening the account modal is a push, not a leave, so it does not ask.
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

  const length = countChars(body);
  // The schema only says "too short"; the screen says by how much.
  const form = useFormCheck(comfortDraft, { body, tags, sourceLang }, (_field, code) =>
    code === 'bodyTooShort' ? t.write.shortBy(MIN_COMFORT_LENGTH - length) : undefined,
  );
  const tagsError = form.errorOf('tags');

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((x) => x !== tag)
        : prev.length >= MAX_COMFORT_TAGS
          ? prev
          : [...prev, tag],
    );
  }

  // Back from the account modal: send if signing in worked; closing it with × just leaves the draft.
  // Through a ref so the call reads the latest draft, not the one from when the focus effect was made.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useFocusEffect(
    useCallback(() => {
      if (!sendAfterSignIn.current) return;
      sendAfterSignIn.current = false;
      isRealAccount()
        .then((isReal) => {
          if (isReal) void sendRef.current();
        })
        .catch(() => {});
    }, []),
  );

  const reportError = (msg: string) => {
    setError(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  // Synchronous guard: state updates land later, so a double tap — or the auto-send after sign-in plus a
  // tap — could otherwise insert the same Comfort twice.
  async function send() {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await sendDraft();
    } finally {
      inFlight.current = false;
    }
  }

  async function sendDraft() {
    const result = form.submit();
    if (!('data' in result)) {
      if (result.field === 'body' || result.field === 'tags') {
        scroll.current?.scrollTo({ y: Math.max(0, fieldY.current[result.field] - space.lg) });
      }
      return;
    }
    // Ask for an account only now, after the draft is valid; the draft stays here meanwhile (DESIGN.md › "Tài khoản").
    if (!(await isRealAccount())) {
      sendAfterSignIn.current = true;
      router.push({ pathname: '/account', params: { reason: 'send' } });
      return;
    }
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

  if (done) {
    return (
      <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
        <TopBar />
        <View style={s.screen}>
          <View style={s.doneContent}>
            <Text style={[pencil.title, s.title]} accessibilityRole="header">
              {t.write.doneTitle}
            </Text>
            <Text style={s.explanation}>{t.write.doneDetail}</Text>
            <PrimaryButton label={t.write.done} onPress={leave} />
          </View>
          <ScreenFooter />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <TopBar />
      {/* Android: KAV, iOS: ScrollView keyboard insets. Why both: new.tsx. */}
      <KeyboardAvoidingView style={s.screen} behavior="padding" enabled={Platform.OS === 'android'}>
        <FormScrollView ref={scroll} contentContainerStyle={s.content}>
          <Text style={[pencil.title, s.title]} accessibilityRole="header">
            {t.write.title}
          </Text>
          <Text style={s.explanation}>{t.write.intro}</Text>
          <Text style={s.caption}>{t.write.guidance}</Text>

          <View style={s.field} onLayout={(e) => (fieldY.current.body = e.nativeEvent.layout.y)}>
            <TextField
              style={s.textArea}
              value={body}
              onChangeText={setBody}
              accessibilityLabel={t.write.inputLabel}
              multiline
              textAlignVertical="top"
              placeholder={t.write.inputPlaceholder}
              editable={!sending}
              error={form.errorOf('body')}
            />
            <Text style={s.counter} accessibilityLabel={t.write.counterA11y(length, MAX_COMFORT_LENGTH)}>
              {length} / {MAX_COMFORT_LENGTH}
            </Text>
          </View>

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

          <Text
            style={[pencil.date, s.label]}
            accessibilityRole="header"
            onLayout={(e) => (fieldY.current.tags = e.nativeEvent.layout.y)}
          >
            {t.write.topicLabel}
          </Text>
          <Text style={s.caption}>{t.write.pickTags(MAX_COMFORT_TAGS, tagLabel(UNKNOWN_TAG))}</Text>
          <View>
            <View style={s.tagRow}>
              {formTags(tags).map(({ id }) => {
                const selected = tags.includes(id);
                return (
                  <Pill
                    key={id}
                    label={tagLabel(id)}
                    selected={selected}
                    disabled={sending || (!selected && tags.length >= MAX_COMFORT_TAGS)}
                    onPress={() => toggleTag(id)}
                  />
                );
              })}
            </View>
            {tagsError ? <FieldError message={tagsError} /> : null}
          </View>

          {/* Explicit consent before the Comfort enters the pool — overview.md §6. */}
          <Text style={[s.caption, s.consent]}>{t.write.consent(LANGS.filter((l) => l !== sourceLang))}</Text>

          {error ? <Text style={s.error}>{error}</Text> : null}
          {sessionExpired ? (
            <LinkRow
              label={t.write.signInAgain}
              chevron
              onPress={() => {
                sendAfterSignIn.current = true;
                router.push({ pathname: '/account', params: { reason: 'send' } });
              }}
            />
          ) : null}

          <LinkRow icon="arrow-left" label={t.common.back} onPress={leave} />
        </FormScrollView>
        <ScreenFooter>
          <PrimaryButton label={t.write.send} onPress={send} busy={sending} />
        </ScreenFooter>
      </KeyboardAvoidingView>
      <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  screen: { flex: 1, backgroundColor: album.page },
  content: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: FAB_CLEARANCE, gap: space.md },
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
  field: { gap: space.md },
  textArea: { minHeight: 160, paddingVertical: space.md - 2 },
  counter: { ...text.caption, color: album.pencil },
  error: { ...text.body, color: album.alert },
});
