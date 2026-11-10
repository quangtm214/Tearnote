import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { album, radius, space, text, touch } from '@/theme';
import { FocusPressable, type IconName } from '@/ui';

/**
 * The active tab gets a filled icon — `ink` and `pencil` are too close to rely on color alone.
 * Labels come from `t.tab[name]` at render time.
 */
const TABS: { name: keyof typeof t.tab; icon: IconName; iconSelected: IconName }[] = [
  { name: 'index', icon: 'notebook-outline', iconSelected: 'notebook' },
  { name: 'strangers', icon: 'note-edit-outline', iconSelected: 'note-edit' },
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
      tabBar={({ state, navigateToTab, insets }) => (
        <View style={[s.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
          {TABS.map((tab) => {
            const selected = state.routes[state.index].name === tab.name;
            const color = selected ? album.ink : album.pencil;
            return (
              <FocusPressable
                key={tab.name}
                onPress={() => navigateToTab(state.routes.find((r) => r.name === tab.name)!.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={t.tab[tab.name]}
                style={({ pressed }) => [s.item, pressed && s.dim]}
              >
                {/* key: on RN 0.88 Android the rounded corners are lost when the background is added after
                    mount (a plain style update, even from 'transparent'); a fresh view keeps them. */}
                <View key={String(selected)} style={[s.indicator, selected && s.indicatorSelected]}>
                  <MaterialCommunityIcons name={selected ? tab.iconSelected : tab.icon} size={24} color={color} />
                </View>
                <Text style={[s.label, { color }]} maxFontSizeMultiplier={1.5}>
                  {t.tab[tab.name]}
                </Text>
              </FocusPressable>
            );
          })}
        </View>
      )}
    >
      {/* Declared so the Journal is the first tab: Back on another tab returns here. */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="strangers" />
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
