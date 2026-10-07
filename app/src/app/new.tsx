import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { insertEntry } from '@/db';
import { nhanTag, t } from '@/i18n';
import { MAX_ENTRY_TAGS, TAG_IDS, type TagId } from '@/tags';
import { album, butChi, space, text, touch } from '@/theme';
import {
  bong,
  ChanMan,
  DongLoi,
  Giot,
  GocDan,
  HopThoai,
  NgheLai,
  nhanGio,
  nhanNgay,
  NutChinh,
  NutPhu,
  ONhap,
  phutGiay,
  Pill,
  THOI_LUONG,
  type YeuCauHoi,
} from '@/ui';

/** Lùi thời điểm (phút) — thay cho date picker, không thêm dependency. */
const LUI = [0, 60, 180, 60 * 24];

const CUONG_DO = [1, 2, 3, 4, 5];
const kep = (n: number) => Math.min(5, Math.max(1, n));

/** Giới hạn đính kèm mỗi lần khóc — chỉ app ép, DB không có CHECK (docs/db.md). */
const TOI_DA_ANH = 3;
const GHI_AM_TOI_DA_GIAY = 5 * 60;

export default function GhiEntry() {
  const [luiPhut, setLuiPhut] = useState(0);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [tags, setTags] = useState<TagId[]>([]);
  const [reflection, setReflection] = useState('');
  // uri tạm trong cache — Lưu mới chép vào máy, bỏ ngang thì không để lại gì.
  const [anh, setAnh] = useState<string[]>([]);
  const [ghiAm, setGhiAm] = useState<string | null>(null);
  const [dangGhi, setDangGhi] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [hoi, setHoi] = useState<YeuCauHoi | null>(null);

  const bao = (msg: string) => {
    setLoi(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  // Dừng tay hay tự dừng ở 5 phút đều về đây.
  const mayGhi = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (st) => {
    if (!st.isFinished) return;
    setDangGhi(false);
    void setAudioModeAsync({ allowsRecording: false });
    if (st.url && !st.hasError) setGhiAm(st.url);
    else bao(t.ghi.ghiNgat);
  });
  const trangThaiGhi = useAudioRecorderState(mayGhi);

  // Chặn bấm Lưu hai lần liên tiếp trước khi kịp rời màn — mỗi lần bấm là một Entry.
  const daLuu = useRef(false);

  // Slider: bề rộng thanh, và mép trái của nó trên màn — đo lúc chạm, rồi quy pageX ra vị trí trên thanh
  // (locationX lúc kéo có thể tính theo view đang nằm dưới ngón tay, không phải thanh).
  const rong = useRef(0);
  const trai = useRef(0);
  const chonTheoX = (x: number) => rong.current > 0 && setIntensity(kep(Math.floor((x / rong.current) * 5) + 1));

  const daDay = tags.length >= MAX_ENTRY_TAGS;
  // Cùng cách viết thời điểm với Timeline: "Thứ Bảy, 26 tháng 9 · 00:05".
  const luc = Date.now() - luiPhut * 60_000;

  const doiTag = (tag: TagId) =>
    setTags((cu) => (cu.includes(tag) ? cu.filter((x) => x !== tag) : [...cu, tag]));

  const hoiBo = (cauHoi: string, bo: () => void) => setHoi({ cauHoi, nhanBo: t.ghi.bo, bo });

  // Rời màn (Thôi, Back hệ thống) khi còn chữ, ảnh hay ghi âm chưa lưu thì hỏi lại: ảnh chụp trong app và
  // đoạn ghi âm không lấy lại được. Cường độ, Tag, thời điểm chọn lại mất vài giây nên không tính.
  const navigation = useNavigation();
  const dirty = reflection.trim() !== '' || anh.length > 0 || ghiAm !== null || dangGhi;
  usePreventRemove(dirty, ({ data }) => {
    if (daLuu.current) return navigation.dispatch(data.action); // Lưu xong thì đi thẳng
    setHoi({
      cauHoi: t.ghi.thoatHoi,
      phu: t.ghi.thoatPhu,
      nhanBo: t.chung.thoat,
      nhanGiu: t.ghi.ghiTiep,
      bo: async () => {
        if (dangGhi) await mayGhi.stop().catch(() => {}); // nhả micro trước khi rời
        navigation.dispatch(data.action);
      },
    });
  });

  // Camera ghi thẳng vào cache của app nên ảnh thường không vào thư viện máy — riêng tư hơn
  // chụp bằng app camera rồi chọn lại.
  async function layAnh(camera: boolean) {
    setLoi(null);
    const conLai = TOI_DA_ANH - anh.length;
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
        return bao(t.ghi.chuaCoCamera);
      }
      const kq = camera
        ? await ImagePicker.launchCameraAsync()
        : await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: conLai > 1,
            selectionLimit: conLai,
          });
      if (!kq.canceled) setAnh((cu) => [...cu, ...kq.assets.map((a) => a.uri)].slice(0, TOI_DA_ANH));
    } catch {
      bao(camera ? t.ghi.loiCamera : t.ghi.loiThuVien);
    }
  }

  async function batDauGhi() {
    setLoi(null);
    // Ẩn nút Ghi âm ngay: bấm hai lần thì lần sau chuẩn bị máy ghi lần nữa và ném lỗi.
    setDangGhi(true);
    try {
      if (!(await requestRecordingPermissionsAsync()).granted) {
        setDangGhi(false);
        return bao(t.ghi.chuaCoMic);
      }
      // iOS không cho ghi nếu phiên âm thanh chưa bật ghi; Android bỏ qua cờ này.
      await setAudioModeAsync({ allowsRecording: true });
      await mayGhi.prepareToRecordAsync();
      mayGhi.record({ forDuration: GHI_AM_TOI_DA_GIAY });
      AccessibilityInfo.announceForAccessibility(t.ghi.dangGhiAm);
    } catch {
      setDangGhi(false);
      bao(t.ghi.loiGhiAm);
    }
  }

  const luu = async () => {
    if (daLuu.current) return;
    daLuu.current = true;
    try {
      // Bấm Lưu khi còn đang ghi: dừng rồi lưu luôn đoạn đó, đừng bắt người ta bấm Dừng trước.
      let am = ghiAm;
      if (dangGhi) {
        await mayGhi.stop();
        am = mayGhi.uri;
      }
      insertEntry(
        {
          occurredAt: Date.now() - luiPhut * 60_000,
          durationMin,
          intensity,
          tags,
          reflection: reflection.trim() === '' ? null : reflection.trim(),
        },
        [
          ...anh.map((uri) => ({ kind: 'image' as const, uri })),
          ...(am ? [{ kind: 'audio' as const, uri: am }] : []),
        ],
      );
      AccessibilityInfo.announceForAccessibility(t.ghi.daLuu);
      router.back();
    } catch {
      daLuu.current = false;
      bao(t.ghi.loiLuu);
    }
  };

  return (
    <SafeAreaView style={styles.man} edges={['top', 'bottom']}>
      {/* Android edge-to-edge không tự co cửa sổ khi bàn phím mở: thiếu cái này là bàn phím che ô nhập. */}
      <KeyboardAvoidingView style={styles.man} behavior="padding">
        <ScrollView contentContainerStyle={styles.cuon} keyboardShouldPersistTaps="handled">
          {/* Nửa trên: chỉ để đọc. Mọi vùng bấm nằm nửa dưới, tầm ngón cái. */}
          <View style={styles.nuaTren}>
            <Text style={[butChi.tieuDe, styles.tieuDe]} accessibilityRole="header">
              {t.ghi.tieuDe}
            </Text>
            <Text style={styles.phu}>{t.ghi.moDau}</Text>
          </View>

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            {t.ghi.lucNao}
          </Text>
          <Text style={styles.phu}>
            {nhanNgay(luc)} · {nhanGio(luc)}
          </Text>
          <View style={styles.hang} accessibilityRole="radiogroup">
            {LUI.map((phut) => (
              <Pill
                key={phut}
                nhan={t.ghi.lui(phut)}
                mot
                chon={luiPhut === phut}
                onPress={() => setLuiPhut(phut)}
              />
            ))}
          </View>

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            {t.ghi.baoLau}
          </Text>
          <View style={styles.hang} accessibilityRole="radiogroup">
            {THOI_LUONG.map((phut) => (
              <Pill
                key={String(phut)}
                nhan={t.thoiLuong(phut)}
                mot
                chon={durationMin === phut}
                onPress={() => setDurationMin(phut)}
              />
            ))}
          </View>

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            {t.ghi.nangDenDau}
          </Text>
          <View style={styles.hang}>
            {/* Kéo hoặc chạm, bắt vào 5 nấc. Không nhả cho ScrollView giữa chừng, để kéo ngang không thành cuộn. */}
            <View
              style={styles.truot}
              // Chỉ thanh nhận chạm, để locationX luôn tính từ mép trái thanh.
              pointerEvents="box-only"
              onLayout={(e) => (rong.current = e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              onResponderGrant={(e) => {
                trai.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
                chonTheoX(e.nativeEvent.locationX);
              }}
              onResponderMove={(e) => chonTheoX(e.nativeEvent.pageX - trai.current)}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={t.ghi.cuongDo}
              accessibilityValue={{ min: 1, max: 5, now: intensity, text: t.ghi.cuongDoGiaTri(intensity) }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) =>
                setIntensity((n) => kep(n + (e.nativeEvent.actionName === 'increment' ? 1 : -1)))
              }
            >
              {/* Đoạn tới mức chọn đậm dần theo thang của bảng năm — cùng một nghĩa "nặng hơn"; đoạn trên mức chỉ mờ. */}
              <View style={styles.ray}>
                {CUONG_DO.map((n) => (
                  <View
                    key={n}
                    style={[styles.doan, { backgroundColor: n <= intensity ? album.lich[n] : album.vienMo }]}
                  />
                ))}
              </View>
              <View style={[styles.con, { left: `${(intensity - 0.5) * 20}%` }]} />
            </View>
            {/* Đúng hình sẽ nằm trên tấm: kéo tới đâu, giọt đầy tới đó. */}
            <View style={styles.giotXem} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Giot n={intensity} />
            </View>
            <Text style={[butChi.chuThich, styles.mucNac]} importantForAccessibility="no">
              {intensity} / 5
            </Text>
          </View>

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            {t.ghi.viChuyenGi}
          </Text>
          <Text style={styles.phu}>{t.ghi.toiDaTag(MAX_ENTRY_TAGS)}</Text>
          <View style={styles.hang}>
            {TAG_IDS.map((tag) => (
              <Pill
                key={tag}
                nhan={nhanTag(tag)}
                chon={tags.includes(tag)}
                tat={daDay && !tags.includes(tag)}
                onPress={() => doiTag(tag)}
              />
            ))}
          </View>

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            {t.ghi.ghiThem}
          </Text>
          <ONhap
            value={reflection}
            onChangeText={setReflection}
            accessibilityLabel={t.ghi.ghiThem}
            placeholder={t.ghi.ghiThemGoiY}
            multiline
            textAlignVertical="top"
            style={styles.oNhap}
          />

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            {t.ghi.kem}
          </Text>
          <Text style={styles.phu}>{t.ghi.kemGioiHan(TOI_DA_ANH, GHI_AM_TOI_DA_GIAY / 60)}</Text>
          {anh.length > 0 && (
            <View style={styles.hangAnh}>
              {anh.map((uri, i) => (
                <Pressable
                  key={uri}
                  onPress={() =>
                    hoiBo(t.ghi.boAnhHoi, () => setAnh((cu) => cu.filter((x) => x !== uri)))
                  }
                  accessibilityRole="button"
                  accessibilityLabel={t.ghi.anhSo(i + 1)}
                  accessibilityHint={t.ghi.boAnhGoiY}
                >
                  <Image source={{ uri }} resizeMethod="resize" style={styles.anhNho} />
                  {/* Sau ảnh để góc dán đè lên mép ảnh, như ảnh thật giữ trong album. */}
                  <GocDan co={10} />
                  {/* Dấu × chỉ để thấy "bấm là bỏ"; cả ảnh vẫn là một vùng bấm. */}
                  <View style={styles.dauX} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                    <MaterialCommunityIcons name="close" size={16} color={album.chu} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
          {dangGhi ? (
            <>
              <Text style={[butChi.chuThich, styles.giayGhi]}>
                {t.ghi.dangGhi(
                  phutGiay(trangThaiGhi.durationMillis / 1000),
                  phutGiay(GHI_AM_TOI_DA_GIAY),
                )}
              </Text>
              <View style={styles.hangNut}>
                <NutPhu
                  icon="stop-circle-outline"
                  nhan={t.ghi.dungGhi}
                  onPress={() => void mayGhi.stop().catch(() => bao(t.ghi.loiDung))}
                />
              </View>
            </>
          ) : ghiAm ? (
            <View style={styles.ghiAm}>
              <NgheLai uri={ghiAm} />
              <View style={styles.hangNut}>
                <NutPhu
                  icon="close"
                  nhan={t.ghi.boGhiAm}
                  onPress={() => hoiBo(t.ghi.boGhiAmHoi, () => setGhiAm(null))}
                />
              </View>
            </View>
          ) : null}
          {/* Luôn đủ ba nút, hết lượt thì mờ chứ không ẩn — vị trí không nhảy. Đang ghi thì không mở camera. */}
          <View style={styles.hangDinhKem}>
            <NutPhu
              icon="camera-outline"
              nhan={t.ghi.chupAnh}
              tat={anh.length >= TOI_DA_ANH || dangGhi}
              onPress={() => void layAnh(true)}
            />
            <NutPhu
              icon="image-outline"
              nhan={t.ghi.chonAnh}
              tat={anh.length >= TOI_DA_ANH || dangGhi}
              onPress={() => void layAnh(false)}
            />
            <NutPhu
              icon="microphone-outline"
              nhan={t.ghi.ghiAm}
              tat={dangGhi || ghiAm !== null}
              onPress={() => void batDauGhi()}
            />
          </View>
          {loi ? <Text style={styles.loi}>{loi}</Text> : null}

          <View style={styles.thoi}>
            <DongLoi icon="close" nhan={t.ghi.thoi} onPress={() => router.back()} />
          </View>
        </ScrollView>
        <ChanMan>
          <NutChinh nhan={t.ghi.luu} onPress={() => void luu()} />
        </ChanMan>
      </KeyboardAvoidingView>
      <HopThoai hoi={hoi} onDong={() => setHoi(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  cuon: { paddingHorizontal: space.man, paddingBottom: space.xl },
  nuaTren: { minHeight: 120, justifyContent: 'flex-end', paddingBottom: space.lg },
  tieuDe: { color: album.chu },
  nhan: { color: album.butChi, marginTop: space.lg },
  phu: { ...text.phu, color: album.butChi, marginTop: space.xs },
  hang: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  truot: { flex: 1, height: touch.toiThieu, justifyContent: 'center' },
  ray: { flexDirection: 'row', gap: 3, height: 8 },
  doan: { flex: 1, borderRadius: 4 },
  // Con trượt tròn nằm trên thanh, tâm ở giữa đoạn đang chọn; viền màu trang như khoét khỏi thanh.
  con: {
    ...bong,
    position: 'absolute',
    top: (touch.toiThieu - 28) / 2,
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: album.trang,
    backgroundColor: album.chu,
  },
  giotXem: { alignSelf: 'center', marginLeft: space.sm },
  // Rộng cố định: "1 / 5" hẹp hơn "5 / 5", để chữ co giãn thì thanh bị kéo ngắn dài trong lúc kéo.
  mucNac: { color: album.butChi, alignSelf: 'center', marginLeft: space.sm, minWidth: 40, textAlign: 'right' },
  oNhap: { minHeight: 120, paddingVertical: space.md - 2, marginTop: space.md },
  // Khe 12 để góc dán của hai ảnh cạnh nhau không chạm nhau.
  hangAnh: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm + space.xs, marginTop: space.md },
  anhNho: { width: 96, height: 96, opacity: 0.85 },
  dauX: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: album.che,
  },
  giayGhi: { color: album.chu, marginTop: space.md },
  ghiAm: { marginTop: space.md },
  hangNut: { marginTop: space.sm },
  hangDinhKem: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  loi: { ...text.than, color: album.chu, marginTop: space.md },
  thoi: { marginTop: space.lg },
});
