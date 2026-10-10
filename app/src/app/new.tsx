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
import { tagLabel, t } from '@/i18n';
import { MAX_ENTRY_TAGS, TAG_IDS, type TagId } from '@/tags';
import { album, pencil, space, text, touch } from '@/theme';
import {
  shadow,
  ScreenFooter,
  LinkRow,
  TearDrop,
  PhotoCorners,
  ConfirmDialog,
  VoicePlayer,
  formatTime,
  formatDate,
  PrimaryButton,
  SecondaryButton,
  TextField,
  formatClock,
  Pill,
  DURATION_OPTIONS,
  type ConfirmRequest,
} from '@/ui';

/** Lùi thời điểm (phút) — thay cho date picker, không thêm dependency. */
const BACKDATE_MINUTES = [0, 60, 180, 60 * 24];

const INTENSITY_LEVELS = [1, 2, 3, 4, 5];
const clamp = (n: number) => Math.min(5, Math.max(1, n));

/** Giới hạn đính kèm mỗi lần khóc — chỉ app ép, DB không có CHECK (docs/db.md). */
const MAX_PHOTOS = 3;
const MAX_RECORDING_SECONDS = 5 * 60;

export default function NewEntryScreen() {
  const [backMinutes, setBackMinutes] = useState(0);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [tags, setTags] = useState<TagId[]>([]);
  const [reflection, setReflection] = useState('');
  // uri tạm trong cache — Lưu mới chép vào máy, bỏ ngang thì không để lại gì.
  const [photos, setPhotos] = useState<string[]>([]);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null);

  const reportError = (msg: string) => {
    setError(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  // Dừng tay hay tự dừng ở 5 phút đều về đây.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    if (!status.isFinished) return;
    setIsRecording(false);
    void setAudioModeAsync({ allowsRecording: false });
    if (status.url && !status.hasError) setRecordingUri(status.url);
    else reportError(t.newEntry.recordingInterrupted);
  });
  const recorderState = useAudioRecorderState(recorder);

  // Chặn bấm Lưu hai lần liên tiếp trước khi kịp rời màn — mỗi lần bấm là một Entry.
  const saved = useRef(false);

  // Slider: bề rộng thanh, và mép trái của nó trên màn — đo lúc chạm, rồi quy pageX ra vị trí trên thanh
  // (locationX lúc kéo có thể tính theo view đang nằm dưới ngón tay, không phải thanh).
  const sliderWidth = useRef(0);
  const sliderLeft = useRef(0);
  const setIntensityAt = (x: number) =>
    sliderWidth.current > 0 && setIntensity(clamp(Math.floor((x / sliderWidth.current) * 5) + 1));

  const tagsFull = tags.length >= MAX_ENTRY_TAGS;
  // Cùng cách viết thời điểm với Timeline: "Thứ Bảy, 26 tháng 9 · 00:05".
  const when = Date.now() - backMinutes * 60_000;

  const toggleTag = (tag: TagId) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));

  const askDiscard = (question: string, onConfirm: () => void) =>
    setDialog({ question, confirmLabel: t.newEntry.discard, onConfirm });

  // Rời màn (Thôi, Back hệ thống) khi còn chữ, ảnh hay ghi âm chưa lưu thì hỏi lại: ảnh chụp trong app và
  // đoạn ghi âm không lấy lại được. Cường độ, Tag, thời điểm chọn lại mất vài giây nên không tính.
  const navigation = useNavigation();
  const dirty = reflection.trim() !== '' || photos.length > 0 || recordingUri !== null || isRecording;
  usePreventRemove(dirty, ({ data }) => {
    if (saved.current) return navigation.dispatch(data.action); // Lưu xong thì đi thẳng
    setDialog({
      question: t.newEntry.leaveQuestion,
      detail: t.newEntry.leaveDetail,
      confirmLabel: t.common.leave,
      keepLabel: t.newEntry.keepWriting,
      onConfirm: async () => {
        if (isRecording) await recorder.stop().catch(() => {}); // nhả micro trước khi rời
        navigation.dispatch(data.action);
      },
    });
  });

  // Camera ghi thẳng vào cache của app nên ảnh thường không vào thư viện máy — riêng tư hơn
  // chụp bằng app camera rồi chọn lại.
  async function pickPhoto(camera: boolean) {
    setError(null);
    const remaining = MAX_PHOTOS - photos.length;
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
        return reportError(t.newEntry.noCameraPermission);
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync()
        : await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: remaining > 1,
            selectionLimit: remaining,
          });
      if (!result.canceled) setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
    } catch {
      reportError(camera ? t.newEntry.cameraError : t.newEntry.libraryError);
    }
  }

  async function startRecording() {
    setError(null);
    // Ẩn nút Ghi âm ngay: bấm hai lần thì lần sau chuẩn bị máy ghi lần nữa và ném lỗi.
    setIsRecording(true);
    try {
      if (!(await requestRecordingPermissionsAsync()).granted) {
        setIsRecording(false);
        return reportError(t.newEntry.noMicPermission);
      }
      // iOS không cho ghi nếu phiên âm thanh chưa bật ghi; Android bỏ qua cờ này.
      await setAudioModeAsync({ allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: MAX_RECORDING_SECONDS });
      AccessibilityInfo.announceForAccessibility(t.newEntry.recordingStarted);
    } catch {
      setIsRecording(false);
      reportError(t.newEntry.recordingError);
    }
  }

  const save = async () => {
    if (saved.current) return;
    saved.current = true;
    try {
      // Bấm Lưu khi còn đang ghi: dừng rồi lưu luôn đoạn đó, đừng bắt người ta bấm Dừng trước.
      let audioUri = recordingUri;
      if (isRecording) {
        await recorder.stop();
        audioUri = recorder.uri;
      }
      insertEntry(
        {
          occurredAt: Date.now() - backMinutes * 60_000,
          durationMin,
          intensity,
          tags,
          reflection: reflection.trim() === '' ? null : reflection.trim(),
        },
        [
          ...photos.map((uri) => ({ kind: 'image' as const, uri })),
          ...(audioUri ? [{ kind: 'audio' as const, uri: audioUri }] : []),
        ],
      );
      AccessibilityInfo.announceForAccessibility(t.newEntry.saved);
      router.back();
    } catch {
      saved.current = false;
      reportError(t.newEntry.saveError);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Android edge-to-edge không tự co cửa sổ khi bàn phím mở: thiếu cái này là bàn phím che ô nhập. */}
      <KeyboardAvoidingView style={styles.screen} behavior="padding">
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Nửa trên: chỉ để đọc. Mọi vùng bấm nằm nửa dưới, tầm ngón cái. */}
          <View style={styles.upperHalf}>
            <Text style={[pencil.title, styles.title]} accessibilityRole="header">
              {t.newEntry.title}
            </Text>
            <Text style={styles.caption}>{t.newEntry.intro}</Text>
          </View>

          <Text style={[pencil.date, styles.label]} accessibilityRole="header">
            {t.newEntry.whenLabel}
          </Text>
          <Text style={styles.caption}>
            {formatDate(when)} · {formatTime(when)}
          </Text>
          <View style={styles.row} accessibilityRole="radiogroup">
            {BACKDATE_MINUTES.map((minutes) => (
              <Pill
                key={minutes}
                label={t.newEntry.ago(minutes)}
                single
                selected={backMinutes === minutes}
                onPress={() => setBackMinutes(minutes)}
              />
            ))}
          </View>

          <Text style={[pencil.date, styles.label]} accessibilityRole="header">
            {t.newEntry.howLongLabel}
          </Text>
          <View style={styles.row} accessibilityRole="radiogroup">
            {DURATION_OPTIONS.map((minutes) => (
              <Pill
                key={String(minutes)}
                label={t.duration(minutes)}
                single
                selected={durationMin === minutes}
                onPress={() => setDurationMin(minutes)}
              />
            ))}
          </View>

          <Text style={[pencil.date, styles.label]} accessibilityRole="header">
            {t.newEntry.howHeavyLabel}
          </Text>
          <View style={styles.row}>
            {/* Kéo hoặc chạm, bắt vào 5 nấc. Không nhả cho ScrollView giữa chừng, để kéo ngang không thành cuộn. */}
            <View
              style={styles.slider}
              // Chỉ thanh nhận chạm, để locationX luôn tính từ mép trái thanh.
              pointerEvents="box-only"
              onLayout={(e) => (sliderWidth.current = e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              onResponderGrant={(e) => {
                sliderLeft.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
                setIntensityAt(e.nativeEvent.locationX);
              }}
              onResponderMove={(e) => setIntensityAt(e.nativeEvent.pageX - sliderLeft.current)}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={t.newEntry.intensityLabel}
              accessibilityValue={{ min: 1, max: 5, now: intensity, text: t.newEntry.intensityValue(intensity) }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) =>
                setIntensity((n) => clamp(n + (e.nativeEvent.actionName === 'increment' ? 1 : -1)))
              }
            >
              {/* Đoạn tới mức chọn đậm dần theo thang của bảng năm — cùng một nghĩa "nặng hơn"; đoạn trên mức chỉ mờ. */}
              <View style={styles.track}>
                {INTENSITY_LEVELS.map((n) => (
                  <View
                    key={n}
                    style={[styles.segment, { backgroundColor: n <= intensity ? album.calendar[n] : album.hairline }]}
                  />
                ))}
              </View>
              <View style={[styles.thumb, { left: `${(intensity - 0.5) * 20}%` }]} />
            </View>
            {/* Đúng hình sẽ nằm trên tấm: kéo tới đâu, giọt đầy tới đó. */}
            <View style={styles.tearPreview} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <TearDrop level={intensity} />
            </View>
            <Text style={[pencil.note, styles.levelText]} importantForAccessibility="no">
              {intensity} / 5
            </Text>
          </View>

          <Text style={[pencil.date, styles.label]} accessibilityRole="header">
            {t.newEntry.whyLabel}
          </Text>
          <Text style={styles.caption}>{t.newEntry.maxTags(MAX_ENTRY_TAGS)}</Text>
          <View style={styles.row}>
            {TAG_IDS.map((tag) => (
              <Pill
                key={tag}
                label={tagLabel(tag)}
                selected={tags.includes(tag)}
                disabled={tagsFull && !tags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>

          <Text style={[pencil.date, styles.label]} accessibilityRole="header">
            {t.newEntry.notesLabel}
          </Text>
          <TextField
            value={reflection}
            onChangeText={setReflection}
            accessibilityLabel={t.newEntry.notesLabel}
            placeholder={t.newEntry.notesPlaceholder}
            multiline
            textAlignVertical="top"
            style={styles.input}
          />

          <Text style={[pencil.date, styles.label]} accessibilityRole="header">
            {t.newEntry.attachLabel}
          </Text>
          <Text style={styles.caption}>{t.newEntry.attachLimit(MAX_PHOTOS, MAX_RECORDING_SECONDS / 60)}</Text>
          {photos.length > 0 && (
            <View style={styles.photoRow}>
              {photos.map((uri, i) => (
                <Pressable
                  key={uri}
                  onPress={() =>
                    askDiscard(t.newEntry.removePhotoQuestion, () => setPhotos((prev) => prev.filter((x) => x !== uri)))
                  }
                  accessibilityRole="button"
                  accessibilityLabel={t.newEntry.photoN(i + 1)}
                  accessibilityHint={t.newEntry.removePhotoHint}
                >
                  <Image source={{ uri }} resizeMethod="resize" style={styles.thumbnail} />
                  {/* Sau ảnh để góc dán đè lên mép ảnh, như ảnh thật giữ trong album. */}
                  <PhotoCorners size={10} />
                  {/* Dấu × chỉ để thấy "bấm là bỏ"; cả ảnh vẫn là một vùng bấm. */}
                  <View style={styles.removeMark} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                    <MaterialCommunityIcons name="close" size={16} color={album.ink} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
          {isRecording ? (
            <>
              <Text style={[pencil.note, styles.recordingTime]}>
                {t.newEntry.recordingProgress(
                  formatClock(recorderState.durationMillis / 1000),
                  formatClock(MAX_RECORDING_SECONDS),
                )}
              </Text>
              <View style={styles.buttonRow}>
                <SecondaryButton
                  icon="stop-circle-outline"
                  label={t.newEntry.stopRecording}
                  onPress={() => void recorder.stop().catch(() => reportError(t.newEntry.stopError))}
                />
              </View>
            </>
          ) : recordingUri ? (
            <View style={styles.recordingBox}>
              <VoicePlayer uri={recordingUri} />
              <View style={styles.buttonRow}>
                <SecondaryButton
                  icon="close"
                  label={t.newEntry.removeRecording}
                  onPress={() => askDiscard(t.newEntry.removeRecordingQuestion, () => setRecordingUri(null))}
                />
              </View>
            </View>
          ) : null}
          {/* Luôn đủ ba nút, hết lượt thì mờ chứ không ẩn — vị trí không nhảy. Đang ghi thì không mở camera. */}
          <View style={styles.attachRow}>
            <SecondaryButton
              icon="camera-outline"
              label={t.newEntry.takePhoto}
              disabled={photos.length >= MAX_PHOTOS || isRecording}
              onPress={() => void pickPhoto(true)}
            />
            <SecondaryButton
              icon="image-outline"
              label={t.newEntry.pickPhoto}
              disabled={photos.length >= MAX_PHOTOS || isRecording}
              onPress={() => void pickPhoto(false)}
            />
            <SecondaryButton
              icon="microphone-outline"
              label={t.newEntry.recordButton}
              disabled={isRecording || recordingUri !== null}
              onPress={() => void startRecording()}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.cancelRow}>
            <LinkRow icon="close" label={t.newEntry.cancel} onPress={() => router.back()} />
          </View>
        </ScrollView>
        <ScreenFooter>
          <PrimaryButton label={t.newEntry.save} onPress={() => void save()} />
        </ScreenFooter>
      </KeyboardAvoidingView>
      <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  scroll: { paddingHorizontal: space.screen, paddingBottom: space.xl },
  upperHalf: { minHeight: 120, justifyContent: 'flex-end', paddingBottom: space.lg },
  title: { color: album.ink },
  label: { color: album.pencil, marginTop: space.lg },
  caption: { ...text.caption, color: album.pencil, marginTop: space.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  slider: { flex: 1, height: touch.min, justifyContent: 'center' },
  track: { flexDirection: 'row', gap: 3, height: 8 },
  segment: { flex: 1, borderRadius: 4 },
  // Con trượt tròn nằm trên thanh, tâm ở giữa đoạn đang chọn; viền màu trang như khoét khỏi thanh.
  thumb: {
    ...shadow,
    position: 'absolute',
    top: (touch.min - 28) / 2,
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: album.page,
    backgroundColor: album.ink,
  },
  tearPreview: { alignSelf: 'center', marginLeft: space.sm },
  // Rộng cố định: "1 / 5" hẹp hơn "5 / 5", để chữ co giãn thì thanh bị kéo ngắn dài trong lúc kéo.
  levelText: { color: album.pencil, alignSelf: 'center', marginLeft: space.sm, minWidth: 40, textAlign: 'right' },
  input: { minHeight: 120, paddingVertical: space.md - 2, marginTop: space.md },
  // Khe 12 để góc dán của hai ảnh cạnh nhau không chạm nhau.
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm + space.xs, marginTop: space.md },
  thumbnail: { width: 96, height: 96, opacity: 0.85 },
  removeMark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: album.scrim,
  },
  recordingTime: { color: album.ink, marginTop: space.md },
  recordingBox: { marginTop: space.md },
  buttonRow: { marginTop: space.sm },
  attachRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  error: { ...text.body, color: album.ink, marginTop: space.md },
  cancelRow: { marginTop: space.lg },
});
