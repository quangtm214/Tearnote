import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { insertEntry } from '@/db';
import { MAX_ENTRY_TAGS, TAG_IDS, TAG_LABEL_VI, type TagId } from '@/tags';
import { color, radius, space, text, touch } from '@/theme';

const luc = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: 'numeric',
  month: 'numeric',
  hour12: false,
});

/** Lùi thời điểm — thay cho date picker, không thêm dependency. */
const LUI = [
  { nhan: 'Vừa xong', phut: 0 },
  { nhan: '1 giờ trước', phut: 60 },
  { nhan: '3 giờ trước', phut: 180 },
  { nhan: 'Hôm qua', phut: 60 * 24 },
];

/** Thời lượng ước lượng, bỏ qua được (null). */
const THOI_LUONG: { nhan: string; phut: number | null }[] = [
  { nhan: 'Không nhớ', phut: null },
  { nhan: 'Vài phút', phut: 5 },
  { nhan: '15 phút', phut: 15 },
  { nhan: 'Nửa tiếng', phut: 30 },
  { nhan: 'Lâu hơn', phut: 60 },
];

const CUONG_DO = [1, 2, 3, 4, 5];

function Pill({
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
      style={[styles.pill, chon && styles.pillChon, tat && styles.pillTat]}
    >
      <Text style={[styles.chuPill, chon && styles.chuPillChon]}>{nhan}</Text>
    </Pressable>
  );
}

export default function GhiEntry() {
  const [luiPhut, setLuiPhut] = useState(0);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [tags, setTags] = useState<TagId[]>([]);
  const [reflection, setReflection] = useState('');

  const daDay = tags.length >= MAX_ENTRY_TAGS;

  const doiTag = (t: TagId) =>
    setTags((cu) => (cu.includes(t) ? cu.filter((x) => x !== t) : [...cu, t]));

  const luu = () => {
    insertEntry({
      occurredAt: Date.now() - luiPhut * 60_000,
      durationMin,
      intensity,
      tags,
      reflection: reflection.trim() === '' ? null : reflection.trim(),
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.man} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.cuon} keyboardShouldPersistTaps="handled">
        {/* Nửa trên: chỉ để đọc. Mọi vùng bấm nằm nửa dưới, tầm ngón cái. */}
        <View style={styles.nuaTren}>
          <Text style={styles.tieuDe}>Lúc nãy thế nào?</Text>
          <Text style={styles.phu}>Bỏ qua được hết, trừ thời điểm và cường độ.</Text>
        </View>

        <Text style={styles.nhan}>Lúc nào?</Text>
        <Text style={styles.phu}>{luc.format(Date.now() - luiPhut * 60_000)}</Text>
        <View style={styles.hang}>
          {LUI.map((o) => (
            <Pill
              key={o.nhan}
              nhan={o.nhan}
              chon={luiPhut === o.phut}
              onPress={() => setLuiPhut(o.phut)}
            />
          ))}
        </View>

        <Text style={styles.nhan}>Kéo dài bao lâu?</Text>
        <View style={styles.hang}>
          {THOI_LUONG.map((o) => (
            <Pill
              key={o.nhan}
              nhan={o.nhan}
              chon={durationMin === o.phut}
              onPress={() => setDurationMin(o.phut)}
            />
          ))}
        </View>

        <Text style={styles.nhan}>Nặng đến đâu?</Text>
        <View style={styles.hang}>
          {CUONG_DO.map((n) => (
            <Pressable
              key={n}
              onPress={() => setIntensity(n)}
              accessibilityRole="button"
              accessibilityLabel={`Cường độ ${n} trên 5`}
              accessibilityState={{ selected: intensity === n }}
              style={styles.oNac}
            >
              <View
                style={[
                  styles.nac,
                  { height: 12 + n * 9 },
                  n <= intensity && styles.nacChon,
                ]}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.nhan}>Vì chuyện gì?</Text>
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

        <Text style={styles.nhan}>Còn gì nữa không?</Text>
        <TextInput
          value={reflection}
          onChangeText={setReflection}
          placeholder="Muốn viết gì thì viết."
          placeholderTextColor={color.chuPhu}
          multiline
          textAlignVertical="top"
          style={styles.oNhap}
        />

        <Pressable style={styles.nutLuu} onPress={luu}>
          <Text style={styles.chuNutLuu}>Lưu lại</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: color.demKhuya },
  cuon: { paddingHorizontal: space.man, paddingBottom: space.xl },
  nuaTren: { minHeight: 200, justifyContent: 'flex-end', paddingBottom: space.lg },
  tieuDe: { ...text.tieuDe, color: color.chuChinh },
  nhan: { ...text.nhan, color: color.chuChinh, marginTop: space.lg },
  phu: { ...text.phu, color: color.chuPhu, marginTop: space.xs },
  hang: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
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
  oNac: {
    width: touch.toiThieu,
    height: touch.toiThieu,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingBottom: space.sm,
  },
  nac: { width: 6, borderRadius: radius.vien, backgroundColor: color.matGiay },
  nacChon: { backgroundColor: color.anhTrang },
  oNhap: {
    ...text.than,
    color: color.chuChinh,
    backgroundColor: color.matGiay,
    borderRadius: radius.o,
    padding: space.md,
    minHeight: 120,
    marginTop: space.md,
  },
  nutLuu: {
    height: touch.chinh,
    borderRadius: radius.o,
    backgroundColor: color.matGiay,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    marginTop: space.xl,
  },
  chuNutLuu: { ...text.nut, color: color.chuChinh },
});
