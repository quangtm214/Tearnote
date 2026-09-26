import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HOTLINES_FALLBACK, type Hotline } from '@/hotlines';
import { album, butChi, space, text, touch } from '@/theme';
import { bong, DongLoi, NutDen } from '@/ui';

/** Màn này phải chạy khi máy bay bật: chỉ đọc danh sách đóng gói sẵn, không gọi mạng. */
const TEN_NUOC: Record<string, string> = {
  VN: 'Việt Nam',
  JP: 'Nhật Bản',
  US: 'Mỹ',
  GB: 'Anh',
};

const nhomTheoNuoc = (ds: Hotline[]): [string, Hotline[]][] => {
  const m = new Map<string, Hotline[]>();
  for (const h of ds) {
    const cu = m.get(h.country);
    if (cu) cu.push(h);
    else m.set(h.country, [h]);
  }
  return [...m];
};

/** TalkBack đọc "096 306 1414" thành số lớn; tách từng chữ số cho dễ nghe, dễ nhớ. */
const docSo = (phone: string) => phone.replace(/\D/g, '').split('').join(' ');

// Máy không gọi được (tablet, không SIM) thì openURL từ chối — số vẫn hiện trên màn để bấm tay.
const mo = (url: string) => Linking.openURL(url).catch(() => {});

/**
 * Màn này chính là lối trợ giúp, nên mọi nút Gọi đều là `NutDen` — ngoại lệ duy nhất của luật
 * Một Ngọn Đèn (DESIGN.md). Không có chân màn: đây là nơi nút trợ giúp dẫn tới.
 */
export default function Help() {
  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.cuon}>
        <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
          Cần trợ giúp ngay
        </Text>
        <Text style={s.moDau}>
          Nếu bạn hoặc ai đó đang gặp nguy hiểm ngay lúc này, gọi cấp cứu.
        </Text>

        {nhomTheoNuoc(HOTLINES_FALLBACK).map(([nuoc, ds]) => (
          <View key={nuoc}>
            <Text style={[butChi.ngay, s.nuoc]} accessibilityRole="header">
              {TEN_NUOC[nuoc] ?? nuoc}
            </Text>
            {ds.map(({ name, hours, phone, url }) => (
              <View key={name} style={s.tam}>
                <Text style={s.ten}>{name}</Text>
                {hours ? <Text style={s.phu}>{hours}</Text> : null}
                {phone ? (
                  <View style={s.nutGoi}>
                    <NutDen
                      nhan={`Gọi ${phone}`}
                      accessibilityLabel={`Gọi ${name}, số ${docSo(phone)}`}
                      onPress={() => mo(`tel:${phone.replace(/\s/g, '')}`)}
                    />
                  </View>
                ) : null}
                {url ? (
                  <Pressable
                    style={({ pressed }) => [s.web, pressed && s.nhan]}
                    accessibilityRole="link"
                    accessibilityLabel={`Mở trang web ${name}`}
                    onPress={() => mo(url)}
                  >
                    <Text style={s.chuWeb}>{url.replace(/^https?:\/\//, '')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ))}

        <Text style={[s.phu, s.cuoi]}>
          Danh sách có sẵn trong máy, mở được cả khi không có mạng. Số nào không gọi được thì thử
          số khác.
        </Text>
        <DongLoi nhan="Quay lại" onPress={thoat} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: album.trang },
  cuon: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl },
  tieuDe: { color: album.chu },
  moDau: { ...text.than, color: album.chu, marginTop: space.sm },
  nuoc: { color: album.butChi, marginTop: space.xl, marginBottom: space.md },
  tam: { ...bong, backgroundColor: album.tam, padding: space.lg, marginBottom: space.lg },
  ten: { ...text.than, color: album.chu },
  phu: { ...text.phu, color: album.butChi, marginTop: space.xs },
  nutGoi: { marginTop: space.md },
  web: { minHeight: touch.toiThieu, justifyContent: 'center', marginTop: space.sm },
  nhan: { opacity: 0.6 },
  chuWeb: { ...text.nut, color: album.chu, textDecorationLine: 'underline' },
  cuoi: { marginTop: space.lg },
});
