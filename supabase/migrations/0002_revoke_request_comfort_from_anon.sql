
-- Supabase cấp execute cho anon theo mặc định. Chưa đăng nhập thì auth.uid() là null,
-- nên hàm vốn đã không trả gì — nhưng để anon gọi được một security definer là thừa bề mặt.
revoke execute on function request_comfort(tag[], lang) from anon;
