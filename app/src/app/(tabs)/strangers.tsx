import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { album, pencil, space, text } from '@/theme';
import { ScreenFooter, FAB_CLEARANCE, fabScrollProps, LinkRow, PrimaryButton } from '@/ui';

/**
 * "For strangers" tab: says where written words go, links to the user's own words, and opens the
 * write screen on top (comfort/write.tsx keeps its own sign-in / Send / Done flow).
 */
export default function StrangersScreen() {
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} {...fabScrollProps}>
        <Text style={[pencil.title, s.title]} accessibilityRole="header">
          {t.strangers.title}
        </Text>
        <Text style={s.body}>{t.strangers.intro}</Text>
        <Text style={s.caption}>{t.strangers.rules}</Text>
        <LinkRow
          chevron
          label={t.common.wordsYouWrote}
          detail={t.strangers.wordsYouWroteDetail}
          onPress={() => router.push('/comfort/mine')}
        />
      </ScrollView>
      <ScreenFooter>
        <PrimaryButton label={t.strangers.writeOne} onPress={() => router.push('/comfort/write')} />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  scroll: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: FAB_CLEARANCE },
  title: { color: album.ink, marginBottom: space.lg },
  body: { ...text.body, color: album.ink, marginBottom: space.sm },
  caption: { ...text.caption, color: album.pencil, marginBottom: space.sm },
});
