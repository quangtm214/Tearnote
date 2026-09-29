import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/supabase';
import { album, butChi, space, text, touch } from '@/theme';
import { ChanMan, DongLoi, NutChinh } from '@/ui';

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
  // Do màn Tạo tài khoản gửi về khi xong (register.tsx).
  const { tao, email: emailMoi } = useLocalSearchParams<{ tao?: string; email?: string }>();

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));

  const baoLoi = (msg: string) => {
    setLoi(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  useEffect(() => {
    // Đã có session thật thì màn này hết việc — trả người dùng về chỗ họ đến.
    if (tao === 'xong') return thoat();
    if (tao !== 'xacMinh') return;
    const msg = 'Đã gửi thư xác minh tới email của bạn. Xác minh xong thì đăng nhập ở đây.';
    if (emailMoi) setEmail(emailMoi);
    setLoi(null);
    setThongBao(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  }, [tao, emailMoi]);

  async function dangNhap() {
    if (dangChay) return;
    setLoi(null);
    setThongBao(null);

    if (!email.includes('@') || matKhau.length < 6) {
      baoLoi('Cần một email hợp lệ và mật khẩu ít nhất 6 ký tự.');
      return;
    }

    setDangChay(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: matKhau });
      if (error) return baoLoi('Không đăng nhập được. Kiểm tra lại email, mật khẩu và kết nối mạng.');
      thoat();
    } catch {
      baoLoi('Không kết nối được. Kiểm tra mạng rồi thử lại.');
    } finally {
      setDangChay(false);
    }
  }

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.man} behavior="padding">
        <ScrollView contentContainerStyle={s.noiDung} keyboardShouldPersistTaps="handled">
          <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
            Đăng nhập
          </Text>

          <Text style={s.giaiThich}>
            Viết cho người lạ thì cần đăng nhập, để giữ an toàn cho người đọc. Người đọc không bao
            giờ thấy email của bạn. Ghi lại những lần khóc thì không cần.
          </Text>

          <Text style={s.nhan}>Email</Text>
          <TextInput
            style={s.o}
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder="ban@vidu.com"
            placeholderTextColor={album.butChi}
            selectionColor={album.butChi}
            editable={!dangChay}
          />

          <Text style={s.nhan}>Mật khẩu</Text>
          <TextInput
            style={s.o}
            value={matKhau}
            onChangeText={setMatKhau}
            accessibilityLabel="Mật khẩu"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            autoComplete="password"
            placeholder="Ít nhất 6 ký tự"
            placeholderTextColor={album.butChi}
            selectionColor={album.butChi}
            editable={!dangChay}
          />

          {loi ? <Text style={s.loi}>{loi}</Text> : null}
          {thongBao ? <Text style={s.loi}>{thongBao}</Text> : null}

          <NutChinh nhan="Đăng nhập" onPress={dangNhap} dangChay={dangChay} />
          <DongLoi nhan="Tạo tài khoản mới" onPress={() => router.push('/register')} />

          <DongLoi nhan="Để sau" onPress={thoat} />
        </ScrollView>
        <ChanMan />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  noiDung: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl, gap: space.md },
  tieuDe: { color: album.chu },
  giaiThich: { ...text.than, color: album.butChi },
  nhan: { ...text.phu, color: album.butChi, marginTop: space.sm },
  o: {
    ...text.than,
    color: album.chu,
    backgroundColor: album.tam,
    paddingHorizontal: space.md,
    minHeight: touch.toiThieu,
  },
  loi: { ...text.than, color: album.chu },
});
