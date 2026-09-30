import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { datNhanComfort, nhanComfortBat } from '@/db';
import { datNgonNgu, LANGS, ngonNgu, t, TEN_GOC } from '@/i18n';
import { supabase } from '@/supabase';
import { album, butChi, space, text } from '@/theme';
import { ChanMan, DongLoi, Pill } from '@/ui';

export default function CaiDat() {
  const [nhan, setNhan] = useState(true);
  // null = chưa đăng nhập tài khoản thật (anonymous hoặc chưa có session).
  const [email, setEmail] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setNhan(nhanComfortBat());
      // Session trên máy như isRealAccount — mất mạng vẫn thấy mình đang đăng nhập bằng gì.
      supabase.auth.getSession().then(({ data }) => {
        const u = data.session?.user;
        setEmail(u && !u.is_anonymous ? (u.email ?? null) : null);
      });
    }, []),
  );

  function doiNhan(bat: boolean) {
    datNhanComfort(bat);
    setNhan(bat);
  }

  async function dangXuat() {
    // signOut luôn xoá session trên máy, kể cả khi mất mạng (lỗi chỉ là server chưa thu hồi token).
    await supabase.auth.signOut();
    setEmail(null);
    AccessibilityInfo.announceForAccessibility(t.caiDat.daDangXuat);
  }

  return (
    <SafeAreaView style={s.man} edges={['top']}>
      <ScrollView contentContainerStyle={s.cuon}>
        <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
          {t.caiDat.tieuDe}
        </Text>

        <View style={s.hang}>
          <View style={s.trai}>
            <Text style={s.nhan}>{t.caiDat.nhanLoi}</Text>
            <Text style={s.phu}>{t.caiDat.nhanLoiPhu}</Text>
          </View>
          <Switch
            value={nhan}
            onValueChange={doiNhan}
            trackColor={{ false: album.kep, true: album.butChi }}
            thumbColor={nhan ? album.chu : album.butChi}
            accessibilityLabel={t.caiDat.nhanLoi}
          />
        </View>

        <DongLoi
          nhan={t.chung.loiDaViet}
          phu={t.caiDat.loiDaVietPhu}
          onPress={() => router.push('/comfort/cua-toi')}
        />
        <DongLoi
          nhan={t.chung.vietLoi}
          phu={t.caiDat.vietLoiPhu}
          onPress={() => router.push('/comfort/write')}
        />

        {email ? (
          <>
            <View style={s.hang}>
              <View style={s.trai}>
                <Text style={s.nhan}>{t.caiDat.taiKhoan}</Text>
                <Text style={s.phu}>{email}</Text>
              </View>
            </View>
            <DongLoi nhan={t.caiDat.dangXuat} phu={t.caiDat.dangXuatPhu} onPress={dangXuat} />
          </>
        ) : (
          <DongLoi
            nhan={t.chung.dangNhap}
            phu={t.caiDat.dangNhapPhu}
            onPress={() => router.push('/login')}
          />
        )}

        {/* Đổi là dựng lại cả cây giao diện ở ngôn ngữ mới (_layout gốc), không cần mở lại app. */}
        <Text style={[s.nhan, s.mucNgonNgu]}>{t.caiDat.ngonNgu}</Text>
        <View style={s.hangNgonNgu} accessibilityRole="radiogroup" accessibilityLabel={t.caiDat.ngonNgu}>
          {LANGS.map((l) => (
            <Pill key={l} nhan={TEN_GOC[l]} mot chon={l === ngonNgu()} onPress={() => datNgonNgu(l)} />
          ))}
        </View>
      </ScrollView>
      <ChanMan />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl },
  tieuDe: { color: album.chu, marginBottom: space.lg },
  hang: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  trai: { flex: 1 },
  nhan: { ...text.nut, color: album.chu },
  phu: { ...text.phu, color: album.butChi, marginTop: space.xs, maxWidth: 320 },
  mucNgonNgu: { marginTop: space.lg },
  hangNgonNgu: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
});
