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

/**
 * fetch của RN (OkHttp) không có hạn chờ: mất mạng sau khi đã có một kết nối giữ sẵn thì yêu cầu kế tiếp
 * treo mãi, kể cả khi có mạng lại — nút "Nhận một lời" quay không dừng. Cắt ở 20 giây để màn hình báo
 * "không kết nối được"; supabase-js trả lỗi đó qua `error` như mọi lỗi mạng khác.
 */
// ponytail: huỷ yêu cầu không đuổi được kết nối chết khỏi pool của OkHttp — trên emulator (bật/tắt máy bay
// giữ nguyên IP) các yêu cầu sau vẫn lỗi tới khi mở lại app. Dứt điểm cần cấu hình OkHttp phía native
// (`pingInterval`), tức dev client thay Expo Go; làm khi build bản thật.
const HAN_CHO_MS = 20_000;
const fetchCoHan: typeof fetch = (input, init) => {
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), HAN_CHO_MS);
  init?.signal?.addEventListener('abort', () => huy.abort());
  return fetch(input, { ...init, signal: huy.signal }).finally(() => clearTimeout(hen));
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    global: { fetch: fetchCoHan },
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

/**
 * Tài khoản thật = đã đăng nhập bằng email. Chỉ tài khoản thật mới được viết Comfort.
 * Đọc session trên máy chứ không `getUser()`: gọi mạng thì mất sóng là bị coi như chưa đăng nhập.
 * Chỉ để chọn màn/câu chữ — luật thật do RLS ép (docs/db.md).
 */
export async function isRealAccount(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session && data.session.user.is_anonymous !== true;
}
