import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getEntry,
  listReceivedComforts,
  markThanked,
  nhanComfortBat,
  saveReceivedComfort,
  type Entry,
  type ReceivedComfort,
} from '@/db';
import { ensureSession, supabase } from '@/supabase';
import { album, butChi, space, text, touch } from '@/theme';
import { bong, ChanMan, DongLoi, nhanNgay, NutChinh, TamEntry } from '@/ui';

type ComfortRow = { comfort_id: string; body: string; translated: boolean };

/**
 * Mở một Entry: đọc lại đủ Reflection (Timeline cắt ở 6 dòng), rồi xem hoặc xin lời từ người lạ.
 */
export default function EntryComfortScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [ds, setDs] = useState<ReceivedComfort[]>([]);
  const [dangXin, setDangXin] = useState(false);
  const [choNhan, setChoNhan] = useState(true);
  const [thongBao, setThongBao] = useState<string | null>(null);

  const nap = useCallback(() => {
    if (!entryId) return;
    setEntry(getEntry(entryId));
    setDs(listReceivedComforts(entryId));
    setChoNhan(nhanComfortBat());
  }, [entryId]);

  useEffect(nap, [nap]);

  // Thông báo mới mount thì TalkBack không chắc đọc — đọc thẳng cho chắc.
  const bao = (msg: string) => {
    setThongBao(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  async function xin() {
    if (!entry || dangXin) return;
    setThongBao(null);
    setDangXin(true);
    try {
      await ensureSession();
      const { data, error } = await supabase.rpc('request_comfort', {
        p_tags: entry.tags,
        p_lang: 'vi',
      });

      if (error) {
        // supabase-js trả lỗi mạng qua `error` với code rỗng; có code là server từ chối.
        bao(
          error.code
            ? 'Chưa nhận được. Thử lại sau một lát.'
            : 'Không kết nối được. Kiểm tra mạng rồi thử lại.',
        );
        return;
      }

      const rows = (data ?? []) as ComfortRow[];
      const row = rows[0];
      if (!row) {
        // Hai lý do khác hẳn nhau, hai câu khác nhau (CLAUDE.md: edge case bắt buộc).
        const chiVui = entry.tags.length === 1 && entry.tags[0] === 'moved';
        const chuaCo = `Lúc này chưa có lời nào cho ${chiVui ? 'niềm vui' : 'chuyện'} này.`;
        bao(
          (await daDuLuot())
            ? 'Bạn đã nhận đủ 3 lời trong 24 giờ qua. Chưa nhận thêm được.'
            : `${chuaCo} Lần này không tính vào lượt của bạn.`,
        );
        return;
      }

      saveReceivedComfort({
        comfortId: row.comfort_id,
        entryId: entry.id,
        body: row.body,
        translated: row.translated,
      });
      nap();
      AccessibilityInfo.announceForAccessibility(row.body);
    } catch {
      bao('Không kết nối được. Kiểm tra mạng rồi thử lại.');
    } finally {
      setDangXin(false);
    }
  }

  async function camOn(comfortId: string) {
    // Đánh dấu ở máy trước: cảm ơn hụt trên server không đáng để chặn người dùng lúc này,
    // và supabase-js trả { error } chứ không throw nên try/catch ở đây là thừa.
    markThanked(comfortId);
    nap();
    await supabase.from('deliveries').update({ thanked: true }).eq('comfort_id', comfortId);
  }

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!entryId || !entry) {
    return (
      <SafeAreaView style={s.man} edges={['top', 'bottom']}>
        <View style={[s.man, s.cuon]}>
          <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
            Không tìm thấy
          </Text>
          <Text style={s.giaiThich}>Lần khóc này không còn trong máy.</Text>
          <DongLoi nhan="Quay lại" onPress={thoat} />
        </View>
        <ChanMan />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.cuon}>
        <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
          {nhanNgay(entry.occurredAt)}
        </Text>
        <TamEntry e={entry} />

        <Text style={[butChi.ngay, s.nhom]} accessibilityRole="header">
          Lời từ người lạ
        </Text>

        {ds.length === 0 ? (
          <Text style={s.giaiThich}>Chưa có lời nào kẹp ở đây.</Text>
        ) : (
          ds.map((c) => (
            // Mẩu giấy người lạ kẹp vào trang — cùng tông `kep` với mẩu nhỏ trên Timeline.
            <View key={c.comfortId} style={s.kep}>
              <Text style={s.than}>{c.body}</Text>
              {c.translated ? <Text style={[butChi.chuThich, s.phu]}>đã dịch tự động</Text> : null}
              {c.thanked ? (
                <Text style={[butChi.chuThich, s.phu]}>đã cảm ơn</Text>
              ) : (
                <Pressable
                  style={({ pressed }) => [s.nutCamOn, pressed && s.mo]}
                  onPress={() => camOn(c.comfortId)}
                  accessibilityRole="button">
                  <Text style={s.chuCamOn}>Cảm ơn</Text>
                </Pressable>
              )}
            </View>
          ))
        )}

        {thongBao ? <Text style={s.thongBao}>{thongBao}</Text> : null}

        {/* Mỗi Entry một Comfort (ADR 0007), và công tắc tắt nhận thì không còn nút xin ở đâu cả. */}
        {ds.length === 0 && choNhan ? (
          <View style={s.nutXin}>
            <NutChinh nhan="Nhận một lời từ người lạ" onPress={xin} dangChay={dangXin} />
          </View>
        ) : null}

        {ds.length === 0 && !choNhan ? (
          <Text style={[s.giaiThich, s.nutXin]}>
            Bạn đã tắt nhận lời từ người lạ. Có thể đổi trong Cài đặt.
          </Text>
        ) : null}

        <DongLoi nhan="Quay lại" onPress={thoat} />
      </ScrollView>
      <ChanMan />
    </SafeAreaView>
  );
}

/**
 * Hàm trả rỗng vì hai lý do khác hẳn nhau: hết lượt 3/24h, hay pool không có gì hợp.
 * Đây là SUY LUẬN PHÍA CLIENT chỉ để chọn câu chữ — DB mới là chỗ ép luật thật
 * (xem request_comfort trong docs/db.md). Sai ở đây thì chỉ hiện nhầm một câu.
 *
 * Đếm trên `deliveries` chứ không trên SQLite: `listReceivedComforts` lọc theo entry và
 * không trả `received_at`, nên không đếm được "3 lời trong 24h qua" trên máy. RLS cho đọc
 * đúng dòng mình là người nhận, và ta vừa gọi mạng xong nên không tốn thêm vòng offline nào.
 */
async function daDuLuot(): Promise<boolean> {
  const tu = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('deliveries')
    .select('comfort_id', { count: 'exact', head: true })
    .gt('delivered_at', tu);
  return !error && (count ?? 0) >= 3;
}

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl },
  tieuDe: { color: album.chu, marginBottom: space.lg },
  nhom: { color: album.butChi, marginTop: space.lg, marginBottom: space.md },
  giaiThich: { ...text.than, color: album.butChi },
  kep: {
    ...bong,
    elevation: 6,
    backgroundColor: album.kep,
    padding: space.lg,
    marginBottom: space.lg,
    gap: space.sm,
  },
  than: { ...text.than, color: album.chu },
  phu: { color: album.butChi },
  nutCamOn: { minHeight: touch.toiThieu, alignSelf: 'flex-start', justifyContent: 'center' },
  chuCamOn: { ...text.nut, color: album.chu },
  mo: { opacity: 0.6 },
  thongBao: { ...text.than, color: album.chu, marginTop: space.md },
  nutXin: { marginTop: space.lg },
});
