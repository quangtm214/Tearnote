import { loadAsync, useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { currentLang, subscribeLanguage } from '@/i18n';
import { refreshTags } from '@/supabase';
import { album } from '@/theme';
import { SnackbarHost } from '@/ui';

SplashScreen.preventAutoHideAsync();

/** Yomogi is ~4MB and only Japanese needs it (Patrick Hand has no kana) — do not load it for everyone. */
const YOMOGI = { Yomogi: require('../../assets/fonts/Yomogi-Regular.ttf') };

/**
 * One Stack for every route. expo-router registers screens from files; only screens with their own
 * options are listed. `slide_from_right` is the native push: the only animation where the iOS edge
 * swipe-back follows the finger (custom ones like `fade` just pop).
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

  // Background: forms read the SQLite copy, so a slow or failed fetch never blocks them.
  useEffect(() => {
    refreshTags().catch(() => {});
  }, []);

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
    // Android draws one empty frame when a pushed screen pops; without this the Expo Go window shows through white.
    <View style={{ flex: 1, backgroundColor: album.page }}>
      <StatusBar style="light" />
      <Stack
        key={lang}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: album.page },
          animation: 'slide_from_right',
        }}
      >
        {/* Listed first: once any screen is listed, the first one becomes the initial route. */}
        <Stack.Screen name="(tabs)" />
        {/* An interruption that returns where it came from: closes with × (TopBar); iOS shows a page sheet. */}
        <Stack.Screen name="account" options={{ presentation: 'modal', animation: 'default' }} />
      </Stack>
      <SnackbarHost />
    </View>
  );
}
