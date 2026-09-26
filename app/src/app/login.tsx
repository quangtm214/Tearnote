import { router } from 'expo-router';
import { useState } from 'react';
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
  const [dangChay, setDangChay] = useState<'vao' | 'tao' | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const baoLoi = (msg: string) => {
    setLoi(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  async function chay(kieu: 'vao' | 'tao') {
    if (dangChay) return;
    setLoi(null);
    setThongBao(null);

    if (!email.includes('@') || matKhau.length < 6) {
      baoLoi('Cần một email hợp lệ và mật khẩu ít nhất 6 ký tự.');
      return;
    }

    setDangChay(kieu);
    try {
      // Đăng ký khi đang có session anonymous phải NÂNG CẤP chính user đó, không tạo user mới:
      // deliveries neo vào user id: tạo mới là mất lịch sử "đã nhận Comfort nào", trần 3/24h
      // reset, và người dùng nhận lại đúng lời đã đọc. signUp chỉ dùng khi chưa có session.
      const { data: phien } = await supabase.auth.getSession();
      const anDanh = phien.session?.user.is_anonymous === true;

      if (kieu === 'tao' && anDanh) {
        const { data, error } = await supabase.auth.updateUser({ email, password: matKhau });
        if (error) return baoLoi(LOI_TAO);
        // updateUser không bao giờ trả session. Còn chờ xác minh thì email mới nằm ở new_email;
        // đã đổi ngay (dự án tắt xác minh) thì làm mới JWT để claim is_anonymous hết là true —
        // không thì RLS vẫn coi đây là tài khoản ẩn danh và chặn viết.
        if (data.user.new_email || !data.user.email) return xacMinh();
        await supabase.auth.refreshSession();
        return thoat();
      }

      const { data, error } =
        kieu === 'vao'
          ? await supabase.auth.signInWithPassword({ email, password: matKhau })
          : await supabase.auth.signUp({ email, password: matKhau });

      if (error) {
        return baoLoi(
          kieu === 'vao'
            ? 'Không đăng nhập được. Kiểm tra lại email, mật khẩu và kết nối mạng.'
            : LOI_TAO,
        );
      }

      // Không có session trả về = dự án đang bật xác minh email.
      if (!data.session) return xacMinh();
      thoat();
    } catch {
      baoLoi('Không kết nối được. Kiểm tra mạng rồi thử lại.');
    } finally {
      setDangChay(null);
    }
  }

  function xacMinh() {
    const msg = 'Đã gửi thư xác minh tới email của bạn. Xác minh xong thì quay lại đăng nhập.';
    setThongBao(msg);
    AccessibilityInfo.announceForAccessibility(msg);
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

          <NutChinh
            nhan="Đăng nhập"
            onPress={() => chay('vao')}
            tat={dangChay === 'tao'}
            dangChay={dangChay === 'vao'}
          />
          <DongLoi nhan="Tạo tài khoản mới" onPress={() => chay('tao')} />

          <DongLoi nhan="Để sau" onPress={thoat} />
        </ScrollView>
        <ChanMan />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const LOI_TAO =
  'Không tạo được tài khoản. Có thể email này đã có tài khoản — thử Đăng nhập. Hoặc kiểm tra mạng.';

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
