import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useDispose } from "@/components/dispose";
import { Button, Header, Screen } from "@/components/ui";
import { formatKorean, today } from "@/lib/date";
import { deadlineOf, dueLabel, isDueToday, viewItem, type ItemView } from "@/lib/items";
import { useStore } from "@/store/store";
import { colors, fonts } from "@/theme";

/** 오늘 챙길 것 (FR-16): 기한 지남 → 오늘까지 → D-1 → D-3 순서 */
export default function Today() {
  const { items, sections, settings } = useStore();
  const dispose = useDispose();

  const base = today();
  const due = items
    .filter((it) => it.status === "active")
    .map((it) => viewItem(it, sections, base))
    .filter((v) => isDueToday(v, settings.notifyOffsets))
    .sort((a, b) => (a.left ?? 0) - (b.left ?? 0));

  const groups: { title: string; color: string; items: ItemView[] }[] = [];
  for (const v of due) {
    const left = v.left ?? 0;
    const title = dueLabel(left);
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push(v);
    else
      groups.push({
        title: left < 0 ? `🚨 ${title}` : title,
        color: left < 0 ? colors.overdueFg : left <= 1 ? colors.urgentFg : colors.calmFg,
        items: [v],
      });
  }

  return (
    <Screen>
      <Header title="오늘 챙길 것" />
      {due.length === 0 ? (
        <View style={styles.done}>
          <Text style={styles.doneTitle}>오늘 할 일 끝!{"\n"}냉장고 깨끗 ✨</Text>
          <Button label="홈으로" style={{ alignSelf: "stretch" }} onPress={() => router.back()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.lead}>
            냉장고 앞에서 하나씩 처리해줘. <Text style={{ color: colors.ink, fontWeight: "700" }}>{due.length}개</Text> 남았어
          </Text>
          {groups.map((g) => (
            <View key={g.title} style={{ gap: 8 }}>
              <Text style={[styles.groupTitle, { color: g.color }]}>{g.title}</Text>
              {g.items.map((v) => {
                const deadline = deadlineOf(v.item);
                const meta =
                  v.left !== null && v.left < 0 && deadline
                    ? [v.section?.name, `${formatKorean(deadline)}까지였어`].filter(Boolean).join(" · ")
                    : v.meta;
                return (
                  <View key={v.item.id} style={styles.row}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push(`/item/${v.item.id}`)}
                      style={{ flex: 1, gap: 2, minWidth: 0, minHeight: 44, justifyContent: "center" }}
                    >
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {v.title}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {meta}
                      </Text>
                    </Pressable>
                    <Button
                      label="처리했어"
                      variant="dark"
                      height={44}
                      fontSize={14}
                      style={{ borderRadius: 10, paddingHorizontal: 14 }}
                      onPress={() => dispose.request(v.item)}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
      {dispose.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 15, color: colors.inkMuted },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 18 },
  groupTitle: { fontSize: 14, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: "500", color: colors.ink },
  rowMeta: { fontSize: 13, color: colors.inkMuted },
  done: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28, paddingHorizontal: 24 },
  doneTitle: { fontFamily: fonts.display, fontSize: 30, lineHeight: 40, color: colors.ink, textAlign: "center" },
});
