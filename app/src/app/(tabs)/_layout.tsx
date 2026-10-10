import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { album, radius, space, text, touch } from '@/theme';
import type { IconName } from '@/ui';

/**
 * "Viết lời" không phải tab: nó mở màn viết đè lên, để luồng đăng nhập / Gửi / Xong của màn đó
 * giữ nguyên. Tab đang mở thì icon tô đặc — chữ ngà và bút chì quá gần nhau để chỉ đổi màu.
 * Nhãn lấy từ `t.tab[name]` lúc render.
 */
const TABS: { name: keyof typeof t.tab; icon: IconName; iconSelected?: IconName; href?: Href }[] = [
  { name: 'index', icon: 'notebook-outline', iconSelected: 'notebook' },
  { name: 'write', icon: 'note-edit-outline', href: '/comfort/write' },
  { name: 'calendar', icon: 'calendar-blank-outline', iconSelected: 'calendar-blank' },
  { name: 'settings', icon: 'cog-outline', iconSelected: 'cog' },
];

/**
 * Thanh điều hướng tự dựng thay thanh mặc định: thanh mặc định cao cố định 49 nên vỡ khi tăng
 * cỡ chữ hệ thống, và nhãn 10–12 dưới sàn 14 của DESIGN.md. Nằm dưới chân màn (ScreenFooter) của mỗi tab.
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
      {/* Khai báo đủ để Nhật ký là tab đầu: Back ở tab khác quay về đây. */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const s = StyleSheet.create({
  // Không hairline riêng: hairline của chân màn ngay trên đã tách trang khỏi phần cố định.
  bar: { flexDirection: 'row', backgroundColor: album.page },
  item: {
    flex: 1,
    minHeight: touch.min,
    alignItems: 'center',
    // Canh trên: nhãn hai dòng ("For / strangers") không đẩy icon lệch hàng với các mục khác.
    justifyContent: 'flex-start',
    gap: space.xs,
    paddingVertical: space.xs,
  },
  indicator: { width: 56, height: 32, borderRadius: radius.touch, alignItems: 'center', justifyContent: 'center' },
  indicatorSelected: { backgroundColor: album.hairline },
  dim: { opacity: 0.6 },
  label: { ...text.caption, textAlign: 'center' },
});
