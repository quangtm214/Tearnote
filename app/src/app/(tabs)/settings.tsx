import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setComfortReceivingEnabled, isComfortReceivingEnabled } from '@/db';
import { setLanguage, LANGS, currentLang, t, NATIVE_NAMES } from '@/i18n';
import { supabase } from '@/supabase';
import { album, pencil, space, text } from '@/theme';
import { ScreenFooter, LinkRow, Pill } from '@/ui';

export default function SettingsScreen() {
  const [receiving, setReceiving] = useState(true);
  // null = no real account (anonymous or no session).
  const [email, setEmail] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setReceiving(isComfortReceivingEnabled());
      // Local session like isRealAccount — offline users still see which account they use.
      supabase.auth.getSession().then(({ data }) => {
        const user = data.session?.user;
        setEmail(user && !user.is_anonymous ? (user.email ?? null) : null);
      });
    }, []),
  );

  function toggleReceiving(enabled: boolean) {
    setComfortReceivingEnabled(enabled);
    setReceiving(enabled);
  }

  async function signOut() {
    // signOut always clears the local session, even offline (an error only means the server did not revoke the token).
    await supabase.auth.signOut();
    setEmail(null);
    AccessibilityInfo.announceForAccessibility(t.settings.signedOut);
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[pencil.title, s.title]} accessibilityRole="header">
          {t.settings.title}
        </Text>

        {/* The whole row is the switch: this safety net (overview §6) must be easy to hit. */}
        <Pressable
          onPress={() => toggleReceiving(!receiving)}
          accessibilityRole="switch"
          accessibilityState={{ checked: receiving }}
          accessibilityLabel={t.settings.receiveComforts}
          accessibilityHint={t.settings.receiveComfortsDetail}
          style={({ pressed }) => [s.row, pressed && s.dim]}
        >
          <View style={s.left} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Text style={s.label}>{t.settings.receiveComforts}</Text>
            <Text style={s.caption}>{t.settings.receiveComfortsDetail}</Text>
          </View>
          <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Switch
              value={receiving}
              trackColor={{ false: album.clip, true: album.pencil }}
              thumbColor={receiving ? album.ink : album.pencil}
            />
          </View>
        </Pressable>

        <LinkRow
          chevron
          label={t.common.wordsYouWrote}
          detail={t.settings.wordsYouWroteDetail}
          onPress={() => router.push('/comfort/mine')}
        />
        <LinkRow
          chevron
          label={t.common.writeForStranger}
          detail={t.settings.writeForStrangerDetail}
          onPress={() => router.push('/comfort/write')}
        />

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
            onPress={() => router.push('/login')}
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  scroll: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: space.xl },
  title: { color: album.ink, marginBottom: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  left: { flex: 1 },
  label: { ...text.button, color: album.ink },
  caption: { ...text.caption, color: album.pencil, marginTop: space.xs, maxWidth: 320 },
  languageHeading: { color: album.pencil, marginTop: space.lg },
  dim: { opacity: 0.6 },
  languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
});
