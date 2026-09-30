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

import { t } from '@/i18n';
import { supabase } from '@/supabase';
import { album, butChi, space, text, touch } from '@/theme';
import { ChanMan, DongLoi, NutChinh } from '@/ui';

/**
 * Tạo tài khoản — mở từ màn Đăng nhập, xong thì quay về đó (dismissTo kèm param `tao`
 * để màn Đăng nhập biết báo gì hoặc tự thoát).
 */
export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [nhapLai, setNhapLai] = useState('');
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const baoLoi = (msg: string) => {
    setLoi(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  // 'xong' = đã có tài khoản thật và session; 'xacMinh' = còn chờ xác minh email.
  const veDangNhap = (tao: 'xong' | 'xacMinh') =>
    router.dismissTo({ pathname: '/login', params: { tao, email } });

  async function tao() {
    if (dangChay) return;
    setLoi(null);

    if (!email.includes('@') || matKhau.length < 6) {
      return baoLoi(t.chung.loiEmail);
    }
    if (matKhau !== nhapLai) return baoLoi(t.taoTaiKhoan.khongKhop);

    setDangChay(true);
    try {
      // Đăng ký khi đang có session anonymous phải NÂNG CẤP chính user đó, không tạo user mới:
      // deliveries neo vào user id: tạo mới là mất lịch sử "đã nhận Comfort nào", trần 3/24h
      // reset, và người dùng nhận lại đúng lời đã đọc. signUp chỉ dùng khi chưa có session.
      const { data: phien } = await supabase.auth.getSession();

      if (phien.session?.user.is_anonymous === true) {
        const { data, error } = await supabase.auth.updateUser({ email, password: matKhau });
        if (error) return baoLoi(t.taoTaiKhoan.loiTao);
        // updateUser không bao giờ trả session. Còn chờ xác minh thì email mới nằm ở new_email;
        // đã đổi ngay (dự án tắt xác minh) thì làm mới JWT để claim is_anonymous hết là true —
        // không thì RLS vẫn coi đây là tài khoản ẩn danh và chặn viết.
        if (data.user.new_email || !data.user.email) return veDangNhap('xacMinh');
        await supabase.auth.refreshSession();
        return veDangNhap('xong');
      }

      const { data, error } = await supabase.auth.signUp({ email, password: matKhau });
      if (error) return baoLoi(t.taoTaiKhoan.loiTao);
      // Không có session trả về = dự án đang bật xác minh email.
      veDangNhap(data.session ? 'xong' : 'xacMinh');
    } catch {
      baoLoi(t.chung.loiMang);
    } finally {
      setDangChay(false);
    }
  }

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.man} behavior="padding">
        <ScrollView contentContainerStyle={s.noiDung} keyboardShouldPersistTaps="handled">
          <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
            {t.taoTaiKhoan.tieuDe}
          </Text>

          <Text style={s.giaiThich}>{t.taoTaiKhoan.giaiThich}</Text>

          <Text style={s.nhan}>{t.chung.email}</Text>
          <TextInput
            style={s.o}
            value={email}
            onChangeText={setEmail}
            accessibilityLabel={t.chung.email}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder={t.chung.emailMau}
            placeholderTextColor={album.butChi}
            selectionColor={album.butChi}
            editable={!dangChay}
          />

          <Text style={s.nhan}>{t.chung.matKhau}</Text>
          <TextInput
            style={s.o}
            value={matKhau}
            onChangeText={setMatKhau}
            accessibilityLabel={t.chung.matKhau}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            placeholder={t.chung.matKhauGoiY}
            placeholderTextColor={album.butChi}
            selectionColor={album.butChi}
            editable={!dangChay}
          />

          <Text style={s.nhan}>{t.taoTaiKhoan.nhapLai}</Text>
          <TextInput
            style={s.o}
            value={nhapLai}
            onChangeText={setNhapLai}
            accessibilityLabel={t.taoTaiKhoan.nhapLai}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            selectionColor={album.butChi}
            editable={!dangChay}
          />

          {loi ? <Text style={s.loi}>{loi}</Text> : null}

          <NutChinh nhan={t.taoTaiKhoan.tieuDe} onPress={tao} dangChay={dangChay} />
          <DongLoi nhan={t.taoTaiKhoan.daCo} onPress={() => router.back()} />
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
