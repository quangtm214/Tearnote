import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { color, text } from '@/theme';

/**
 * Stack chung cho mọi route. Không liệt kê từng màn — expo-router tự đăng ký theo file,
 * nên route thêm sau (login, comfort/*) không cần đụng file này.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.demKhuya },
          headerStyle: { backgroundColor: color.demKhuya },
          headerTintColor: color.chuChinh,
          headerTitleStyle: { fontSize: text.nhan.fontSize },
          animation: 'fade',
        }}
      />
    </>
  );
}
