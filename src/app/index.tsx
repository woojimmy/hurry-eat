import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDispose } from "@/components/dispose";
import { Icon } from "@/components/icon";
import { SwipeRow } from "@/components/swipe-row";
import { Badge, Chip, IconButton } from "@/components/ui";
import { today } from "@/lib/date";
import { compareByDeadline, isDueToday, viewItem, type ItemView } from "@/lib/items";
import { useMonthStats } from "@/lib/stats";
import { useStore } from "@/store/store";
import { colors, fonts } from "@/theme";

type Group = { key: string; title: string; color: string; items: ItemView[] };

export default function Home() {
  const { items, sections, settings } = useStore();
  const [tab, setTab] = useState<number | "all">("all");
  const dispose = useDispose();
  const stats = useMonthStats();

  if (!settings.onboardingDone) return <Redirect href="/onboarding" />;

  const base = today();
  const views = items
    .filter((it) => it.status === "active")
    .map((it) => viewItem(it, sections, base))
    .sort(compareByDeadline);
  const dueCount = views.filter((v) => isDueToday(v, settings.notifyOffsets)).length;
  const shown = tab === "all" ? views : views.filter((v) => v.item.sectionId === tab);

  const groups: Group[] = [
    { key: "overdue", title: "🚨 기한 지남", color: colors.overdueFg, items: shown.filter((v) => v.tone === "overdue") },
    { key: "urgent", title: "얼른먹어", color: colors.urgentFg, items: shown.filter((v) => v.tone === "urgent") },
    { key: "calm", title: "여유 있음", color: colors.calmFg, items: shown.filter((v) => v.tone === "calm") },
  ].filter((g) => g.items.length > 0);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.logo}>얼른먹어</Text>
          <IconButton icon="settings" label="설정" onPress={() => router.push("/settings")} />
        </View>
        {stats.within > 0 ? (
          <Text style={styles.stat}>
            이번 달 기한 안에 챙긴 식품 <Text style={styles.statStrong}>{stats.within}개</Text>
          </Text>
        ) : null}
        {dueCount > 0 ? (
          <Link href="/today" asChild>
            <Pressable accessibilityRole="link" style={styles.banner}>
              <Text style={styles.bannerText}>오늘 챙길 거 {dueCount}개 있어. 얼른먹어!</Text>
              <Icon name="chevron" size={18} color={colors.brandInk} />
            </Pressable>
          </Link>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel="섹션"
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.tabs}
      >
        <Chip label="전체" selected={tab === "all"} onPress={() => setTab("all")} />
        {sections.map((s) => (
          <Chip key={s.id} label={s.name} selected={tab === s.id} onPress={() => setTab(s.id)} />
        ))}
      </ScrollView>

      {views.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>냉장고가 텅 비었네?</Text>
          <Text style={styles.emptyBody}>첫 식품을 찍어봐 📸</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {groups.length === 0 ? <Text style={styles.hint}>이 섹션은 비어 있어</Text> : null}
          {groups.map((g) => (
            <View key={g.key} style={{ gap: 8 }}>
              <Text style={[styles.groupTitle, { color: g.color }]}>{g.title}</Text>
              {g.items.map((v) => (
                <SwipeRow key={v.item.id} onSwipe={() => dispose.request(v.item)}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityHint="왼쪽으로 밀면 처리돼요"
                    onPress={() => router.push(`/item/${v.item.id}`)}
                    style={styles.row}
                  >
                    <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {v.title}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {v.meta}
                      </Text>
                    </View>
                    <Badge tone={v.tone} label={v.badge} />
                  </Pressable>
                </SwipeRow>
              ))}
            </View>
          ))}
          <Text style={styles.hint}>식품을 왼쪽으로 밀면 처리돼요</Text>
        </ScrollView>
      )}

      {views.length === 0 ? (
        <View pointerEvents="none" style={styles.tooltip}>
          <Text style={styles.tooltipText}>여기를 눌러 첫 식품을 등록해</Text>
        </View>
      ) : null}
      <SafeAreaView edges={["bottom"]} pointerEvents="box-none" style={styles.fabWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="식품 등록"
          onPress={() => router.push("/camera")}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
        >
          <Icon name="add" size={30} />
        </Pressable>
      </SafeAreaView>
      {dispose.sheet}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  stat: { fontSize: 14, color: colors.inkMuted },
  statStrong: { color: colors.ink, fontWeight: "700", backgroundColor: colors.brand },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.brandTint,
    borderRadius: 12,
  },
  bannerText: { fontSize: 15, fontWeight: "500", color: colors.brandInk },
  tabs: { gap: 8, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 120, gap: 16 },
  groupTitle: { fontSize: 14, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 64,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: "500", color: colors.ink },
  rowMeta: { fontSize: 13, color: colors.inkMuted },
  hint: { fontSize: 13, color: colors.inkMuted, textAlign: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 120 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  emptyBody: { fontSize: 16, color: colors.inkMuted },
  fabWrap: { position: "absolute", right: 20, bottom: 0 },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 28,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tooltip: {
    position: "absolute",
    right: 20,
    bottom: 140,
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tooltipText: { color: colors.surface, fontSize: 14, fontWeight: "500" },
});
