import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listEntries, type Entry } from '@/db';
import { t } from '@/i18n';
import { mucMau, NGUONG, tongTheoNgay } from '@/lich';
import { album, butChi, space, text, touch } from '@/theme';
import { ChanMan, type TenIcon } from '@/ui';

const NGAY = Array.from({ length: 31 }, (_, i) => i + 1);
/** "1–2" … "10+", suy từ NGUONG để chú thích không lệch ngưỡng. */
const NHAN_MUC = NGUONG.map((n, i) => (i === NGUONG.length - 1 ? `${n}+` : `${n}–${NGUONG[i + 1] - 1}`));
/** Cùng các mức, viết thành lời cho screen reader — không đoán được giọng đọc xử lý "–" và "+". */
const docMuc = () =>
  NGUONG.map((n, i) => (i === NGUONG.length - 1 ? t.lich.muc(n) : t.lich.muc(n, NGUONG[i + 1] - 1)));

/**
 * Bảng cường độ cả năm: 12 cột tháng × 31 hàng ngày, màu theo tổng cường độ trong ngày.
 * Chỉ để nhìn — ô không bấm được, không có số. Ngoại lệ luật Một Trục, xem DESIGN.md.
 */
export default function Lich() {
  const homNay = new Date();
  const namNay = homNay.getFullYear();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [nam, setNam] = useState(namNay);

  useFocusEffect(useCallback(() => setEntries(listEntries()), []));

  // listEntries sắp giảm dần: phần tử cuối là Entry đầu tiên.
  const namDau = Math.min(
    entries.length ? new Date(entries[entries.length - 1].occurredAt).getFullYear() : namNay,
    namNay,
  );
  const tong = tongTheoNgay(entries, nam);
  // Hôm nay chỉ đánh dấu trên bảng của năm nay.
  const thangNay = nam === namNay ? homNay.getMonth() : -1;
  const ngayNay = homNay.getDate() - 1;

  return (
    <SafeAreaView style={s.man} edges={['top']}>
      <ScrollView contentContainerStyle={s.cuon}>
        {/* Năm nằm cùng hàng tiêu đề: không mở hộp chọn, và trả lại chỗ để thấy đủ 31 hàng trong một màn. */}
        <View style={s.dau}>
          <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
            {t.lich.tieuDe}
          </Text>
          <View style={s.cumNam}>
            {namDau < namNay ? (
              <NutNam
                icon="chevron-left"
                nhan={t.lich.namTruoc}
                tat={nam <= namDau}
                onPress={() => setNam(nam - 1)}
              />
            ) : null}
            <Text style={s.chuNam} accessibilityLiveRegion="polite">
              {nam}
            </Text>
            {namDau < namNay ? (
              <NutNam
                icon="chevron-right"
                nhan={t.lich.namSau}
                tat={nam >= namNay}
                onPress={() => setNam(nam + 1)}
              />
            ) : null}
          </View>
        </View>

        {/* Nhãn hàng/cột cao đúng một ô nên không theo cỡ chữ hệ thống: ở 200% "10" còn "1", "T10" thành
            "T…". Screen reader đọc tóm tắt từng tháng, không mất thông tin. */}
        <View style={s.bang}>
          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Text style={[butChi.chuThich, s.nhanCot, s.nhanHangRong]} allowFontScaling={false}> </Text>
            {NGAY.map((d) => (
              <Text
                key={d}
                style={[butChi.chuThich, s.nhanHang, d - 1 === ngayNay && thangNay >= 0 && s.nhanNay]}
                allowFontScaling={false}
              >
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
                    ? t.lich.thang(m + 1, coKhoc.length, Math.max(...coKhoc))
                    : t.lich.thangTrong(m + 1)
                }
              >
                <Text
                  style={[butChi.chuThich, s.nhanCot, m === thangNay && s.nhanNay]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {t.lich.cot(m + 1)}
                </Text>
                {thang.map((tongNgay, d) => {
                  const muc = mucMau(tongNgay);
                  return (
                    // Ngày không tồn tại (30/2…) không tô gì, khác ô trống của ngày có thật.
                    <View
                      key={d}
                      style={[
                        s.o,
                        d < soNgay && { backgroundColor: album.lich[muc] },
                        // Hôm nay: vòng bút chì; ô đã đậm (mức ≥ 3) thì vòng màu trang để còn thấy.
                        m === thangNay && d === ngayNay && [s.oNay, { borderColor: muc >= 3 ? album.trang : album.chu }],
                      ]}
                    />
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={s.chuGiai} accessible accessibilityLabel={t.lich.chuGiai(docMuc())}>
          <Text style={[butChi.chuThich, s.tenChuGiai]}>{t.lich.tenChuGiai}</Text>
          {NHAN_MUC.map((nhan, i) => (
            <View key={nhan} style={s.oGiai}>
              <View style={[s.o, { backgroundColor: album.lich[i + 1] }]} />
              <Text style={[butChi.chuThich, s.chuMuc]}>{nhan}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <ChanMan />
    </SafeAreaView>
  );
}

/** Nút lùi / tới một năm: chỉ hiện khi có từ hai năm; hết đầu / cuối thì mờ và tắt. */
function NutNam({ icon, nhan, tat, onPress }: { icon: TenIcon; nhan: string; tat: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={tat}
      accessibilityRole="button"
      accessibilityLabel={nhan}
      accessibilityState={{ disabled: tat }}
      style={({ pressed }) => [s.nutNam, pressed && s.nhan, tat && s.nhat]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={album.chu} />
    </Pressable>
  );
}

const O = 16;
const KHE = 2;

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.lg },
  dau: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  tieuDe: { color: album.chu },
  cumNam: { flexDirection: 'row', alignItems: 'center' },
  nutNam: { width: touch.toiThieu, height: touch.toiThieu, alignItems: 'center', justifyContent: 'center' },
  nhan: { opacity: 0.6 },
  nhat: { opacity: 0.35 },
  chuNam: { ...text.nut, color: album.chu },

  bang: { flexDirection: 'row', gap: KHE },
  cot: { flex: 1, gap: KHE },
  // Đi sau butChi.chuThich trong mảng style: butChi đổi họ chữ theo ngôn ngữ, không trải vào đây được.
  nhanCot: { fontSize: 14, lineHeight: 20, color: album.butChi, textAlign: 'center' },
  nhanHangRong: { width: 20 },
  nhanHang: {
    fontSize: 14,
    lineHeight: O,
    height: O,
    marginTop: KHE,
    color: album.butChi,
    textAlign: 'right',
    width: 20,
  },
  nhanNay: { color: album.chu },
  o: { height: O, minWidth: O, borderRadius: 3 },
  oNay: { borderWidth: 1.5 },

  chuGiai: { flexDirection: 'row', gap: space.md, marginTop: space.lg, marginBottom: space.md, flexWrap: 'wrap' },
  tenChuGiai: { color: album.butChi, width: '100%' },
  oGiai: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  chuMuc: { color: album.butChi },
});
