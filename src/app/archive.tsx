import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, Header, Screen } from "@/components/ui";
import { diffDays, formatKorean, toYmd, today } from "@/lib/date";
import { RESTORE_DAYS, useStore } from "@/store/store";
import { colors } from "@/theme";

/** 치운 식품 (FR-12): 30일 동안 복구할 수 있고, 기록은 계속 남는다 */
export default function Archive() {
  const { disposals, items, sections, restoreDisposal, showSnackbar } = useStore();
  const base = today();

  const rows = [...disposals]
    .sort((a, b) => b.disposedAt.localeCompare(a.disposedAt))
    .map((d) => {
      const item = items.find((it) => it.id === d.itemId);
      const day = toYmd(new Date(d.disposedAt));
      return { d, item, day, restoreLeft: RESTORE_DAYS - diffDays(day, base) };
    })
    .filter((r) => r.item);

  const days: { day: string; rows: typeof rows }[] = [];
  for (const r of rows) {
    const last = days[days.length - 1];
    if (last && last.day === r.day) last.rows.push(r);
    else days.push({ day: r.day, rows: [r] });
  }

  return (
    <Screen>
      <Header title="치운 식품" />
      <Text style={styles.lead}>실수로 치웠으면 복구해줘. {RESTORE_DAYS}일 안에는 다시 꺼낼 수 있어요</Text>
      {days.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 15, color: colors.inkMuted }}>아직 치운 식품이 없어</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {days.map((g) => (
            <View key={g.day} style={{ gap: 8 }}>
              <Text style={styles.dayTitle}>{g.day === base ? "오늘" : formatKorean(g.day)}</Text>
              {g.rows.map(({ d, item, restoreLeft }) => {
                const section = sections.find((s) => s.id === item!.sectionId);
                const name = item!.quantity > 1 ? `${item!.name} ${d.quantity}개` : item!.name;
                const canRestore = restoreLeft > 0;
                const meta = [item!.brand ?? section?.name, canRestore ? `${restoreLeft}일 동안 복구 가능` : null]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <View key={d.id} style={styles.row}>
                    <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {meta}
                      </Text>
                    </View>
                    {canRestore ? (
                      <Button
                        label="복구"
                        variant="outline"
                        height={44}
                        fontSize={14}
                        style={{ borderRadius: 10, paddingHorizontal: 14, backgroundColor: colors.bg }}
                        onPress={() => {
                          restoreDisposal(d.id);
                          showSnackbar({ message: `${item!.name} 다시 냉장고에 넣었어` });
                        }}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { paddingHorizontal: 20, paddingBottom: 16, fontSize: 14, color: colors.inkMuted },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 18 },
  dayTitle: { fontSize: 14, fontWeight: "700", color: colors.calmFg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    minHeight: 64,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: "500", color: colors.ink },
  rowMeta: { fontSize: 13, color: colors.inkMuted },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
});
