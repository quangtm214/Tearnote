import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isRealAccount, supabase } from '@/supabase';
import { TAG_IDS, TAG_LABEL_VI, type TagId } from '@/tags';
import { color, radius, space, text, touch } from '@/theme';

const TOI_THIEU = 20;
const TOI_DA = 500;
const TAG_TOI_DA = 2;

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
  const [xong, setXong] = useState(false);

  useEffect(() => {
    let huy = false;
    isRealAccount().then((that) => {
      if (huy) return;
      if (!that) router.replace('/login');
      else setChoDuyenQuyen(false);
    });
    return () => {
      huy = true;
    };
  }, []);

  const doDai = body.trim().length;
  const guiDuoc = doDai >= TOI_THIEU && doDai <= TOI_DA && tags.length > 0 && !dangGui;

  function doiTag(t: TagId) {
    setTags((truoc) =>
      truoc.includes(t)
        ? truoc.filter((x) => x !== t)
        : truoc.length >= TAG_TOI_DA
          ? truoc
          : [...truoc, t],
    );
  }

  async function gui() {
    if (!guiDuoc) return;
    setLoi(null);
    setDangGui(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        router.replace('/login');
        return;
      }

      // author_id là cột not null nên vẫn phải truyền, dù RLS ép nó = auth.uid().
      const { error } = await supabase.from('comforts').insert({
        author_id: u.user.id,
        body: body.trim(),
        source_lang: 'vi',
        tags,
      });

      if (error) {
        // 42501 = RLS chặn. Ở bảng này chỉ có một lý do: đã đủ 5 lời trong 24h.
        setLoi(
          error.code === '42501'
            ? 'Hôm nay bạn đã gửi 5 lời rồi. Mai quay lại nhé.'
            : 'Chưa gửi được. Có vẻ mạng đang chập chờn — thử lại sau một lát.',
        );
        return;
      }
      setXong(true);
    } catch {
      setLoi('Không kết nối được. Kiểm tra mạng rồi thử lại.');
    } finally {
      setDangGui(false);
    }
  }

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (choDuyenQuyen) {
    return (
      <SafeAreaView style={s.man}>
        <View style={s.giua}>
          <ActivityIndicator color={color.chuPhu} />
        </View>
      </SafeAreaView>
    );
  }

  if (xong) {
    return (
      <SafeAreaView style={s.man}>
        <View style={s.noiDungXong}>
          <Text style={s.tieuDe}>Đã nhận lời của bạn</Text>
          <Text style={s.giaiThich}>
            Lời này sẽ được đọc duyệt trước, rồi mới gửi tới một người lạ. Chưa gửi đi ngay.
          </Text>
          <Pressable style={s.nutChinh} onPress={thoat} accessibilityRole="button">
            <Text style={s.chuNutChinh}>Xong</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.man}>
      <ScrollView contentContainerStyle={s.noiDung} keyboardShouldPersistTaps="handled">
        <Text style={s.tieuDe}>Viết một lời</Text>
        <Text style={s.giaiThich}>
          Một người lạ đang có chuyện giống bạn từng có sẽ đọc nó. Họ không biết bạn là ai, bạn cũng
          không biết họ.
        </Text>

        <TextInput
          style={s.oVanBan}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          maxLength={TOI_DA}
          placeholder="Viết điều bạn từng muốn nghe."
          placeholderTextColor={color.chuPhu}
          editable={!dangGui}
        />
        <Text style={s.dem}>
          {doDai}/{TOI_DA}
          {doDai < TOI_THIEU ? `  (cần ít nhất ${TOI_THIEU} ký tự)` : ''}
        </Text>

        <Text style={s.nhan}>Lời này dành cho chuyện gì?</Text>
        <Text style={s.phu}>Chọn tối đa {TAG_TOI_DA}.</Text>
        <View style={s.hangTag}>
          {TAG_IDS.map((t) => {
            const chon = tags.includes(t);
            return (
              <Pressable
                key={t}
                onPress={() => doiTag(t)}
                disabled={dangGui}
                accessibilityRole="button"
                accessibilityState={{ selected: chon }}
                style={[s.tag, chon && s.tagChon]}>
                <Text style={[s.chuTag, chon && s.chuTagChon]}>{TAG_LABEL_VI[t]}</Text>
              </Pressable>
            );
          })}
        </View>

        {loi ? <Text style={s.loi}>{loi}</Text> : null}

        <Pressable
          style={[s.nutChinh, !guiDuoc && s.mo]}
          onPress={gui}
          disabled={!guiDuoc}
          accessibilityRole="button">
          {dangGui ? (
            <ActivityIndicator color={color.demKhuya} />
          ) : (
            <Text style={s.chuNutChinh}>Gửi</Text>
          )}
        </Pressable>
        <Text style={s.phu}>Lời của bạn được đọc duyệt trước khi tới tay ai đó.</Text>

        <Pressable style={s.nutThoat} onPress={thoat} accessibilityRole="button">
          <Text style={s.chuThoat}>Quay lại</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  man: { flex: 1, backgroundColor: color.demKhuya },
  giua: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noiDung: { paddingHorizontal: space.man, paddingVertical: space.lg, gap: space.md },
  noiDungXong: {
    flex: 1,
    paddingHorizontal: space.man,
    paddingVertical: space.lg,
    gap: space.md,
    justifyContent: 'center',
  },
  tieuDe: { ...text.tieuDe, color: color.chuChinh },
  giaiThich: { ...text.than, color: color.chuPhu },
  nhan: { ...text.nhan, color: color.chuChinh, marginTop: space.md },
  phu: { ...text.phu, color: color.chuPhu },
  oVanBan: {
    ...text.than,
    color: color.chuChinh,
    backgroundColor: color.matGiay,
    borderRadius: radius.o,
    padding: space.md,
    minHeight: 160,
  },
  dem: { ...text.phu, color: color.chuPhu },
  hangTag: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tag: {
    minHeight: touch.toiThieu,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.vien,
    backgroundColor: color.matGiay,
  },
  tagChon: { backgroundColor: color.anhTrang },
  chuTag: { ...text.nut, color: color.chuPhu },
  chuTagChon: { color: color.demKhuya },
  loi: {
    ...text.than,
    color: color.chuChinh,
    backgroundColor: color.matGiay,
    padding: space.md,
    borderRadius: radius.o,
  },
  nutChinh: {
    minHeight: touch.chinh,
    borderRadius: radius.o,
    backgroundColor: color.anhTrang,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  chuNutChinh: { ...text.nut, color: color.demKhuya },
  mo: { opacity: 0.5 },
  nutThoat: { minHeight: touch.toiThieu, justifyContent: 'center', marginTop: space.lg },
  chuThoat: { ...text.nut, color: color.chuPhu },
});
