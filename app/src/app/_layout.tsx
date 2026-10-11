import { loadAsync, useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { currentLang, subscribeLanguage } from '@/i18n';
import { album } from '@/theme';

SplashScreen.preventAutoHideAsync();

/** Yomogi is ~4MB and only Japanese needs it (Patrick Hand has no kana) — do not load it for everyone. */
const YOMOGI = { Yomogi: require('../../assets/fonts/Yomogi-Regular.ttf') };

/**
 * One Stack for every route. Screens are not listed — expo-router registers them from files,
 * so new routes do not need changes here.
 */
export default function RootLayout() {
  const [lang, setLang] = useState(currentLang);
  // If fonts fail, open with the system font — a blank screen must never block the help button.
  // useFonts reads its map only on mount; switching to Japanese later loads Yomogi below.
  const [loaded, fontError] = useFonts({
    PatrickHand: require('../../assets/fonts/PatrickHand-Regular.ttf'),
    ...(lang === 'ja' ? YOMOGI : {}),
  });

  useEffect(() => {
    if (loaded || fontError) SplashScreen.hideAsync();
  }, [loaded, fontError]);

  // Language change from Settings: `t` already holds the new text; changing `key` rebuilds every screen.
  // For Japanese, load Yomogi first; if it fails, switch anyway — kana falls back to the system font.
  useEffect(
    () =>
      subscribeLanguage((next) => {
        (next === 'ja' ? loadAsync(YOMOGI).catch(() => {}) : Promise.resolve()).then(() => setLang(next));
      }),
    [],
  );

  if (!loaded && !fontError) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        key={lang}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: album.page },
          animation: 'fade',
        }}
      />
    </>
  );
}
