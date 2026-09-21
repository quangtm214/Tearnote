import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listEntries, type Entry } from '@/db';
import { TAG_LABEL_VI } from '@/tags';
import { caoVach, color, radius, space, text, touch } from '@/theme';

const gio = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
const ngay = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

/** Khoá nhóm theo ngày địa phương. */
const khoaNgay = (ms: number) => new Date(ms).toDateString();

function DongEntry({ e }: { e: Entry }) {
  const nhanTag = e.tags.map((t) => TAG_LABEL_VI[t]).join(' · ');
  return (
    <Pressable
      onPress={() => router.push(`/comfort/${e.id}` as Href)}
      style={styles.dong}
      accessibilityRole="button"
      accessibilityLabel={`${gio.format(e.occurredAt)}, cường độ ${e.intensity} trên 5`}
    >
      <Text style={styles.moc}>{gio.format(e.occurredAt)}</Text>
      <View style={[styles.vach, { height: caoVach(e.intensity) }]} />
      <View style={styles.noiDung}>
        {e.durationMin !== null && <Text style={styles.phu}>{e.durationMin} phút</Text>}
        <Text style={styles.tag}>{nhanTag}</Text>
        {e.reflection ? (
          <Text style={styles.than} numberOfLines={3}>
            {e.reflection}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Timeline() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useFocusEffect(
    useCallback(() => {
      setEntries(listEntries());
    }, []),
  );

  // Entry đã sắp xếp giảm dần từ DB — chỉ cần cắt nhóm khi đổi ngày.
  const nhom: Entry[][] = [];
  for (const e of entries) {
    const cuoi = nhom[nhom.length - 1];
    if (cuoi && khoaNgay(cuoi[0].occurredAt) === khoaNgay(e.occurredAt)) cuoi.push(e);
    else nhom.push([e]);
  }

  return (
    <SafeAreaView style={styles.man} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.cuon}>
        <Text style={styles.tieuDe}>Những lần đã khóc</Text>

        {nhom.length === 0 ? (
          <Text style={styles.rong}>
            Chưa có gì ở đây. Khi nào muốn ghi thì ghi, không thì thôi.
          </Text>
        ) : (
          nhom.map((ngayNhom) => (
            <View key={ngayNhom[0].id} style={styles.khoiNgay}>
              <Text style={styles.nhanNgay}>{ngay.format(ngayNhom[0].occurredAt)}</Text>
              {ngayNhom.map((e) => (
                <DongEntry key={e.id} e={e} />
              ))}
            </View>
          ))
        )}
        <Pressable style={styles.nutCho} onPress={() => router.push('/comfort/write')}>
          <Text style={styles.chuCho}>Viết một lời cho người lạ</Text>
          <Text style={styles.phuCho}>
            Gửi ẩn danh cho ai đó đang trải qua điều tương tự. Cần một tài khoản.
          </Text>
        </Pressable>

        <Pressable style={styles.nutCho} onPress={() => router.push('/settings')}>
          <Text style={styles.chuCho}>Cài đặt</Text>
          <Text style={styles.phuCho}>Lời đã viết, và công tắc tắt nhận lời từ người lạ.</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.chanMan}>
        <Pressable style={styles.nutChinh} onPress={() => router.push('/new')}>
          <Text style={styles.chuNutChinh}>Ghi một Entry</Text>
        </Pressable>
        <Pressable style={styles.nutHotline} onPress={() => router.push('/help')}>
          <Text style={styles.chuNutHotline}>Cần trợ giúp ngay</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: color.demKhuya },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl },
  tieuDe: { ...text.tieuDe, color: color.chuChinh, marginBottom: space.lg },
  rong: { ...text.than, color: color.chuPhu, maxWidth: 320 },
  khoiNgay: { marginBottom: space.xl },
  nhanNgay: { ...text.phu, color: color.chuPhu, marginBottom: space.md },
  dong: { flexDirection: 'row', minHeight: touch.toiThieu, marginBottom: space.lg },
  moc: { ...text.phu, color: color.chuPhu, width: 52 },
  vach: {
    width: 3,
    borderRadius: radius.vien,
    backgroundColor: color.anhTrang,
    marginRight: space.md,
    marginTop: space.xs,
  },
  noiDung: { flex: 1 },
  phu: { ...text.phu, color: color.chuPhu },
  tag: { ...text.phu, color: color.anhTrang, marginTop: space.xs },
  than: { ...text.than, color: color.chuChinh, marginTop: space.sm },
  nutCho: { minHeight: touch.toiThieu, marginTop: space.xl, justifyContent: 'center' },
  chuCho: { ...text.nut, color: color.anhTrang },
  phuCho: { ...text.phu, color: color.chuPhu, marginTop: space.xs, maxWidth: 320 },
  chanMan: { paddingHorizontal: space.man, paddingBottom: space.md, gap: space.sm },
  nutChinh: {
    height: touch.chinh,
    borderRadius: radius.o,
    backgroundColor: color.matGiay,
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  chuNutChinh: { ...text.nut, color: color.chuChinh },
  nutHotline: {
    height: touch.hotline,
    borderRadius: radius.o,
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  chuNutHotline: { ...text.nut, color: color.denConSang },
});
