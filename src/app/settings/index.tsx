import Constants from "expo-constants";
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { offsetsLabel, TimeSheet } from "@/components/notify";
import { Button, Dialog, Header, Screen, text, Toggle } from "@/components/ui";
import { formatTime } from "@/lib/date";
import { useMonthStats } from "@/lib/stats";
import { useStore } from "@/store/store";
import { colors } from "@/theme";

export default function Settings() {
  const { settings, updateSettings, clearHistory, showSnackbar } = useStore();
  const stats = useMonthStats();
  const [timeOpen, setTimeOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <Screen>
      <Header title="설정" />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={[styles.stat, { backgroundColor: colors.brandTint }]}>
            <Text style={{ fontSize: 13, color: colors.brandInk }}>기한 안에 챙김</Text>
            <Text style={styles.statValue}>{stats.within}개</Text>
          </View>
          <View style={[styles.stat, styles.statPlain]}>
            <Text style={{ fontSize: 13, color: colors.inkMuted }}>이번 달 정리</Text>
            <Text style={styles.statValue}>{stats.cleared}개</Text>
          </View>
        </View>

        <Group title="알림" note="챙길 게 있는 날만, 하루 한 번 알려줘요">
          <View style={[styles.row, styles.rowDivider, { minHeight: 52 }]}>
            <Text style={styles.rowText}>매일 알림 받기</Text>
            <Toggle
              label="매일 알림 받기"
              value={settings.notifyEnabled}
              onChange={(v) => updateSettings({ notifyEnabled: v })}
            />
          </View>
          <Row label="언제 알려줄까" value={offsetsLabel(settings.notifyOffsets)} onPress={() => router.push("/settings/notify")} divider />
          <Row label="알림 시간" value={formatTime(settings.notifyTime)} onPress={() => setTimeOpen(true)} />
        </Group>

        <Group title="냉장고">
          <Row label="섹션 관리" onPress={() => router.push("/settings/sections")} divider />
          <Row label="치운 식품" onPress={() => router.push("/archive")} divider />
          <Pressable accessibilityRole="button" onPress={() => setClearOpen(true)} style={styles.row}>
            <Text style={[styles.rowText, { color: colors.overdueFg }]}>기록 전체 지우기</Text>
          </Pressable>
        </Group>

        <Group title="정보">
          <Row label="사용법 다시 보기" onPress={() => router.push({ pathname: "/onboarding/guide", params: { replay: "1" } })} divider />
          <Row label="개인정보처리방침" onPress={() => showSnackbar({ message: "개인정보처리방침은 준비 중이야" })} divider />
          <Row label="오픈소스 라이선스" onPress={() => showSnackbar({ message: "오픈소스 라이선스는 준비 중이야" })} />
        </Group>

        <Text style={[text.caption, { textAlign: "center" }]}>앱을 삭제하면 데이터도 사라져요 · 버전 {version}</Text>
      </ScrollView>

      <TimeSheet
        visible={timeOpen}
        value={settings.notifyTime}
        onClose={() => setTimeOpen(false)}
        onPick={(t) => updateSettings({ notifyTime: t })}
      />

      <Dialog visible={clearOpen} onClose={() => setClearOpen(false)}>
        <Text style={text.sheetTitle}>기록을 전부 지울까?</Text>
        <Text style={{ fontSize: 15, color: colors.inkMuted }}>
          치운 식품과 통계가 모두 사라지고 되돌릴 수 없어요. 냉장고에 있는 식품은 그대로 둬요.
        </Text>
        <Button
          label="전부 지울게"
          variant="dark"
          onPress={() => {
            clearHistory();
            setClearOpen(false);
            showSnackbar({ message: "기록을 전부 지웠어" });
          }}
        />
        <Button label="취소" variant="ghost" height={44} onPress={() => setClearOpen(false)} />
      </Dialog>
    </Screen>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
      {note ? <Text style={text.caption}>{note}</Text> : null}
    </View>
  );
}

function Row({ label, value, onPress, divider }: { label: string; value?: string; onPress: () => void; divider?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.row, divider && styles.rowDivider]}>
      <Text style={styles.rowText}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        {value ? <Text style={{ fontSize: 15, color: colors.inkMuted }}>{value}</Text> : null}
        <Icon name="chevron" size={18} color={colors.inkMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 20 },
  stat: { flex: 1, padding: 16, borderRadius: 14, gap: 4 },
  statPlain: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 26, fontWeight: "700", color: colors.ink },
  groupTitle: { fontSize: 13, fontWeight: "700", color: colors.inkMuted },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowText: { fontSize: 15, color: colors.ink },
});
