import { MaterialCommunityIcons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useFocusEffect, type Href } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type PressableProps,
  type ScrollViewProps,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, Path } from 'react-native-svg';
import type { z } from 'zod';

import { getSetting, setSetting, tagUsage, type Attachment, type Entry } from './db';
import { tagLabel, tagLabels, t } from './i18n';
import { quickTags, type Tag } from './tags';
import { album, pencil, radius, space, text, touch } from './theme';
import { fabPosition } from './validation';

/**
 * Only for pieces already used on at least two screens. Do not add anything here before
 * its second use — this file is not a component library.
 */

// Go back, or go home when the screen was opened directly from a deep link.
// `'/' as Href` works around typed routes generated wrong on Windows (CLAUDE.md).
export const leave = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));

/**
 * Pressable with a visible focus ring for keyboard / D-pad users (DESIGN.md › "Vòng focus").
 * A touch never moves focus, so the ring does not show on tap.
 */
export function FocusPressable({ style, onFocus, onBlur, ...rest }: PressableProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={(state) => [typeof style === 'function' ? style(state) : style, focused && s.focusRing]}
    />
  );
}

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
        <FocusPressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={spokenLabel}
          style={({ pressed }) => [s.card, pressed && s.lifted]}
        >
          <PhotoCorners />
          {photoRow}
          {words}
          {clip}
        </FocusPressable>
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
    <FocusPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t.newEntry.photoN(index + 1)}
      accessibilityHint={t.card.openPhotoHint}
      style={({ pressed }) => [frame, pressed && s.dim]}
      shouldRasterizeIOS
    >
      {photo}
    </FocusPressable>
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
    <FocusPressable
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
    </FocusPressable>
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
    <FocusPressable
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
    </FocusPressable>
  );
}

/**
 * Bar above the scroll area of every stacked screen: ← (or × on a modal), no title — the pencil title
 * stays in the page. The "Back" row at the end of the page stays too, for the thumb. DESIGN.md › TopBar.
 */
export function TopBar({ close }: { close?: boolean }) {
  useFocusEffect(
    useCallback(() => {
      topBars++;
      emitSnack();
      return () => {
        topBars--;
        emitSnack();
      };
    }, []),
  );
  return (
    <View style={s.topBar}>
      <FocusPressable
        onPress={leave}
        accessibilityRole="button"
        accessibilityLabel={close ? t.common.close : t.common.back}
        style={({ pressed }) => [s.topBarButton, pressed && s.dim]}
      >
        <MaterialCommunityIcons name={close ? 'close' : 'arrow-left'} size={24} color={album.ink} />
      </FocusPressable>
    </View>
  );
}

// 'offline': a network error that belongs to no field (DESIGN.md › TextField) — same paper, own icon.
type Snack = { id: number; message: string; kind: 'done' | 'deleted' | 'offline' };
let snack: Snack | null = null;
let snackTimer: ReturnType<typeof setTimeout> | undefined;
// Focused screens with a TopBar: a counter, not a flag, because the next screen's focus can run before
// the last screen's blur.
let topBars = 0;
const snackListeners = new Set<() => void>();
const emitSnack = () => snackListeners.forEach((l) => l());
const subscribeSnack = (l: () => void) => {
  snackListeners.add(l);
  return () => void snackListeners.delete(l);
};

/**
 * Short note that something just finished ("Đã lưu.", "Đã xoá."), at the top of whatever screen is shown next
 * (DESIGN.md › Snackbar). No action, no undo; a new one replaces the current one. Also read by screen readers.
 */
export function showSnackbar(message: string, kind: Snack['kind'] = 'done') {
  clearTimeout(snackTimer);
  snack = { id: (snack?.id ?? 0) + 1, message, kind };
  emitSnack();
  // `queue`: iOS VoiceOver otherwise cuts the message off when the next screen is announced. Android ignores it.
  AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
  snackTimer = setTimeout(() => {
    snack = null;
    emitSnack();
  }, 3000);
}

/** Mounted once in the root layout, above every screen and the help FAB. */
export function SnackbarHost() {
  const current = useSyncExternalStore(subscribeSnack, () => snack);
  const underTopBar = useSyncExternalStore(subscribeSnack, () => topBars > 0);
  const insets = useSafeAreaInsets();
  if (!current) return null;
  return (
    <View
      pointerEvents="none"
      style={[s.snackLayer, { top: insets.top + (underTopBar ? touch.min : 0) + space.sm }]}
    >
      <SnackPaper key={current.id} {...current} />
    </View>
  );
}

const SNACK_ICON: Record<Snack['kind'], IconName> = { done: 'check', deleted: 'trash-can-outline', offline: 'wifi-off' };

function SnackPaper({ message, kind }: Snack) {
  const y = useRef(new Animated.Value(-touch.min - space.lg)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }, [y]);
  return (
    // Already announced by showSnackbar; hidden from screen readers so it is not read twice.
    <Animated.View
      style={[s.snack, { transform: [{ translateY: y }] }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <MaterialCommunityIcons name={SNACK_ICON[kind]} size={20} color={album.pencil} />
      <Text style={s.snackText}>{message}</Text>
    </Animated.View>
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
    <FocusPressable
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
    </FocusPressable>
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
    <FocusPressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={busy && busyLabel ? busyLabel : label}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      style={({ pressed }) => [s.primaryButton, pressed && s.pressedPrimary, disabled && s.faded]}
    >
      {busy ? (
        <View style={s.waitRow}>
          <ActivityIndicator color={album.ink} />
          {busyLabel ? (
            <Text style={s.primaryText} maxFontSizeMultiplier={2}>
              {busyLabel}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={s.primaryText} maxFontSizeMultiplier={2}>
          {label}
        </Text>
      )}
    </FocusPressable>
  );
}

/**
 * Fixed footer outside the scroll area, holding only the screen's primary button (Save, Send, Log in…).
 * With no children there is no footer bar. Either way it anchors the help FAB above it: ADR 0005 requires
 * the help entry on every screen except the hotline screen itself.
 */
export function ScreenFooter({ children }: { children?: ReactNode }) {
  const footer = useRef<View>(null);
  const layer = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const [anchor, setAnchor] = useState<FabAnchor | null>(null);
  // Measured on screen, not from onLayout: an absolute child is placed inside the parent's padding
  // (the SafeAreaView top inset), while onLayout y counts from outside it.
  const measure = () =>
    footer.current?.measure((_x, _y, _w, _h, _px, footerY) =>
      layer.current?.measure((_x2, _y2, _w2, height, _px2, layerY) =>
        setAnchor({
          minLift: layerY + height - footerY + space.md,
          maxLift: height - touch.min - space.md - Math.max(0, insets.top - layerY),
        }),
      ),
    );
  return (
    <>
      <View ref={footer} style={children ? s.footer : null} onLayout={measure}>
        {children}
      </View>
      <View ref={layer} style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={measure}>
        {anchor ? <HelpFab {...anchor} /> : null}
      </View>
    </>
  );
}

/** Bottom padding for a scroll area so its last line can scroll clear of the help FAB. */
export const FAB_CLEARANCE = touch.min + space.md + space.sm;

/** dp range for `lift` on this screen: `md` above the footer at least, `md` under the status bar at most. */
type FabAnchor = { minLift: number; maxLift: number };
type FabPosition = z.infer<typeof fabPosition>;
/** settings key, JSON FabPosition. `lift` = dp from the bottom of the screen area to the FAB (docs/db.md). */
const FAB_KEY = 'help_fab_position';
// Below this a touch is a tap that opens help, not a drag.
const FAB_SLOP = 6;

// One FAB per screen, but the user sees one button: position and fold state are shared by all of them.
type FabState = { position: FabPosition; collapsed: boolean };
let fab: FabState | null = null;
const fabListeners = new Set<() => void>();
// Read lazily, not at import: importing ui.tsx must not touch SQLite.
const fabSnapshot = (): FabState => {
  if (!fab) {
    let saved: unknown;
    try {
      saved = JSON.parse(getSetting(FAB_KEY) ?? 'null');
    } catch {}
    fab = { position: fabPosition.parse(saved), collapsed: false };
  }
  return fab;
};
const setFab = (next: Partial<FabState>) => {
  fab = { ...fabSnapshot(), ...next };
  fabListeners.forEach((l) => l());
};
const subscribeFab = (l: () => void) => {
  fabListeners.add(l);
  return () => void fabListeners.delete(l);
};

// Only the user's own drags fold the FAB: scrollTo (Timeline on open / after Save) must not.
let scrollDragging = false;
let lastScrollY = 0;
const stopScrollDrag = () => {
  scrollDragging = false;
};
/** Spread on a screen's ScrollView: the help FAB folds to a circle scrolling down, opens scrolling up. */
export const fabScrollProps = {
  scrollEventThrottle: 16,
  onScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollDragging = true;
    lastScrollY = e.nativeEvent.contentOffset.y;
  },
  onScrollEndDrag: stopScrollDrag,
  onMomentumScrollEnd: stopScrollDrag,
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!scrollDragging) return;
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastScrollY;
    lastScrollY = y;
    const { collapsed } = fabSnapshot();
    if (y <= 0) {
      if (collapsed) setFab({ collapsed: false });
    } else if (Math.abs(dy) > 4 && (dy > 0) !== collapsed) setFab({ collapsed: dy > 0 });
  },
} satisfies ScrollViewProps;

/**
 * Floating help button (DESIGN.md › Layout). Drag past FAB_SLOP to move it: on release it snaps to the nearer
 * side and keeps its height. `lift` is kept from the bottom of the screen area, so it sits in the same spot
 * on every screen unless this screen's footer pushes it up.
 */
function HelpFab({ minLift, maxLift }: FabAnchor) {
  const { position, collapsed } = useSyncExternalStore(subscribeFab, fabSnapshot);
  const { side } = position;
  const lift = Math.max(minLift, Math.min(position.lift, maxLift));
  const { width: screenWidth } = useWindowDimensions();
  const [keyboard, setKeyboard] = useState(Keyboard.isVisible());
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState<number>(touch.min);
  const offset = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  // Every screen opens with the label showing.
  useFocusEffect(useCallback(() => setFab({ collapsed: false }), []));

  // Drop the drag offset only once the new side / lift is laid out, or the FAB jumps back for a frame.
  useLayoutEffect(() => offset.setValue({ x: 0, y: 0 }), [dragging, side, lift, offset]);

  const pan = useMemo(() => {
    const startX = side === 'left' ? space.screen : screenWidth - space.screen - width;
    const at = (dx: number, dy: number) => ({
      x: Math.min(Math.max(0, startX + dx), screenWidth - width),
      lift: Math.min(Math.max(minLift, lift - dy), maxLift),
    });
    const end = (dx: number, dy: number) => {
      const p = at(dx, dy);
      const next: FabPosition = { side: p.x + width / 2 < screenWidth / 2 ? 'left' : 'right', lift: Math.round(p.lift) };
      setSetting(FAB_KEY, JSON.stringify(next));
      setFab({ position: next });
      setDragging(false);
    };
    return PanResponder.create({
      // Capture: take the touch from the Pressable inside only once it moves, so a tap still opens help.
      onMoveShouldSetPanResponderCapture: (_e, g) => Math.hypot(g.dx, g.dy) > FAB_SLOP,
      onPanResponderGrant: () => setDragging(true),
      onPanResponderMove: (_e, g) => {
        const p = at(g.dx, g.dy);
        offset.setValue({ x: p.x - startX, y: lift - p.lift });
      },
      onPanResponderRelease: (_e, g) => end(g.dx, g.dy),
      onPanResponderTerminate: (_e, g) => end(g.dx, g.dy),
      onPanResponderTerminationRequest: () => false,
    });
  }, [side, lift, minLift, maxLift, screenWidth, width, offset]);

  if (keyboard) return null;
  return (
    <Animated.View
      {...pan.panHandlers}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        s.fabSlot,
        side === 'left' ? { left: space.screen } : { right: space.screen },
        { bottom: lift, transform: offset.getTranslateTransform() },
      ]}
    >
      <FocusPressable
        onPress={() => router.push('/help')}
        accessibilityRole="button"
        // The short visible label is not enough for a screen reader user looking for help.
        accessibilityLabel={t.common.needHelp}
        accessibilityHint={t.common.needHelpHint}
        style={({ pressed }) => [s.fab, collapsed && s.fabCollapsed, dragging && s.fabDragging, pressed && s.helpPressed]}
      >
        {({ pressed }) => (
          <>
            <MaterialCommunityIcons name="lifebuoy" size={22} color={pressed ? album.page : album.lamp} />
            {collapsed ? null : (
              <Text style={[s.helpText, pressed && s.helpTextPressed]} maxFontSizeMultiplier={2}>
                {t.common.help}
              </Text>
            )}
          </>
        )}
      </FocusPressable>
    </Animated.View>
  );
}

/** Hotline Call button. With the help FAB, the only places that use `album.lamp` (DESIGN.md › One Lamp rule). */
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
    <FocusPressable
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
          <Text style={[s.helpText, pressed && s.helpTextPressed]} maxFontSizeMultiplier={2}>
            {label}
          </Text>
        </>
      )}
    </FocusPressable>
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
    <FocusPressable
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
    </FocusPressable>
  );
}

/**
 * Tag choice on the entry and write screens. The admin list can grow, so the form shows only `quickTags`
 * (most picked + selected) and puts the rest behind "Chuyện khác…" — DESIGN.md › "Chọn chuyện".
 * `tags`: what this screen offers, in admin order; `label`: the question above, reused as the sheet title.
 */
export function TagPicker({
  tags,
  selected,
  max,
  label,
  disabled,
  onToggle,
}: {
  tags: readonly Tag[];
  selected: readonly string[];
  max: number;
  label: string;
  disabled?: boolean;
  onToggle: (id: string) => void;
}) {
  // Read once per mount: the row must not reorder while the user is picking.
  const [usage] = useState(tagUsage);
  // Every Tag picked during this mount stays on the row, so unselecting one does not pull it from under the finger.
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const { row, more } = quickTags(tags, usage, [...new Set([...selected, ...picked])]);
  const full = selected.length >= max;
  const toggle = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev : [...prev, id]));
    onToggle(id);
  };
  return (
    <>
      {/* Gives the group a name for TalkBack group navigation, like the other choice groups. */}
      <View style={s.tagRow} role="group" accessibilityLabel={label}>
        {row.map(({ id }) => {
          const on = selected.includes(id);
          return (
            <Pill
              key={id}
              label={tagLabel(id)}
              selected={on}
              disabled={disabled || (full && !on)}
              onPress={() => toggle(id)}
            />
          );
        })}
        {more ? (
          <SecondaryButton icon="dots-horizontal" label={t.tagPicker.more} disabled={disabled} onPress={() => setOpen(true)} />
        ) : null}
      </View>
      <TagSheet
        open={open}
        tags={tags}
        selected={selected}
        max={max}
        title={label}
        onToggle={toggle}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const TAG_GROUPS = ['sad', 'joy', 'unknown'] as const;

/**
 * Every Tag, one checkbox row each, grouped by kind in admin order (not by use, so it can be searched from
 * memory). A tick applies at once; "Xong", the backdrop and Back all close and keep the picks.
 */
function TagSheet({
  open,
  tags,
  selected,
  max,
  title,
  onToggle,
  onClose,
}: {
  open: boolean;
  tags: readonly Tag[];
  selected: readonly string[];
  max: number;
  title: string;
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  // Starts 24 below and rises on show; back to 24 once closed so the next open rises again.
  const rise = useRef(new Animated.Value(24)).current;
  const full = selected.length >= max;
  useEffect(() => {
    if (!open) rise.setValue(24);
  }, [open, rise]);
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onShow={() => {
        Animated.timing(rise, { toValue: 0, duration: 220, useNativeDriver: true }).start();
      }}
    >
      <View style={s.sheetBackdrop}>
        {/* Sibling, not a wrapper, for the same reason as in ConfirmDialog. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} focusable={false} />
        <Animated.View
          style={[s.sheet, { paddingBottom: space.md + insets.bottom, transform: [{ translateY: rise }] }]}
          accessibilityViewIsModal
        >
          <Text style={[pencil.date, s.question]} accessibilityRole="header">
            {title}
          </Text>
          <Text style={s.sheetCount} accessibilityLiveRegion="polite">
            {t.tagPicker.count(max, selected.length)}
          </Text>
          <ScrollView style={s.sheetList}>
            {TAG_GROUPS.map((kind) => {
              const items = tags.filter((tag) => tag.kind === kind);
              if (items.length === 0) return null;
              return (
                <View key={kind}>
                  <Text style={s.sheetGroup} accessibilityRole="header">
                    {t.tagPicker.groups[kind]}
                  </Text>
                  {items.map(({ id }) => {
                    const on = selected.includes(id);
                    const off = full && !on;
                    return (
                      <FocusPressable
                        key={id}
                        onPress={() => onToggle(id)}
                        disabled={off}
                        accessibilityRole="checkbox"
                        accessibilityLabel={tagLabel(id)}
                        accessibilityState={{ checked: on, disabled: off }}
                        style={({ pressed }) => [s.checkRow, pressed && s.dim, off && s.faded]}
                      >
                        <MaterialCommunityIcons
                          name={on ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={24}
                          color={on ? album.ink : album.pencil}
                        />
                        <Text style={s.checkLabel}>{tagLabel(id)}</Text>
                      </FocusPressable>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
          {/* ConfirmDialog's safe button: a clip primary would vanish on the clip sheet. */}
          <FocusPressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [s.dialogButton, s.sheetDone, pressed && s.pressedSelected]}
          >
            <Text style={s.keepText} maxFontSizeMultiplier={2}>
              {t.tagPicker.done}
            </Text>
          </FocusPressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Brings a TextField (or its error) back above the keyboard; null outside FormScrollView.
const RevealContext = createContext<{ follow: (input: TextInput) => void; showError: (box: View) => void } | null>(null);

/**
 * ScrollView for screens with TextFields. iOS `automaticallyAdjustKeyboardInsets` scrolls to the input only
 * when the keyboard opens; if the user scrolls away and types, or a multiline input grows, iOS does not follow.
 * So each TextField asks this view to scroll it back on every change. Android scrolls to the cursor natively.
 */
export function FormScrollView({ ref: outerRef, ...props }: ScrollViewProps & { ref?: Ref<ScrollView> }) {
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
  // An error that appears under the focused field lands behind the keyboard on both platforms
  // (Android only scrolls to the cursor). Scroll just enough to show the field with its error.
  // ponytail: only the focused field; an error under an unfocused field lower down can stay hidden.
  const showError = (box: View) => {
    const view = ref.current;
    if (!view) return;
    const keyboardTop = Keyboard.metrics()?.screenY ?? Infinity;
    box.measureInWindow((_x, top, _w, height) => {
      view.getNativeScrollRef()?.measureInWindow((_x2, viewTop, _w2, viewHeight) => {
        const below = top + height + space.md - Math.min(viewTop + viewHeight, keyboardTop);
        if (below > 0) view.scrollTo({ y: offset.current + below });
      });
    });
  };
  return (
    <RevealContext value={{ follow: reveal, showError }}>
      <ScrollView
        ref={(node) => {
          ref.current = node;
          if (typeof outerRef === 'function') outerRef(node);
          else if (outerRef) outerRef.current = node;
        }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        {...fabScrollProps}
        {...props}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
          fabScrollProps.onScroll(e);
          props.onScroll?.(e);
        }}
      />
    </RevealContext>
  );
}

/**
 * Text input. The 2px border is always there (`fieldBorder` at rest, `pencil` on focus) so focus does not shift the text.
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
  hint,
  password,
  ...rest
}: TextInputProps & {
  ref?: Ref<TextInput>;
  error?: string | null;
  /** Fixed rule under the field ("At least 6 characters."); the error takes its place. Not a placeholder: that disappears while typing. */
  hint?: string;
  /** Hidden text with a 48×48 eye button to show it; no "repeat password" field. DESIGN.md › "Ô nhập". */
  password?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  const [shown, setShown] = useState(false);
  const reveal = useContext(RevealContext);
  const input = useRef<TextInput>(null);
  const box = useRef<View>(null);
  const hasError = !!error;
  useEffect(() => {
    // After the error has been laid out, so the measured box includes it.
    if (hasError && input.current?.isFocused()) requestAnimationFrame(() => box.current && reveal?.showError(box.current));
    // Only when an error appears, not on every keystroke while it stays (the context object is new on every render).
  }, [hasError]);
  return (
    <View ref={box}>
      <TextInput
        secureTextEntry={password && !shown}
        accessibilityHint={hint}
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
          if (input.current) reveal?.follow(input.current);
        }}
        // A multiline input grows after onChangeText has measured it.
        onContentSizeChange={(e) => {
          onContentSizeChange?.(e);
          if (input.current?.isFocused()) reveal?.follow(input.current);
        }}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        style={[
          s.input,
          rest.multiline && s.inputMultiline,
          password && s.inputPassword,
          focus && s.inputFocus,
          error && s.inputError,
          style,
        ]}
      />
      {password ? (
        <FocusPressable
          onPress={() => setShown(!shown)}
          accessibilityRole="button"
          accessibilityLabel={shown ? t.common.hidePassword : t.common.showPassword}
          style={({ pressed }) => [s.eye, pressed && s.dim]}
        >
          <MaterialCommunityIcons name={shown ? 'eye-off-outline' : 'eye-outline'} size={24} color={album.pencil} />
        </FocusPressable>
      ) : null}
      {error ? <FieldError message={error} /> : hint ? <Text style={s.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

/**
 * Error right under what failed: a TextField (via its `error` prop), a group of choices, or an action that
 * did not work (requesting a Comfort). Not for states that are not errors, like an empty pool. DESIGN.md › "Báo lỗi".
 */
export function FieldError({ message }: { message: string }) {
  return (
    <View style={s.fieldError} accessibilityRole="alert">
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={18}
        color={album.alert}
        style={s.fieldErrorIcon}
        importantForAccessibility="no"
        accessibilityElementsHidden
      />
      <Text style={s.fieldErrorText}>{message}</Text>
    </View>
  );
}

/** A spinner never stands alone: it says what it waits for, and screen readers hear it when it appears. */
export function Loading({ label }: { label: string }) {
  // A live region is not read reliably when it first mounts.
  useEffect(() => AccessibilityInfo.announceForAccessibility(label), [label]);
  return (
    <View style={s.loading} accessible accessibilityLabel={label}>
      <ActivityIndicator color={album.pencil} />
      <Text style={s.loadingText}>{label}</Text>
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
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} focusable={false} />
        {request ? (
          <View style={s.dialog} accessibilityViewIsModal>
            <ScrollView style={s.dialogScroll}>
              <Text style={[pencil.date, s.question]} accessibilityRole="header">
                {request.question}
              </Text>
              {request.detail ? <Text style={s.dialogDetail}>{request.detail}</Text> : null}
            </ScrollView>
            <FocusPressable
              onPress={() => {
                const action = request.onConfirm;
                onClose();
                action();
              }}
              accessibilityRole="button"
              style={({ pressed }) => [s.dialogButton, s.confirmButton, pressed && s.dim]}
            >
              <Text style={s.confirmText} maxFontSizeMultiplier={2}>
                {request.confirmLabel}
              </Text>
            </FocusPressable>
            <FocusPressable
              onPress={onClose}
              accessibilityRole="button"
              style={({ pressed }) => [s.dialogButton, s.keepButton, pressed && s.pressedSelected]}
            >
              <Text style={s.keepText} maxFontSizeMultiplier={2}>
                {request.keepLabel ?? t.common.keep}
              </Text>
            </FocusPressable>
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
  // Padding 12 less than the screen margin: the 24 icon centred in its 48 box lines up with the page text.
  topBar: { height: touch.min, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.screen - 12, backgroundColor: album.page },
  snackLayer: { position: 'absolute', left: space.screen, right: space.screen },
  snack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.paper,
    backgroundColor: album.clip,
    ...shadow,
  },
  snackText: { ...text.body, color: album.ink, flexShrink: 1 },
  topBarButton: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center', borderRadius: radius.touch },
  // `outline` draws outside the layout and follows borderRadius, so focus does not move anything.
  focusRing: { outlineColor: album.pencil, outlineWidth: 2, outlineOffset: 2, outlineStyle: 'solid' },
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
    // One step brighter than every other control, so the screen's main action stands out.
    backgroundColor: album.clip,
  },
  // Pressed = one step lighter: shadows barely show on a black page, brightness does.
  pressedPrimary: { backgroundColor: album.clipPressed },
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
  fabSlot: { position: 'absolute' },
  // Solid page fill: content scrolling under the label must not show through.
  fab: {
    ...shadow,
    height: touch.min,
    minWidth: touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: space.md,
    backgroundColor: album.page,
    borderWidth: 1.5,
    borderColor: album.lamp,
    borderRadius: radius.touch,
  },
  fabCollapsed: { width: touch.min, paddingLeft: 0, paddingRight: 0, borderRadius: touch.min / 2 },
  fabDragging: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 10 },
  helpText: { ...text.button, color: album.lamp, textAlign: 'center', flexShrink: 1 },
  helpTextPressed: { color: album.page },

  pill: {
    minHeight: touch.min,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.touch,
    backgroundColor: album.hairline,
  },
  pillSelected: { backgroundColor: album.ink },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: album.scrim },
  sheet: {
    ...shadow,
    elevation: 6,
    maxHeight: '80%',
    backgroundColor: album.clip,
    borderTopLeftRadius: radius.paper,
    borderTopRightRadius: radius.paper,
    paddingTop: space.lg,
    paddingHorizontal: space.screen,
  },
  sheetCount: { ...text.caption, color: album.pencil, marginTop: space.xs },
  sheetList: { flexGrow: 0, marginTop: space.sm, marginBottom: space.md },
  sheetGroup: { ...text.caption, color: album.pencil, marginTop: space.md, marginBottom: space.xs },
  checkRow: { minHeight: touch.min, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: space.sm },
  checkLabel: { ...text.body, color: album.ink, flex: 1 },
  sheetDone: { backgroundColor: album.ink },
  pillText: { ...text.button, color: album.pencil },
  pillTextSelected: { color: album.page },

  // No lineHeight on a single-line input: iOS UITextField puts the extra line space above the text,
  // so the text sits low instead of centered.
  input: {
    fontSize: text.body.fontSize,
    fontWeight: text.body.fontWeight,
    color: album.ink,
    backgroundColor: album.card,
    borderRadius: radius.touch,
    borderWidth: 2,
    borderColor: album.fieldBorder,
    paddingHorizontal: space.md - 2,
    minHeight: touch.min,
  },
  inputMultiline: { lineHeight: text.body.lineHeight },
  // Room for the eye button so long passwords never run under it.
  inputPassword: { paddingRight: touch.min },
  eye: { position: 'absolute', top: 0, right: 0, width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  fieldHint: { ...text.caption, color: album.pencil, marginTop: space.xs },
  inputFocus: { borderColor: album.pencil },
  inputError: { borderColor: album.alert },
  fieldError: { flexDirection: 'row', gap: space.xs, marginTop: space.xs },
  // Centers the 18 icon on the first 20-high caption line.
  fieldErrorIcon: { marginTop: 1 },
  fieldErrorText: { ...text.caption, color: album.alert, flex: 1 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  loadingText: { ...text.caption, color: album.pencil },

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
