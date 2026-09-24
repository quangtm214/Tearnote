import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSetting, listEntries, setSetting, type Entry } from '@/db';
import { TAG_LABEL_VI } from '@/tags';
import { bit, pixel, space, text, touch } from '@/theme';

/** Cường độ 1–5 → tile dither dày dần. Cùng một thang cho ô khảm và dòng Entry. */
const DITHER = [
  require('../../assets/images/dither/d1.png'),
  require('../../assets/images/dither/d2.png'),
  require('../../assets/images/dither/d3.png'),
  require('../../assets/images/dither/d4.png'),
  require('../../assets/images/dither/d5.png'),
];
const SOC = require('../../assets/images/dither/soc.png');

// ponytail: khảm cố định 12 tuần gần nhất; cần xem xa hơn thì thêm cuộn ngang theo quý.
const SO_TUAN = 12;
const THU = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const KHOA_DUNG = 'timeline_dung';

const gio = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
const ngay = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

/** Khoá nhóm theo ngày địa phương. */
const khoaNgay = (ms: number) => new Date(ms).toDateString();

/** 0h thứ Hai của tuần chứa `d`. */
function dauTuan(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function Dither({ muc }: { muc: number }) {
  return <Image source={DITHER[muc - 1]} resizeMode="repeat" style={StyleSheet.absoluteFill} />;
}

/** Thanh tiêu đề cửa sổ: sọc dither hai bên, nhãn pixel ở giữa. */
function ThanhTieuDe({ nhan, lon }: { nhan: string; lon?: boolean }) {
  return (
    <View style={s.thanh} accessibilityRole="header">
      <View style={s.soc}>
        <Image source={SOC} resizeMode="repeat" style={StyleSheet.absoluteFill} />
      </View>
      <Text style={[lon ? pixel.tieuDe : pixel.nhan, s.chuThanh]}>{nhan}</Text>
      <View style={s.soc}>
        <Image source={SOC} resizeMode="repeat" style={StyleSheet.absoluteFill} />
      </View>
    </View>
  );
}

function Co() {
  return (
    <View style={s.co} pointerEvents="none">
      <View style={s.coLa} />
      <View style={s.coCan} />
    </View>
  );
}

type Khung = { x: number; y: number; w: number; h: number };

export default function Timeline() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dung, setDung] = useState<string | null>(null);
  const [zoom, setZoom] = useState<{ tu: Khung; buoc: number } | null>(null);
  const man = useWindowDimensions();

  useFocusEffect(
    useCallback(() => {
      setEntries(listEntries());
      setDung(getSetting(KHOA_DUNG));
      setZoom(null);
    }, []),
  );

  /** Mở Entry. Từ ô khảm thì có khung zoom từng nấc; giảm chuyển động thì cắt thẳng. */
  async function moEntry(id: string, ev?: GestureResponderEvent) {
    setSetting(KHOA_DUNG, id);
    const di = () => router.push(`/comfort/${id}` as Href);
    const o = ev?.currentTarget as unknown as
      | { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void }
      | undefined;
    if (!o?.measureInWindow || (await AccessibilityInfo.isReduceMotionEnabled())) return di();
    o.measureInWindow((x, y, w, h) => {
      let buoc = 0;
      const nhip = () => {
        buoc += 1;
        setZoom({ tu: { x, y, w, h }, buoc });
        setTimeout(buoc < 5 ? nhip : di, 45);
      };
      nhip();
    });
  }

  // Entry đã sắp xếp giảm dần từ DB — chỉ cần cắt nhóm khi đổi ngày.
  const nhom: Entry[][] = [];
  const theoNgay = new Map<string, Entry[]>();
  for (const e of entries) {
    const k = khoaNgay(e.occurredAt);
    const cuoi = nhom[nhom.length - 1];
    if (cuoi && khoaNgay(cuoi[0].occurredAt) === k) cuoi.push(e);
    else nhom.push([e]);
    theoNgay.set(k, [...(theoNgay.get(k) ?? []), e]);
  }
  const ngayDung = entries.find((e) => e.id === dung);
  const khoaDung = ngayDung ? khoaNgay(ngayDung.occurredAt) : null;

  const homNay = new Date();
  const tuanNay = dauTuan(homNay);
  const tuan = Array.from({ length: SO_TUAN }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const x = new Date(tuanNay);
      x.setDate(x.getDate() - w * 7 + d);
      return x;
    }),
  );

  function o(d: Date) {
    const k = d.toDateString();
    if (d > homNay) return <View key={k} style={s.o} />;
    const ds = theoNgay.get(k);
    const laHomNay = k === homNay.toDateString();
    if (!ds) return <View key={k} style={[s.o, s.oTrong, laHomNay && s.oHomNay]} />;
    const manh = Math.max(...ds.map((e) => e.intensity));
    return (
      <Pressable
        key={k}
        onPress={(ev) => moEntry(ds[0].id, ev)}
        style={[s.o, s.oCo, laHomNay && s.oHomNay]}
        accessibilityRole="button"
        accessibilityLabel={`${ngay.format(d)}, ${ds.length} lần khóc, mạnh nhất ${manh} trên 5${
          k === khoaDung ? ', chỗ bạn dừng lần trước' : ''
        }`}
      >
        <Dither muc={manh} />
        {k === khoaDung && <Co />}
      </Pressable>
    );
  }

  return (
    <View style={s.goc}>
      <SafeAreaView style={s.man} edges={['top', 'bottom']}>
        <ThanhTieuDe nhan="NHỮNG LẦN ĐÃ KHÓC" lon />

        <ScrollView contentContainerStyle={s.cuon}>
          <View style={s.cuaSo}>
            <ThanhTieuDe nhan={`${SO_TUAN} TUẦN`} />
            <View style={s.luoi}>
              <View style={s.hang} importantForAccessibility="no-hide-descendants">
                {THU.map((t) => (
                  <Text key={t} style={[pixel.nhan, s.thu]}>
                    {t}
                  </Text>
                ))}
              </View>
              {tuan.map((ngays) => (
                <View key={ngays[0].toDateString()} style={s.hang}>
                  {ngays.map(o)}
                </View>
              ))}
            </View>
          </View>

          {nhom.length === 0 ? (
            <Text style={s.rong}>Chưa có gì ở đây. Khi nào muốn ghi thì ghi, không thì thôi.</Text>
          ) : (
            nhom.map((ngayNhom) => (
              <View key={ngayNhom[0].id} style={s.khoiNgay}>
                <Text style={[pixel.nhan, s.nhanNgay]} accessibilityRole="header">
                  {ngay.format(ngayNhom[0].occurredAt).toLocaleUpperCase('vi-VN')}
                </Text>
                {ngayNhom.map((e) => (
                  <DongEntry key={e.id} e={e} onPress={() => moEntry(e.id)} />
                ))}
              </View>
            ))
          )}

          <DongLoi
            nhan="VIẾT MỘT LỜI CHO NGƯỜI LẠ"
            phu="Gửi ẩn danh cho ai đó đang trải qua điều tương tự. Cần một tài khoản."
            onPress={() => router.push('/comfort/write')}
          />
          <DongLoi
            nhan="CÀI ĐẶT"
            phu="Lời đã viết, và công tắc tắt nhận lời từ người lạ."
            onPress={() => router.push('/settings')}
          />
        </ScrollView>

        <View style={s.chanMan}>
          <View style={s.vienMacDinh}>
            <Pressable
              onPress={() => router.push('/new')}
              accessibilityRole="button"
              style={({ pressed }) => [s.nutChinh, pressed && s.daoTong]}
            >
              {({ pressed }) => (
                <Text style={[pixel.nhan, s.chuMuc, pressed && s.chuDao]}>GHI MỘT ENTRY</Text>
              )}
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push('/help')}
            accessibilityRole="button"
            style={({ pressed }) => [s.nutTroGiup, pressed && s.denSang]}
          >
            {({ pressed }) => (
              <Text style={[pixel.nhan, s.chuDen, pressed && s.chuDao]}>CẦN TRỢ GIÚP NGAY</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      {zoom && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: zoom.buoc }, (_, i) => {
            const t = (i + 1) / 5;
            const { x, y, w, h } = zoom.tu;
            return (
              <View
                key={i}
                style={[
                  s.khungZoom,
                  {
                    left: x * (1 - t),
                    top: y * (1 - t),
                    width: w + (man.width - w) * t,
                    height: h + (man.height - h) * t,
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

function DongEntry({ e, onPress }: { e: Entry; onPress: () => void }) {
  const nhanTag = e.tags.map((t) => TAG_LABEL_VI[t]).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.dong, pressed && s.daoTong]}
      accessibilityRole="button"
      accessibilityLabel={`${gio.format(e.occurredAt)}, cường độ ${e.intensity} trên 5, ${nhanTag}`}
    >
      {({ pressed }) => (
        <>
          <View style={[s.mau, pressed && s.mauDao]}>
            <Dither muc={e.intensity} />
          </View>
          <View style={s.noiDung}>
            <View style={s.nhanDong}>
              <Text style={[pixel.nhan, s.chuMuc, pressed && s.chuDao]}>
                {gio.format(e.occurredAt)}
              </Text>
              {e.durationMin !== null && (
                <Text style={[pixel.nhan, s.chuMuc, pressed && s.chuDao]}>{e.durationMin} PHÚT</Text>
              )}
            </View>
            <Text style={[s.tag, pressed && s.chuDao]}>{nhanTag}</Text>
            {e.reflection ? (
              <Text style={[s.than, pressed && s.chuDao]} numberOfLines={3}>
                {e.reflection}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );
}

function DongLoi({ nhan, phu, onPress }: { nhan: string; phu: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.loi, pressed && s.daoTong]}
    >
      {({ pressed }) => (
        <>
          <Text style={[pixel.nhan, s.chuMuc, pressed && s.chuDao]}>{nhan}</Text>
          <Text style={[s.phuLoi, pressed && s.chuDao]}>{phu}</Text>
        </>
      )}
    </Pressable>
  );
}

const VIEN = 1;

const s = StyleSheet.create({
  goc: { flex: 1, backgroundColor: bit.nen },
  man: { flex: 1 },
  cuon: { paddingHorizontal: space.man, paddingTop: space.md, paddingBottom: space.xl },

  thanh: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.toiThieu,
    paddingHorizontal: space.sm,
    borderBottomWidth: VIEN,
    borderColor: bit.muc,
  },
  soc: { flex: 1, height: 14, overflow: 'hidden' },
  chuThanh: { color: bit.muc, paddingHorizontal: space.sm, flexShrink: 1, textAlign: 'center' },

  cuaSo: { borderWidth: VIEN, borderColor: bit.muc, marginBottom: space.xl },
  luoi: { padding: space.sm, gap: space.xs },
  hang: { flexDirection: 'row', gap: space.xs },
  thu: { flex: 1, textAlign: 'center', color: bit.muc },
  o: { flex: 1, aspectRatio: 1 },
  oTrong: { borderWidth: VIEN, borderColor: bit.muc, borderStyle: 'dotted' },
  oCo: { borderWidth: VIEN, borderColor: bit.muc, overflow: 'hidden' },
  oHomNay: { borderWidth: 2, borderStyle: 'dashed' },

  co: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 16,
    backgroundColor: bit.nen,
    borderLeftWidth: VIEN,
    borderBottomWidth: VIEN,
    borderColor: bit.muc,
  },
  coLa: { position: 'absolute', top: 3, left: 4, width: 6, height: 4, backgroundColor: bit.muc },
  coCan: { position: 'absolute', top: 3, left: 3, width: 2, height: 10, backgroundColor: bit.muc },

  rong: { ...text.than, color: bit.muc, maxWidth: 320, marginBottom: space.xl },
  khoiNgay: { marginBottom: space.xl },
  nhanNgay: { color: bit.muc, marginBottom: space.sm },

  dong: {
    flexDirection: 'row',
    gap: space.md,
    minHeight: touch.toiThieu,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    borderTopWidth: VIEN,
    borderColor: bit.muc,
  },
  mau: {
    width: 24,
    height: 24,
    marginTop: 2,
    borderWidth: VIEN,
    borderColor: bit.muc,
    overflow: 'hidden',
  },
  mauDao: { borderColor: bit.nen, backgroundColor: bit.nen },
  noiDung: { flex: 1 },
  nhanDong: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.sm },
  tag: { ...text.phu, color: bit.muc, marginTop: space.xs },
  than: { ...text.than, color: bit.muc, marginTop: space.sm },

  loi: {
    minHeight: touch.toiThieu,
    justifyContent: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    borderTopWidth: VIEN,
    borderColor: bit.muc,
  },
  phuLoi: { ...text.phu, color: bit.muc, marginTop: space.xs, maxWidth: 320 },

  daoTong: { backgroundColor: bit.muc },
  chuMuc: { color: bit.muc },
  chuDao: { color: bit.nen },

  chanMan: {
    paddingHorizontal: space.man,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: space.sm,
    borderTopWidth: VIEN,
    borderColor: bit.muc,
  },
  // Viền đôi của nút mặc định trên desktop một-bit: vòng ngoài 2dp, khe 2dp, nút viền 1dp.
  vienMacDinh: { borderWidth: 2, borderColor: bit.muc, padding: 2 },
  nutChinh: {
    minHeight: touch.chinh - 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: VIEN,
    borderColor: bit.muc,
  },
  nutTroGiup: {
    minHeight: touch.hotline,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: VIEN,
    borderColor: bit.den,
  },
  denSang: { backgroundColor: bit.den },
  chuDen: { color: bit.den },

  khungZoom: { position: 'absolute', borderWidth: VIEN, borderColor: bit.muc },
});
