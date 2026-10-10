import { router, useLocalSearchParams, type Href } from 'expo-router';
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
  type ConfirmRequest,
} from '@/ui';

type ComfortRow = { comfort_id: string; body: string; translated: boolean };

/**
 * Mở một Entry: đọc lại đủ Reflection (Timeline cắt ở 6 dòng), rồi xem hoặc xin lời từ người lạ.
 */
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

  // Thông báo mới mount thì TalkBack không chắc đọc — đọc thẳng cho chắc.
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
      // Lời trả về bằng ngôn ngữ app; pool chỉ gồm lời đã có bản ngôn ngữ đó (docs/db.md).
      const { data, error } = await supabase.rpc('request_comfort', {
        p_tags: entry.tags,
        p_lang: currentLang(),
      });

      if (error) {
        // supabase-js trả lỗi mạng qua `error` với code rỗng; có code là server từ chối.
        notify(error.code ? t.entry.receiveError : t.common.networkError);
        return;
      }

      const rows = (data ?? []) as ComfortRow[];
      const row = rows[0];
      if (!row) {
        // Hai lý do khác hẳn nhau, hai câu khác nhau (CLAUDE.md: edge case bắt buộc).
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
    // Đánh dấu ở máy trước: cảm ơn hụt trên server không đáng để chặn người dùng lúc này,
    // và supabase-js trả { error } chứ không throw nên try/catch ở đây là thừa.
    markThanked(comfortId);
    reload();
    AccessibilityInfo.announceForAccessibility(t.common.thanked);
    await supabase.from('deliveries').update({ thanked: true }).eq('comfort_id', comfortId);
  }

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));
  const recording = attachments.find((att) => att.kind === 'audio');

  // Xoá thật, không thùng rác, không hoàn tác: câu phụ nói rõ mất những gì.
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
        {/* Nằm ngoài tấm: tấm là một vùng đọc gộp cho screen reader, nút bên trong sẽ bị nuốt mất. */}
        {recording ? <VoicePlayer uri={recording.uri} /> : null}

        <Text style={[pencil.date, s.section]} accessibilityRole="header">
          {t.entry.wordsFromStranger}
        </Text>

        {comforts.length === 0 ? (
          <Text style={s.explanation}>{t.entry.noneYet}</Text>
        ) : (
          comforts.map((comfort) => (
            // Mẩu giấy người lạ kẹp vào trang — cùng tông `kep` với mẩu nhỏ trên Timeline.
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

        {/* Mỗi Entry một Comfort (ADR 0007), và công tắc tắt nhận thì không còn nút xin ở đâu cả. */}
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
 * Hàm trả rỗng vì hai lý do khác hẳn nhau: hết lượt 3/24h, hay pool không có gì hợp.
 * Đây là SUY LUẬN PHÍA CLIENT chỉ để chọn câu chữ — DB mới là chỗ ép luật thật
 * (xem request_comfort trong docs/db.md). Sai ở đây thì chỉ hiện nhầm một câu.
 *
 * Đếm trên `deliveries` chứ không trên SQLite: `listReceivedComforts` lọc theo entry và
 * không trả `received_at`, nên không đếm được "3 lời trong 24h qua" trên máy. RLS cho đọc
 * đúng dòng mình là người nhận, và ta vừa gọi mạng xong nên không tốn thêm vòng offline nào.
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
  // Đáy `lg` để chiếc kẹp nhô 16 trên mẩu lời không chạm nhãn mục.
  section: { color: album.pencil, marginTop: space.lg, marginBottom: space.lg },
  explanation: { ...text.body, color: album.pencil },
  body: { ...text.body, color: album.ink },
  muted: { color: album.pencil },
  notice: { ...text.body, color: album.ink, marginTop: space.md },
  requestButton: { marginTop: space.lg },
  removeRow: { marginTop: space.lg },
});
