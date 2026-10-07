import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  deleteEntry,
  getEntry,
  listAttachments,
  listReceivedComforts,
  markThanked,
  nhanComfortBat,
  saveReceivedComfort,
  type Attachment,
  type Entry,
  type ReceivedComfort,
} from '@/db';
import { ngonNgu, t } from '@/i18n';
import { ensureSession, supabase } from '@/supabase';
import { album, butChi, space, text } from '@/theme';
import {
  ChanMan,
  DongLoi,
  HopThoai,
  NgheLai,
  nhanNgay,
  NutChinh,
  NutPhu,
  TamEntry,
  TamLoi,
  type YeuCauHoi,
} from '@/ui';

type ComfortRow = { comfort_id: string; body: string; translated: boolean };

/**
 * Mở một Entry: đọc lại đủ Reflection (Timeline cắt ở 6 dòng), rồi xem hoặc xin lời từ người lạ.
 */
export default function EntryComfortScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [dk, setDk] = useState<Attachment[]>([]);
  const [ds, setDs] = useState<ReceivedComfort[]>([]);
  const [dangXin, setDangXin] = useState(false);
  const [choNhan, setChoNhan] = useState(true);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [hoi, setHoi] = useState<YeuCauHoi | null>(null);

  const nap = useCallback(() => {
    if (!entryId) return;
    setEntry(getEntry(entryId));
    setDk(listAttachments(entryId));
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
    AccessibilityInfo.announceForAccessibility(t.lanKhoc.dangTim);
    try {
      await ensureSession();
      // Lời trả về bằng ngôn ngữ app; pool chỉ gồm lời đã có bản ngôn ngữ đó (docs/db.md).
      const { data, error } = await supabase.rpc('request_comfort', {
        p_tags: entry.tags,
        p_lang: ngonNgu(),
      });

      if (error) {
        // supabase-js trả lỗi mạng qua `error` với code rỗng; có code là server từ chối.
        bao(error.code ? t.lanKhoc.loiNhan : t.chung.loiMang);
        return;
      }

      const rows = (data ?? []) as ComfortRow[];
      const row = rows[0];
      if (!row) {
        // Hai lý do khác hẳn nhau, hai câu khác nhau (CLAUDE.md: edge case bắt buộc).
        const chiVui = entry.tags.length === 1 && entry.tags[0] === 'moved';
        bao((await daDuLuot()) ? t.lanKhoc.hetLuot : t.lanKhoc.poolRong(chiVui));
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
      bao(t.chung.loiMang);
    } finally {
      setDangXin(false);
    }
  }

  async function camOn(comfortId: string) {
    // Đánh dấu ở máy trước: cảm ơn hụt trên server không đáng để chặn người dùng lúc này,
    // và supabase-js trả { error } chứ không throw nên try/catch ở đây là thừa.
    markThanked(comfortId);
    nap();
    AccessibilityInfo.announceForAccessibility(t.chung.daCamOn);
    await supabase.from('deliveries').update({ thanked: true }).eq('comfort_id', comfortId);
  }

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));
  const ghiAm = dk.find((d) => d.kind === 'audio');

  // Xoá thật, không thùng rác, không hoàn tác: câu phụ nói rõ mất những gì.
  const hoiXoa = () =>
    entry &&
    setHoi({
      cauHoi: t.lanKhoc.xoaHoi,
      phu: t.lanKhoc.xoaPhu(ds.length > 0),
      nhanBo: t.chung.xoa,
      bo: () => {
        deleteEntry(entry.id);
        AccessibilityInfo.announceForAccessibility(t.lanKhoc.daXoa);
        thoat();
      },
    });

  if (!entryId || !entry) {
    return (
      <SafeAreaView style={s.man} edges={['top', 'bottom']}>
        <View style={[s.man, s.cuon]}>
          <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
            {t.lanKhoc.khongThay}
          </Text>
          <Text style={s.giaiThich}>{t.lanKhoc.khongThayPhu}</Text>
          <DongLoi icon="arrow-left" nhan={t.chung.quayLai} onPress={thoat} />
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
        <TamEntry e={entry} dk={dk} />
        {/* Nằm ngoài tấm: tấm là một vùng đọc gộp cho screen reader, nút bên trong sẽ bị nuốt mất. */}
        {ghiAm ? <NgheLai uri={ghiAm.uri} /> : null}

        <Text style={[butChi.ngay, s.nhom]} accessibilityRole="header">
          {t.lanKhoc.loiTuNguoiLa}
        </Text>

        {ds.length === 0 ? (
          <Text style={s.giaiThich}>{t.lanKhoc.chuaKep}</Text>
        ) : (
          ds.map((c) => (
            // Mẩu giấy người lạ kẹp vào trang — cùng tông `kep` với mẩu nhỏ trên Timeline.
            <TamLoi key={c.comfortId}>
              <Text style={s.than}>{c.body}</Text>
              {c.translated ? <Text style={[butChi.chuThich, s.phu]}>{t.chung.daDich}</Text> : null}
              {c.thanked ? (
                <Text style={[butChi.chuThich, s.phu]}>{t.chung.daCamOn}</Text>
              ) : (
                <NutPhu nhan={t.lanKhoc.camOn} onPress={() => void camOn(c.comfortId)} />
              )}
            </TamLoi>
          ))
        )}

        {thongBao ? <Text style={s.thongBao}>{thongBao}</Text> : null}

        {/* Mỗi Entry một Comfort (ADR 0007), và công tắc tắt nhận thì không còn nút xin ở đâu cả. */}
        {ds.length === 0 && choNhan ? (
          <View style={s.nutXin}>
            <NutChinh nhan={t.lanKhoc.xin} onPress={xin} dangChay={dangXin} nhanDangChay={t.lanKhoc.dangTim} />
          </View>
        ) : null}

        {ds.length === 0 && !choNhan ? (
          <Text style={[s.giaiThich, s.nutXin]}>{t.lanKhoc.daTat}</Text>
        ) : null}

        <View style={s.xoa}>
          <DongLoi icon="trash-can-outline" nhan={t.lanKhoc.xoa} onPress={hoiXoa} />
        </View>
        <DongLoi icon="arrow-left" nhan={t.chung.quayLai} onPress={thoat} />
      </ScrollView>
      <ChanMan />
      <HopThoai hoi={hoi} onDong={() => setHoi(null)} />
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
  // Đáy `lg` để chiếc kẹp nhô 16 trên mẩu lời không chạm nhãn mục.
  nhom: { color: album.butChi, marginTop: space.lg, marginBottom: space.lg },
  giaiThich: { ...text.than, color: album.butChi },
  than: { ...text.than, color: album.chu },
  phu: { color: album.butChi },
  thongBao: { ...text.than, color: album.chu, marginTop: space.md },
  nutXin: { marginTop: space.lg },
  xoa: { marginTop: space.lg },
});
