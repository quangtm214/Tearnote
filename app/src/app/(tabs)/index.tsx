import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getSetting,
  listAttachments,
  listEntries,
  listReceivedComforts,
  setSetting,
  type Attachment,
  type Entry,
} from '@/db';
import { t } from '@/i18n';
import { album, butChi, space } from '@/theme';
import { ChanMan, GocDan, nhanNgay, NutChinh, TamEntry, type TrangThai } from '@/ui';


/** Khoá nhóm theo ngày địa phương. */
const khoaNgay = (ms: number) => new Date(ms).toDateString();

/** Entry mở gần nhất — mở lại app thì album cuộn về đêm đó. */
const KHOA_DUNG = 'timeline_dung';

export default function Timeline() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [trangThai, setTrangThai] = useState<Record<string, TrangThai>>({});
  const [dinhKem, setDinhKem] = useState<Record<string, Attachment[]>>({});
  const cuon = useRef<ScrollView>(null);
  /** Khoá đêm cần cuộn tới ở lần dựng kế tiếp; cuộn xong thì về null. */
  const cuonToi = useRef<string | null>(null);
  /** Entry đã hiện ở lần focus trước — null là lần đầu mở màn. */
  const daThay = useRef<Set<string> | null>(null);

  useFocusEffect(
    useCallback(() => {
      const es = listEntries();
      const tt: Record<string, TrangThai> = {};
      const dk: Record<string, Attachment[]> = {};
      for (const e of es) {
        const cs = listReceivedComforts(e.id);
        if (cs.length) tt[e.id] = cs.every((c) => c.thanked) ? 'camOn' : 'kep';
        dk[e.id] = listAttachments(e.id);
      }
      // Mở app: về đêm của Entry mở gần nhất. Quay về sau khi Lưu: về đêm của lần khóc vừa ghi — không thì
      // trang đứng ở chỗ cuộn cũ và người vừa ghi không thấy nó đâu.
      const thay = daThay.current;
      const toi = thay ? es.find((e) => !thay.has(e.id)) : es.find((e) => e.id === getSetting(KHOA_DUNG));
      cuonToi.current = toi ? khoaNgay(toi.occurredAt) : null;
      daThay.current = new Set(es.map((e) => e.id));
      setEntries(es);
      setTrangThai(tt);
      setDinhKem(dk);
    }, []),
  );

  const moEntry = (id: string) => {
    setSetting(KHOA_DUNG, id);
    router.push(`/comfort/${id}` as Href);
  };

  // Entry đã sắp xếp giảm dần từ DB — chỉ cần cắt nhóm khi đổi ngày.
  const nhom: Entry[][] = [];
  for (const e of entries) {
    const cuoi = nhom[nhom.length - 1];
    if (cuoi && khoaNgay(cuoi[0].occurredAt) === khoaNgay(e.occurredAt)) cuoi.push(e);
    else nhom.push([e]);
  }

  return (
    <SafeAreaView style={s.man} edges={['top']}>
      <ScrollView ref={cuon} contentContainerStyle={s.cuon}>
        <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
          {t.timeline.tieuDe}
        </Text>

        {nhom.length === 0 ? (
          <View style={s.khungCho}>
            <GocDan />
            <Text style={[butChi.chuThich, s.chuCho]}>{t.timeline.trong}</Text>
          </View>
        ) : (
          nhom.map((ngayNhom, i) => {
            const k = khoaNgay(ngayNhom[0].occurredAt);
            return (
              <View
                key={k}
                onLayout={(ev) => {
                  // Chỉ cuộn khi có đích (mở app, vừa Lưu), không giật trang mỗi lần quay về.
                  if (k !== cuonToi.current) return;
                  cuonToi.current = null;
                  // Chờ một frame: gọi ngay trong onLayout thì ScrollView native chưa biết chiều
                  // cao nội dung mới và kẹp về 0 — mở lại app vẫn đứng ở đầu trang.
                  const y = i > 0 ? ev.nativeEvent.layout.y : 0;
                  requestAnimationFrame(() => cuon.current?.scrollTo({ y, animated: false }));
                }}
              >
                {i > 0 && <View style={s.poLuya} />}
                <Text style={[butChi.ngay, s.ngay]} accessibilityRole="header">
                  {nhanNgay(ngayNhom[0].occurredAt)}
                </Text>
                {ngayNhom.map((e) => (
                  <TamEntry
                    key={e.id}
                    e={e}
                    dk={dinhKem[e.id]}
                    tt={trangThai[e.id]}
                    onPress={() => moEntry(e.id)}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      <ChanMan>
        <NutChinh nhan={t.timeline.ghi} onPress={() => router.push('/new')} />
      </ChanMan>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl },
  tieuDe: { color: album.chu, marginBottom: space.lg },
  ngay: { color: album.butChi, marginBottom: space.md },

  // Tờ pơ-luya giữa hai đêm: chỉ thấy mép giấy mỏng chìa ra — một mép sáng, hơi lệch,
  // chờm quá lề trang, phần thân mờ dần vào nền. Không có khung, để không thành ô nhập.
  poLuya: {
    height: 10,
    backgroundColor: album.poLuya,
    borderTopWidth: 1,
    borderColor: 'rgba(228, 220, 207, 0.22)',
    marginHorizontal: -space.sm,
    marginTop: space.md,
    marginBottom: space.xl,
    transform: [{ rotate: '-0.8deg' }],
  },

  khungCho: {
    minHeight: 160,
    justifyContent: 'center',
    padding: space.lg,
    marginBottom: space.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: album.vienMo,
  },
  chuCho: { color: album.butChi, textAlign: 'center' },
});
