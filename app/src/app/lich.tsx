import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listEntries, type Entry } from '@/db';
import { mucMau, NGUONG, tongTheoNgay } from '@/lich';
import { album, butChi, space, text, touch } from '@/theme';
import { bong, ChanMan, DongLoi } from '@/ui';

const NGAY = Array.from({ length: 31 }, (_, i) => i + 1);
/** "1–2" … "10+", suy từ NGUONG để chú thích không lệch ngưỡng. */
const NHAN_MUC = NGUONG.map((n, i) => (i === NGUONG.length - 1 ? `${n}+` : `${n}–${NGUONG[i + 1] - 1}`));
/** Cùng các mức, viết thành lời cho screen reader — không đoán được giọng đọc xử lý "–" và "+". */
const DOC_MUC = NGUONG.map((n, i) =>
  i === NGUONG.length - 1 ? `từ ${n} trở lên` : `${n} đến ${NGUONG[i + 1] - 1}`,
);

/**
 * Bảng cường độ cả năm: 12 cột tháng × 31 hàng ngày, màu theo tổng cường độ trong ngày.
 * Chỉ để nhìn — ô không bấm được, không có số. Ngoại lệ luật Một Trục, xem DESIGN.md.
 */
export default function Lich() {
  const namNay = new Date().getFullYear();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [nam, setNam] = useState(namNay);
  const [moChon, setMoChon] = useState(false);

  useFocusEffect(useCallback(() => setEntries(listEntries()), []));

  // listEntries sắp giảm dần: phần tử cuối là Entry đầu tiên.
  const namDau = entries.length ? new Date(entries[entries.length - 1].occurredAt).getFullYear() : namNay;
  const cacNam = Array.from({ length: namNay - Math.min(namDau, namNay) + 1 }, (_, i) => namNay - i);
  const tong = tongTheoNgay(entries, nam);
  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.cuon}>
        <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
          Lịch
        </Text>

        <Pressable
          onPress={() => setMoChon(true)}
          accessibilityRole="button"
          accessibilityLabel={`Năm ${nam}, chọn năm khác`}
          style={({ pressed }) => [s.chonNam, pressed && s.nhan]}
        >
          <Text style={s.chuNam}>{nam} ▾</Text>
        </Pressable>

        <View style={s.bang}>
          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Text style={[s.nhanCot, s.nhanHangRong]}> </Text>
            {NGAY.map((d) => (
              <Text key={d} style={s.nhanHang}>
                {d}
              </Text>
            ))}
          </View>
          {tong.map((thang, m) => {
            const soNgay = new Date(nam, m + 1, 0).getDate();
            const coKhoc = thang.filter(Boolean);
            return (
              // Screen reader đọc tóm tắt từng tháng, không đọc 31 ô.
              <View
                key={m}
                style={s.cot}
                accessible
                accessibilityLabel={
                  coKhoc.length
                    ? `Tháng ${m + 1}: khóc ${coKhoc.length} ngày. Ngày nặng nhất, cường độ cộng lại là ${Math.max(...coKhoc)}.`
                    : `Tháng ${m + 1}: không có ngày nào khóc.`
                }
              >
                <Text style={s.nhanCot} numberOfLines={1}>
                  T{m + 1}
                </Text>
                {thang.map((t, d) => (
                  // Ngày không tồn tại (30/2…) không tô gì, khác ô trống của ngày có thật.
                  <View key={d} style={[s.o, d < soNgay && { backgroundColor: album.lich[mucMau(t)] }]} />
                ))}
              </View>
            );
          })}
        </View>

        <View
          style={s.chuGiai}
          accessible
          accessibilityLabel={`Màu đậm dần theo tổng cường độ trong ngày: ${DOC_MUC.join(', ')}`}
        >
          {NHAN_MUC.map((nhan, i) => (
            <View key={nhan} style={s.oGiai}>
              <View style={[s.o, { backgroundColor: album.lich[i + 1] }]} />
              <Text style={[butChi.chuThich, s.chuMuc]}>{nhan}</Text>
            </View>
          ))}
        </View>
        <DongLoi nhan="Quay lại" onPress={thoat} />
      </ScrollView>
      <ChanMan />

      <Modal visible={moChon} transparent animationType="fade" onRequestClose={() => setMoChon(false)}>
        <View style={s.nenModal}>
          {/* Nền đứng riêng, không bọc tấm chọn: bọc thì VoiceOver gộp cả tấm, không chạm được từng năm. */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMoChon(false)}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
          />
          <View style={s.tamChon}>
            <ScrollView>
              {cacNam.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => {
                    setNam(n);
                    setMoChon(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: n === nam }}
                  style={({ pressed }) => [s.dongNam, pressed && s.nhan]}
                >
                  <Text style={[s.chuNam, n !== nam && s.namKhac]}>{n}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const O = 18;
const KHE = 3;

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl },
  tieuDe: { color: album.chu, marginBottom: space.md },
  nhan: { opacity: 0.6 },

  chonNam: { minHeight: touch.toiThieu, justifyContent: 'center', alignSelf: 'flex-start', marginBottom: space.md },
  chuNam: { ...text.nut, color: album.chu },
  namKhac: { color: album.butChi },

  bang: { flexDirection: 'row', gap: KHE },
  cot: { flex: 1, gap: KHE },
  nhanCot: { ...butChi.chuThich, fontSize: 14, lineHeight: 20, color: album.butChi, textAlign: 'center' },
  nhanHangRong: { width: 20 },
  nhanHang: {
    ...butChi.chuThich,
    fontSize: 14,
    lineHeight: O,
    height: O,
    marginTop: KHE,
    color: album.butChi,
    textAlign: 'right',
    width: 20,
  },
  o: { height: O, minWidth: O },

  chuGiai: { flexDirection: 'row', gap: space.md, marginTop: space.lg, marginBottom: space.md, flexWrap: 'wrap' },
  oGiai: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  chuMuc: { color: album.butChi },

  nenModal: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', padding: space.xl },
  tamChon: {
    backgroundColor: album.tam,
    paddingVertical: space.sm,
    maxHeight: 400,
    ...bong,
  },
  dongNam: { minHeight: touch.toiThieu, justifyContent: 'center', paddingHorizontal: space.lg },
});
