import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, CheckRow, Sheet, text } from "@/components/ui";
import { formatTime } from "@/lib/date";
import type { NotifyOffset } from "@/store/types";
import { colors } from "@/theme";

export const OFFSET_OPTIONS: { value: NotifyOffset; label: string }[] = [
  { value: 0, label: "당일" },
  { value: 1, label: "1일 전" },
  { value: 2, label: "2일 전" },
  { value: 3, label: "3일 전" },
  { value: 7, label: "7일 전" },
];

export function offsetsLabel(offsets: NotifyOffset[]): string {
  if (offsets.length === 0) return "안 고름";
  return OFFSET_OPTIONS.filter((o) => offsets.includes(o.value))
    .map((o) => o.label)
    .join(", ");
}

/** 알림 시점 복수 선택 (FR-13) */
export function OffsetPicker({ value, onChange }: { value: NotifyOffset[]; onChange: (v: NotifyOffset[]) => void }) {
  return (
    <View accessibilityLabel="알림 시점" style={{ gap: 8 }}>
      {OFFSET_OPTIONS.map((o) => {
        const on = value.includes(o.value);
        return (
          <CheckRow
            key={o.value}
            checked={on}
            onPress={() =>
              onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value].sort((a, b) => a - b))
            }
          >
            <Text style={styles.optionText}>{o.label}</Text>
          </CheckRow>
        );
      })}
    </View>
  );
}

export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <View style={styles.timeRow}>
        <Text style={{ fontSize: 17, fontWeight: "500", color: colors.ink }}>몇 시에?</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`알림 시간 ${formatTime(value)}`} onPress={() => setOpen(true)} style={styles.timeButton}>
          <Text style={{ fontSize: 17, color: colors.ink }}>{formatTime(value)}</Text>
        </Pressable>
      </View>
      <TimeSheet visible={open} value={value} onClose={() => setOpen(false)} onPick={onChange} />
    </>
  );
}

const TIMES = Array.from({ length: 34 }, (_, i) => {
  const minutes = 6 * 60 + i * 30; // 오전 6:00 ~ 오후 10:30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

export function TimeSheet({
  visible,
  value,
  onClose,
  onPick,
}: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onPick: (v: string) => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={text.sheetTitle}>몇 시에 알려줄까?</Text>
      <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={styles.timeGrid}>
        {TIMES.map((t) => {
          const on = t === value;
          return (
            <Pressable
              key={t}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                onPick(t);
                onClose();
              }}
              style={[styles.timeCell, on && { backgroundColor: colors.ink, borderColor: colors.ink }]}
            >
              <Text style={{ fontSize: 15, color: on ? colors.surface : colors.ink }}>{formatTime(t)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Button label="닫기" variant="ghost" height={44} onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  optionText: { fontSize: 17, fontWeight: "500", color: colors.ink },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingRight: 6,
    paddingLeft: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  timeButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    justifyContent: "center",
  },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeCell: {
    width: "31%",
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
