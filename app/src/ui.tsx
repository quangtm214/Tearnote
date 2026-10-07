import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router } from 'expo-router';
import { useState, type ReactNode, type Ref } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, Path } from 'react-native-svg';

import type { Attachment, Entry } from './db';
import { nhanTags, t } from './i18n';
import { album, bo, butChi, space, text, touch } from './theme';

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

/** Giọt nước mắt vẽ tay (hơi lệch hai bên), khung 20×28: chóp y=1.5, đáy y=26. */
const GIOT = 'M10 1.5C8.6 5 2.2 11.4 2.2 17.8C2.2 22.3 5.7 26 10 26C14.4 26 17.9 22.3 17.8 17.7C17.7 11.6 11.5 5.1 10 1.5Z';

/**
 * Cường độ 1–5 là một giọt nước mắt đầy dần: 1 là đáy giọt, 5 là đầy. Mặt nước gợn nhẹ để đọc
 * thành nước chứ không thành thanh đo. Viền và phần đầy cùng màu bút chì.
 */
export function Giot({ n }: { n: number }) {
  const y = 26 - (24.5 * n) / 5;
  return (
    <Svg width={20} height={28} viewBox="0 0 20 28">
      <Defs>
        {/* id chỉ cần duy nhất trong một <Svg>: trên native mỗi <Svg> giữ defs riêng. */}
        <ClipPath id="giot">
          <Path d={GIOT} />
        </ClipPath>
      </Defs>
      <Path d={`M0 ${y}Q5 ${y - 1.5} 10 ${y}T20 ${y}V28H0Z`} fill={album.butChi} clipPath="url(#giot)" />
      <Path d={GIOT} fill="none" stroke={album.butChi} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
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
  // Không có Reflection thì Tag đã là thân tấm — chú thích không lặp lại. Chú thích viết thường hết.
  const phan = [
    nhanGio(e.occurredAt),
    e.durationMin !== null && t.thoiLuong(e.durationMin).toLowerCase(),
    e.reflection && nhanTag.toLowerCase(),
    anh.length > 0 && t.tam.anh(anh.length),
    dk.some((d) => d.kind === 'audio') && t.tam.ghiAm,
  ].filter(Boolean);
  const nhanComfort = tt === 'kep' ? t.tam.kep : tt === 'camOn' ? t.chung.daCamOn : null;
  // Mẩu kẹp là ẩn dụ cho người nhìn; screen reader nghe thẳng nghĩa của nó.
  const nhanDoc = [
    e.reflection || nhanTag,
    ...phan,
    t.chung.cuongDo(e.intensity),
    tt === 'kep' ? t.tam.coLoi : tt === 'camOn' ? t.tam.coLoiCamOn : null,
  ]
    .filter(Boolean)
    .join(', ');
  const noiDung = (
    <>
      <GocDan />
      {(onPress ? anh.slice(0, 1) : anh).map((uri) => (
        <AnhTrenTam key={uri} uri={uri} du={!onPress} />
      ))}
      <Text style={s.than} numberOfLines={onPress ? 6 : undefined}>
        {e.reflection || nhanTag}
      </Text>
      {/* Chú thích nằm trong tấm: để ngoài thì giờ và giọt cường độ lơ lửng giữa hai tấm, không rõ
          của tấm trên hay tấm dưới. Đã đọc trong nhãn của tấm — ẩn khỏi screen reader để không đọc lặp. */}
      <View
        style={s.dongChuThich}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Text style={[butChi.chuThich, s.chuThich]}>{phan.join(' · ')}</Text>
        <Giot n={e.intensity} />
      </View>
      {nhanComfort && (
        <View style={s.kep}>
          <Text style={[butChi.chuThich, s.chuKep]}>{nhanComfort}</Text>
        </View>
      )}
    </>
  );
  return (
    <View style={[s.oTam, nhanComfort ? s.duoiKep : null]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={nhanDoc}
          style={({ pressed }) => [s.tam, pressed && s.nhac]}
        >
          {noiDung}
        </Pressable>
      ) : (
        // Tấm để đọc: Pressable không có onPress vẫn bị TalkBack mời "nhấn đúp để kích hoạt".
        <View accessible accessibilityRole="text" accessibilityLabel={nhanDoc} style={s.tam}>
          {noiDung}
        </View>
      )}
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

/** Nghe lại một đoạn ghi âm: dải giấy bo mềm với đĩa play tròn, bấm để nghe / tạm dừng. */
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
      style={({ pressed }) => [s.nghe, pressed && s.nutNhan]}
    >
      <View style={s.dia}>
        <MaterialCommunityIcons name={st.playing ? 'pause' : 'play'} size={22} color={album.trang} />
      </View>
      <Text style={s.chuNghe}>{nhan}</Text>
      <Text style={[butChi.chuThich, s.giayNghe]} importantForAccessibility="no">
        {st.playing ? `${phutGiay(st.currentTime)} / ` : ''}
        {phutGiay(st.duration)}
      </Text>
    </Pressable>
  );
}

export type TenIcon = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Dòng lối: không nền, không viền, cả hàng là vùng bấm; nhấn thì mờ đi. `icon` đứng trước khi lối làm một
 * việc ngay (Quay lại, Đăng xuất…); `mui` là chevron cuối hàng khi lối dẫn sang màn khác.
 */
export function DongLoi({
  nhan,
  phu,
  icon,
  mui,
  onPress,
}: {
  nhan: string;
  phu?: string;
  icon?: TenIcon;
  mui?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={nhan}
      accessibilityHint={phu}
      style={({ pressed }) => [s.loi, pressed && s.mo]}
    >
      <View style={s.hangLoi}>
        {icon ? <MaterialCommunityIcons name={icon} size={24} color={album.chu} /> : null}
        <View style={s.khoiLoi}>
          <Text style={s.chuLoi}>{nhan}</Text>
          {phu ? <Text style={s.phuLoi}>{phu}</Text> : null}
        </View>
        {mui ? <MaterialCommunityIcons name="chevron-right" size={24} color={album.butChi} /> : null}
      </View>
    </Pressable>
  );
}

/**
 * Nút phụ: hành động tại chỗ (Chụp ảnh, Ghi âm, Cảm ơn, Thu hồi…). Mảnh tonal bo mềm — thấy được là bấm được
 * mà không tranh với nút chính. Hết lượt thì mờ và tắt, không ẩn, để vị trí không nhảy.
 */
export function NutPhu({
  nhan,
  onPress,
  icon,
  tat,
  accessibilityLabel,
  accessibilityHint,
}: {
  nhan: string;
  onPress: () => void;
  icon?: TenIcon;
  tat?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={tat}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? nhan}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!tat }}
      style={({ pressed }) => [s.nutPhu, pressed && s.mo, tat && s.nhat]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={20} color={album.butChi} /> : null}
      <Text style={s.chuNutPhu}>{nhan}</Text>
    </Pressable>
  );
}

/**
 * Nút chính: mảnh `tam` bo mềm, không góc dán (góc dán chỉ dành cho thứ được dán). Nhấn thì sáng lên một bậc.
 * `nhanDangChay`: khi chờ lâu (xin lời) thì nói đang làm gì, đừng để một tấm trống với vòng quay.
 */
export function NutChinh({
  nhan,
  onPress,
  tat,
  dangChay,
  nhanDangChay,
}: {
  nhan: string;
  onPress: () => void;
  tat?: boolean;
  dangChay?: boolean;
  nhanDangChay?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={tat || dangChay}
      accessibilityRole="button"
      accessibilityLabel={dangChay && nhanDangChay ? nhanDangChay : nhan}
      accessibilityState={{ disabled: !!tat, busy: !!dangChay }}
      style={({ pressed }) => [s.nutChinh, pressed && s.nutNhan, tat && s.nhat]}
    >
      {dangChay ? (
        <View style={s.hangCho}>
          <ActivityIndicator color={album.chu} />
          {nhanDangChay ? (
            <Text style={s.chuNutChinh} maxFontSizeMultiplier={1.6}>
              {nhanDangChay}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={s.chuNutChinh} maxFontSizeMultiplier={1.6}>
          {nhan}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * Chân màn cố định ngoài vùng cuộn, luôn kết thúc bằng lối trợ giúp — ADR 0005: lối này hiển thị
 * thường trực, ở mọi màn, cùng một chỗ. Màn hotline thì không cần chân màn này. Nút chính của màn
 * (Lưu lại, Gửi, Đăng nhập…) cũng nằm ở đây, ngay trên lối trợ giúp.
 */
export function ChanMan({ children }: { children?: ReactNode }) {
  return (
    <View style={s.chanMan}>
      {children}
      <NutDen
        nhan={t.chung.canTroGiup}
        icon="lifebuoy"
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
  icon,
  accessibilityLabel,
  accessibilityHint,
}: {
  nhan: string;
  onPress: () => void;
  icon?: TenIcon;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      // Nhãn đặt sẵn để screen reader không đọc ký tự của icon.
      accessibilityLabel={accessibilityLabel ?? nhan}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [s.nutDen, pressed && s.denSang]}
    >
      {({ pressed }) => (
        <>
          {icon ? (
            <MaterialCommunityIcons name={icon} size={24} color={pressed ? album.trang : album.den} />
          ) : null}
          <Text style={[s.chuDen, pressed && s.chuTrenDen]} maxFontSizeMultiplier={1.6}>
            {nhan}
          </Text>
        </>
      )}
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
      style={({ pressed }) => [
        s.pill,
        chon && s.pillChon,
        pressed && (chon ? s.chonNhan : s.nutNhan),
        tat && s.nhat,
      ]}
    >
      <Text style={[s.chuPill, chon && s.chuPillChon]}>{nhan}</Text>
    </Pressable>
  );
}

/**
 * Ô nhập: bo mềm, viền 2px luôn có — trong suốt khi nghỉ, bút chì khi đang gõ (focus thấy được mà
 * không xê dịch chữ). `ref` là prop thường ở React 19.
 */
export function ONhap({
  ref,
  style,
  onFocus,
  onBlur,
  ...p
}: TextInputProps & { ref?: Ref<TextInput> }) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={album.butChi}
      selectionColor={album.butChi}
      keyboardAppearance="dark"
      {...p}
      onFocus={(e) => {
        setFocus(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        onBlur?.(e);
      }}
      style={[s.oNhap, focus && s.oNhapFocus, style]}
    />
  );
}

/** Một câu hỏi xác nhận: `bo` chạy khi người dùng chọn hành động (nút trên); nút dưới là nút an toàn. */
export type YeuCauHoi = { cauHoi: string; phu?: string; nhanBo: string; nhanGiu?: string; bo: () => void };

/**
 * Hộp thoại xác nhận thay `Alert` hệ thống (Alert Android trắng giữa app tối lúc 2 giờ sáng). Tờ giấy neo
 * đáy; nút an toàn ở dưới cùng, đúng chỗ ngón cái; muốn bỏ thì phải với lên. Chạm nền / Back = giữ lại.
 */
export function HopThoai({ hoi, onDong }: { hoi: YeuCauHoi | null; onDong: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={!!hoi}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onDong}
    >
      <View style={[s.nenHop, { paddingBottom: space.md + insets.bottom }]}>
        {/* Nền đứng riêng, không bọc tờ giấy: bọc thì screen reader gộp cả tờ, không chạm được từng nút. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onDong} accessible={false} />
        {hoi ? (
          <View style={s.hop} accessibilityViewIsModal>
            <ScrollView style={s.cuonHop}>
              <Text style={[butChi.ngay, s.cauHoi]} accessibilityRole="header">
                {hoi.cauHoi}
              </Text>
              {hoi.phu ? <Text style={s.phuHop}>{hoi.phu}</Text> : null}
            </ScrollView>
            <Pressable
              onPress={() => {
                const lam = hoi.bo;
                onDong();
                lam();
              }}
              accessibilityRole="button"
              style={({ pressed }) => [s.nutHop, s.nutBo, pressed && s.mo]}
            >
              <Text style={s.chuNutBo} maxFontSizeMultiplier={1.6}>
                {hoi.nhanBo}
              </Text>
            </Pressable>
            <Pressable
              onPress={onDong}
              accessibilityRole="button"
              style={({ pressed }) => [s.nutHop, s.nutGiu, pressed && s.chonNhan]}
            >
              <Text style={s.chuNutGiu} maxFontSizeMultiplier={1.6}>
                {hoi.nhanGiu ?? t.chung.giuLai}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/** Lời từ người lạ (đã nhận, hoặc mình đã viết): mẩu giấy rời bo nhẹ, có một chiếc kẹp giữ vào trang. */
export function TamLoi({ children }: { children: ReactNode }) {
  return (
    <View style={s.tamLoi}>
      <MaterialCommunityIcons
        name="paperclip"
        size={32}
        color={album.butChi}
        style={s.kepGiay}
        importantForAccessibility="no"
        accessibilityElementsHidden
      />
      {children}
    </View>
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
  // Chạm là nhấc tấm khỏi trang: sáng lên một bậc, nâng lên một chút, bóng đậm và xa hơn.
  nhac: {
    backgroundColor: album.tamNhac,
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
    borderRadius: bo.giay,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    transform: [{ rotate: '-2deg' }],
    elevation: 6,
  },
  chuKep: { color: album.chu },
  dongChuThich: {
    // Không wrap: chú thích tự xuống dòng bên trong, giọt luôn nằm cuối dòng đầu, không tách ra.
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    marginTop: space.md,
  },
  // Mẩu kẹp chờm 18 xuống dưới tấm — chừa chỗ để nó không chạm tấm kế tiếp.
  duoiKep: { marginBottom: space.xl },
  chuThich: { color: album.butChi, flex: 1 },

  loi: { minHeight: touch.toiThieu, paddingVertical: space.md, justifyContent: 'center', marginTop: space.md },
  hangLoi: { flexDirection: 'row', alignItems: 'center', gap: space.sm + space.xs },
  khoiLoi: { flex: 1 },
  mo: { opacity: 0.6 },
  chuLoi: { ...text.nut, color: album.chu },
  phuLoi: { ...text.phu, color: album.butChi, marginTop: space.xs, maxWidth: 320 },

  nutPhu: {
    minHeight: touch.toiThieu,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: bo.tay,
    backgroundColor: album.vienMo,
  },
  chuNutPhu: { ...text.nut, color: album.chu },

  nutChinh: {
    minHeight: touch.chinh,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    borderRadius: bo.tay,
    backgroundColor: album.tam,
  },
  // Nhấn là sáng lên một bậc: bóng trên trang đen gần như không thấy, độ sáng thì thấy.
  nutNhan: { backgroundColor: album.kep },
  chonNhan: { opacity: 0.85 },
  nhat: { opacity: 0.35 },
  hangCho: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  chuNutChinh: { ...text.nut, color: album.chu, textAlign: 'center' },

  // Dải giấy trơn, không góc dán: nó là thứ để bấm, không phải thứ được dán.
  nghe: {
    ...bong,
    minHeight: touch.chinh,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingLeft: 10,
    paddingRight: space.lg,
    borderRadius: bo.tay,
    backgroundColor: album.tam,
  },
  dia: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: album.chu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chuNghe: { ...text.nut, color: album.chu, flex: 1 },
  giayNghe: { color: album.butChi },

  chanMan: {
    paddingHorizontal: space.man,
    paddingTop: space.sm + space.xs,
    paddingBottom: space.sm + space.xs,
    gap: space.sm,
    backgroundColor: album.trang,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: album.vienMo,
  },
  nutDen: {
    minHeight: touch.hotline,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    borderWidth: 1.5,
    borderColor: album.den,
    borderRadius: bo.tay,
  },
  denSang: { backgroundColor: album.den },
  chuDen: { ...text.nut, color: album.den, textAlign: 'center', flexShrink: 1 },
  chuTrenDen: { color: album.trang },

  pill: {
    minHeight: touch.toiThieu,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: bo.tay,
    backgroundColor: album.tam,
  },
  pillChon: { backgroundColor: album.chu },
  chuPill: { ...text.nut, color: album.butChi },
  chuPillChon: { color: album.trang },

  oNhap: {
    ...text.than,
    color: album.chu,
    backgroundColor: album.tam,
    borderRadius: bo.tay,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: space.md - 2,
    minHeight: touch.toiThieu,
  },
  oNhapFocus: { borderColor: album.butChi },

  nenHop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: album.che,
    paddingHorizontal: space.md,
  },
  hop: {
    ...bong,
    elevation: 6,
    backgroundColor: album.kep,
    borderRadius: bo.giay,
    padding: space.lg,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    maxHeight: '90%',
  },
  cuonHop: { flexGrow: 0 },
  cauHoi: { color: album.chu },
  phuHop: { ...text.than, color: album.butChi, marginTop: space.sm },
  nutHop: {
    minHeight: touch.chinh,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    borderRadius: bo.tay,
  },
  nutBo: { marginTop: space.lg, backgroundColor: album.vienMo },
  nutGiu: { marginTop: space.sm, backgroundColor: album.chu },
  chuNutBo: { ...text.nut, color: album.chu, textAlign: 'center' },
  chuNutGiu: { ...text.nut, color: album.trang, textAlign: 'center' },

  tamLoi: {
    ...bong,
    elevation: 6,
    backgroundColor: album.kep,
    borderRadius: bo.giay,
    padding: space.lg,
    marginBottom: space.lg,
    gap: space.sm,
  },
  kepGiay: { position: 'absolute', top: -16, left: space.man, transform: [{ rotate: '8deg' }] },
});
