import { router, useFocusEffect, type Href } from 'expo-router';
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

import { LANGS, ngonNgu, nhanTag, t, TEN_GOC, type Lang } from '@/i18n';
import { isRealAccount, supabase } from '@/supabase';
import { MAX_COMFORT_TAGS, TAG_IDS, type TagId } from '@/tags';
import { album, butChi, space, text } from '@/theme';
import { ChanMan, DongLoi, NutChinh, Pill } from '@/ui';

const TOI_THIEU = 20;
const TOI_DA = 500;

/**
 * Viết Comfort. Hai luật quan trọng nhất KHÔNG nằm ở đây mà ở DB:
 * "chỉ tài khoản thật" và "tối đa 5 / 24h" do RLS ép (docs/db.md). App chỉ dịch lỗi ra lời.
 */
export default function WriteComfortScreen() {
  const [choDuyenQuyen, setChoDuyenQuyen] = useState(true);
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<TagId[]>([]);
  // source_lang: batch dịch từ đây. Mặc định ngôn ngữ app, nhưng người viết có thể viết tiếng khác.
  const [nguon, setNguon] = useState<Lang>(ngonNgu);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [hetPhien, setHetPhien] = useState(false);
  const [xong, setXong] = useState(false);
  const daHoi = useRef(false);

  const thoat = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));

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

  function doiTag(tag: TagId) {
    setTags((truoc) =>
      truoc.includes(tag)
        ? truoc.filter((x) => x !== tag)
        : truoc.length >= MAX_COMFORT_TAGS
          ? truoc
          : [...truoc, tag],
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
        bao(t.viet.hetPhien);
        return;
      }

      // author_id là cột not null nên vẫn phải truyền, dù RLS ép nó = auth.uid().
      const { error } = await supabase.from('comforts').insert({
        author_id: user.id,
        body: body.trim(),
        source_lang: nguon,
        tags,
      });

      if (error) {
        // 42501 = RLS chặn, và policy comfort_insert có ba điều kiện. Hết lượt 5/24h là
        // lý do hay gặp nhất, nhưng tài khoản anonymous hoặc session hết hạn cũng trả
        // đúng mã này — hỏi lại để khỏi hiện một câu sai.
        if (error.code === '42501' && (await isRealAccount())) {
          bao(t.viet.hetLuot);
        } else if (error.code === '42501') {
          setHetPhien(true);
          bao(t.viet.hetPhien);
        } else {
          // supabase-js trả lỗi mạng qua `error` với code rỗng; có code là server từ chối.
          bao(error.code ? t.viet.loiGui : t.chung.loiMang);
        }
        return;
      }
      setXong(true);
    } catch {
      bao(t.chung.loiMang);
    } finally {
      setDangGui(false);
    }
  }

  if (choDuyenQuyen) {
    return (
      <SafeAreaView style={s.man} edges={['top', 'bottom']}>
        <View style={s.giua}>
          <ActivityIndicator color={album.butChi} accessibilityLabel={t.chung.dangTai} />
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
            {t.viet.xongTieuDe}
          </Text>
          <Text style={s.giaiThich}>{t.viet.xongPhu}</Text>
          <NutChinh nhan={t.viet.xong} onPress={thoat} />
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
            {t.chung.vietLoi}
          </Text>
          <Text style={s.giaiThich}>{t.viet.moDau}</Text>
          <Text style={s.phu}>{t.viet.goiY}</Text>

          <TextInput
            style={s.oVanBan}
            value={body}
            onChangeText={setBody}
            accessibilityLabel={t.viet.oNhap}
            multiline
            textAlignVertical="top"
            maxLength={TOI_DA}
            placeholder={t.viet.oNhapGoiY}
            placeholderTextColor={album.butChi}
            selectionColor={album.butChi}
            editable={!dangGui}
          />
          <Text style={s.dem} accessibilityLabel={t.viet.demA11y(doDai, TOI_DA)}>
            {doDai}/{TOI_DA}
            {doDai < TOI_THIEU ? t.viet.conThieu(TOI_THIEU - doDai) : ''}
          </Text>

          <Text style={[butChi.ngay, s.nhan]} accessibilityRole="header">
            {t.viet.vietBang}
          </Text>
          <View style={s.hangTag} accessibilityRole="radiogroup">
            {LANGS.map((l) => (
              <Pill
                key={l}
                nhan={TEN_GOC[l]}
                mot
                chon={nguon === l}
                tat={dangGui}
                onPress={() => setNguon(l)}
              />
            ))}
          </View>

          <Text style={[butChi.ngay, s.nhan]} accessibilityRole="header">
            {t.viet.danhCho}
          </Text>
          <Text style={s.phu}>{t.viet.chonTag(MAX_COMFORT_TAGS, nhanTag('unknown'))}</Text>
          <View style={s.hangTag}>
            {TAG_IDS.map((tag) => {
              const chon = tags.includes(tag);
              return (
                <Pill
                  key={tag}
                  nhan={nhanTag(tag)}
                  chon={chon}
                  tat={dangGui || (!chon && tags.length >= MAX_COMFORT_TAGS)}
                  onPress={() => doiTag(tag)}
                />
              );
            })}
          </View>

          {/* Đồng ý rõ ràng trước khi lời vào pool — overview.md §6. */}
          <Text style={[s.phu, s.dongY]}>{t.viet.dongY(LANGS.filter((l) => l !== nguon))}</Text>

          {loi ? <Text style={s.loi}>{loi}</Text> : null}
          {hetPhien ? (
            <DongLoi nhan={t.viet.dangNhapLai} onPress={() => router.push('/login')} />
          ) : null}

          <NutChinh nhan={t.viet.gui} onPress={gui} tat={!guiDuoc && !dangGui} dangChay={dangGui} />

          <DongLoi nhan={t.chung.quayLai} onPress={thoat} />
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
