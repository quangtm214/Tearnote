import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TAG_LABEL_VI, type TagId } from '@/tags';
import { supabase } from '@/supabase';
import { color, radius, space, text, touch } from '@/theme';

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
  approved: 'Đang ở trong pool',
  rejected: 'Không được duyệt',
  retracted: 'Đã thu hồi',
};

export default function ComfortCuaToi() {
  const [ds, setDs] = useState<ComfortCuaToi[] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangThuHoi, setDangThuHoi] = useState<string | null>(null);

  useEffect(() => {
    void nap();
  }, []);

  async function nap() {
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
  }

  async function thuHoi(id: string) {
    setDangThuHoi(id);
    // RLS chỉ cho đổi cột status, và chỉ sang 'retracted'. Không cần kiểm lại ở đây.
    const { error } = await supabase.from('comforts').update({ status: 'retracted' }).eq('id', id);
    setDangThuHoi(null);
    if (error) {
      setLoi('Chưa thu hồi được. Thử lại sau nhé.');
      return;
    }
    await nap();
  }

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.cuon}>
        <Text style={s.tieuDe}>Lời tôi đã viết</Text>

        {ds === null ? (
          <ActivityIndicator color={color.anhTrang} />
        ) : ds.length === 0 ? (
          <Text style={s.phu}>
            Bạn chưa viết lời nào. Nếu chưa đăng nhập thì đăng nhập rồi quay lại đây.
          </Text>
        ) : (
          ds.map((c) => (
            <View key={c.id} style={s.the}>
              <Text style={s.than}>{c.body}</Text>
              <Text style={s.phu}>
                {c.tags.map((t) => TAG_LABEL_VI[t]).join(' · ')} — {NHAN_TRANG_THAI[c.status]}
              </Text>
              {/* Thu hồi rồi thì thôi; bị từ chối cũng không còn trong pool để mà thu. */}
              {c.status === 'pending' || c.status === 'approved' ? (
                <Pressable
                  style={s.nutThuHoi}
                  onPress={() => thuHoi(c.id)}
                  disabled={dangThuHoi === c.id}
                  accessibilityRole="button">
                  <Text style={s.chuThuHoi}>
                    {dangThuHoi === c.id ? 'Đang thu hồi…' : 'Thu hồi'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}

        {loi ? <Text style={s.loi}>{loi}</Text> : null}

        <Pressable style={s.nutThoat} onPress={thoat} accessibilityRole="button">
          <Text style={s.chuThoat}>Quay lại</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: color.demKhuya },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl },
  tieuDe: { ...text.tieuDe, color: color.chuChinh, marginBottom: space.lg },
  the: {
    backgroundColor: color.matGiay,
    borderRadius: radius.the,
    padding: space.md,
    marginBottom: space.md,
  },
  than: { ...text.than, color: color.chuChinh },
  phu: { ...text.phu, color: color.chuPhu, marginTop: space.sm },
  loi: { ...text.phu, color: color.chuChinh, marginTop: space.md },
  nutThuHoi: { minHeight: touch.toiThieu, justifyContent: 'center', marginTop: space.sm },
  chuThuHoi: { ...text.nut, color: color.anhTrang },
  nutThoat: { minHeight: touch.toiThieu, justifyContent: 'center', marginTop: space.lg },
  chuThoat: { ...text.nut, color: color.chuPhu },
});
