import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { z } from 'zod';

import { tagLabels, t } from '@/i18n';
import { isRealAccount, supabase } from '@/supabase';
import { album, pencil, space, text } from '@/theme';
import { ScreenFooter, FAB_CLEARANCE, fabScrollProps, LinkRow, Loading, ConfirmDialog, SecondaryButton, ComfortCard, TopBar, leave, showSnackbar, type ConfirmRequest } from '@/ui';
import { myComfortRows } from '@/validation';

/**
 * Comforts the user wrote. overview.md §6 requires that writers can retract them.
 *
 * The ONLY place the app `select`s from `comforts`, and it does not break ADR 0008:
 * policy `comfort_select_own` returns only the user's own rows. Other people's Comforts
 * are still reachable only through `request_comfort()`.
 */
type MyComfort = z.infer<typeof myComfortRows>[number];

export default function MyComfortsScreen() {
  // null = loading; 'signedOut' is separate from an empty list because RLS returns [] for both.
  const [items, setItems] = useState<MyComfort[] | 'signedOut' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retractingId, setRetractingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null);

  const load = useCallback(async () => {
    if (!(await isRealAccount())) return setItems('signedOut');
    const { data, error } = await supabase
      .from('comforts')
      .select('id, body, tags, status')
      .order('created_at', { ascending: false });

    const rows = myComfortRows.safeParse(data);
    if (error || !rows.success) {
      setError(t.myComforts.loadError);
      setItems([]);
      return;
    }
    setError(null);
    setItems(rows.data);
  }, []);

  // On focus, so it reloads when coming back from the account modal.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Retracting cannot be undone (RLS only allows changing to 'retracted'), so confirm once.
  function askRetract(id: string) {
    setDialog({
      question: t.myComforts.retractQuestion,
      detail: t.myComforts.retractDetail,
      confirmLabel: t.myComforts.retract,
      onConfirm: () => void retract(id),
    });
  }

  async function retract(id: string) {
    setRetractingId(id);
    // RLS only allows changing status, and only to 'retracted'. No need to check here.
    const { error } = await supabase.from('comforts').update({ status: 'retracted' }).eq('id', id);
    setRetractingId(null);
    if (error) {
      setError(t.myComforts.retractError);
      return;
    }
    showSnackbar(t.myComforts.retracted);
    await load();
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <TopBar />
      {/* Own box under the TopBar: the help FAB is placed inside it, so it can never cover ←. */}
      <View style={s.screen}>
        <ScrollView contentContainerStyle={s.scroll} {...fabScrollProps}>
          <Text style={[pencil.title, s.title]} accessibilityRole="header">
            {t.common.wordsYouWrote}
          </Text>

          {items === null ? (
            <Loading label={t.common.loading} />
          ) : items === 'signedOut' ? (
            <>
              <Text style={s.explanation}>{t.myComforts.keptByAccount}</Text>
              <LinkRow
                label={t.myComforts.signInToView}
                chevron
                onPress={() => router.push({ pathname: '/account', params: { reason: 'mine' } })}
              />
            </>
          ) : items.length === 0 && !error ? (
            <Text style={s.explanation}>{t.myComforts.empty}</Text>
          ) : (
            items.map((comfort) => (
              <ComfortCard key={comfort.id}>
                <Text style={s.body}>{comfort.body}</Text>
                <Text style={[pencil.note, s.muted]}>
                  {tagLabels(comfort.tags)} · {t.myComforts.status[comfort.status]}
                </Text>
                {/* Nothing to retract once retracted, or once rejected (no longer in the pool). */}
                {comfort.status === 'pending' || comfort.status === 'approved' ? (
                  <SecondaryButton
                    label={retractingId === comfort.id ? t.myComforts.retracting : t.myComforts.retract}
                    onPress={() => askRetract(comfort.id)}
                    disabled={retractingId === comfort.id}
                    accessibilityLabel={t.myComforts.retractA11y(comfort.body.slice(0, 40))}
                    accessibilityHint={t.myComforts.irreversible}
                  />
                ) : null}
              </ComfortCard>
            ))
          )}

          {error ? (
            <>
              <Text style={s.error}>{error}</Text>
              <LinkRow icon="refresh" label={t.myComforts.retry} onPress={() => void load()} />
            </>
          ) : null}

          <LinkRow icon="arrow-left" label={t.common.back} onPress={leave} />
        </ScrollView>
        <ScreenFooter />
      </View>
      <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  scroll: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: FAB_CLEARANCE },
  title: { color: album.ink, marginBottom: space.lg },
  explanation: { ...text.body, color: album.pencil },
  body: { ...text.body, color: album.ink },
  muted: { color: album.pencil },
  error: { ...text.body, color: album.alert, marginTop: space.md },
});
