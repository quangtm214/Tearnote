import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Attachment, Entry } from './db';
import { nhanTags, t } from './i18n';
import { album, butChi, space, text, touch } from './theme';

/**
 * Chỗ duy nhất cho thứ đã lặp từ lần thứ hai. Đừng đẩy thêm gì vào đây trước khi
 * nó thật sự xuất hiện ở hai màn — file này không phải kho component.
 */

/** Bóng mềm, thấp: tấm dán nằm trên trang chứ không bay. */
export const bong = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.45,
  shadowRadius: 6,
  elevation: 3,
};

/** Bốn góc dán ảnh giữ một tấm vào trang. */
export function GocDan({ co = 14 }: { co?: number }) {
  const g = { width: 0, height: 0, position: 'absolute' as const, borderColor: 'transparent' };
  return (
    <>
      <View style={[g, { top: -2, left: -2, borderTopWidth: co, borderRightWidth: co, borderTopColor: album.goc }]} />
      <View style={[g, { top: -2, right: -2, borderTopWidth: co, borderLeftWidth: co, borderTopColor: album.goc }]} />
      <View style={[g, { bottom: -2, left: -2, borderBottomWidth: co, borderRightWidth: co, borderBottomColor: album.goc }]} />
      <View style={[g, { bottom: -2, right: -2, borderBottomWidth: co, borderLeftWidth: co, borderBottomColor: album.goc }]} />
    </>
  );
}

/** Nét bút chì đếm tay: mỗi nét lệch một chút về cao và nghiêng, để không thành cột sóng. */
export const NET = [
  { height: 13, transform: [{ rotate: '-4deg' }] },
  { height: 15, transform: [{ rotate: '3deg' }] },
  { height: 12, transform: [{ rotate: '-2deg' }] },
  { height: 14, transform: [{ rotate: '5deg' }] },
  { height: 13, transform: [{ rotate: '-3deg' }] },
];

/** Cường độ 1–5 là đúng n nét bút chì, không phải cột biểu đồ — không vẽ ô trống. */
export function Vach({ n }: { n: number }) {
  return (
    <View style={s.vach}>
      {NET.slice(0, n).map((net, i) => (
        <View key={i} style={[s.net, net]} />
      ))}
    </View>
  );
}

/**
 * Thời lượng ước lượng (phút), bỏ qua được (null). Người dùng chọn một khoảng chứ không đo, nên
 * tấm Entry hiện lại đúng nhãn đã chọn (`t.thoiLuong`) — không khẳng định "60 phút" khi họ chỉ nói
 * "lâu hơn".
 */
export const THOI_LUONG = [null, 5, 15, 30, 60];

let dinhDang:
  | { locale: string; gio: Intl.DateTimeFormat; namNay: Intl.DateTimeFormat; namKhac: Intl.DateTimeFormat }
  | undefined;

/** Formatter theo ngôn ngữ đang dùng; tạo lại khi đổi ngôn ngữ, không tạo mỗi lần gọi. */
function dd() {
  if (dinhDang?.locale !== t.locale) {
    const ngay = { weekday: 'long', day: 'numeric', month: 'long' } as const;
    dinhDang = {
      locale: t.locale,
      gio: new Intl.DateTimeFormat(t.locale, { hour: '2-digit', minute: '2-digit', hour12: false }),
      namNay: new Intl.DateTimeFormat(t.locale, ngay),
      namKhac: new Intl.DateTimeFormat(t.locale, { ...ngay, year: 'numeric' }),
    };
  }
  return dinhDang;
}

export const nhanGio = (ms: number) => dd().gio.format(ms);

/** "Thứ Bảy, 26 tháng 9"; khác năm nay thì thêm năm, để hai đêm ở hai năm không trùng tên. */
export const nhanNgay = (ms: number) =>
  (new Date(ms).getFullYear() === new Date().getFullYear() ? dd().namNay : dd().namKhac).format(ms);

/** Trạng thái Comfort của một tấm: chưa xin thì không có gì kẹp vào. */
export type TrangThai = 'kep' | 'camOn' | undefined;

/**
 * Tấm Entry. Có `onPress` (Timeline) thì bấm được, cắt ở 6 dòng và chỉ dán ảnh đầu; không có
 * (màn xem một Entry) thì là tấm để đọc, hiện đủ Reflection và mọi ảnh.
 */
export function TamEntry({
  e,
  dk = [],
  tt,
  onPress,
}: {
  e: Entry;
  dk?: Attachment[];
  tt?: TrangThai;
  onPress?: () => void;
}) {
  const nhanTag = nhanTags(e.tags);
  const anh = dk.filter((d) => d.kind === 'image').map((d) => d.uri);
  // Không có Reflection thì Tag đã là thân tấm — chú thích không lặp lại.
  const phan = [
    nhanGio(e.occurredAt),
    e.durationMin !== null && t.thoiLuong(e.durationMin).toLowerCase(),
    e.reflection && nhanTag,
    anh.length > 0 && t.tam.anh(anh.length),
    dk.some((d) => d.kind === 'audio') && t.tam.ghiAm,
  ].filter(Boolean);
  const nhanComfort = tt === 'kep' ? t.tam.kep : tt === 'camOn' ? t.chung.daCamOn : null;
  return (
    <View style={[s.oTam, nhanComfort ? s.duoiKep : null]}>
      <Pressable
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : 'text'}
        // Mẩu kẹp là ẩn dụ cho người nhìn; screen reader nghe thẳng nghĩa của nó.
        accessibilityLabel={[
          e.reflection || nhanTag,
          ...phan,
          t.chung.cuongDo(e.intensity),
          tt === 'kep' ? t.tam.coLoi : tt === 'camOn' ? t.tam.coLoiCamOn : null,
        ]
          .filter(Boolean)
          .join(', ')}
        style={({ pressed }) => [s.tam, pressed && onPress && s.nhac]}
      >
        <GocDan />
        {(onPress ? anh.slice(0, 1) : anh).map((uri) => (
          <AnhTrenTam key={uri} uri={uri} du={!onPress} />
        ))}
        <Text style={s.than} numberOfLines={onPress ? 6 : undefined}>
          {e.reflection || nhanTag}
        </Text>
        {/* Chú thích nằm trong tấm: để ngoài thì giờ và nét cường độ lơ lửng giữa hai tấm, không rõ
            của tấm trên hay tấm dưới. Đã đọc trong nhãn của tấm — ẩn khỏi screen reader để không đọc lặp. */}
        <View
          style={s.dongChuThich}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Text style={[butChi.chuThich, s.chuThich]}>{phan.join(' · ')}</Text>
          <Vach n={e.intensity} />
        </View>
        {nhanComfort && (
          <View style={s.kep}>
            <Text style={[butChi.chuThich, s.chuKep]}>{nhanComfort}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

/**
 * Ảnh dán trên tấm. Timeline cắt 4:3 cho nhịp đều; tấm để đọc (`du`) giữ đúng tỉ lệ ảnh.
 * `resize` để Android giải mã ảnh ở cỡ hiển thị, không phải ảnh gốc 12MP.
 */
function AnhTrenTam({ uri, du }: { uri: string; du: boolean }) {
  const [tiLe, setTiLe] = useState(4 / 3);
  return (
    <Image
      source={{ uri }}
      resizeMethod="resize"
      onLoad={du ? (ev) => setTiLe(ev.nativeEvent.source.width / ev.nativeEvent.source.height) : undefined}
      style={[s.anh, { aspectRatio: tiLe }]}
    />
  );
}

/** Giây → "4:05". */
export const phutGiay = (giay: number) =>
  `${Math.floor(giay / 60)}:${String(Math.floor(giay % 60)).padStart(2, '0')}`;

/** Nghe lại một đoạn ghi âm: một dải giấy, bấm để nghe / dừng. */
export function NgheLai({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const st = useAudioPlayerStatus(player);

  async function bam() {
    if (st.playing) return player.pause();
    // Nghe hết thì máy phát đứng ở cuối — tua về đầu mới phát lại được.
    if (st.duration > 0 && st.currentTime >= st.duration - 0.1) await player.seekTo(0);
    player.play();
  }

  const nhan = st.playing ? t.tam.dung : t.tam.nghe;
  return (
    <Pressable
      onPress={bam}
      accessibilityRole="button"
      accessibilityLabel={t.tam.ngheA11y(nhan, Math.round(st.duration))}
      style={({ pressed }) => [s.nghe, pressed && s.nhac]}
    >
      <MaterialCommunityIcons name={st.playing ? 'pause' : 'play'} size={24} color={album.chu} />
      <Text style={s.chuNghe}>{nhan}</Text>
      <Text style={[butChi.chuThich, s.giayNghe]} importantForAccessibility="no">
        {st.playing ? `${phutGiay(st.currentTime)} / ` : ''}
        {phutGiay(st.duration)}
      </Text>
    </Pressable>
  );
}

/** Dòng lối: không nền, không viền; nhấn thì mờ đi. */
export function DongLoi({ nhan, phu, onPress }: { nhan: string; phu?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={nhan}
      accessibilityHint={phu}
      style={({ pressed }) => [s.loi, pressed && s.mo]}
    >
      <Text style={s.chuLoi}>{nhan}</Text>
      {phu ? <Text style={s.phuLoi}>{phu}</Text> : null}
    </Pressable>
  );
}

/** Nút chính là một tấm dán: góc dán, bóng thấp; nhấn thì nhấc khỏi trang. */
export function NutChinh({
  nhan,
  onPress,
  tat,
  dangChay,
}: {
  nhan: string;
  onPress: () => void;
  tat?: boolean;
  dangChay?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={tat || dangChay}
      accessibilityRole="button"
      accessibilityLabel={nhan}
      accessibilityState={{ disabled: !!tat, busy: !!dangChay }}
      style={({ pressed }) => [s.nutChinh, pressed && s.nhac, tat && s.nhat]}
    >
      <GocDan co={10} />
      {dangChay ? (
        <ActivityIndicator color={album.chu} />
      ) : (
        <Text style={s.chuNutChinh}>{nhan}</Text>
      )}
    </Pressable>
  );
}

/**
 * Chân màn cố định ngoài vùng cuộn, luôn kết thúc bằng lối trợ giúp — ADR 0005: lối này hiển thị
 * thường trực, ở mọi màn, cùng một chỗ. Màn hotline thì không cần chân màn này.
 */
export function ChanMan({ children }: { children?: ReactNode }) {
  return (
    <View style={s.chanMan}>
      {children}
      <NutDen
        nhan={t.chung.canTroGiup}
        accessibilityHint={t.chung.troGiupGoiY}
        onPress={() => router.push('/help')}
      />
    </View>
  );
}

/** Lối trợ giúp — chỗ duy nhất có màu `den`: viền khi nghỉ, tô kín khi nhấn. */
export function NutDen({
  nhan,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: {
  nhan: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [s.nutDen, pressed && s.denSang]}
    >
      {({ pressed }) => <Text style={[s.chuDen, pressed && s.chuTrenDen]}>{nhan}</Text>}
    </Pressable>
  );
}

/**
 * Lựa chọn bấm được: Tag (chọn nhiều), thời điểm, thời lượng (chọn một — `mot`).
 * Chọn thì tô chữ ngà, chữ đổi sang màu trang.
 */
export function Pill({
  nhan,
  chon,
  tat,
  mot,
  onPress,
}: {
  nhan: string;
  chon: boolean;
  tat?: boolean;
  mot?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={tat}
      accessibilityRole={mot ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: chon, disabled: !!tat }}
      style={[s.pill, chon && s.pillChon, tat && s.nhat]}
    >
      <Text style={[s.chuPill, chon && s.chuPillChon]}>{nhan}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  oTam: { marginBottom: space.lg },
  tam: {
    ...bong,
    backgroundColor: album.tam,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    minHeight: touch.toiThieu,
  },
  // Chạm là nhấc tấm khỏi trang: nâng lên một chút, bóng đậm và xa hơn.
  nhac: {
    transform: [{ translateY: -3 }],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  than: { ...text.than, color: album.chu },
  // Hạ sáng một chút: ảnh chụp sáng rực giữa trang đen lúc 2 giờ sáng là chói.
  anh: { width: '100%', marginBottom: space.md, opacity: 0.85, backgroundColor: album.trang },
  // Mẩu giấy người lạ kẹp vào: chờm qua góc dán dưới phải, hơi nghiêng, bóng riêng.
  kep: {
    ...bong,
    position: 'absolute',
    right: -8,
    bottom: -18,
    backgroundColor: album.kep,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    transform: [{ rotate: '-2deg' }],
    elevation: 6,
  },
  chuKep: { color: album.chu },
  dongChuThich: {
    // Không wrap: chú thích tự xuống dòng bên trong, vạch luôn nằm cuối dòng đầu, không tách ra.
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    marginTop: space.md,
  },
  // Mẩu kẹp chờm 18 xuống dưới tấm — chừa chỗ để nó không chạm tấm kế tiếp.
  duoiKep: { marginBottom: space.xl },
  chuThich: { color: album.butChi, flex: 1 },
  vach: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 26, paddingBottom: 5 },
  net: { width: 2, backgroundColor: album.butChi, borderRadius: 1 },

  loi: { minHeight: touch.toiThieu, paddingVertical: space.md, justifyContent: 'center', marginTop: space.md },
  mo: { opacity: 0.6 },
  chuLoi: { ...text.nut, color: album.chu },
  phuLoi: { ...text.phu, color: album.butChi, marginTop: space.xs, maxWidth: 320 },

  nutChinh: {
    ...bong,
    minHeight: touch.chinh,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    backgroundColor: album.tam,
  },
  nhat: { opacity: 0.35 },
  chuNutChinh: { ...text.nut, color: album.chu, textAlign: 'center' },

  // Dải giấy trơn, không góc dán — để khỏi lẫn với nút chính ngay bên dưới ở màn ghi.
  nghe: {
    ...bong,
    minHeight: touch.chinh,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: album.tam,
  },
  chuNghe: { ...text.nut, color: album.chu, flex: 1 },
  giayNghe: { color: album.butChi },

  chanMan: {
    paddingHorizontal: space.man,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: space.sm,
    backgroundColor: album.trang,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: album.vienMo,
  },
  nutDen: {
    minHeight: touch.hotline,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    borderWidth: 1.5,
    borderColor: album.den,
  },
  denSang: { backgroundColor: album.den },
  chuDen: { ...text.nut, color: album.den, textAlign: 'center' },
  chuTrenDen: { color: album.trang },

  pill: {
    minHeight: touch.toiThieu,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    backgroundColor: album.tam,
  },
  pillChon: { backgroundColor: album.chu },
  chuPill: { ...text.nut, color: album.butChi },
  chuPillChon: { color: album.trang },
});
