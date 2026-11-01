import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DeadlinePicker } from "@/components/date-field";
import { useDispose } from "@/components/dispose";
import { Button, Dialog, Header, Screen, Sheet, text } from "@/components/ui";
import { formatDot } from "@/lib/date";
import { storedDays, TONE_COLORS, viewItem } from "@/lib/items";
import { useStore } from "@/store/store";
import { ENV_LABEL } from "@/store/types";
import { colors, fonts } from "@/theme";

const EXPIRY_LABEL = { use_by: "소비기한", best_before: "유통기한" } as const;

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, sections, updateItem, deleteItem } = useStore();
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const dispose = useDispose(() => router.back());

  const item = items.find((it) => it.id === Number(id));
  if (!item || item.status === "done") {
    return (
      <Screen>
        <Header />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={text.muted}>이미 치운 식품이야</Text>
        </View>
      </Screen>
    );
  }

  const v = viewItem(item, sections);
  const hero = heroText(v.left, v.alertOn, v.badge);
  const tone = TONE_COLORS[v.tone];

  return (
    <Screen>
      <Header
        right={
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/confirm", params: { id: String(item.id) } })}
            style={styles.edit}
          >
            <Text style={styles.editText}>수정</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={{ gap: 4 }}>
          {item.brand ? <Text style={{ fontSize: 14, color: colors.inkMuted }}>{item.brand}</Text> : null}
          <Text style={styles.name}>
            {item.name}
            {item.remaining > 1 ? <Text style={styles.count}>  ×{item.remaining}</Text> : null}
          </Text>
        </View>

        <View style={[styles.hero, { backgroundColor: tone.bg }]}>
          <Text style={[styles.heroTitle, { color: tone.fg }]}>{hero.title}</Text>
          <Text style={{ fontSize: 15, color: tone.fg }}>{hero.sub}</Text>
        </View>

        <View style={styles.card}>
          {item.expiryDate ? (
            <InfoRow label="표시 기한">
              {formatDot(item.expiryDate)}
              {item.expiryType ? ` · ${EXPIRY_LABEL[item.expiryType]}` : ""}
            </InfoRow>
          ) : null}
          {item.manufacturedDate ? <InfoRow label="제조일자">{formatDot(item.manufacturedDate)}</InfoRow> : null}
          <InfoRow label="보관">
            {v.section ? `${v.section.name}${v.section.name !== ENV_LABEL[v.section.env] ? `(${ENV_LABEL[v.section.env]})` : ""}` : ""} ·{" "}
            {storedDays(item)}일째{"\n"}
            <Text style={{ fontSize: 12, color: colors.inkMuted, fontWeight: "400" }}>{formatDot(item.storedSince)}부터</Text>
          </InfoRow>
          <View style={[styles.infoRow, { paddingVertical: 10, alignItems: "center", borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>내가 정한 기한</Text>
            <Pressable accessibilityRole="button" onPress={() => setDeadlineOpen(true)} style={styles.smallButton}>
              <Text style={{ fontSize: 14, color: colors.ink }}>{item.myDeadline ? formatDot(item.myDeadline) : "정하기"}</Text>
            </Pressable>
          </View>
        </View>
        <Text style={text.caption}>표시 기한은 포장 기준이에요. 보관 상태에 따라 달라질 수 있어요.</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="처리했어" variant="dark" onPress={() => dispose.request(item)} fontSize={17} />
        <Pressable accessibilityRole="button" onPress={() => setDeleteOpen(true)} style={styles.deleteLink}>
          <Text style={{ fontSize: 13, color: colors.inkMuted, textDecorationLine: "underline" }}>잘못 등록했어 (삭제)</Text>
        </Pressable>
      </View>

      {dispose.sheet}

      <Sheet visible={deadlineOpen} onClose={() => setDeadlineOpen(false)}>
        {deadlineOpen ? (
          <DeadlineForm
            base={item.manufacturedDate ?? item.storedSince}
            initial={item.myDeadline}
            canClear={!!item.expiryDate}
            onSave={(d) => {
              updateItem(item.id, { myDeadline: d });
              setDeadlineOpen(false);
            }}
          />
        ) : null}
      </Sheet>

      <Dialog visible={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <Text style={text.sheetTitle}>{item.name}, 지울까?</Text>
        <Text style={{ fontSize: 15, color: colors.inkMuted }}>잘못 등록한 거면 기록 없이 바로 지워요. 먹었으면 [처리했어]를 눌러줘.</Text>
        <Button
          label="지울게"
          variant="dark"
          onPress={() => {
            setDeleteOpen(false);
            deleteItem(item.id);
            router.back();
          }}
        />
        <Button label="취소" variant="ghost" height={44} onPress={() => setDeleteOpen(false)} />
      </Dialog>
    </Screen>
  );
}

function heroText(left: number | null, alertOn: boolean, badge: string) {
  if (!alertOn) return { title: badge, sub: "이 칸은 기한 알림이 꺼져 있어" };
  if (left === null) return { title: "기한 없음", sub: "내가 정한 기한을 넣어줘" };
  if (left < 0) return { title: `${-left}일 지났어`, sub: "먹을 수 있는지 꼭 확인해줘" };
  if (left === 0) return { title: "오늘까지!", sub: "오늘 안에 얼른먹어!!" };
  if (left === 1) return { title: "내일까지", sub: "내일까지 얼른먹어!" };
  return { title: `${left}일 남음`, sub: left <= 3 ? "슬슬 챙겨줘" : "아직 여유 있어" };
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{children}</Text>
    </View>
  );
}

function DeadlineForm({
  base,
  initial,
  canClear,
  onSave,
}: {
  base: string;
  initial: string | null;
  canClear: boolean;
  onSave: (d: string | null) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <View style={{ gap: 6 }}>
        <Text style={text.sheetTitle}>언제까지 먹을래?</Text>
        <Text style={[text.muted, { fontSize: 14 }]}>정하면 목록 순서와 알림에 이 날짜를 써요</Text>
      </View>
      <DeadlinePicker base={base} value={value} onChange={setValue} />
      <Text style={text.caption}>앱은 기한을 대신 판단하지 않아요. 포장지 보관 안내를 보고 정해줘.</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {canClear && initial ? (
          <Button label="안 정할래" variant="outline" style={{ flex: 1 }} onPress={() => onSave(null)} />
        ) : null}
        <Button label="이걸로 정할래" style={{ flex: 1 }} disabled={!value} onPress={() => onSave(value)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  edit: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  editText: { fontSize: 15, fontWeight: "500", color: colors.link },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  name: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  count: { fontSize: 20, color: colors.inkMuted },
  hero: { padding: 20, borderRadius: 16, gap: 4 },
  heroTitle: { fontFamily: fonts.display, fontSize: 32 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: { fontSize: 14, color: colors.inkMuted },
  infoValue: { flex: 1, fontSize: 15, fontWeight: "500", color: colors.ink, textAlign: "right" },
  smallButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    justifyContent: "center",
  },
  footer: { paddingHorizontal: 20, paddingBottom: 8, gap: 4 },
  deleteLink: { alignSelf: "center", minHeight: 44, justifyContent: "center" },
});
