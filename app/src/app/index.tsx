import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSetting, listEntries, listReceivedComforts, setSetting, type Entry } from '@/db';
import { album, butChi, space } from '@/theme';
import { ChanMan, DongLoi, GocDan, nhanNgay, NutChinh, TamEntry, type TrangThai } from '@/ui';


/** Khoá nhóm theo ngày địa phương. */
const khoaNgay = (ms: number) => new Date(ms).toDateString();

/** Entry mở gần nhất — mở lại app thì album cuộn về đêm đó. */
const KHOA_DUNG = 'timeline_dung';

export default function Timeline() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [trangThai, setTrangThai] = useState<Record<string, TrangThai>>({});
  const [dung, setDung] = useState<string | null>(null);
  const cuon = useRef<ScrollView>(null);
  const daCuon = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const es = listEntries();
      const tt: Record<string, TrangThai> = {};
      for (const e of es) {
        const cs = listReceivedComforts(e.id);
        if (cs.length) tt[e.id] = cs.every((c) => c.thanked) ? 'camOn' : 'kep';
      }
      setEntries(es);
      setTrangThai(tt);
      setDung(getSetting(KHOA_DUNG));
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
  const eDung = entries.find((e) => e.id === dung);
  const khoaDung = eDung ? khoaNgay(eDung.occurredAt) : null;

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <ScrollView ref={cuon} contentContainerStyle={s.cuon}>
        <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
          Những lần đã khóc
        </Text>

        {nhom.length === 0 ? (
          <View style={s.khungCho}>
            <GocDan />
            <Text style={[butChi.chuThich, s.chuCho]}>
              Chưa có gì ở đây. Khi nào muốn ghi thì ghi, không thì thôi.
            </Text>
          </View>
        ) : (
          nhom.map((ngayNhom, i) => {
            const k = khoaNgay(ngayNhom[0].occurredAt);
            return (
              <View
                key={k}
                onLayout={(ev) => {
                  // Chỉ cuộn một lần khi mở app, không giật trang mỗi lần quay về.
                  if (daCuon.current || k !== khoaDung) return;
                  daCuon.current = true;
                  // Chờ một frame: gọi ngay trong onLayout thì ScrollView native chưa biết chiều
                  // cao nội dung mới và kẹp về 0 — mở lại app vẫn đứng ở đầu trang.
                  const y = ev.nativeEvent.layout.y;
                  if (i > 0) {
                    requestAnimationFrame(() => cuon.current?.scrollTo({ y, animated: false }));
                  }
                }}
              >
                {i > 0 && <View style={s.poLuya} />}
                <Text style={[butChi.ngay, s.ngay]} accessibilityRole="header">
                  {nhanNgay(ngayNhom[0].occurredAt)}
                </Text>
                {ngayNhom.map((e) => (
                  <TamEntry key={e.id} e={e} tt={trangThai[e.id]} onPress={() => moEntry(e.id)} />
                ))}
              </View>
            );
          })
        )}

        <DongLoi
          nhan="Viết một lời cho người lạ"
          phu="Gửi ẩn danh cho ai đó đang trải qua điều tương tự. Cần đăng nhập."
          onPress={() => router.push('/comfort/write')}
        />
        <DongLoi
          nhan="Lịch"
          phu="Cả năm trên một trang, đậm nhạt theo cường độ mỗi ngày."
          onPress={() => router.push('/lich')}
        />
        <DongLoi
          nhan="Cài đặt"
          phu="Lời bạn đã viết, và việc nhận lời từ người lạ."
          onPress={() => router.push('/settings')}
        />
      </ScrollView>

      <ChanMan>
        <NutChinh nhan="Ghi một lần khóc" onPress={() => router.push('/new')} />
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
