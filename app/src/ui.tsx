import { Pressable, StyleSheet, Text } from 'react-native';

import { color, radius, space, text, touch } from './theme';

/**
 * Chỗ duy nhất cho thứ đã lặp từ lần thứ hai. Đừng đẩy thêm gì vào đây trước khi
 * nó thật sự xuất hiện ở hai màn — file này không phải kho component.
 */

/** Tag chọn được. Dùng ở màn ghi Entry (tối đa 3) và màn viết Comfort (tối đa 2). */
export function Pill({
  nhan,
  chon,
  tat,
  onPress,
}: {
  nhan: string;
  chon: boolean;
  tat?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={tat}
      accessibilityRole="button"
      accessibilityState={{ selected: chon, disabled: !!tat }}
      style={[s.pill, chon && s.pillChon, tat && s.pillTat]}
    >
      <Text style={[s.chuPill, chon && s.chuPillChon]}>{nhan}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: {
    minHeight: touch.toiThieu,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.vien,
    backgroundColor: color.matGiay,
  },
  pillChon: { backgroundColor: color.anhTrang },
  pillTat: { opacity: 0.35 },
  chuPill: { ...text.nut, color: color.chuPhu },
  chuPillChon: { color: color.demKhuya },
});
