import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listEntries, type Entry } from '@/db';
import { t } from '@/i18n';
import { colorLevel, THRESHOLDS, dailyTotals } from '@/calendar';
import { album, pencil, space, text, touch } from '@/theme';
import { ScreenFooter, type IconName } from '@/ui';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
/** "1–2" … "10+", derived from THRESHOLDS so the legend never drifts from them. */
const LEVEL_LABELS = THRESHOLDS.map((n, i) => (i === THRESHOLDS.length - 1 ? `${n}+` : `${n}–${THRESHOLDS[i + 1] - 1}`));
/** The same levels in words for screen readers, which read "–" and "+" unpredictably. */
const spokenLevels = () =>
  THRESHOLDS.map((n, i) => (i === THRESHOLDS.length - 1 ? t.calendar.levelRange(n) : t.calendar.levelRange(n, THRESHOLDS[i + 1] - 1)));

/**
 * Year intensity grid: 12 month columns × 31 day rows, colored by the daily intensity sum.
 * View only — cells are not pressable and show no numbers. Exception to the One Axis rule, see DESIGN.md.
 */
export default function CalendarScreen() {
  const today = new Date();
  const thisYear = today.getFullYear();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [year, setYear] = useState(thisYear);

  useFocusEffect(useCallback(() => setEntries(listEntries()), []));

  // listEntries is sorted newest first: the last item is the first Entry.
  const firstYear = Math.min(
    entries.length ? new Date(entries[entries.length - 1].occurredAt).getFullYear() : thisYear,
    thisYear,
  );
  const totals = dailyTotals(entries, year);
  // Today is marked only on the current year's grid.
  const currentMonth = year === thisYear ? today.getMonth() : -1;
  const currentDay = today.getDate() - 1;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Year sits on the title row: no picker, and it saves room to fit all 31 rows on one screen. */}
        <View style={s.header}>
          <Text style={[pencil.title, s.title]} accessibilityRole="header">
            {t.calendar.title}
          </Text>
          <View style={s.yearGroup}>
            {firstYear < thisYear ? (
              <YearButton
                icon="chevron-left"
                label={t.calendar.prevYear}
                disabled={year <= firstYear}
                onPress={() => setYear(year - 1)}
              />
            ) : null}
            <Text style={s.yearText} accessibilityLiveRegion="polite">
              {year}
            </Text>
            {firstYear < thisYear ? (
              <YearButton
                icon="chevron-right"
                label={t.calendar.nextYear}
                disabled={year >= thisYear}
                onPress={() => setYear(year + 1)}
              />
            ) : null}
          </View>
        </View>

        {/* Row/column labels are one cell tall, so they ignore system font scaling: at 200% "10" shows as "1".
            Screen readers get a per-month summary, so nothing is lost. */}
        <View style={s.grid}>
          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Text style={[pencil.note, s.columnLabel, s.rowLabelSpacer]} allowFontScaling={false}> </Text>
            {DAYS.map((d) => (
              <Text
                key={d}
                style={[pencil.note, s.rowLabel, d - 1 === currentDay && currentMonth >= 0 && s.labelToday]}
                allowFontScaling={false}
              >
                {d}
              </Text>
            ))}
          </View>
          {totals.map((monthTotals, monthIndex) => {
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            const cryDays = monthTotals.filter(Boolean);
            return (
              // Screen readers read one summary per month, not 31 cells.
              <View
                key={monthIndex}
                style={s.column}
                accessible
                accessibilityLabel={
                  cryDays.length
                    ? t.calendar.monthSummary(monthIndex + 1, cryDays.length, Math.max(...cryDays))
                    : t.calendar.monthEmpty(monthIndex + 1)
                }
              >
                <Text
                  style={[pencil.note, s.columnLabel, monthIndex === currentMonth && s.labelToday]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {t.calendar.monthLabel(monthIndex + 1)}
                </Text>
                {monthTotals.map((dayTotal, dayIndex) => {
                  const level = colorLevel(dayTotal);
                  return (
                    // Non-existent days (Feb 30…) are blank, unlike a real day with no Entry.
                    <View
                      key={dayIndex}
                      style={[
                        s.cell,
                        dayIndex < daysInMonth && { backgroundColor: album.calendar[level] },
                        // Today: pencil ring; on dark cells (level ≥ 3) a page-colored ring so it stays visible.
                        monthIndex === currentMonth && dayIndex === currentDay && [s.cellToday, { borderColor: level >= 3 ? album.page : album.ink }],
                      ]}
                    />
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={s.legend} accessible accessibilityLabel={t.calendar.legendA11y(spokenLevels())}>
          <Text style={[pencil.note, s.legendTitle]}>{t.calendar.legendTitle}</Text>
          {LEVEL_LABELS.map((label, i) => (
            <View key={label} style={s.legendItem}>
              <View style={[s.cell, { backgroundColor: album.calendar[i + 1] }]} />
              <Text style={[pencil.note, s.legendText]}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <ScreenFooter />
    </SafeAreaView>
  );
}

/** Previous / next year button: shown only with two or more years; faded and disabled at either end. */
function YearButton({ icon, label, disabled, onPress }: { icon: IconName; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [s.yearButton, pressed && s.pressed, disabled && s.faded]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={album.ink} />
    </Pressable>
  );
}

const CELL = 16;
const GAP = 2;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  scroll: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: space.lg },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  title: { color: album.ink },
  yearGroup: { flexDirection: 'row', alignItems: 'center' },
  yearButton: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  faded: { opacity: 0.35 },
  yearText: { ...text.button, color: album.ink },

  grid: { flexDirection: 'row', gap: GAP },
  column: { flex: 1, gap: GAP },
  // Used after pencil.note in a style array: pencil changes font per language, so it cannot be spread here.
  columnLabel: { fontSize: 14, lineHeight: 20, color: album.pencil, textAlign: 'center' },
  rowLabelSpacer: { width: 20 },
  rowLabel: {
    fontSize: 14,
    lineHeight: CELL,
    height: CELL,
    marginTop: GAP,
    color: album.pencil,
    textAlign: 'right',
    width: 20,
  },
  labelToday: { color: album.ink },
  cell: { height: CELL, minWidth: CELL, borderRadius: 3 },
  cellToday: { borderWidth: 1.5 },

  legend: { flexDirection: 'row', gap: space.md, marginTop: space.lg, marginBottom: space.md, flexWrap: 'wrap' },
  legendTitle: { color: album.pencil, width: '100%' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  legendText: { color: album.pencil },
});
