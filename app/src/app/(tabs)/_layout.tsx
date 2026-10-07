import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { album, bo, space, text, touch } from '@/theme';
import type { TenIcon } from '@/ui';

/**
 * "Viết lời" không phải tab: nó mở màn viết đè lên, để luồng đăng nhập / Gửi / Xong của màn đó
 * giữ nguyên. Tab đang mở thì icon tô đặc — chữ ngà và bút chì quá gần nhau để chỉ đổi màu.
 * Nhãn lấy từ `t.tab[ten]` lúc render.
 */
const MUC: { ten: keyof typeof t.tab; icon: TenIcon; iconChon?: TenIcon; href?: Href }[] = [
  { ten: 'index', icon: 'notebook-outline', iconChon: 'notebook' },
  { ten: 'viet', icon: 'note-edit-outline', href: '/comfort/write' },
  { ten: 'lich', icon: 'calendar-blank-outline', iconChon: 'calendar-blank' },
  { ten: 'settings', icon: 'cog-outline', iconChon: 'cog' },
];

/**
 * Thanh điều hướng tự dựng thay thanh mặc định: thanh mặc định cao cố định 49 nên vỡ khi tăng
 * cỡ chữ hệ thống, và nhãn 10–12 dưới sàn 14 của DESIGN.md. Nằm dưới chân màn (ChanMan) của mỗi tab.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: album.trang } }}
      tabBar={({ state, navigation, insets }) => (
        <View style={[s.thanh, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
          {MUC.map((m) => {
            const chon = state.routes[state.index].name === m.ten;
            const mau = chon ? album.chu : album.butChi;
            return (
              <Pressable
                key={m.ten}
                onPress={() => (m.href ? router.push(m.href) : navigation.navigate(m.ten))}
                accessibilityRole={m.href ? 'button' : 'tab'}
                accessibilityState={{ selected: chon }}
                accessibilityLabel={t.tab[m.ten]}
                style={({ pressed }) => [s.muc, pressed && s.mo]}
              >
                <View style={[s.chiBao, chon && s.chiBaoChon]}>
                  <MaterialCommunityIcons name={chon && m.iconChon ? m.iconChon : m.icon} size={24} color={mau} />
                </View>
                <Text style={[s.nhan, { color: mau }]} maxFontSizeMultiplier={1.3}>
                  {t.tab[m.ten]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    >
      {/* Khai báo đủ để Nhật ký là tab đầu: Back ở tab khác quay về đây. */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="lich" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const s = StyleSheet.create({
  // Không hairline riêng: hairline của chân màn ngay trên đã tách trang khỏi phần cố định.
  thanh: { flexDirection: 'row', backgroundColor: album.trang },
  muc: {
    flex: 1,
    minHeight: touch.toiThieu,
    alignItems: 'center',
    // Canh trên: nhãn hai dòng ("For / strangers") không đẩy icon lệch hàng với các mục khác.
    justifyContent: 'flex-start',
    gap: space.xs,
    paddingVertical: space.xs,
  },
  chiBao: { width: 56, height: 32, borderRadius: bo.tay, alignItems: 'center', justifyContent: 'center' },
  chiBaoChon: { backgroundColor: album.vienMo },
  mo: { opacity: 0.6 },
  nhan: { ...text.phu, textAlign: 'center' },
});
