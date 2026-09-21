import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { datNhanComfort, nhanComfortBat } from '@/db';
import { color, radius, space, text, touch } from '@/theme';

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
        <Text style={s.tieuDe}>Cài đặt</Text>

        <View style={s.hang}>
          <View style={s.trai}>
            <Text style={s.nhan}>Nhận lời từ người lạ</Text>
            <Text style={s.phu}>
              Tắt thì không còn nút xin ở bất kỳ Entry nào. Nhật ký vẫn dùng bình thường.
            </Text>
          </View>
          <Switch
            value={nhan}
            onValueChange={doiNhan}
            trackColor={{ false: color.matGiay, true: color.anhTrang }}
            thumbColor={color.chuChinh}
            accessibilityLabel="Nhận lời từ người lạ"
          />
        </View>

        <Pressable style={s.muc} onPress={() => router.push('/comfort/cua-toi')}>
          <Text style={s.nhan}>Lời tôi đã viết</Text>
          <Text style={s.phu}>Xem lại và thu hồi những lời mình đã gửi vào pool.</Text>
        </Pressable>

        <Pressable style={s.muc} onPress={() => router.push('/comfort/write')}>
          <Text style={s.nhan}>Viết một lời cho người lạ</Text>
          <Text style={s.phu}>Cần một tài khoản thật. Tối đa 5 lời mỗi 24 giờ.</Text>
        </Pressable>

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
  hang: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xl },
  trai: { flex: 1 },
  muc: { minHeight: touch.toiThieu, marginBottom: space.xl },
  nhan: { ...text.nut, color: color.chuChinh },
  phu: { ...text.phu, color: color.chuPhu, marginTop: space.xs },
  nutThoat: {
    minHeight: touch.toiThieu,
    justifyContent: 'center',
    borderRadius: radius.o,
    marginTop: space.lg,
  },
  chuThoat: { ...text.nut, color: color.chuPhu },
});
