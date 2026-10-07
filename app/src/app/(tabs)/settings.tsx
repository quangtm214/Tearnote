import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
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

        {/* Cả hàng là một công tắc: lưới an toàn duy nhất (overview §6) phải gạt được chắc tay. */}
        <Pressable
          onPress={() => doiNhan(!nhan)}
          accessibilityRole="switch"
          accessibilityState={{ checked: nhan }}
          accessibilityLabel={t.caiDat.nhanLoi}
          accessibilityHint={t.caiDat.nhanLoiPhu}
          style={({ pressed }) => [s.hang, pressed && s.mo]}
        >
          <View style={s.trai} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Text style={s.nhan}>{t.caiDat.nhanLoi}</Text>
            <Text style={s.phu}>{t.caiDat.nhanLoiPhu}</Text>
          </View>
          <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Switch
              value={nhan}
              trackColor={{ false: album.kep, true: album.butChi }}
              thumbColor={nhan ? album.chu : album.butChi}
            />
          </View>
        </Pressable>

        <DongLoi
          mui
          nhan={t.chung.loiDaViet}
          phu={t.caiDat.loiDaVietPhu}
          onPress={() => router.push('/comfort/cua-toi')}
        />
        <DongLoi
          mui
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
            <DongLoi icon="logout" nhan={t.caiDat.dangXuat} phu={t.caiDat.dangXuatPhu} onPress={dangXuat} />
          </>
        ) : (
          <DongLoi
            mui
            nhan={t.chung.dangNhap}
            phu={t.caiDat.dangNhapPhu}
            onPress={() => router.push('/login')}
          />
        )}

        {/* Đổi là dựng lại cả cây giao diện ở ngôn ngữ mới (_layout gốc), không cần mở lại app. */}
        <Text style={[butChi.ngay, s.mucNgonNgu]} accessibilityRole="header">
          {t.caiDat.ngonNgu}
        </Text>
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
  mucNgonNgu: { color: album.butChi, marginTop: space.lg },
  mo: { opacity: 0.6 },
  hangNgonNgu: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
});
