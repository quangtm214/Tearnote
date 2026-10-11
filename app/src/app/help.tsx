import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HOTLINES_FALLBACK, topCountry, type Hotline } from '@/hotlines';
import { currentLang, t, deviceRegion, type Lang } from '@/i18n';
import { album, pencil, radius, space, text, touch } from '@/theme';
import { shadow, LinkRow, HelpButton, leave } from '@/ui';

/** Must work in airplane mode: reads only the bundled list, no network calls. */
const COUNTRY_NAMES: Record<string, Record<Lang, string>> = {
  VN: { vi: 'Việt Nam', en: 'Vietnam', ja: 'ベトナム' },
  JP: { vi: 'Nhật Bản', en: 'Japan', ja: '日本' },
  US: { vi: 'Mỹ', en: 'United States', ja: 'アメリカ' },
  GB: { vi: 'Vương quốc Anh', en: 'United Kingdom', ja: 'イギリス' },
};

const groupByCountry = (list: Hotline[]): [string, Hotline[]][] => {
  const map = new Map<string, Hotline[]>();
  for (const h of list) {
    const existing = map.get(h.country);
    if (existing) existing.push(h);
    else map.set(h.country, [h]);
  }
  return [...map];
};

/** TalkBack reads "096 306 1414" as a large number; spell it digit by digit so it is easy to follow. */
const spellDigits = (phone: string) => phone.replace(/\D/g, '').split('').join(' ');

// Devices that cannot call (tablet, no SIM) reject openURL — the number stays on screen to dial by hand.
const openUrl = (url: string) => Linking.openURL(url).catch(() => {});

/**
 * This screen is the help destination, so every Call button is a `HelpButton` — the only exception
 * to the One Lamp rule (DESIGN.md). No ScreenFooter: this is where the help button leads.
 */
export default function Help() {
  const lang = currentLang();
  // The user's country first (a Japanese user should not scroll past 115); the rest keep their order.
  const first = topCountry(deviceRegion(), lang);
  const groups = groupByCountry(HOTLINES_FALLBACK);

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[pencil.title, s.title]} accessibilityRole="header">
          {t.common.needHelp}
        </Text>
        <Text style={s.intro}>{t.help.intro}</Text>

        {[...groups.filter(([n]) => n === first), ...groups.filter(([n]) => n !== first)].map(([country, list]) => (
          <View key={country}>
            <Text style={[pencil.date, s.country]} accessibilityRole="header">
              {COUNTRY_NAMES[country]?.[lang] ?? country}
            </Text>
            {list.map(({ name, hours, phone, url }) => (
              <View key={name.vi} style={s.card}>
                <Text style={s.name}>{name[lang]}</Text>
                {hours ? <Text style={s.caption}>{hours[lang]}</Text> : null}
                {phone ? (
                  <View style={s.callButton}>
                    <HelpButton
                      icon="phone-outline"
                      label={t.help.call(phone)}
                      accessibilityLabel={t.help.callA11y(name[lang], spellDigits(phone))}
                      onPress={() => openUrl(`tel:${phone.replace(/\s/g, '')}`)}
                    />
                  </View>
                ) : null}
                {url ? (
                  <Pressable
                    style={({ pressed }) => [s.link, pressed && s.pressed]}
                    accessibilityRole="link"
                    accessibilityLabel={t.help.openWebsite(name[lang])}
                    onPress={() => openUrl(url)}
                  >
                    <Text style={s.linkText}>{url.replace(/^https?:\/\//, '')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ))}

        <Text style={[s.caption, s.footer]}>{t.help.footer}</Text>
        <LinkRow icon="arrow-left" label={t.common.back} onPress={leave} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  scroll: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: space.xl },
  title: { color: album.ink },
  intro: { ...text.body, color: album.ink, marginTop: space.sm },
  country: { color: album.pencil, marginTop: space.xl, marginBottom: space.md },
  card: { ...shadow, backgroundColor: album.card, borderRadius: radius.paper, padding: space.lg, marginBottom: space.lg },
  name: { ...text.body, color: album.ink },
  caption: { ...text.caption, color: album.pencil, marginTop: space.xs },
  callButton: { marginTop: space.md },
  link: { minHeight: touch.min, justifyContent: 'center', marginTop: space.sm },
  pressed: { opacity: 0.6 },
  linkText: { ...text.button, color: album.ink, textDecorationLine: 'underline' },
  footer: { marginTop: space.lg },
});
