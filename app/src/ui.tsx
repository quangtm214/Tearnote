import { MaterialCommunityIcons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, type Href } from 'expo-router';
import { createContext, useContext, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, Path } from 'react-native-svg';

import type { Attachment, Entry } from './db';
import { tagLabels, t } from './i18n';
import { album, pencil, radius, space, text, touch } from './theme';

/**
 * Only for pieces already used on at least two screens. Do not add anything here before
 * its second use — this file is not a component library.
 */

// Go back, or go home when the screen was opened directly from a deep link.
// `'/' as Href` works around typed routes generated wrong on Windows (CLAUDE.md).
export const leave = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));

/** Soft, low shadow: a card rests on the page, it does not float. */
export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.45,
  shadowRadius: 6,
  elevation: 3,
};

/** Four photo corners holding a card to the page. */
export function PhotoCorners({ size = 14 }: { size?: number }) {
  const base = { width: 0, height: 0, position: 'absolute' as const, borderColor: 'transparent' };
  return (
    <>
      <View style={[base, { top: -2, left: -2, borderTopWidth: size, borderRightWidth: size, borderTopColor: album.corner }]} />
      <View style={[base, { top: -2, right: -2, borderTopWidth: size, borderLeftWidth: size, borderTopColor: album.corner }]} />
      <View style={[base, { bottom: -2, left: -2, borderBottomWidth: size, borderRightWidth: size, borderBottomColor: album.corner }]} />
      <View style={[base, { bottom: -2, right: -2, borderBottomWidth: size, borderLeftWidth: size, borderBottomColor: album.corner }]} />
    </>
  );
}

/** Hand-drawn tear (slightly asymmetric) in a 20×28 box: tip at y=1.5, bottom at y=26. */
const TEAR_PATH = 'M10 1.5C8.6 5 2.2 11.4 2.2 17.8C2.2 22.3 5.7 26 10 26C14.4 26 17.9 22.3 17.8 17.7C17.7 11.6 11.5 5.1 10 1.5Z';

/**
 * Intensity 1–5 as a filling tear: 1 is the bottom, 5 is full. The surface is wavy so it reads
 * as water, not as a progress bar.
 */
export function TearDrop({ level }: { level: number }) {
  const y = 26 - (24.5 * level) / 5;
  return (
    <Svg width={20} height={28} viewBox="0 0 20 28">
      <Defs>
        {/* The id only has to be unique inside one <Svg>: on native each <Svg> has its own defs. */}
        <ClipPath id="tear">
          <Path d={TEAR_PATH} />
        </ClipPath>
      </Defs>
      <Path d={`M0 ${y}Q5 ${y - 1.5} 10 ${y}T20 ${y}V28H0Z`} fill={album.pencil} clipPath="url(#tear)" />
      <Path d={TEAR_PATH} fill="none" stroke={album.pencil} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Estimated duration in minutes; null = skipped. The user picks a range instead of measuring, so the
 * card shows the label they picked (`t.duration`), never "60 minutes" when they only said "longer".
 */
export const DURATION_OPTIONS = [null, 5, 15, 30, 60];

let formatters:
  | { locale: string; time: Intl.DateTimeFormat; thisYear: Intl.DateTimeFormat; otherYear: Intl.DateTimeFormat }
  | undefined;

/** Formatters for the current language; rebuilt when the language changes, not on every call. */
function getFormatters() {
  if (formatters?.locale !== t.locale) {
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' } as const;
    formatters = {
      locale: t.locale,
      time: new Intl.DateTimeFormat(t.locale, { hour: '2-digit', minute: '2-digit', hour12: false }),
      thisYear: new Intl.DateTimeFormat(t.locale, dateOptions),
      otherYear: new Intl.DateTimeFormat(t.locale, { ...dateOptions, year: 'numeric' }),
    };
  }
  return formatters;
}

export const formatTime = (ms: number) => getFormatters().time.format(ms);

/** "Saturday, September 26"; adds the year when it is not this year, so nights in two years never share a name. */
export const formatDate = (ms: number) =>
  (new Date(ms).getFullYear() === new Date().getFullYear() ? getFormatters().thisYear : getFormatters().otherYear).format(ms);

/** Comfort state of a card; undefined = none requested, nothing clipped on. */
export type ComfortState = 'clipped' | 'thanked' | undefined;

/**
 * Entry card; photos are a row of small polaroids. With `onPress` (Timeline) the whole card is pressable
 * and cut at 6 lines. Without it (single Entry screen) it shows the full Reflection, and each photo opens
 * full size.
 */
export function EntryCard({
  entry,
  attachments = [],
  comfortState,
  onPress,
}: {
  entry: Entry;
  attachments?: Attachment[];
  comfortState?: ComfortState;
  onPress?: () => void;
}) {
  const [openPhoto, setOpenPhoto] = useState<string | null>(null);
  const tagText = tagLabels(entry.tags);
  const photoUris = attachments.filter((a) => a.kind === 'image').map((a) => a.uri);
  // Without a Reflection the Tags are already the card body, so the caption does not repeat them.
  const parts = [
    formatTime(entry.occurredAt),
    entry.durationMin !== null && t.duration(entry.durationMin).toLowerCase(),
    entry.reflection && tagText.toLowerCase(),
    photoUris.length > 0 && t.card.photos(photoUris.length),
    attachments.some((a) => a.kind === 'audio') && t.card.recording,
  ].filter(Boolean);
  const clipLabel = comfortState === 'clipped' ? t.card.clipped : comfortState === 'thanked' ? t.common.thanked : null;
  // The clip is a visual metaphor; screen readers get its plain meaning instead.
  const spokenLabel = [
    entry.reflection || tagText,
    ...parts,
    t.common.intensity(entry.intensity),
    comfortState === 'clipped' ? t.card.hasComfort : comfortState === 'thanked' ? t.card.hasComfortThanked : null,
  ]
    .filter(Boolean)
    .join(', ');
  const photoRow = photoUris.length > 0 && (
    <View style={s.polaroidRow}>
      {photoUris.map((uri, i) => (
        <Polaroid key={uri} uri={uri} index={i} onPress={onPress ? undefined : () => setOpenPhoto(uri)} />
      ))}
    </View>
  );
  const words = (
    <>
      <Text style={s.body} numberOfLines={onPress ? 6 : undefined}>
        {entry.reflection || tagText}
      </Text>
      {/* Caption stays inside the card: outside, it floats between two cards and belongs to neither.
          Hidden from screen readers because `spokenLabel` already reads it. */}
      <View
        style={s.noteRow}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Text style={[pencil.note, s.note]}>{parts.join(' · ')}</Text>
        <TearDrop level={entry.intensity} />
      </View>
    </>
  );
  const clip = clipLabel && (
    <View style={s.clip}>
      <Text style={[pencil.note, s.clipText]}>{clipLabel}</Text>
    </View>
  );
  return (
    <View style={[s.cardSlot, clipLabel ? s.belowClip : null]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={spokenLabel}
          style={({ pressed }) => [s.card, pressed && s.lifted]}
        >
          <PhotoCorners />
          {photoRow}
          {words}
          {clip}
        </Pressable>
      ) : (
        <View style={s.card}>
          <PhotoCorners />
          {/* Photos stay outside the merged screen-reader item, or it would swallow their buttons. */}
          {photoRow}
          {/* Not a Pressable: TalkBack says "double-tap to activate" even when onPress is missing. */}
          <View accessible accessibilityRole="text" accessibilityLabel={spokenLabel}>
            {words}
          </View>
          {clip}
          <PhotoViewer uri={openPhoto} onClose={() => setOpenPhoto(null)} />
        </View>
      )}
    </View>
  );
}

/** One photo full size over the dimmed page. Tapping anywhere or Back closes it. */
function PhotoViewer({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState({ width: 0, height: 0 });
  // Width / height of the photo; square until it loads.
  const [loaded, setLoaded] = useState({ uri: '', ratio: 1 });
  const ratio = loaded.uri === uri ? loaded.ratio : 1;
  // Sized to the photo itself, not `contain` in the whole area: the round corners must sit on the photo's edge.
  const width = Math.min(area.width, area.height * ratio);
  return (
    <Modal
      visible={!!uri}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t.card.closePhoto}
        style={[s.viewer, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md }]}
      >
        <MaterialCommunityIcons name="close" size={28} color={album.ink} style={s.viewerClose} />
        <View style={s.viewerArea} onLayout={(e) => setArea(e.nativeEvent.layout)}>
          {/* `resize` makes Android decode at display size, not the original 12MP. */}
          {uri ? (
            <Image
              source={{ uri }}
              resizeMethod="resize"
              onLoad={(e) => setLoaded({ uri, ratio: e.nativeEvent.source.width / e.nativeEvent.source.height })}
              style={[s.viewerPhoto, { width, height: width / ratio }]}
            />
          ) : null}
        </View>
      </Pressable>
    </Modal>
  );
}

// Fixed tilt per position, so a card looks the same on every render (DESIGN.md › Shapes).
const POLAROID_TILT = ['-3deg', '2deg', '-1.5deg'];

/** A loose square polaroid; up to three overlap in a row. With `onPress` it is a button on its own. */
function Polaroid({ uri, index, onPress }: { uri: string; index: number; onPress?: () => void }) {
  const frame = [
    s.polaroid,
    index > 0 && s.polaroidOverlap,
    { transform: [{ rotate: POLAROID_TILT[index % POLAROID_TILT.length] }] },
  ];
  const photo = <Image source={{ uri }} resizeMethod="resize" style={s.polaroidPhoto} />;
  // shouldRasterizeIOS: iOS antialiases only the rotated view's own edge, so the photo inside shows jagged
  // edges; rasterizing flattens frame + photo into one bitmap before it is rotated.
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t.newEntry.photoN(index + 1)}
      accessibilityHint={t.card.openPhotoHint}
      style={({ pressed }) => [frame, pressed && s.dim]}
      shouldRasterizeIOS
    >
      {photo}
    </Pressable>
  ) : (
    <View style={frame} shouldRasterizeIOS>
      {photo}
    </View>
  );
}

/** Seconds → "4:05". */
export const formatClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** Plays back a recording; tap to play / pause. */
export function VoicePlayer({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  async function toggle() {
    if (status.playing) return player.pause();
    // After the end the player stays there; seek to 0 or play() does nothing.
    if (status.duration > 0 && status.currentTime >= status.duration - 0.1) await player.seekTo(0);
    // iOS mutes playback with the ring/silent switch unless the session plays in silent mode;
    // stopping a recording also resets the session to that muted mode.
    await setAudioModeAsync({ playsInSilentMode: true });
    player.play();
  }

  const label = status.playing ? t.card.pause : t.card.listen;
  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={t.card.listenA11y(label, Math.round(status.duration))}
      style={({ pressed }) => [s.player, pressed && s.pressedButton]}
    >
      <View style={s.disc}>
        <MaterialCommunityIcons name={status.playing ? 'pause' : 'play'} size={22} color={album.page} />
      </View>
      <Text style={s.playerText}>{label}</Text>
      <Text style={[pencil.note, s.playerTime]} importantForAccessibility="no">
        {status.playing ? `${formatClock(status.currentTime)} / ` : ''}
        {formatClock(status.duration)}
      </Text>
    </Pressable>
  );
}

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Text link row; the whole row is the touch target. `icon` goes first when the row acts right away
 * (Back, Log out…); `chevron` goes last when the row opens another screen.
 */
export function LinkRow({
  label,
  detail,
  icon,
  chevron,
  onPress,
}: {
  label: string;
  detail?: string;
  icon?: IconName;
  chevron?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={detail}
      style={({ pressed }) => [s.link, pressed && s.dim]}
    >
      <View style={s.linkRow}>
        {icon ? <MaterialCommunityIcons name={icon} size={24} color={album.ink} /> : null}
        <View style={s.linkBlock}>
          <Text style={s.linkText}>{label}</Text>
          {detail ? <Text style={s.linkDetail}>{detail}</Text> : null}
        </View>
        {chevron ? <MaterialCommunityIcons name="chevron-right" size={24} color={album.pencil} /> : null}
      </View>
    </Pressable>
  );
}

/**
 * Secondary button for in-place actions (Take photo, Record, Thank, Withdraw…). When unavailable it is
 * faded and disabled, not hidden, so the layout does not jump.
 */
export function SecondaryButton({
  label,
  onPress,
  icon,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.secondaryButton, pressed && s.dim, disabled && s.faded]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={20} color={album.pencil} /> : null}
      <Text style={s.secondaryText}>{label}</Text>
    </Pressable>
  );
}

/**
 * Primary button. No photo corners: those are only for things stuck on the page.
 * `busyLabel`: for long waits (requesting a Comfort) say what is happening, not just a spinner.
 */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  busy,
  busyLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={busy && busyLabel ? busyLabel : label}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      style={({ pressed }) => [s.primaryButton, pressed && s.pressedButton, disabled && s.faded]}
    >
      {busy ? (
        <View style={s.waitRow}>
          <ActivityIndicator color={album.ink} />
          {busyLabel ? (
            <Text style={s.primaryText} maxFontSizeMultiplier={1.6}>
              {busyLabel}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={s.primaryText} maxFontSizeMultiplier={1.6}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * Fixed footer outside the scroll area. Always ends with the help button: ADR 0005 requires it on
 * every screen, in the same place (except the hotline screen itself). The screen's primary button
 * (Save, Send, Log in…) goes here too, above the help button.
 */
export function ScreenFooter({ children }: { children?: ReactNode }) {
  return (
    <View style={s.footer}>
      {children}
      <HelpButton
        label={t.common.needHelp}
        icon="lifebuoy"
        accessibilityHint={t.common.needHelpHint}
        onPress={() => router.push('/help')}
      />
    </View>
  );
}

/** Help button — the only place that uses `album.lamp`. */
export function HelpButton({
  label,
  onPress,
  icon,
  accessibilityLabel,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      // Explicit label so screen readers do not read the icon glyph.
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [s.helpButton, pressed && s.helpPressed]}
    >
      {({ pressed }) => (
        <>
          {icon ? (
            <MaterialCommunityIcons name={icon} size={24} color={pressed ? album.page : album.lamp} />
          ) : null}
          <Text style={[s.helpText, pressed && s.helpTextPressed]} maxFontSizeMultiplier={1.6}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** Selectable option: Tags (multiple choice), time, duration (single choice — `single`). */
export function Pill({
  label,
  selected,
  disabled,
  single,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  single?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={single ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      style={({ pressed }) => [
        s.pill,
        selected && s.pillSelected,
        pressed && (selected ? s.pressedSelected : s.pressedButton),
        disabled && s.faded,
      ]}
    >
      <Text style={[s.pillText, selected && s.pillTextSelected]}>{label}</Text>
    </Pressable>
  );
}

// Brings a TextField back above the keyboard; null outside FormScrollView.
const RevealContext = createContext<((input: TextInput) => void) | null>(null);

/**
 * ScrollView for screens with TextFields. iOS `automaticallyAdjustKeyboardInsets` scrolls to the input only
 * when the keyboard opens; if the user scrolls away and types, or a multiline input grows, iOS does not follow.
 * So each TextField asks this view to scroll it back on every change. Android scrolls to the cursor natively.
 */
export function FormScrollView(props: ScrollViewProps) {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);
  const reveal = (input: TextInput) => {
    const view = ref.current;
    const keyboard = Keyboard.metrics();
    if (Platform.OS !== 'ios' || !view || !keyboard) return;
    input.measureInWindow((_x, top, _w, height) => {
      const below = top + height + space.md - keyboard.screenY;
      // Not animated: the next keystroke must read an offset that is already final.
      if (below > 0) return view.scrollTo({ y: offset.current + below, animated: false });
      view.getNativeScrollRef()?.measureInWindow((_x2, viewTop) => {
        const above = viewTop + space.md - top;
        if (above > 0) view.scrollTo({ y: offset.current - above, animated: false });
      });
    });
  };
  return (
    <RevealContext value={reveal}>
      <ScrollView
        ref={ref}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        scrollEventThrottle={16}
        {...props}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
          props.onScroll?.(e);
        }}
      />
    </RevealContext>
  );
}

/**
 * Text input. The 2px border is always there (transparent until focused) so focus does not shift the text.
 * `error` turns the border `alert` and shows the message right under the field. `ref` is a normal prop in React 19.
 * Inside FormScrollView it scrolls itself back above the iOS keyboard while the user types.
 */
export function TextField({
  ref,
  style,
  error,
  onFocus,
  onBlur,
  onChangeText,
  onContentSizeChange,
  ...rest
}: TextInputProps & { ref?: Ref<TextInput>; error?: string | null }) {
  const [focus, setFocus] = useState(false);
  const reveal = useContext(RevealContext);
  const input = useRef<TextInput>(null);
  return (
    <View>
      <TextInput
        ref={(node) => {
          input.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        placeholderTextColor={album.pencil}
        selectionColor={album.pencil}
        keyboardAppearance="dark"
        {...rest}
        onChangeText={(value) => {
          onChangeText?.(value);
          if (input.current) reveal?.(input.current);
        }}
        // A multiline input grows after onChangeText has measured it.
        onContentSizeChange={(e) => {
          onContentSizeChange?.(e);
          if (input.current?.isFocused()) reveal?.(input.current);
        }}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        style={[s.input, focus && s.inputFocus, error && s.inputError, style]}
      />
      {error ? (
        <View style={s.fieldError}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={album.alert} style={s.fieldErrorIcon} />
          <Text style={s.fieldErrorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** `onConfirm` runs when the user picks the action (top button); the bottom button is the safe choice. */
export type ConfirmRequest = { question: string; detail?: string; confirmLabel: string; keepLabel?: string; onConfirm: () => void };

/**
 * Replaces the system `Alert`, which is white on Android inside a dark app. The safe button is at the
 * bottom, under the thumb; the destructive one needs a reach. Tapping the backdrop or Back = keep.
 */
export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={!!request}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[s.backdrop, { paddingBottom: space.md + insets.bottom }]}>
        {/* Backdrop is a sibling, not a wrapper: wrapping makes screen readers merge the dialog into one item. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
        {request ? (
          <View style={s.dialog} accessibilityViewIsModal>
            <ScrollView style={s.dialogScroll}>
              <Text style={[pencil.date, s.question]} accessibilityRole="header">
                {request.question}
              </Text>
              {request.detail ? <Text style={s.dialogDetail}>{request.detail}</Text> : null}
            </ScrollView>
            <Pressable
              onPress={() => {
                const action = request.onConfirm;
                onClose();
                action();
              }}
              accessibilityRole="button"
              style={({ pressed }) => [s.dialogButton, s.confirmButton, pressed && s.dim]}
            >
              <Text style={s.confirmText} maxFontSizeMultiplier={1.6}>
                {request.confirmLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={({ pressed }) => [s.dialogButton, s.keepButton, pressed && s.pressedSelected]}
            >
              <Text style={s.keepText} maxFontSizeMultiplier={1.6}>
                {request.keepLabel ?? t.common.keep}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/** A Comfort (received, or written by the user), drawn as a loose note with a paperclip. */
export function ComfortCard({ children }: { children: ReactNode }) {
  return (
    <View style={s.comfortCard}>
      <MaterialCommunityIcons
        name="paperclip"
        size={32}
        color={album.pencil}
        style={s.paperclip}
        importantForAccessibility="no"
        accessibilityElementsHidden
      />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  cardSlot: { marginBottom: space.lg },
  card: {
    ...shadow,
    backgroundColor: album.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    minHeight: touch.min,
  },
  // Pressed = lifted off the page: lighter, raised, deeper shadow.
  lifted: {
    backgroundColor: album.cardLifted,
    transform: [{ translateY: -3 }],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  body: { ...text.body, color: album.ink },
  polaroidRow: { flexDirection: 'row', marginBottom: space.md, paddingTop: space.xs },
  // `pencil`, not white: a bright frame on a black page at 2 a.m. is glaring.
  polaroid: {
    ...shadow,
    flex: 1,
    maxWidth: 120,
    padding: 5,
    paddingBottom: 16,
    backgroundColor: album.pencil,
    borderRadius: radius.paper,
    elevation: 4,
  },
  // Each polaroid lies partly over the one before it.
  polaroidOverlap: { marginLeft: -10 },
  // Dimmed: a bright photo on a black page at 2 a.m. is glaring.
  // Radius 3: half the frame's 6, so the photo's corners follow the frame (DESIGN.md › Shapes).
  polaroidPhoto: { width: '100%', aspectRatio: 1, opacity: 0.85, backgroundColor: album.page, borderRadius: 3 },
  viewer: { flex: 1, backgroundColor: album.scrim, paddingHorizontal: space.md },
  viewerClose: { alignSelf: 'flex-end', padding: space.sm },
  viewerArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Not dimmed like the polaroids: at 0.85 the page behind shows through the photo.
  viewerPhoto: { borderRadius: radius.paper },
  // Comfort clip: overlaps the bottom-right corner, slightly rotated.
  clip: {
    ...shadow,
    position: 'absolute',
    right: -8,
    bottom: -18,
    backgroundColor: album.clip,
    borderRadius: radius.paper,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    transform: [{ rotate: '-2deg' }],
    elevation: 6,
  },
  clipText: { color: album.ink },
  noteRow: {
    // No flexWrap: the caption wraps inside itself so the tear stays on the first line.
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    marginTop: space.md,
  },
  // The clip hangs 18 below the card (`clip.bottom`); leave room so it does not touch the next card.
  belowClip: { marginBottom: space.xl },
  note: { color: album.pencil, flex: 1 },

  link: { minHeight: touch.min, paddingVertical: space.md, justifyContent: 'center', marginTop: space.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm + space.xs },
  linkBlock: { flex: 1 },
  dim: { opacity: 0.6 },
  linkText: { ...text.button, color: album.ink },
  linkDetail: { ...text.caption, color: album.pencil, marginTop: space.xs, maxWidth: 320 },

  secondaryButton: {
    minHeight: touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.touch,
    backgroundColor: album.hairline,
  },
  secondaryText: { ...text.button, color: album.ink },

  primaryButton: {
    minHeight: touch.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.touch,
    backgroundColor: album.card,
  },
  // Pressed = one step lighter: shadows barely show on a black page, brightness does.
  pressedButton: { backgroundColor: album.clip },
  pressedSelected: { opacity: 0.85 },
  faded: { opacity: 0.35 },
  waitRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  primaryText: { ...text.button, color: album.ink, textAlign: 'center' },

  // No photo corners: it is a control, not something stuck on the page.
  player: {
    ...shadow,
    minHeight: touch.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingLeft: 10,
    paddingRight: space.lg,
    borderRadius: radius.touch,
    backgroundColor: album.card,
  },
  disc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: album.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerText: { ...text.button, color: album.ink, flex: 1 },
  playerTime: { color: album.pencil },

  footer: {
    paddingHorizontal: space.screen,
    paddingTop: space.sm + space.xs,
    paddingBottom: space.sm + space.xs,
    gap: space.sm,
    backgroundColor: album.page,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: album.hairline,
  },
  helpButton: {
    minHeight: touch.hotline,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    borderWidth: 1.5,
    borderColor: album.lamp,
    borderRadius: radius.touch,
  },
  helpPressed: { backgroundColor: album.lamp },
  helpText: { ...text.button, color: album.lamp, textAlign: 'center', flexShrink: 1 },
  helpTextPressed: { color: album.page },

  pill: {
    minHeight: touch.min,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.touch,
    backgroundColor: album.card,
  },
  pillSelected: { backgroundColor: album.ink },
  pillText: { ...text.button, color: album.pencil },
  pillTextSelected: { color: album.page },

  input: {
    ...text.body,
    color: album.ink,
    backgroundColor: album.card,
    borderRadius: radius.touch,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: space.md - 2,
    minHeight: touch.min,
  },
  inputFocus: { borderColor: album.pencil },
  inputError: { borderColor: album.alert },
  fieldError: { flexDirection: 'row', gap: space.xs, marginTop: space.xs },
  // Centers the 18 icon on the first 20-high caption line.
  fieldErrorIcon: { marginTop: 1 },
  fieldErrorText: { ...text.caption, color: album.alert, flex: 1 },

  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: album.scrim,
    paddingHorizontal: space.md,
  },
  dialog: {
    ...shadow,
    elevation: 6,
    backgroundColor: album.clip,
    borderRadius: radius.paper,
    padding: space.lg,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    maxHeight: '90%',
  },
  dialogScroll: { flexGrow: 0 },
  question: { color: album.ink },
  dialogDetail: { ...text.body, color: album.pencil, marginTop: space.sm },
  dialogButton: {
    minHeight: touch.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.touch,
  },
  confirmButton: { marginTop: space.lg, backgroundColor: album.hairline },
  keepButton: { marginTop: space.sm, backgroundColor: album.ink },
  confirmText: { ...text.button, color: album.ink, textAlign: 'center' },
  keepText: { ...text.button, color: album.page, textAlign: 'center' },

  comfortCard: {
    ...shadow,
    elevation: 6,
    backgroundColor: album.clip,
    borderRadius: radius.paper,
    padding: space.lg,
    marginBottom: space.lg,
    gap: space.sm,
  },
  paperclip: { position: 'absolute', top: -16, left: space.screen, transform: [{ rotate: '8deg' }] },
});
