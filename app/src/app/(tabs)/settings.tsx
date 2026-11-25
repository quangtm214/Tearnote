import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setComfortReceivingEnabled, isComfortReceivingEnabled } from '@/db';
import { setLanguage, LANGS, currentLang, t, NATIVE_NAMES } from '@/i18n';
import { supabase } from '@/supabase';
import {
  disableSync,
  enableSync,
  hasBackupKey,
  isSyncBlocked,
  isSyncing,
  isSyncLocked,
  isSyncOn,
  lastSyncAt,
  lockBackup,
  onSync,
} from '@/sync';
import { album, pencil, space, text } from '@/theme';
import {
  ScreenFooter,
  FAB_CLEARANCE,
  fabScrollProps,
  LinkRow,
  Pill,
  FocusPressable,
  showSnackbar,
  ConfirmDialog,
  formatDate,
  formatTime,
  type ConfirmRequest,
} from '@/ui';

export default function SettingsScreen() {
  const [receiving, setReceiving] = useState(true);
  // null = no real account (anonymous or no session).
  const [email, setEmail] = useState<string | null>(null);
  const [syncOn, setSyncOn] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ busy: false, lastAt: null as number | null, locked: false });
  const [syncBlocked, setSyncBlocked] = useState(false);
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null);
  const [switching, setSwitching] = useState(false);

  const readSession = useCallback(() => {
    // Local session like isRealAccount — offline users still see which account they use.
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setEmail(user && !user.is_anonymous ? (user.email ?? null) : null);
      setSyncOn(isSyncOn(data.session));
      setSyncBlocked(isSyncBlocked(data.session));
    });
    setSyncStatus({ busy: isSyncing(), lastAt: lastSyncAt(), locked: isSyncLocked() });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setReceiving(isComfortReceivingEnabled());
      readSession();
    }, [readSession]),
  );
  useEffect(() => onSync(readSession), [readSession]);

  function toggleReceiving(enabled: boolean) {
    setComfortReceivingEnabled(enabled);
    setReceiving(enabled);
  }

  // Both directions ask first: on uploads private writing (explicit consent, ADR 0004), off deletes the copy.
  function toggleSync() {
    if (switching) return;
    setDialog(
      syncOn
        ? { question: t.settings.syncOffQuestion, detail: t.settings.syncOffDetail, confirmLabel: t.settings.syncOff, onConfirm: () => void switchSync(false) }
        : { question: t.settings.syncOnQuestion, detail: t.settings.syncOnDetail, confirmLabel: t.settings.syncOn, onConfirm: () => void switchSync(true) },
    );
  }

  // The password opens (or makes) the backup key: ask for it on the account screen (ADR 0010).
  const askPassword = () => router.push({ pathname: '/account', params: { reason: 'sync', email: email ?? '' } });

  async function switchSync(on: boolean) {
    if (on && (!email || !(await hasBackupKey()))) return askPassword();
    setSwitching(true);
    const ok = await (on ? enableSync() : disableSync());
    setSwitching(false);
    if (!ok) return showSnackbar(t.common.networkError, 'offline');
    readSession();
    showSnackbar(on ? t.settings.syncTurnedOn : t.settings.syncTurnedOff);
  }

  async function signOut() {
    await lockBackup();
    // signOut always clears the local session, even offline (an error only means the server did not revoke the token).
    await supabase.auth.signOut();
    setEmail(null);
    setSyncOn(false);
    showSnackbar(t.settings.signedOut);
  }

  const syncDetail = switching
    ? t.common.loading
    : !syncOn
      ? t.settings.syncDetail
      : syncBlocked
        ? t.settings.syncBlocked
        : syncStatus.locked
          ? t.settings.syncLocked
          : syncStatus.busy
        ? t.settings.syncing
        : syncStatus.lastAt
          ? t.settings.syncedAt(formatDate(syncStatus.lastAt), formatTime(syncStatus.lastAt))
          : t.settings.syncWaiting;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} {...fabScrollProps}>
        <Text style={[pencil.title, s.title]} accessibilityRole="header">
          {t.settings.title}
        </Text>

        {/* The whole row is the switch: this safety net (overview §6) must be easy to hit. */}
        <SwitchRow
          label={t.settings.receiveComforts}
          detail={t.settings.receiveComfortsDetail}
          value={receiving}
          onPress={() => toggleReceiving(!receiving)}
        />
        <SwitchRow label={t.settings.sync} detail={syncDetail} value={syncOn} onPress={toggleSync} />
        {syncOn && !syncBlocked && syncStatus.locked ? (
          <LinkRow chevron icon="lock-open-outline" label={t.settings.syncUnlock} onPress={askPassword} />
        ) : null}

        {email ? (
          <>
            <View style={s.row}>
              <View style={s.left}>
                <Text style={s.label}>{t.settings.account}</Text>
                <Text style={s.caption}>{email}</Text>
              </View>
            </View>
            <LinkRow icon="logout" label={t.settings.signOut} detail={t.settings.signOutDetail} onPress={signOut} />
          </>
        ) : (
          <LinkRow
            chevron
            label={t.common.signIn}
            detail={t.settings.signInDetail}
            onPress={() => router.push({ pathname: '/account', params: { reason: 'settings' } })}
          />
        )}

        {/* Changing rebuilds the whole tree in the new language (root _layout); no restart needed. */}
        <Text style={[pencil.date, s.languageHeading]} accessibilityRole="header">
          {t.settings.language}
        </Text>
        <View style={s.languageRow} accessibilityRole="radiogroup" accessibilityLabel={t.settings.language}>
          {LANGS.map((l) => (
            <Pill key={l} label={NATIVE_NAMES[l]} single selected={l === currentLang()} onPress={() => setLanguage(l)} />
          ))}
        </View>
      </ScrollView>
      <ScreenFooter />
      <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />
    </SafeAreaView>
  );
}

/** DESIGN.md › "Nút gạt": the whole row (label + detail + switch) is one control. */
function SwitchRow({ label, detail, value, onPress }: { label: string; detail: string; value: boolean; onPress: () => void }) {
  return (
    <FocusPressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={detail}
      style={({ pressed }) => [s.row, pressed && s.dim]}
    >
      <View style={s.left} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={s.label}>{label}</Text>
        <Text style={s.caption}>{detail}</Text>
      </View>
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Switch value={value} trackColor={{ false: album.clip, true: album.pencil }} thumbColor={value ? album.ink : album.pencil} />
      </View>
    </FocusPressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  scroll: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: FAB_CLEARANCE },
  title: { color: album.ink, marginBottom: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  left: { flex: 1 },
  label: { ...text.button, color: album.ink },
  caption: { ...text.caption, color: album.pencil, marginTop: space.xs, maxWidth: 320 },
  languageHeading: { color: album.pencil, marginTop: space.lg },
  dim: { opacity: 0.6 },
  languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
});
