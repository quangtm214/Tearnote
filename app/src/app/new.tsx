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
  Platform,
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

/** Time offsets in minutes — instead of a date picker, to avoid a dependency. */
const BACKDATE_MINUTES = [0, 60, 180, 60 * 24];

const INTENSITY_LEVELS = [1, 2, 3, 4, 5];
const clamp = (n: number) => Math.min(5, Math.max(1, n));

/** Attachment limits per Entry — enforced only here, the DB has no CHECK (docs/db.md). */
const MAX_PHOTOS = 3;
const MAX_RECORDING_SECONDS = 5 * 60;

export default function NewEntryScreen() {
  const [backMinutes, setBackMinutes] = useState(0);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [tags, setTags] = useState<TagId[]>([]);
  const [reflection, setReflection] = useState('');
  // Temporary cache URIs — copied to storage only on Save, so abandoning leaves nothing behind.
  const [photos, setPhotos] = useState<string[]>([]);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null);

  const reportError = (msg: string) => {
    setError(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  // Both a manual stop and the 5-minute auto-stop end up here.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    if (!status.isFinished) return;
    setIsRecording(false);
    void setAudioModeAsync({ allowsRecording: false });
    if (status.url && !status.hasError) setRecordingUri(status.url);
    else reportError(t.newEntry.recordingInterrupted);
  });
  const recorderState = useAudioRecorderState(recorder);

  // Blocks a double tap on Save before the screen closes — each tap would create an Entry.
  const saved = useRef(false);

  // Slider width and left edge on screen, measured on touch; pageX is converted to a bar position
  // (while dragging, locationX may be relative to whatever view is under the finger, not the bar).
  const sliderWidth = useRef(0);
  const sliderLeft = useRef(0);
  const setIntensityAt = (x: number) =>
    sliderWidth.current > 0 && setIntensity(clamp(Math.floor((x / sliderWidth.current) * 5) + 1));

  const tagsFull = tags.length >= MAX_ENTRY_TAGS;
  // Same format as the Timeline: "Saturday, September 26 · 00:05".
  const when = Date.now() - backMinutes * 60_000;

  const toggleTag = (tag: TagId) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));

  const askDiscard = (question: string, onConfirm: () => void) =>
    setDialog({ question, confirmLabel: t.newEntry.discard, onConfirm });

  // Confirm before leaving (Cancel, system Back) with unsaved text, photos or a recording: in-app photos
  // and recordings cannot be recovered. Intensity, Tags and time take seconds to redo, so they do not count.
  const navigation = useNavigation();
  const dirty = reflection.trim() !== '' || photos.length > 0 || recordingUri !== null || isRecording;
  usePreventRemove(dirty, ({ data }) => {
    if (saved.current) return navigation.dispatch(data.action); // already saved: leave without asking
    setDialog({
      question: t.newEntry.leaveQuestion,
      detail: t.newEntry.leaveDetail,
      confirmLabel: t.common.leave,
      keepLabel: t.newEntry.keepWriting,
      onConfirm: async () => {
        if (isRecording) await recorder.stop().catch(() => {}); // release the mic before leaving
        navigation.dispatch(data.action);
      },
    });
  });

  // The camera writes into the app cache, so the photo usually stays out of the device gallery —
  // more private than shooting with the camera app and picking it.
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
    // Hide the Record button at once: a second tap would prepare the recorder again and throw.
    setIsRecording(true);
    try {
      if (!(await requestRecordingPermissionsAsync()).granted) {
        setIsRecording(false);
        return reportError(t.newEntry.noMicPermission);
      }
      // iOS refuses to record unless the audio session allows it; Android ignores this flag.
      // expo-audio on iOS throws when allowsRecording is true without playsInSilentMode.
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
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
      // Save while recording: stop and keep the clip instead of making the user press Stop first.
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
      {/* Android edge-to-edge does not resize for the keyboard: without this the keyboard covers the input.
          iOS does not scroll to the focused input by itself; only automaticallyAdjustKeyboardInsets does, and it
          measures against the keyboard, so KAV padding on top would leave the input behind the footer. */}
      <KeyboardAvoidingView style={styles.screen} behavior="padding" enabled={Platform.OS === 'android'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          {/* Top half is read-only; every touch target is in the bottom half, within thumb reach. */}
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
            {/* Drag or tap, snapping to 5 steps. Never yields to the ScrollView, so a horizontal drag does not scroll. */}
            <View
              style={styles.slider}
              // Only the bar takes touches, so locationX is always from the bar's left edge.
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
              {/* Segments up to the value use the year-grid scale (same "heavier" meaning); the rest stay faint. */}
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
            {/* The same tear that will appear on the card. */}
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
                  {/* After the image so the corners overlap its edges. */}
                  <PhotoCorners size={10} />
                  {/* The × only signals "tap to remove"; the whole photo is the touch target. */}
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
          {/* Always three buttons; at the limit they fade, not hide, so nothing jumps. No camera while recording. */}
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
  // Round thumb centered on the selected segment; the page-colored border cuts it out of the bar.
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
  // Fixed width: "1 / 5" is narrower than "5 / 5"; a flexible width would resize the bar while dragging.
  levelText: { color: album.pencil, alignSelf: 'center', marginLeft: space.sm, minWidth: 40, textAlign: 'right' },
  input: { minHeight: 120, paddingVertical: space.md - 2, marginTop: space.md },
  // Gap of 12 so the corners of adjacent photos do not touch.
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
  error: { ...text.body, color: album.alert, marginTop: space.md },
  cancelRow: { marginTop: space.lg },
});
