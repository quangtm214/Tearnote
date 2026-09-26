import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { datNhanComfort, nhanComfortBat } from '@/db';
import { album, butChi, space, text } from '@/theme';
import { ChanMan, DongLoi } from '@/ui';

export default function CaiDat() {
  const [nhan, setNhan] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setNhan(nhanComfortBat());
    }, []),
  );

  function doiNhan(bat: boolean) {
    datNhanComfort(bat);
    setNhan(bat);
  }

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.cuon}>
        <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
          Cài đặt
        </Text>

        <View style={s.hang}>
          <View style={s.trai}>
            <Text style={s.nhan}>Nhận lời từ người lạ</Text>
            <Text style={s.phu}>
              Tắt thì không nhận thêm lời nào từ người lạ. Việc ghi lại vẫn như cũ.
            </Text>
          </View>
          <Switch
            value={nhan}
            onValueChange={doiNhan}
            trackColor={{ false: album.kep, true: album.butChi }}
            thumbColor={nhan ? album.chu : album.butChi}
            accessibilityLabel="Nhận lời từ người lạ"
          />
        </View>

        <DongLoi
          nhan="Lời bạn đã viết"
          phu="Xem lại, hoặc thu hồi lời đã viết."
          onPress={() => router.push('/comfort/cua-toi')}
        />
        <DongLoi
          nhan="Viết một lời cho người lạ"
          phu="Cần đăng nhập. Tối đa 5 lời trong 24 giờ."
          onPress={() => router.push('/comfort/write')}
        />

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
  hang: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  trai: { flex: 1 },
  nhan: { ...text.nut, color: album.chu },
  phu: { ...text.phu, color: album.butChi, marginTop: space.xs, maxWidth: 320 },
});
