import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  deleteEntry,
  getEntry,
  listAttachments,
  listReceivedComforts,
  markThanked,
  isComfortReceivingEnabled,
  saveReceivedComfort,
  type Attachment,
  type Entry,
  type ReceivedComfort,
} from '@/db';
import { currentLang, t } from '@/i18n';
import { ensureSession, supabase } from '@/supabase';
import { album, pencil, space, text } from '@/theme';
import {
  ScreenFooter,
  LinkRow,
  ConfirmDialog,
  VoicePlayer,
  formatDate,
  PrimaryButton,
  SecondaryButton,
  EntryCard,
  ComfortCard,
  leave,
  type ConfirmRequest,
} from '@/ui';
import { comfortRows } from '@/validation';

/** One Entry: the full Reflection (Timeline cuts at 6 lines), then its Comforts or a request button. */
export default function EntryComfortScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comforts, setComforts] = useState<ReceivedComfort[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [receivingOn, setReceivingOn] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null);

  const reload = useCallback(() => {
    if (!entryId) return;
    setEntry(getEntry(entryId));
    setAttachments(listAttachments(entryId));
    setComforts(listReceivedComforts(entryId));
    setReceivingOn(isComfortReceivingEnabled());
  }, [entryId]);

  useEffect(reload, [reload]);

  // TalkBack may skip a message that just mounted — announce it explicitly.
  const notify = (msg: string) => {
    setNotice(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  async function requestComfort() {
    if (!entry || requesting) return;
    setNotice(null);
    setRequesting(true);
    AccessibilityInfo.announceForAccessibility(t.entry.searching);
    try {
      await ensureSession();
      // Returned in the app language; the pool only includes Comforts that have that translation (docs/db.md).
      const { data, error } = await supabase.rpc('request_comfort', {
        p_tags: entry.tags,
        p_lang: currentLang(),
      });

      if (error) {
        // supabase-js reports network errors in `error` with an empty code; a code means the server refused.
        notify(error.code ? t.entry.receiveError : t.common.networkError);
        return;
      }

      const parsed = comfortRows.safeParse(data ?? []);
      if (!parsed.success) return notify(t.entry.receiveError);
      const row = parsed.data[0];
      if (!row) {
        // Two different reasons, two different messages (required edge case, CLAUDE.md).
        const joyOnly = entry.tags.length === 1 && entry.tags[0] === 'moved';
        notify((await hitDailyLimit()) ? t.entry.limitReached : t.entry.poolEmpty(joyOnly));
        return;
      }

      saveReceivedComfort({
        comfortId: row.comfort_id,
        entryId: entry.id,
        body: row.body,
        translated: row.translated,
      });
      reload();
      AccessibilityInfo.announceForAccessibility(row.body);
    } catch {
      notify(t.common.networkError);
    } finally {
      setRequesting(false);
    }
  }

  async function thank(comfortId: string) {
    // Mark locally first: a failed thank-you on the server is not worth blocking the user,
    // and supabase-js returns { error } instead of throwing, so no try/catch.
    markThanked(entryId, comfortId);
    reload();
    AccessibilityInfo.announceForAccessibility(t.common.thanked);
    await supabase.from('deliveries').update({ thanked: true }).eq('comfort_id', comfortId);
  }

  const recording = attachments.find((att) => att.kind === 'audio');

  // Hard delete, no trash, no undo: the detail line says exactly what is lost.
  const askRemove = () =>
    entry &&
    setDialog({
      question: t.entry.removeQuestion,
      detail: t.entry.removeDetail(comforts.length > 0),
      confirmLabel: t.common.remove,
      onConfirm: () => {
        deleteEntry(entry.id);
        AccessibilityInfo.announceForAccessibility(t.entry.removed);
        leave();
      },
    });

  if (!entryId || !entry) {
    return (
      <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
        <View style={[s.screen, s.scroll]}>
          <Text style={[pencil.title, s.title]} accessibilityRole="header">
            {t.entry.notFound}
          </Text>
          <Text style={s.explanation}>{t.entry.notFoundDetail}</Text>
          <LinkRow icon="arrow-left" label={t.common.back} onPress={leave} />
        </View>
        <ScreenFooter />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[pencil.title, s.title]} accessibilityRole="header">
          {formatDate(entry.occurredAt)}
        </Text>
        <EntryCard entry={entry} attachments={attachments} />
        {/* Outside the card: the card is one merged screen-reader item and would swallow a button inside it. */}
        {recording ? <VoicePlayer uri={recording.uri} /> : null}

        <Text style={[pencil.date, s.section]} accessibilityRole="header">
          {t.entry.wordsFromStranger}
        </Text>

        {comforts.length === 0 ? (
          <Text style={s.explanation}>{t.entry.noneYet}</Text>
        ) : (
          comforts.map((comfort) => (
            // Same `album.clip` tone as the small clip on the Timeline card.
            <ComfortCard key={comfort.comfortId}>
              <Text style={s.body}>{comfort.body}</Text>
              {comfort.translated ? <Text style={[pencil.note, s.muted]}>{t.common.autoTranslated}</Text> : null}
              {comfort.thanked ? (
                <Text style={[pencil.note, s.muted]}>{t.common.thanked}</Text>
              ) : (
                <SecondaryButton label={t.entry.thank} onPress={() => void thank(comfort.comfortId)} />
              )}
            </ComfortCard>
          ))
        )}

        {notice ? <Text style={s.notice}>{notice}</Text> : null}

        {/* One Comfort per Entry (ADR 0007); with receiving turned off there is no request button anywhere. */}
        {comforts.length === 0 && receivingOn ? (
          <View style={s.requestButton}>
            <PrimaryButton label={t.entry.request} onPress={requestComfort} busy={requesting} busyLabel={t.entry.searching} />
          </View>
        ) : null}

        {comforts.length === 0 && !receivingOn ? (
          <Text style={[s.explanation, s.requestButton]}>{t.entry.receivingOff}</Text>
        ) : null}

        <View style={s.removeRow}>
          <LinkRow icon="trash-can-outline" label={t.entry.remove} onPress={askRemove} />
        </View>
        <LinkRow icon="arrow-left" label={t.common.back} onPress={leave} />
      </ScrollView>
      <ScreenFooter />
      <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />
    </SafeAreaView>
  );
}

/**
 * request_comfort returns nothing for two different reasons: the 3/24h quota is used up, or the pool
 * has no match. This is a CLIENT-SIDE GUESS only to pick the message — the DB enforces the rule
 * (request_comfort in docs/db.md). Getting it wrong only shows the wrong message.
 *
 * Counts `deliveries`, not SQLite: `listReceivedComforts` filters by Entry and has no `received_at`,
 * so "3 in the last 24h" cannot be counted locally. RLS allows reading the user's own rows, and we are
 * already online from the previous call.
 */
async function hitDailyLimit(): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('deliveries')
    .select('comfort_id', { count: 'exact', head: true })
    .gt('delivered_at', since);
  return !error && (count ?? 0) >= 3;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  scroll: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: space.xl },
  title: { color: album.ink, marginBottom: space.lg },
  // Bottom `lg` so the paperclip (16 above the note) does not touch the section label.
  section: { color: album.pencil, marginTop: space.lg, marginBottom: space.lg },
  explanation: { ...text.body, color: album.pencil },
  body: { ...text.body, color: album.ink },
  muted: { color: album.pencil },
  notice: { ...text.body, color: album.ink, marginTop: space.md },
  requestButton: { marginTop: space.lg },
  removeRow: { marginTop: space.lg },
});
