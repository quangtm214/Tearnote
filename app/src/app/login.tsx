import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/supabase';
import { color, radius, space, text, touch } from '@/theme';

/**
 * Đăng nhập chỉ cần cho hai việc: VIẾT Comfort và bật sync. Nhật ký chạy không cần
 * tài khoản (ADR 0004) — màn này luôn phải có lối thoát.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  async function chay(kieu: 'vao' | 'tao') {
    if (dangChay) return;
    setLoi(null);
    setThongBao(null);

    if (!email.includes('@') || matKhau.length < 6) {
      setLoi('Cần một email hợp lệ và mật khẩu từ 6 ký tự.');
      return;
    }

    setDangChay(true);
    try {
      const { data, error } =
        kieu === 'vao'
          ? await supabase.auth.signInWithPassword({ email, password: matKhau })
          : await supabase.auth.signUp({ email, password: matKhau });

      if (error) {
        setLoi(
          kieu === 'vao'
            ? 'Không đăng nhập được. Kiểm tra lại email, mật khẩu và kết nối mạng.'
            : 'Không tạo được tài khoản. Có thể email này đã dùng rồi, hoặc mạng đang chập chờn.',
        );
        return;
      }

      // signUp mà chưa có session = dự án đang bật xác minh email.
      if (!data.session) {
        setThongBao('Đã gửi thư xác minh tới email của bạn. Xác minh xong thì quay lại đăng nhập.');
        return;
      }
      thoat();
    } catch {
      setLoi('Không kết nối được. Kiểm tra mạng rồi thử lại.');
    } finally {
      setDangChay(false);
    }
  }

  return (
    <SafeAreaView style={s.man}>
      <ScrollView contentContainerStyle={s.noiDung} keyboardShouldPersistTaps="handled">
        <Text style={s.tieuDe}>Đăng nhập</Text>

        <Text style={s.giaiThich}>
          Viết cho người lạ đọc thì cần một danh tính bền — để nếu ai đó viết điều gây hại, việc
          chặn họ có nghĩa. Nhật ký của bạn vẫn dùng được bình thường mà không cần tài khoản.
        </Text>

        <Text style={s.nhan}>Email</Text>
        <TextInput
          style={s.o}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="ban@vidu.com"
          placeholderTextColor={color.chuPhu}
          editable={!dangChay}
        />

        <Text style={s.nhan}>Mật khẩu</Text>
        <TextInput
          style={s.o}
          value={matKhau}
          onChangeText={setMatKhau}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="ít nhất 6 ký tự"
          placeholderTextColor={color.chuPhu}
          editable={!dangChay}
        />

        {loi ? <Text style={s.loi}>{loi}</Text> : null}
        {thongBao ? <Text style={s.thongBao}>{thongBao}</Text> : null}

        <Pressable
          style={[s.nutChinh, dangChay && s.mo]}
          onPress={() => chay('vao')}
          disabled={dangChay}
          accessibilityRole="button">
          {dangChay ? (
            <ActivityIndicator color={color.demKhuya} />
          ) : (
            <Text style={s.chuNutChinh}>Đăng nhập</Text>
          )}
        </Pressable>

        <Pressable
          style={[s.nutPhu, dangChay && s.mo]}
          onPress={() => chay('tao')}
          disabled={dangChay}
          accessibilityRole="button">
          <Text style={s.chuNutPhu}>Tạo tài khoản mới</Text>
        </Pressable>

        <View style={s.khoangNghi} />

        <Pressable style={s.nutThoat} onPress={thoat} accessibilityRole="button">
          <Text style={s.chuThoat}>Để sau, quay lại nhật ký</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: color.demKhuya },
  noiDung: { paddingHorizontal: space.man, paddingVertical: space.lg, gap: space.md },
  tieuDe: { ...text.tieuDe, color: color.chuChinh },
  giaiThich: { ...text.than, color: color.chuPhu },
  nhan: { ...text.phu, color: color.chuPhu, marginTop: space.sm },
  o: {
    ...text.than,
    color: color.chuChinh,
    backgroundColor: color.matGiay,
    borderRadius: radius.o,
    paddingHorizontal: space.md,
    minHeight: touch.toiThieu,
  },
  loi: { ...text.than, color: color.chuChinh, backgroundColor: color.matGiay, padding: space.md, borderRadius: radius.o },
  thongBao: { ...text.than, color: color.anhTrang },
  nutChinh: {
    minHeight: touch.chinh,
    borderRadius: radius.o,
    backgroundColor: color.anhTrang,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  chuNutChinh: { ...text.nut, color: color.demKhuya },
  nutPhu: {
    minHeight: touch.chinh,
    borderRadius: radius.o,
    backgroundColor: color.matGiay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chuNutPhu: { ...text.nut, color: color.chuChinh },
  mo: { opacity: 0.5 },
  khoangNghi: { height: space.lg },
  nutThoat: { minHeight: touch.toiThieu, justifyContent: 'center' },
  chuThoat: { ...text.nut, color: color.chuPhu },
});
