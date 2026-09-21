import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getEntry,
  listReceivedComforts,
  markThanked,
  saveReceivedComfort,
  type Entry,
  type ReceivedComfort,
} from '@/db';
import { ensureSession, supabase } from '@/supabase';
import { color, radius, space, text, touch } from '@/theme';

type ComfortRow = { comfort_id: string; body: string; translated: boolean };

export default function EntryComfortScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [ds, setDs] = useState<ReceivedComfort[]>([]);
  const [dangXin, setDangXin] = useState(false);
  const [thongBao, setThongBao] = useState<string | null>(null);

  const nap = useCallback(() => {
    if (!entryId) return;
    setEntry(getEntry(entryId));
    setDs(listReceivedComforts(entryId));
  }, [entryId]);

  useEffect(nap, [nap]);

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
        setThongBao('Chưa lấy được. Có vẻ mạng đang chập chờn — thử lại sau một lát.');
        return;
      }

      const rows = (data ?? []) as ComfortRow[];
      const row = rows[0];
      if (!row) {
        setThongBao(
          (await daDuLuot())
            ? 'Bạn đã nhận 3 lời trong hôm nay rồi. Mai quay lại nhé.'
            : 'Chưa có lời nào hợp với hoàn cảnh này. Thử lại sau nhé.'
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
    } catch {
      setThongBao('Không kết nối được. Kiểm tra mạng rồi thử lại.');
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
      <SafeAreaView style={s.man}>
        <View style={s.noiDung}>
          <Text style={s.tieuDe}>Không tìm thấy</Text>
          <Text style={s.giaiThich}>Entry này không còn nữa.</Text>
          <Pressable style={s.nutThoat} onPress={thoat} accessibilityRole="button">
            <Text style={s.chuThoat}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.man}>
      <ScrollView contentContainerStyle={s.noiDung}>
        <Text style={s.tieuDe}>Lời từ người lạ</Text>

        {ds.length === 0 ? (
          <Text style={s.giaiThich}>Chưa có lời nào cho Entry này.</Text>
        ) : (
          ds.map((c) => (
            <View key={c.comfortId} style={s.the}>
              <Text style={s.than}>{c.body}</Text>
              {c.translated ? <Text style={s.phu}>đã dịch tự động</Text> : null}
              {c.thanked ? (
                <Text style={s.phu}>Đã cảm ơn</Text>
              ) : (
                <Pressable
                  style={s.nutCamOn}
                  onPress={() => camOn(c.comfortId)}
                  accessibilityRole="button">
                  <Text style={s.chuNutCamOn}>Cảm ơn</Text>
                </Pressable>
              )}
            </View>
          ))
        )}

        {thongBao ? <Text style={s.thongBao}>{thongBao}</Text> : null}

        {/* Mỗi Entry một Comfort — ADR 0007. Nhận rồi thì không còn nút xin. */}
        {ds.length === 0 ? (
          <Pressable
            style={[s.nutChinh, dangXin && s.mo]}
            onPress={xin}
            disabled={dangXin}
            accessibilityRole="button">
            {dangXin ? (
              <ActivityIndicator color={color.demKhuya} />
            ) : (
              <Text style={s.chuNutChinh}>Xin một lời động viên</Text>
            )}
          </Pressable>
        ) : null}

        <Pressable style={s.nutThoat} onPress={thoat} accessibilityRole="button">
          <Text style={s.chuThoat}>Quay lại</Text>
        </Pressable>
      </ScrollView>
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
  man: { flex: 1, backgroundColor: color.demKhuya },
  noiDung: { paddingHorizontal: space.man, paddingVertical: space.lg, gap: space.md },
  tieuDe: { ...text.tieuDe, color: color.chuChinh },
  giaiThich: { ...text.than, color: color.chuPhu },
  the: {
    backgroundColor: color.matGiay,
    borderRadius: radius.the,
    padding: space.md,
    gap: space.sm,
  },
  than: { ...text.than, color: color.chuChinh },
  phu: { ...text.phu, color: color.chuPhu },
  thongBao: { ...text.than, color: color.anhTrang },
  nutCamOn: {
    minHeight: touch.toiThieu,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.vien,
    backgroundColor: color.demKhuya,
  },
  chuNutCamOn: { ...text.nut, color: color.chuChinh },
  nutChinh: {
    minHeight: touch.chinh,
    borderRadius: radius.o,
    backgroundColor: color.anhTrang,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
  chuNutChinh: { ...text.nut, color: color.demKhuya },
  mo: { opacity: 0.5 },
  nutThoat: { minHeight: touch.toiThieu, justifyContent: 'center', marginTop: space.lg },
  chuThoat: { ...text.nut, color: color.chuPhu },
});
