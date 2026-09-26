import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isRealAccount, supabase } from '@/supabase';
import { MAX_COMFORT_TAGS, TAG_IDS, TAG_LABEL_VI, type TagId } from '@/tags';
import { album, butChi, space, text } from '@/theme';
import { ChanMan, DongLoi, NutChinh, Pill } from '@/ui';

const TOI_THIEU = 20;
const TOI_DA = 500;

/**
 * Viết Comfort. Hai luật quan trọng nhất KHÔNG nằm ở đây mà ở DB:
 * "chỉ tài khoản thật" và "tối đa 5 / 24h" do RLS ép (docs/db.md). App chỉ dịch lỗi ra tiếng Việt.
 */
export default function WriteComfortScreen() {
  const [choDuyenQuyen, setChoDuyenQuyen] = useState(true);
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<TagId[]>([]);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [hetPhien, setHetPhien] = useState(false);
  const [xong, setXong] = useState(false);
  const daHoi = useRef(false);

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // push chứ không replace: đăng nhập xong thì quay về đúng màn này, chữ đã gõ còn nguyên.
  useFocusEffect(
    useCallback(() => {
      let huy = false;
      isRealAccount().then((that) => {
        if (huy) return;
        if (that) return setChoDuyenQuyen(false);
        // Lần đầu thì sang đăng nhập; quay về mà vẫn chưa đăng nhập ("Để sau") thì rời màn viết.
        if (daHoi.current) thoat();
        else {
          daHoi.current = true;
          router.push('/login');
        }
      });
      return () => {
        huy = true;
      };
    }, []),
  );

  // Đếm theo code point cho khớp CHECK char_length(body) của Postgres — emoji là 1, không phải 2.
  const doDai = [...body.trim()].length;
  const guiDuoc = doDai >= TOI_THIEU && doDai <= TOI_DA && tags.length > 0 && !dangGui;

  function doiTag(t: TagId) {
    setTags((truoc) =>
      truoc.includes(t)
        ? truoc.filter((x) => x !== t)
        : truoc.length >= MAX_COMFORT_TAGS
          ? truoc
          : [...truoc, t],
    );
  }

  const bao = (msg: string) => {
    setLoi(msg);
    AccessibilityInfo.announceForAccessibility(msg);
  };

  async function gui() {
    if (!guiDuoc) return;
    setLoi(null);
    setHetPhien(false);
    setDangGui(true);
    try {
      // Session trên máy, không gọi mạng: mất mạng thì để insert báo lỗi mạng, đừng đá sang login.
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setHetPhien(true);
        bao('Phiên đăng nhập đã hết. Đăng nhập lại rồi gửi — chữ bạn gõ vẫn còn đây.');
        return;
      }

      // author_id là cột not null nên vẫn phải truyền, dù RLS ép nó = auth.uid().
      const { error } = await supabase.from('comforts').insert({
        author_id: user.id,
        body: body.trim(),
        source_lang: 'vi',
        tags,
      });

      if (error) {
        // 42501 = RLS chặn, và policy comfort_insert có ba điều kiện. Hết lượt 5/24h là
        // lý do hay gặp nhất, nhưng tài khoản anonymous hoặc session hết hạn cũng trả
        // đúng mã này — hỏi lại để khỏi hiện một câu sai.
        if (error.code === '42501' && (await isRealAccount())) {
          bao('Bạn đã gửi đủ 5 lời trong 24 giờ qua. Chưa gửi thêm được.');
        } else if (error.code === '42501') {
          setHetPhien(true);
          bao('Phiên đăng nhập đã hết. Đăng nhập lại rồi gửi — chữ bạn gõ vẫn còn đây.');
        } else {
          // supabase-js trả lỗi mạng qua `error` với code rỗng; có code là server từ chối.
          bao(
            error.code
              ? 'Chưa gửi được. Lời vẫn còn đây — thử gửi lại sau một lát.'
              : 'Không kết nối được. Kiểm tra mạng rồi thử lại.',
          );
        }
        return;
      }
      setXong(true);
    } catch {
      bao('Không kết nối được. Kiểm tra mạng rồi thử lại.');
    } finally {
      setDangGui(false);
    }
  }

  if (choDuyenQuyen) {
    return (
      <SafeAreaView style={s.man} edges={['top', 'bottom']}>
        <View style={s.giua}>
          <ActivityIndicator color={album.butChi} accessibilityLabel="Đang tải" />
        </View>
        <ChanMan />
      </SafeAreaView>
    );
  }

  if (xong) {
    return (
      <SafeAreaView style={s.man} edges={['top', 'bottom']}>
        <View style={s.noiDungXong}>
          <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
            Đã nhận lời của bạn
          </Text>
          <Text style={s.giaiThich}>
            Lời này sẽ được duyệt trước, rồi mới tới tay một người lạ. Muốn rút lại thì vào Cài đặt
            → Lời bạn đã viết.
          </Text>
          <NutChinh nhan="Xong" onPress={thoat} />
        </View>
        <ChanMan />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.man} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.man} behavior="padding">
        <ScrollView contentContainerStyle={s.noiDung} keyboardShouldPersistTaps="handled">
          <Text style={[butChi.tieuDe, s.tieuDe]} accessibilityRole="header">
            Viết một lời cho người lạ
          </Text>
          <Text style={s.giaiThich}>
            Lời này sẽ tới một người lạ vừa khóc vì chuyện tương tự. Hai bên không biết nhau.
          </Text>
          <Text style={s.phu}>
            Kể điều từng giúp bạn, không cần khuyên. Đừng để lại tên, số điện thoại hay mạng xã
            hội.
          </Text>

          <TextInput
            style={s.oVanBan}
            value={body}
            onChangeText={setBody}
            accessibilityLabel="Lời cho người lạ"
            multiline
            textAlignVertical="top"
            maxLength={TOI_DA}
            placeholder="Viết điều bạn từng muốn nghe."
            placeholderTextColor={album.butChi}
            selectionColor={album.butChi}
            editable={!dangGui}
          />
          <Text style={s.dem} accessibilityLabel={`${doDai} trên ${TOI_DA} ký tự`}>
            {doDai}/{TOI_DA}
            {doDai < TOI_THIEU ? ` · còn thiếu ${TOI_THIEU - doDai} ký tự` : ''}
          </Text>

          <Text style={[butChi.ngay, s.nhan]} accessibilityRole="header">
            Lời này dành cho chuyện gì?
          </Text>
          <Text style={s.phu}>
            Chọn 1 hoặc {MAX_COMFORT_TAGS}. Lời hợp với bất kỳ ai đang buồn thì chọn “
            {TAG_LABEL_VI.unknown}”.
          </Text>
          <View style={s.hangTag}>
            {TAG_IDS.map((t) => {
              const chon = tags.includes(t);
              return (
                <Pill
                  key={t}
                  nhan={TAG_LABEL_VI[t]}
                  chon={chon}
                  tat={dangGui || (!chon && tags.length >= MAX_COMFORT_TAGS)}
                  onPress={() => doiTag(t)}
                />
              );
            })}
          </View>

          {/* Đồng ý rõ ràng trước khi lời vào pool — overview.md §6. */}
          <Text style={[s.phu, s.dongY]}>
            Bấm Gửi là bạn đồng ý: lời này được duyệt, dịch sang tiếng Anh và tiếng Nhật, rồi gửi
            ẩn danh tới người lạ. Thu hồi được trong Cài đặt → Lời bạn đã viết; ai đã nhận thì vẫn
            giữ bản của họ.
          </Text>

          {loi ? <Text style={s.loi}>{loi}</Text> : null}
          {hetPhien ? <DongLoi nhan="Đăng nhập lại" onPress={() => router.push('/login')} /> : null}

          <NutChinh nhan="Gửi" onPress={gui} tat={!guiDuoc && !dangGui} dangChay={dangGui} />

          <DongLoi nhan="Quay lại" onPress={thoat} />
        </ScrollView>
        <ChanMan />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hangTag: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  man: { flex: 1, backgroundColor: album.trang },
  giua: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noiDung: { paddingHorizontal: space.man, paddingTop: space.lg, paddingBottom: space.xl, gap: space.md },
  noiDungXong: {
    flex: 1,
    paddingHorizontal: space.man,
    paddingVertical: space.lg,
    gap: space.md,
    justifyContent: 'center',
  },
  tieuDe: { color: album.chu },
  giaiThich: { ...text.than, color: album.butChi },
  nhan: { color: album.butChi, marginTop: space.md },
  phu: { ...text.phu, color: album.butChi },
  dongY: { marginTop: space.md },
  oVanBan: {
    ...text.than,
    color: album.chu,
    backgroundColor: album.tam,
    padding: space.md,
    minHeight: 160,
  },
  dem: { ...text.phu, color: album.butChi },
  loi: { ...text.than, color: album.chu },
});
