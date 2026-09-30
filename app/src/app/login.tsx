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

import { t } from '@/i18n';
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
    const msg = t.dangNhap.daGuiXacMinh;
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
      baoLoi(t.chung.loiEmail);
      return;
    }

    setDangChay(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: matKhau });
      if (error) return baoLoi(t.dangNhap.loi);
      thoat();
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
            {t.chung.dangNhap}
          </Text>

          <Text style={s.giaiThich}>{t.dangNhap.giaiThich}</Text>

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
            autoComplete="password"
            placeholder={t.chung.matKhauGoiY}
            placeholderTextColor={album.butChi}
            selectionColor={album.butChi}
            editable={!dangChay}
          />

          {loi ? <Text style={s.loi}>{loi}</Text> : null}
          {thongBao ? <Text style={s.loi}>{thongBao}</Text> : null}

          <NutChinh nhan={t.chung.dangNhap} onPress={dangNhap} dangChay={dangChay} />
          <DongLoi nhan={t.dangNhap.taoMoi} onPress={() => router.push('/register')} />

          <DongLoi nhan={t.dangNhap.deSau} onPress={thoat} />
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
