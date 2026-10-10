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
/** "1–2" … "10+", suy từ THRESHOLDS để chú thích không lệch ngưỡng. */
const LEVEL_LABELS = THRESHOLDS.map((n, i) => (i === THRESHOLDS.length - 1 ? `${n}+` : `${n}–${THRESHOLDS[i + 1] - 1}`));
/** Cùng các mức, viết thành lời cho screen reader — không đoán được giọng đọc xử lý "–" và "+". */
const spokenLevels = () =>
  THRESHOLDS.map((n, i) => (i === THRESHOLDS.length - 1 ? t.calendar.levelRange(n) : t.calendar.levelRange(n, THRESHOLDS[i + 1] - 1)));

/**
 * Bảng cường độ cả năm: 12 cột tháng × 31 hàng ngày, màu theo tổng cường độ trong ngày.
 * Chỉ để nhìn — ô không bấm được, không có số. Ngoại lệ luật Một Trục, xem DESIGN.md.
 */
export default function CalendarScreen() {
  const today = new Date();
  const thisYear = today.getFullYear();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [year, setYear] = useState(thisYear);

  useFocusEffect(useCallback(() => setEntries(listEntries()), []));

  // listEntries sắp giảm dần: phần tử cuối là Entry đầu tiên.
  const firstYear = Math.min(
    entries.length ? new Date(entries[entries.length - 1].occurredAt).getFullYear() : thisYear,
    thisYear,
  );
  const totals = dailyTotals(entries, year);
  // Hôm nay chỉ đánh dấu trên bảng của năm nay.
  const currentMonth = year === thisYear ? today.getMonth() : -1;
  const currentDay = today.getDate() - 1;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Năm nằm cùng hàng tiêu đề: không mở hộp chọn, và trả lại chỗ để thấy đủ 31 hàng trong một màn. */}
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

        {/* Nhãn hàng/cột cao đúng một ô nên không theo cỡ chữ hệ thống: ở 200% "10" còn "1", "T10" thành
            "T…". Screen reader đọc tóm tắt từng tháng, không mất thông tin. */}
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
              // Screen reader đọc tóm tắt từng tháng, không đọc 31 ô.
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
                    // Ngày không tồn tại (30/2…) không tô gì, khác ô trống của ngày có thật.
                    <View
                      key={dayIndex}
                      style={[
                        s.cell,
                        dayIndex < daysInMonth && { backgroundColor: album.calendar[level] },
                        // Hôm nay: vòng bút chì; ô đã đậm (mức ≥ 3) thì vòng màu trang để còn thấy.
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

/** Nút lùi / tới một năm: chỉ hiện khi có từ hai năm; hết đầu / cuối thì mờ và tắt. */
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
  // Đi sau pencil.note trong mảng style: pencil đổi họ chữ theo ngôn ngữ, không trải vào đây được.
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
