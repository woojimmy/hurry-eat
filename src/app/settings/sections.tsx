import { useEffect, useEffectEvent, useState } from "react";
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { SectionSheet } from "@/components/section-sheet";
import { Button, Chip, Dialog, EnvTag, Header, Screen, text, Toggle } from "@/components/ui";
import { useStore } from "@/store/store";
import type { Section } from "@/store/types";
import { ENV_LABEL } from "@/store/types";
import { colors } from "@/theme";

const ROW_STEP = 60; // 줄 높이 52 + 간격 8

/** 섹션 관리 (FR-05, FR-06) */
export default function Sections() {
  const { sections, items, addSection, updateSection, deleteSection, reorderSections, showSnackbar } = useStore();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [deleting, setDeleting] = useState<Section | null>(null);
  const [moveTo, setMoveTo] = useState<number | null>(null);

  const countIn = (id: number) => items.filter((it) => it.status === "active" && it.sectionId === id).length;

  const requestDelete = (s: Section) => {
    setEditing(null);
    if (sections.length <= 1) {
      showSnackbar({ message: "섹션은 최소 1개는 있어야 해" });
      return;
    }
    if (countIn(s.id) === 0) {
      deleteSection(s.id, null);
      showSnackbar({ message: `${s.name} 섹션을 지웠어` });
      return;
    }
    setMoveTo(sections.find((x) => x.id !== s.id)!.id);
    setDeleting(s);
  };

  const move = (id: number, delta: number) => {
    const ids = sections.map((s) => s.id);
    const from = ids.indexOf(id);
    const to = Math.max(0, Math.min(ids.length - 1, from + delta));
    if (from === to) return;
    ids.splice(to, 0, ...ids.splice(from, 1));
    reorderSections(ids);
  };

  return (
    <Screen>
      <Header title="섹션 관리" />
      <Text style={styles.lead}>끌어서 순서 변경 · 오른쪽 스위치는 기한 알림</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {sections.map((s) => (
          <DraggableRow key={s.id} onMove={(delta) => move(s.id, delta)}>
            {(handle) => (
              <View style={styles.row}>
                {handle}
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint="눌러서 이름과 환경을 바꿔요"
                  onPress={() => setEditing(s)}
                  style={styles.rowMain}
                >
                  <Text style={styles.rowName} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <EnvTag label={ENV_LABEL[s.env]} />
                </Pressable>
                <Toggle
                  label={`${s.name} 기한 알림`}
                  value={s.alertEnabled}
                  onChange={(v) => updateSection(s.id, { alertEnabled: v })}
                />
              </View>
            )}
          </DraggableRow>
        ))}
        <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={styles.add}>
          <Text style={{ fontSize: 15, color: colors.ink }}>+ 섹션 추가</Text>
        </Pressable>
      </ScrollView>

      <SectionSheet
        visible={adding}
        title="새 섹션"
        submitLabel="추가하기"
        onClose={() => setAdding(false)}
        onSubmit={(draft) => {
          addSection(draft);
          setAdding(false);
        }}
      />

      <SectionSheet
        visible={!!editing}
        title="섹션 고치기"
        submitLabel="저장"
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSubmit={(draft) => {
          if (editing) updateSection(editing.id, draft);
          setEditing(null);
        }}
        onDelete={editing ? () => requestDelete(editing) : undefined}
      />

      <Dialog visible={!!deleting} onClose={() => setDeleting(null)}>
        {deleting ? (
          <>
            <Text style={text.sheetTitle}>
              {deleting.name}에 식품이 {countIn(deleting.id)}개 있어.{"\n"}어디로 옮길까?
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {sections
                .filter((x) => x.id !== deleting.id)
                .map((x) => (
                  <Chip key={x.id} label={x.name} selected={moveTo === x.id} onPress={() => setMoveTo(x.id)} />
                ))}
            </View>
            <Button
              label="옮기고 지울게"
              variant="dark"
              disabled={moveTo === null}
              onPress={() => {
                deleteSection(deleting.id, moveTo);
                showSnackbar({ message: `${deleting.name} 섹션을 지웠어` });
                setDeleting(null);
              }}
            />
            <Button label="취소" variant="ghost" height={44} onPress={() => setDeleting(null)} />
          </>
        ) : null}
      </Dialog>
    </Screen>
  );
}

/** 손잡이를 끌어 순서를 바꾸는 줄. 놓는 위치로 몇 칸 움직일지 계산한다 */
function DraggableRow({
  onMove,
  children,
}: {
  onMove: (delta: number) => void;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const [y] = useState(() => new Animated.Value(0));
  const [dragging, setDragging] = useState(false);
  // 놓을 때마다 { delta }를 새 객체로 남기고, 효과에서 최신 onMove를 부른다.
  const [drop, setDrop] = useState<{ delta: number } | null>(null);
  const fireMove = useEffectEvent((delta: number) => onMove(delta));
  useEffect(() => {
    if (drop) fireMove(drop.delta);
  }, [drop]);

  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => setDragging(true),
      onPanResponderMove: (_, g) => y.setValue(g.dy),
      onPanResponderRelease: (_, g) => {
        setDragging(false);
        y.setValue(0);
        setDrop({ delta: Math.round(g.dy / ROW_STEP) });
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        y.setValue(0);
      },
    }),
  );

  const handle = (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="순서 바꾸기"
      accessibilityActions={[
        { name: "increment", label: "아래로" },
        { name: "decrement", label: "위로" },
      ]}
      onAccessibilityAction={(e) => onMove(e.nativeEvent.actionName === "increment" ? 1 : -1)}
      style={styles.handle}
    >
      <Icon name="drag" size={20} color={colors.inkMuted} />
    </View>
  );

  return (
    <Animated.View
      style={{
        transform: [{ translateY: y }],
        zIndex: dragging ? 10 : 0,
        elevation: dragging ? 6 : 0,
        opacity: dragging ? 0.95 : 1,
      }}
    >
      {children(handle)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lead: { paddingHorizontal: 20, paddingBottom: 12, fontSize: 13, color: colors.inkMuted },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  row: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  handle: { width: 40, height: 50, alignItems: "center", justifyContent: "center" },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, height: 50 },
  rowName: { flexShrink: 1, fontSize: 16, fontWeight: "500", color: colors.ink },
  add: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.switchOff,
    alignItems: "center",
    justifyContent: "center",
  },
});
