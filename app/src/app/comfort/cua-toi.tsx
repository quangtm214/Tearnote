import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isRealAccount, supabase } from '@/supabase';
import { nhanTags, type TagId } from '@/tags';
import { album, butChi, space, text, touch } from '@/theme';
import { bong, ChanMan, DongLoi } from '@/ui';

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

const NHAN_TRANG_THAI: Record<ComfortCuaToi['status'], string> = {
  pending: 'Đang chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Không được gửi đi',
  retracted: 'Đã thu hồi',
};

export default function ComfortCuaToi() {
  // null = đang tải; 'chuaDangNhap' tách khỏi danh sách rỗng — RLS trả [] cho cả hai.
  const [ds, setDs] = useState<ComfortCuaToi[] | 'chuaDangNhap' | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangThuHoi, setDangThuHoi] = useState<string | null>(null);

  const nap = useCallback(async () => {
    if (!(await isRealAccount())) return setDs('chuaDangNhap');
    const { data, error } = await supabase
      .from('comforts')
      .select('id, body, tags, status')
      .order('created_at', { ascending: false });

    if (error) {
      setLoi('Chưa lấy được danh sách. Kiểm tra mạng rồi thử lại.');
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
    Alert.alert(
      'Thu hồi lời này?',
      'Lời này sẽ không tới tay thêm ai nữa. Ai đã nhận thì vẫn giữ được. ' +
        'Thu hồi rồi không mở lại được.',
      [
        { text: 'Giữ lại', style: 'cancel' },
        { text: 'Thu hồi', style: 'destructive', onPress: () => void thuHoi(id) },
      ],
    );
  }

  async function thuHoi(id: string) {
    setDangThuHoi(id);
    // RLS chỉ cho đổi cột status, và chỉ sang 'retracted'. Không cần kiểm lại ở đây.
    const { error } = await supabase.from('comforts').update({ status: 'retracted' }).eq('id', id);
    setDangThuHoi(null);
    if (error) {
      setLoi('Chưa thu hồi được. Kiểm tra mạng rồi thử lại.');
      return;
    }
    await nap();
  }

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.cuon}>
        <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
          Lời bạn đã viết
        </Text>

        {ds === null ? (
          <ActivityIndicator color={album.butChi} accessibilityLabel="Đang tải" />
        ) : ds === 'chuaDangNhap' ? (
          <>
            <Text style={s.giaiThich}>Lời bạn viết được giữ theo tài khoản.</Text>
            <DongLoi nhan="Đăng nhập để xem" onPress={() => router.push('/login')} />
          </>
        ) : ds.length === 0 && !loi ? (
          <Text style={s.giaiThich}>Chưa có lời nào.</Text>
        ) : (
          ds.map((c) => (
            <View key={c.id} style={s.kep}>
              <Text style={s.than}>{c.body}</Text>
              <Text style={[butChi.chuThich, s.phu]}>
                {nhanTags(c.tags)} · {NHAN_TRANG_THAI[c.status]}
              </Text>
              {/* Thu hồi rồi thì thôi; bị từ chối cũng không còn trong pool để mà thu. */}
              {c.status === 'pending' || c.status === 'approved' ? (
                <Pressable
                  style={({ pressed }) => [s.nutThuHoi, pressed && s.mo]}
                  onPress={() => hoiThuHoi(c.id)}
                  disabled={dangThuHoi === c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Thu hồi lời: ${c.body.slice(0, 40)}`}
                  accessibilityHint="Không hoàn tác được">
                  <Text style={s.chuThuHoi}>
                    {dangThuHoi === c.id ? 'Đang thu hồi…' : 'Thu hồi'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}

        {loi ? (
          <>
            <Text style={s.loi}>{loi}</Text>
            <DongLoi nhan="Thử lại" onPress={() => void nap()} />
          </>
        ) : null}

        <DongLoi nhan="Quay lại" onPress={thoat} />
      </ScrollView>
      <ChanMan />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl },
  tieuDe: { color: album.chu, marginBottom: space.lg },
  giaiThich: { ...text.than, color: album.butChi },
  kep: {
    ...bong,
    elevation: 6,
    backgroundColor: album.kep,
    padding: space.lg,
    marginBottom: space.lg,
  },
  than: { ...text.than, color: album.chu },
  phu: { color: album.butChi, marginTop: space.sm },
  loi: { ...text.than, color: album.chu, marginTop: space.md },
  nutThuHoi: { minHeight: touch.toiThieu, alignSelf: 'flex-start', justifyContent: 'center' },
  chuThuHoi: { ...text.nut, color: album.chu },
  mo: { opacity: 0.6 },
});
