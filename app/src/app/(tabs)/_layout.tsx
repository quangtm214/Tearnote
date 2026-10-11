import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { album, radius, space, text, touch } from '@/theme';
import type { IconName } from '@/ui';

/**
 * "For strangers" is not a tab: it opens the write screen on top, keeping that screen's
 * login / Send / Done flow. The active tab gets a filled icon — `ink` and `pencil` are too close
 * to rely on color alone. Labels come from `t.tab[name]` at render time.
 */
const TABS: { name: keyof typeof t.tab; icon: IconName; iconSelected?: IconName; href?: Href }[] = [
  { name: 'index', icon: 'notebook-outline', iconSelected: 'notebook' },
  { name: 'write', icon: 'note-edit-outline', href: '/comfort/write' },
  { name: 'calendar', icon: 'calendar-blank-outline', iconSelected: 'calendar-blank' },
  { name: 'settings', icon: 'cog-outline', iconSelected: 'cog' },
];

/**
 * Custom tab bar: the default one has a fixed height of 49, breaks with large system fonts, and its
 * 10–12 labels are below the 14 floor in DESIGN.md. Sits below each tab's ScreenFooter.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: album.page } }}
      tabBar={({ state, navigation, insets }) => (
        <View style={[s.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
          {TABS.map((tab) => {
            const selected = state.routes[state.index].name === tab.name;
            const color = selected ? album.ink : album.pencil;
            return (
              <Pressable
                key={tab.name}
                onPress={() => (tab.href ? router.push(tab.href) : navigation.navigate(tab.name))}
                accessibilityRole={tab.href ? 'button' : 'tab'}
                accessibilityState={{ selected }}
                accessibilityLabel={t.tab[tab.name]}
                style={({ pressed }) => [s.item, pressed && s.dim]}
              >
                <View style={[s.indicator, selected && s.indicatorSelected]}>
                  <MaterialCommunityIcons name={selected && tab.iconSelected ? tab.iconSelected : tab.icon} size={24} color={color} />
                </View>
                <Text style={[s.label, { color }]} maxFontSizeMultiplier={1.3}>
                  {t.tab[tab.name]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    >
      {/* Declared so the Journal is the first tab: Back on another tab returns here. */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const s = StyleSheet.create({
  // No hairline: the footer's hairline right above already separates the page from the fixed area.
  bar: { flexDirection: 'row', backgroundColor: album.page },
  item: {
    flex: 1,
    minHeight: touch.min,
    alignItems: 'center',
    // Top-aligned: a two-line label ("For / strangers") does not push its icon out of line.
    justifyContent: 'flex-start',
    gap: space.xs,
    paddingVertical: space.xs,
  },
  indicator: { width: 56, height: 32, borderRadius: radius.touch, alignItems: 'center', justifyContent: 'center' },
  indicatorSelected: { backgroundColor: album.hairline },
  dim: { opacity: 0.6 },
  label: { ...text.caption, textAlign: 'center' },
});
