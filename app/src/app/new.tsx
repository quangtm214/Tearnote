import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { insertEntry } from '@/db';
import { MAX_ENTRY_TAGS, TAG_IDS, TAG_LABEL_VI, type TagId } from '@/tags';
import { album, butChi, space, text, touch } from '@/theme';
import { ChanMan, DongLoi, gio, NET, nhanNgay, NutChinh, Pill, THOI_LUONG } from '@/ui';

/** Lùi thời điểm — thay cho date picker, không thêm dependency. */
const LUI = [
  { nhan: 'Vừa xong', phut: 0 },
  { nhan: '1 giờ trước', phut: 60 },
  { nhan: '3 giờ trước', phut: 180 },
  { nhan: 'Hôm qua', phut: 60 * 24 },
];

const CUONG_DO = [1, 2, 3, 4, 5];

export default function GhiEntry() {
  const [luiPhut, setLuiPhut] = useState(0);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [tags, setTags] = useState<TagId[]>([]);
  const [reflection, setReflection] = useState('');

  // Chặn bấm Lưu hai lần liên tiếp trước khi kịp rời màn — mỗi lần bấm là một Entry.
  const daLuu = useRef(false);

  const daDay = tags.length >= MAX_ENTRY_TAGS;
  // Cùng cách viết thời điểm với Timeline: "Thứ Bảy, 26 tháng 9 · 00:05".
  const luc = Date.now() - luiPhut * 60_000;

  const doiTag = (t: TagId) =>
    setTags((cu) => (cu.includes(t) ? cu.filter((x) => x !== t) : [...cu, t]));

  const luu = () => {
    if (daLuu.current) return;
    daLuu.current = true;
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
          <View style={styles.hang} accessibilityRole="radiogroup">
            {CUONG_DO.map((n) => (
              <Pressable
                key={n}
                onPress={() => setIntensity(n)}
                accessibilityRole="radio"
                accessibilityLabel={`Cường độ ${n} trên 5`}
                accessibilityState={{ checked: intensity === n }}
                style={styles.oNac}
              >
                {/* Nét bút chì như trên tấm, phóng to cho ngón tay; nét chưa tới mức chọn chỉ mờ. */}
                <View
                  style={[
                    styles.nac,
                    { height: NET[n - 1].height * 2, transform: NET[n - 1].transform },
                    n <= intensity && styles.nacChon,
                  ]}
                />
              </Pressable>
            ))}
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

          <View style={styles.nutLuu}>
            <NutChinh nhan="Lưu lại" onPress={luu} />
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
  oNac: {
    width: touch.toiThieu,
    height: touch.toiThieu,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nac: { width: 3, borderRadius: 1.5, backgroundColor: album.vienMo },
  nacChon: { backgroundColor: album.chu },
  mucNac: { color: album.butChi, alignSelf: 'center', marginLeft: space.sm },
  oNhap: {
    ...text.than,
    color: album.chu,
    backgroundColor: album.tam,
    padding: space.md,
    minHeight: 120,
    marginTop: space.md,
  },
  nutLuu: { marginTop: space.xl },
});
