import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { color } from '@/theme';

SplashScreen.preventAutoHideAsync();

/**
 * Stack chung cho mọi route. Không liệt kê từng màn — expo-router tự đăng ký theo file,
 * nên route thêm sau (login, comfort/*) không cần đụng file này.
 */
export default function RootLayout() {
  // Font lỗi thì vẫn mở app bằng font hệ thống — không để màn trắng chặn lối trợ giúp.
  const [xong, loi] = useFonts({ VT323: require('../../assets/fonts/VT323-Regular.ttf') });

  useEffect(() => {
    if (xong || loi) SplashScreen.hideAsync();
  }, [xong, loi]);

  if (!xong && !loi) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.demKhuya },
          animation: 'fade',
        }}
      />
    </>
  );
}
