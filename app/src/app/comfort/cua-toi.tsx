import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { nhanTags, t } from '@/i18n';
import { isRealAccount, supabase } from '@/supabase';
import type { TagId } from '@/tags';
import { album, butChi, space, text } from '@/theme';
import { ChanMan, DongLoi, HopThoai, NutPhu, TamLoi, type YeuCauHoi } from '@/ui';

/**
 * Lời mình đã viết. overview.md §6 là ràng buộc bắt buộc: người viết phải thu hồi được.
 *
 * Đây là chỗ DUY NHẤT app `select` vào bảng `comforts`, và không phạm ADR 0008:
 * policy `comfort_select_own` chỉ trả về dòng của chính mình. Pool của người khác
 * vẫn chỉ vào được qua `request_comfort()`.
 */
type ComfortCuaToi = {
  id: string;
  body: string;
  tags: TagId[];
  status: 'pending' | 'approved' | 'rejected' | 'retracted';
};

export default function ComfortCuaToi() {
  // null = đang tải; 'chuaDangNhap' tách khỏi danh sách rỗng — RLS trả [] cho cả hai.
  const [ds, setDs] = useState<ComfortCuaToi[] | 'chuaDangNhap' | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangThuHoi, setDangThuHoi] = useState<string | null>(null);
  const [hoi, setHoi] = useState<YeuCauHoi | null>(null);

  const nap = useCallback(async () => {
    if (!(await isRealAccount())) return setDs('chuaDangNhap');
    const { data, error } = await supabase
      .from('comforts')
      .select('id, body, tags, status')
      .order('created_at', { ascending: false });

    if (error) {
      setLoi(t.cuaToi.loiTai);
      setDs([]);
      return;
    }
    setLoi(null);
    setDs(data as ComfortCuaToi[]);
  }, []);

  // Theo focus: đăng nhập xong quay lại đây thì tải lại.
  useFocusEffect(
    useCallback(() => {
      void nap();
    }, [nap]),
  );

  // Thu hồi không hoàn tác được (RLS chỉ cho đổi sang 'retracted'), nên hỏi lại một lần.
  function hoiThuHoi(id: string) {
    setHoi({
      cauHoi: t.cuaToi.hoiThuHoi,
      phu: t.cuaToi.hoiThuHoiPhu,
      nhanBo: t.cuaToi.thuHoi,
      bo: () => void thuHoi(id),
    });
  }

  async function thuHoi(id: string) {
    setDangThuHoi(id);
    // RLS chỉ cho đổi cột status, và chỉ sang 'retracted'. Không cần kiểm lại ở đây.
    const { error } = await supabase.from('comforts').update({ status: 'retracted' }).eq('id', id);
    setDangThuHoi(null);
    if (error) {
      setLoi(t.cuaToi.loiThuHoi);
      return;
    }
    AccessibilityInfo.announceForAccessibility(t.cuaToi.daThuHoi);
    await nap();
  }

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.cuon}>
        <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
          {t.chung.loiDaViet}
        </Text>

        {ds === null ? (
          <ActivityIndicator color={album.butChi} accessibilityLabel={t.chung.dangTai} />
        ) : ds === 'chuaDangNhap' ? (
          <>
            <Text style={s.giaiThich}>{t.cuaToi.theoTaiKhoan}</Text>
            <DongLoi nhan={t.cuaToi.dangNhapXem} mui onPress={() => router.push('/login')} />
          </>
        ) : ds.length === 0 && !loi ? (
          <Text style={s.giaiThich}>{t.cuaToi.trong}</Text>
        ) : (
          ds.map((c) => (
            <TamLoi key={c.id}>
              <Text style={s.than}>{c.body}</Text>
              <Text style={[butChi.chuThich, s.phu]}>
                {nhanTags(c.tags)} · {t.cuaToi.trangThai[c.status]}
              </Text>
              {/* Thu hồi rồi thì thôi; bị từ chối cũng không còn trong pool để mà thu. */}
              {c.status === 'pending' || c.status === 'approved' ? (
                <NutPhu
                  nhan={dangThuHoi === c.id ? t.cuaToi.dangThuHoi : t.cuaToi.thuHoi}
                  onPress={() => hoiThuHoi(c.id)}
                  tat={dangThuHoi === c.id}
                  accessibilityLabel={t.cuaToi.thuHoiA11y(c.body.slice(0, 40))}
                  accessibilityHint={t.cuaToi.khongHoanTac}
                />
              ) : null}
            </TamLoi>
          ))
        )}

        {loi ? (
          <>
            <Text style={s.loi}>{loi}</Text>
            <DongLoi icon="refresh" nhan={t.cuaToi.thuLai} onPress={() => void nap()} />
          </>
        ) : null}

        <DongLoi icon="arrow-left" nhan={t.chung.quayLai} onPress={thoat} />
      </ScrollView>
      <ChanMan />
      <HopThoai hoi={hoi} onDong={() => setHoi(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl },
  tieuDe: { color: album.chu, marginBottom: space.lg },
  giaiThich: { ...text.than, color: album.butChi },
  than: { ...text.than, color: album.chu },
  phu: { color: album.butChi },
  loi: { ...text.than, color: album.chu, marginTop: space.md },
});
