import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getSetting,
  listAttachments,
  listEntries,
  listReceivedComforts,
  setSetting,
  type Attachment,
  type Entry,
} from '@/db';
import { t } from '@/i18n';
import { album, pencil, space } from '@/theme';
import { ScreenFooter, PhotoCorners, formatDate, PrimaryButton, EntryCard, type ComfortState } from '@/ui';


/** Group key by local date. */
const dayKey = (ms: number) => new Date(ms).toDateString();

/** Last opened Entry — on app start the album scrolls back to that night. */
const LAST_OPENED_KEY = 'timeline_dung';

export default function Timeline() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [comfortStates, setComfortStates] = useState<Record<string, ComfortState>>({});
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const scrollRef = useRef<ScrollView>(null);
  /** Night key to scroll to on the next render; null after scrolling. */
  const scrollTarget = useRef<string | null>(null);
  /** Entries shown on the previous focus — null on first open. */
  const seenIds = useRef<Set<string> | null>(null);

  useFocusEffect(
    useCallback(() => {
      const list = listEntries();
      const states: Record<string, ComfortState> = {};
      const atts: Record<string, Attachment[]> = {};
      for (const e of list) {
        const received = listReceivedComforts(e.id);
        if (received.length) states[e.id] = received.every((c) => c.thanked) ? 'thanked' : 'clipped';
        atts[e.id] = listAttachments(e.id);
      }
      // On app start: scroll to the last opened Entry's night. After Save: scroll to the new Entry's night —
      // otherwise the page keeps its old position and the user cannot see what they just saved.
      const seen = seenIds.current;
      const target = seen ? list.find((e) => !seen.has(e.id)) : list.find((e) => e.id === getSetting(LAST_OPENED_KEY));
      scrollTarget.current = target ? dayKey(target.occurredAt) : null;
      seenIds.current = new Set(list.map((e) => e.id));
      setEntries(list);
      setComfortStates(states);
      setAttachments(atts);
    }, []),
  );

  const openEntry = (id: string) => {
    setSetting(LAST_OPENED_KEY, id);
    router.push(`/comfort/${id}` as Href);
  };

  // Entries come sorted newest first from the DB — just start a new group when the day changes.
  const groups: Entry[][] = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    if (last && dayKey(last[0].occurredAt) === dayKey(e.occurredAt)) last.push(e);
    else groups.push([e]);
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={s.scroll}>
        <Text style={[pencil.title, s.title]} accessibilityRole="header">
          {t.timeline.title}
        </Text>

        {groups.length === 0 ? (
          <View style={s.emptyFrame}>
            <PhotoCorners />
            <Text style={[pencil.note, s.emptyText]}>{t.timeline.empty}</Text>
          </View>
        ) : (
          groups.map((group, i) => {
            const key = dayKey(group[0].occurredAt);
            return (
              <View
                key={key}
                onLayout={(ev) => {
                  // Scroll only when there is a target (app start, just saved), not on every return.
                  if (key !== scrollTarget.current) return;
                  scrollTarget.current = null;
                  // Wait one frame: inside onLayout the native ScrollView does not know the new content
                  // height yet and clamps to 0.
                  const y = i > 0 ? ev.nativeEvent.layout.y : 0;
                  requestAnimationFrame(() => scrollRef.current?.scrollTo({ y, animated: false }));
                }}
              >
                {i > 0 && <View style={s.tissue} />}
                <Text style={[pencil.date, s.date]} accessibilityRole="header">
                  {formatDate(group[0].occurredAt)}
                </Text>
                {group.map((e) => (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    attachments={attachments[e.id]}
                    comfortState={comfortStates[e.id]}
                    onPress={() => openEntry(e.id)}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      <ScreenFooter>
        <PrimaryButton label={t.timeline.newEntry} onPress={() => router.push('/new')} />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: album.page },
  scroll: { paddingHorizontal: space.screen, paddingTop: space.lg, paddingBottom: space.xl },
  title: { color: album.ink, marginBottom: space.lg },
  date: { color: album.pencil, marginBottom: space.md },

  // Tissue sheet between two nights: only a thin light edge shows. No frame, so it does not look like an input.
  tissue: {
    height: 10,
    backgroundColor: album.tissue,
    borderTopWidth: 1,
    borderColor: 'rgba(228, 220, 207, 0.22)',
    marginHorizontal: -space.sm,
    marginTop: space.md,
    marginBottom: space.xl,
    transform: [{ rotate: '-0.8deg' }],
  },

  emptyFrame: {
    minHeight: 160,
    justifyContent: 'center',
    padding: space.lg,
    marginBottom: space.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: album.hairline,
  },
  emptyText: { color: album.pencil, textAlign: 'center' },
});
