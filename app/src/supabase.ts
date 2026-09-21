import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

/**
 * Server chỉ làm 4 việc: pool Comfort, bản dịch, hotline, và bản sao Entry cho ai bật sync.
 * Entry KHÔNG tự động lên đây — xem ADR 0004.
 */

// ponytail: SecureStore giới hạn ~2KB mỗi giá trị. Session hiện tại vừa; nếu JWT phình
// (thêm custom claim) thì phải cắt nhỏ theo khoá. Đừng đổi sang AsyncStorage —
// token auth nằm plaintext trên máy là bước lùi, không phải bước đơn giản hoá.
const store = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: store,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

/**
 * Mỗi lần cài app sinh một anonymous user. Nó là chỗ neo cho "đã gửi Comfort nào cho ai",
 * không phải một lần đăng ký. Tài khoản thật (email) chỉ xuất hiện khi người dùng muốn
 * VIẾT Comfort hoặc bật sync.
 *
 * Gọi được nhiều lần: đã có session thì không làm gì.
 */
export async function ensureSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) await supabase.auth.signInAnonymously();
}

/** Tài khoản thật = đã đăng nhập bằng email. Chỉ tài khoản thật mới được viết Comfort. */
export async function isRealAccount(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return !!data.user && data.user.is_anonymous !== true;
}
