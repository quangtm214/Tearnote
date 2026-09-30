import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { insertEntry } from '@/db';
import { MAX_ENTRY_TAGS, TAG_IDS, TAG_LABEL_VI, type TagId } from '@/tags';
import { album, butChi, space, text, touch } from '@/theme';
import {
  bong,
  ChanMan,
  DongLoi,
  GocDan,
  gio,
  NgheLai,
  nhanNgay,
  NutChinh,
  phutGiay,
  Pill,
  THOI_LUONG,
} from '@/ui';

/** Lùi thời điểm — thay cho date picker, không thêm dependency. */
const LUI = [
  { nhan: 'Vừa xong', phut: 0 },
  { nhan: '1 giờ trước', phut: 60 },
  { nhan: '3 giờ trước', phut: 180 },
  { nhan: 'Hôm qua', phut: 60 * 24 },
];

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
    else bao('Ghi âm bị ngắt giữa chừng. Thử ghi lại.');
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

  const doiTag = (t: TagId) =>
    setTags((cu) => (cu.includes(t) ? cu.filter((x) => x !== t) : [...cu, t]));

  const hoiBo = (cauHoi: string, bo: () => void) =>
    Alert.alert(cauHoi, undefined, [
      { text: 'Giữ lại', style: 'cancel' },
      { text: 'Bỏ', style: 'destructive', onPress: bo },
    ]);

  // Camera ghi thẳng vào cache của app nên ảnh thường không vào thư viện máy — riêng tư hơn
  // chụp bằng app camera rồi chọn lại.
  async function layAnh(camera: boolean) {
    setLoi(null);
    const conLai = TOI_DA_ANH - anh.length;
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
        return bao('Tearnote chưa được dùng camera. Có thể cho phép trong Cài đặt của máy.');
      }
      const kq = camera
        ? await ImagePicker.launchCameraAsync()
        : await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: conLai > 1,
            selectionLimit: conLai,
          });
      if (!kq.canceled) setAnh((cu) => [...cu, ...kq.assets.map((a) => a.uri)].slice(0, TOI_DA_ANH));
    } catch {
      bao(camera ? 'Chưa mở được camera.' : 'Chưa mở được thư viện ảnh.');
    }
  }

  async function batDauGhi() {
    setLoi(null);
    // Ẩn nút Ghi âm ngay: bấm hai lần thì lần sau chuẩn bị máy ghi lần nữa và ném lỗi.
    setDangGhi(true);
    try {
      if (!(await requestRecordingPermissionsAsync()).granted) {
        setDangGhi(false);
        return bao('Tearnote chưa được dùng micro. Có thể cho phép trong Cài đặt của máy.');
      }
      // iOS không cho ghi nếu phiên âm thanh chưa bật ghi; Android bỏ qua cờ này.
      await setAudioModeAsync({ allowsRecording: true });
      await mayGhi.prepareToRecordAsync();
      mayGhi.record({ forDuration: GHI_AM_TOI_DA_GIAY });
      AccessibilityInfo.announceForAccessibility('Đang ghi âm');
    } catch {
      setDangGhi(false);
      bao('Chưa ghi âm được. Thử lại.');
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
      router.back();
    } catch {
      daLuu.current = false;
      bao('Chưa lưu được ảnh hoặc ghi âm. Bấm Lưu lại lần nữa, hoặc bỏ bớt rồi lưu.');
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
              Lúc nãy thế nào?
            </Text>
            <Text style={styles.phu}>Không cần điền hết. Bấm Lưu lúc nào cũng được.</Text>
          </View>

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            Lúc nào?
          </Text>
          <Text style={styles.phu}>
            {nhanNgay(luc)} · {gio.format(luc)}
          </Text>
          <View style={styles.hang} accessibilityRole="radiogroup">
            {LUI.map((o) => (
              <Pill
                key={o.nhan}
                nhan={o.nhan}
                mot
                chon={luiPhut === o.phut}
                onPress={() => setLuiPhut(o.phut)}
              />
            ))}
          </View>

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            Kéo dài bao lâu?
          </Text>
          <View style={styles.hang} accessibilityRole="radiogroup">
            {THOI_LUONG.map((o) => (
              <Pill
                key={o.nhan}
                nhan={o.nhan}
                mot
                chon={durationMin === o.phut}
                onPress={() => setDurationMin(o.phut)}
              />
            ))}
          </View>

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            Nặng đến đâu?
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
              accessibilityLabel="Cường độ"
              accessibilityValue={{ min: 1, max: 5, now: intensity, text: `${intensity} trên 5` }}
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
            <Text style={[butChi.chuThich, styles.mucNac]} importantForAccessibility="no">
              {intensity} / 5
            </Text>
          </View>

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            Vì chuyện gì?
          </Text>
          <Text style={styles.phu}>Tối đa {MAX_ENTRY_TAGS}. Không chọn cũng được.</Text>
          <View style={styles.hang}>
            {TAG_IDS.map((t) => (
              <Pill
                key={t}
                nhan={TAG_LABEL_VI[t]}
                chon={tags.includes(t)}
                tat={daDay && !tags.includes(t)}
                onPress={() => doiTag(t)}
              />
            ))}
          </View>

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            Muốn ghi thêm gì không?
          </Text>
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            accessibilityLabel="Muốn ghi thêm gì không"
            placeholder="Muốn viết gì thì viết. Chỉ bạn đọc được."
            placeholderTextColor={album.butChi}
            selectionColor={album.butChi}
            multiline
            textAlignVertical="top"
            style={styles.oNhap}
          />

          <Text style={[butChi.ngay, styles.nhan]} accessibilityRole="header">
            Kèm ảnh hay ghi âm?
          </Text>
          <Text style={styles.phu}>
            Tối đa {TOI_DA_ANH} ảnh và một đoạn ghi âm {GHI_AM_TOI_DA_GIAY / 60} phút. Chỉ nằm trong
            máy.
          </Text>
          {anh.length > 0 && (
            <View style={styles.hang}>
              {anh.map((uri, i) => (
                <Pressable
                  key={uri}
                  onPress={() =>
                    hoiBo('Bỏ ảnh này?', () => setAnh((cu) => cu.filter((x) => x !== uri)))
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Ảnh ${i + 1}`}
                  accessibilityHint="Bấm để bỏ ảnh này"
                >
                  <Image source={{ uri }} resizeMethod="resize" style={styles.anhNho} />
                  {/* Sau ảnh để góc dán đè lên mép ảnh, như ảnh thật giữ trong album. */}
                  <GocDan co={10} />
                </Pressable>
              ))}
            </View>
          )}
          {dangGhi ? (
            <>
              <Text style={[butChi.chuThich, styles.giayGhi]}>
                Đang ghi · {phutGiay(trangThaiGhi.durationMillis / 1000)} /{' '}
                {phutGiay(GHI_AM_TOI_DA_GIAY)}
              </Text>
              <DongLoi
                nhan="Dừng ghi"
                onPress={() => void mayGhi.stop().catch(() => bao('Chưa dừng được. Thử lại.'))}
              />
            </>
          ) : ghiAm ? (
            <View style={styles.ghiAm}>
              <NgheLai uri={ghiAm} />
              <DongLoi
                nhan="Bỏ ghi âm"
                onPress={() => hoiBo('Bỏ đoạn ghi âm này?', () => setGhiAm(null))}
              />
            </View>
          ) : null}
          <View style={styles.hangLoi}>
            {anh.length < TOI_DA_ANH && (
              <>
                <DongLoi nhan="Chụp ảnh" onPress={() => void layAnh(true)} />
                <DongLoi nhan="Chọn ảnh" onPress={() => void layAnh(false)} />
              </>
            )}
            {!dangGhi && !ghiAm && <DongLoi nhan="Ghi âm" onPress={() => void batDauGhi()} />}
          </View>
          {loi ? <Text style={styles.loi}>{loi}</Text> : null}

          <View style={styles.nutLuu}>
            <NutChinh nhan="Lưu lại" onPress={() => void luu()} />
          </View>
          <DongLoi nhan="Thôi, không ghi nữa" onPress={() => router.back()} />
        </ScrollView>
        <ChanMan />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  cuon: { paddingHorizontal: space.man, paddingBottom: space.xl },
  nuaTren: { minHeight: 200, justifyContent: 'flex-end', paddingBottom: space.lg },
  tieuDe: { color: album.chu },
  nhan: { color: album.butChi, marginTop: space.lg },
  phu: { ...text.phu, color: album.butChi, marginTop: space.xs },
  hang: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  truot: { flex: 1, height: touch.toiThieu, justifyContent: 'center' },
  ray: { flexDirection: 'row', gap: 3, height: 8 },
  doan: { flex: 1 },
  // Con trượt là một mẩu giấy vuông nằm trên thanh, tâm ở giữa đoạn đang chọn.
  con: {
    ...bong,
    position: 'absolute',
    top: (touch.toiThieu - 22) / 2,
    width: 22,
    height: 22,
    marginLeft: -11,
    backgroundColor: album.chu,
  },
  // Rộng cố định: "1 / 5" hẹp hơn "5 / 5", để chữ co giãn thì thanh bị kéo ngắn dài trong lúc kéo.
  mucNac: { color: album.butChi, alignSelf: 'center', marginLeft: space.sm, minWidth: 40, textAlign: 'right' },
  oNhap: {
    ...text.than,
    color: album.chu,
    backgroundColor: album.tam,
    padding: space.md,
    minHeight: 120,
    marginTop: space.md,
  },
  anhNho: { width: 96, height: 96, opacity: 0.85 },
  giayGhi: { color: album.chu, marginTop: space.md },
  ghiAm: { marginTop: space.md },
  hangLoi: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.lg },
  loi: { ...text.than, color: album.chu, marginTop: space.md },
  nutLuu: { marginTop: space.xl },
});
