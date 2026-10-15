import type { Lang } from './i18n';

/**
 * Tearnote design tokens. Constants only — no components, context or hooks. The one exception:
 * the `pencil` handwriting family changes with the language (`setHandwriting`).
 *
 * Every value below assumes: 2 a.m., just finished crying, one hand, in the dark, blurry eyes.
 * Dark is the only theme; there is no light mode.
 */

/**
 * The "black-page photo album" world used by every screen (DESIGN.md).
 * Warm, not cold: every tone leans brown, no blue-grey.
 */
export const album = {
  /** Album page. */
  page: '#1A1614',
  /** Cards: Entry, primary button. Just light enough to read as lying on the page. */
  card: '#2B2622',
  /** Small note clipped on by a stranger: a received Comfort. */
  clip: '#3A322C',
  /** Body text on cards. ~11:1 on `card` — readable with blurry eyes, not harsh white. */
  ink: '#E4DCCF',
  /** White pencil: captions, dates, intensity tear. ~7.8:1 on `page`. */
  pencil: '#B3AA9C',
  /** Photo corners — same tone as `pencil`. */
  corner: '#B3AA9C',
  /** Tissue paper between nights: a very faint light band. */
  tissue: 'rgba(228, 220, 207, 0.06)',
  /** The only hairline: top edge of the footer, empty-page frame. */
  hairline: 'rgba(228, 220, 207, 0.12)',
  /** The only accent color: the help button (~8:1 on `page`). */
  lamp: '#E2A55A',
  /** Pressed Entry card, between `card` and `clip`: shadows barely show on black, so pressing lightens. */
  cardLifted: '#322C27',
  /**
   * Errors only: text and border of a field that failed validation, and form error lines (~7:1 on `page`).
   * Warm terracotta, not alarm red; never for selection or emphasis — `lamp` stays the only accent.
   */
  alert: '#E38B76',
  /** Scrim behind dialogs and behind the × on thumbnails: warm black, not #000. */
  scrim: 'rgba(10, 8, 7, 0.72)',
  /**
   * Year grid on the Calendar screen — the only exception to the One Axis rule (DESIGN.md).
   * Index 0 = a real day with no Entry, then 5 levels from `THRESHOLDS` in `calendar.ts`: one tone,
   * only the opacity changes. The intensity slider in new.tsx reuses `calendar[1..5]`.
   */
  calendar: [
    'rgba(228, 220, 207, 0.06)',
    'rgba(228, 220, 207, 0.22)',
    'rgba(228, 220, 207, 0.40)',
    'rgba(228, 220, 207, 0.58)',
    'rgba(228, 220, 207, 0.78)',
    'rgba(228, 220, 207, 1)',
  ],
} as const;

/**
 * Handwriting (loaded in _layout) for titles and captions; Reflection and buttons stay on the system
 * font for readability. Patrick Hand for vi/en; Yomogi for ja because Patrick Hand has no kana.
 * Never Yomogi for Vietnamese: its Latin glyphs are fixed-width and split accented letters ("l ần").
 */
const HANDWRITING_FONT: Record<Lang, string> = { vi: 'PatrickHand', en: 'PatrickHand', ja: 'Yomogi' };

const makePencil = (fontFamily: string) => ({
  title: { fontFamily, fontSize: 34, lineHeight: 46 },
  date: { fontFamily, fontSize: 22, lineHeight: 33 },
  note: { fontFamily, fontSize: 19, lineHeight: 29 },
});

export const pencil = makePencil('PatrickHand');

/**
 * Called only by i18n, right before the UI tree is rebuilt. Replaces the three objects instead of
 * mutating them: RN freezes styles passed as props (dev builds throw on mutation). So never spread
 * `...pencil.x` into a module-level StyleSheet — the copy keeps the old font; use `[pencil.x, s.y]`.
 */
export function setHandwriting(lang: Lang) {
  Object.assign(pencil, makePencil(HANDWRITING_FONT[lang]));
}

/**
 * Type scale on the system font (no family set anywhere). Titles and section labels use `pencil`.
 * A body font, if ever added, must cover Vietnamese diacritics and Japanese kana in ONE family
 * (e.g. Noto Sans / Noto Sans JP), so rhythm does not drift between locales.
 *
 * Starts at 17, nothing below 14: blurry eyes at midnight cannot read a 12pt caption.
 * lineHeight ~1.5 because Vietnamese stacks two levels of diacritics; tighter lines make them touch
 * the line above. Only weights 400 / 500: Android's Roboto renders '600' inconsistently.
 */
export const text = {
  /** Body: Reflection, Comfort text. The app's default size. */
  body: { fontSize: 17, fontWeight: '400', lineHeight: 26 },
  /** Buttons and tags. One weight heavier than body so touch targets read without borders. */
  button: { fontSize: 17, fontWeight: '500', lineHeight: 22 },
  /** Secondary: time, duration. The smallest allowed size. */
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
} as const;

/**
 * Spacing, looser than usual: white space says "nothing is urgent", and a one-handed thumb needs
 * margin between touch targets to avoid mis-taps.
 */
export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  /** Between large blocks / between Entries of different days. */
  xl: 40,
  /** Horizontal margin of every screen. */
  screen: 20,
} as const;

/**
 * Touch targets. 48dp (Android guideline) is the floor, not the goal:
 * one-handed taps in the dark miss far more often.
 */
export const touch = {
  /** Floor for anything pressable: icons, tags, intensity steps. */
  min: 48,
  /** Primary actions: save Entry, send Comfort. */
  primary: 56,
  /** Hotline button. Bigger because hands shake most when it is needed. */
  hotline: 64,
} as const;

/**
 * Corner radius (DESIGN.md › Shapes): photo corners ⇒ square (0, no token); touched by a finger ⇒ `touch`;
 * loose paper (clip, Comfort note, hotline card, dialog) ⇒ `paper`. Circles are shapes, not a third
 * radius. Nothing ≥ 20 (no pills).
 */
export const radius = { paper: 6, touch: 14 } as const;

