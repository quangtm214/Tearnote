import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HOTLINES_FALLBACK, type Hotline } from '@/hotlines';
import { color, radius, space, text, touch } from '@/theme';

/** Màn này phải chạy khi máy bay bật: chỉ đọc danh sách đóng gói sẵn, không gọi mạng. */
const TEN_NUOC: Record<string, string> = {
  VN: 'Việt Nam',
  JP: 'Nhật Bản',
  US: 'Mỹ',
  GB: 'Anh',
};

const nhomTheoNuoc = (ds: Hotline[]): [string, Hotline[]][] => {
  const m = new Map<string, Hotline[]>();
  for (const h of ds) {
    const cu = m.get(h.country);
    if (cu) cu.push(h);
    else m.set(h.country, [h]);
  }
  return [...m];
};

export default function Help() {
  return (
    <SafeAreaView style={styles.man} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.cuon}>
        <Text style={styles.tieuDe}>Cần trợ giúp ngay</Text>
        <Text style={styles.phu}>
          Danh sách này nằm sẵn trong máy, không cần mạng. Có thể đã cũ hơn bản trên server.
        </Text>

        {nhomTheoNuoc(HOTLINES_FALLBACK).map(([nuoc, ds]) => (
          <View key={nuoc} style={styles.khoi}>
            <Text style={styles.nhanNuoc}>{TEN_NUOC[nuoc] ?? nuoc}</Text>
            {ds.map(({ name, hours, phone, url }) => (
              <View key={name} style={styles.the}>
                <Text style={styles.ten}>{name}</Text>
                {hours ? <Text style={styles.phu}>{hours}</Text> : null}
                {phone ? (
                  <Pressable
                    style={styles.nutGoi}
                    accessibilityRole="button"
                    accessibilityLabel={`Gọi ${phone}`}
                    onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`)}
                  >
                    <Text style={styles.chuGoi}>Gọi {phone}</Text>
                  </Pressable>
                ) : null}
                {url ? (
                  <Pressable
                    style={styles.nutWeb}
                    accessibilityRole="button"
                    onPress={() => Linking.openURL(url)}
                  >
                    <Text style={styles.chuWeb}>{url}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: color.demKhuya },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl },
  tieuDe: { ...text.tieuDe, color: color.chuChinh },
  phu: { ...text.phu, color: color.chuPhu, marginTop: space.xs },
  khoi: { marginTop: space.xl },
  nhanNuoc: { ...text.nhan, color: color.chuChinh, marginBottom: space.md },
  the: {
    backgroundColor: color.matGiay,
    borderRadius: radius.the,
    padding: space.md,
    marginBottom: space.md,
  },
  ten: { ...text.than, color: color.chuChinh },
  nutGoi: {
    height: touch.hotline,
    borderRadius: radius.o,
    justifyContent: 'center',
    marginTop: space.sm,
  },
  chuGoi: { ...text.nut, color: color.denConSang },
  nutWeb: { minHeight: touch.toiThieu, justifyContent: 'center' },
  chuWeb: { ...text.phu, color: color.anhTrang },
});
