import { loadAsync, useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { ngonNgu, theoDoiNgonNgu } from '@/i18n';
import { album } from '@/theme';

SplashScreen.preventAutoHideAsync();

/** Yomogi nặng ~4MB và chỉ tiếng Nhật cần (Patrick Hand không có kana) — không nạp cho mọi người. */
const YOMOGI = { Yomogi: require('../../assets/fonts/Yomogi-Regular.ttf') };

/**
 * Stack chung cho mọi route. Không liệt kê từng màn — expo-router tự đăng ký theo file,
 * nên route thêm sau (login, comfort/*) không cần đụng file này.
 */
export default function RootLayout() {
  const [lang, setLang] = useState(ngonNgu);
  // Font lỗi thì vẫn mở app bằng font hệ thống — không để màn trắng chặn lối trợ giúp.
  // useFonts chỉ đọc map lúc mount; đổi sang tiếng Nhật sau đó thì nạp ở dưới.
  const [xong, loi] = useFonts({
    PatrickHand: require('../../assets/fonts/PatrickHand-Regular.ttf'),
    ...(lang === 'ja' ? YOMOGI : {}),
  });

  useEffect(() => {
    if (xong || loi) SplashScreen.hideAsync();
  }, [xong, loi]);

  // Đổi ngôn ngữ trong Cài đặt: `t` đã mang chữ mới, đổi `key` để dựng lại mọi màn. Sang tiếng Nhật
  // thì nạp Yomogi trước; nạp hỏng vẫn đổi — kana rơi về font hệ thống.
  useEffect(
    () =>
      theoDoiNgonNgu((l) => {
        (l === 'ja' ? loadAsync(YOMOGI).catch(() => {}) : Promise.resolve()).then(() => setLang(l));
      }),
    [],
  );

  if (!xong && !loi) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        key={lang}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: album.trang },
          animation: 'fade',
        }}
      />
    </>
  );
}
