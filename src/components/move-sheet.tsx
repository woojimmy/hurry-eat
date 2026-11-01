import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DateInput, DeadlinePicker } from "@/components/date-field";
import { Button, Sheet, text } from "@/components/ui";
import { formatDot, parseDateInput, today } from "@/lib/date";
import { useStore } from "@/store/store";
import type { Item, Section } from "@/store/types";
import { ENV_LABEL } from "@/store/types";
import { colors } from "@/theme";

/** 환경 이동 시트 (FR-27): 보관 시작일을 오늘로 갱신하고 기한을 새로 정할지 묻는다 */
export function MoveSheet({
  visible,
  item,
  from,
  to,
  onClose,
}: {
  visible: boolean;
  item: Item;
  from: Section;
  to: Section;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      {visible ? <MoveForm item={item} from={from} to={to} onClose={onClose} /> : null}
    </Sheet>
  );
}

function MoveForm({ item, from, to, onClose }: { item: Item; from: Section; to: Section; onClose: () => void }) {
  const { updateItem } = useStore();
  const [since, setSince] = useState(today());
  const [editingSince, setEditingSince] = useState(false);
  const [sinceText, setSinceText] = useState(formatDot(today()));
  const [deadline, setDeadline] = useState<string | null>(null);
  const envName = ENV_LABEL[to.env];

  return (
    <>
      <View style={{ gap: 6 }}>
        <Text style={text.sheetTitle}>
          {item.name}, {ENV_LABEL[from.env]} → {envName}으로 옮겼어
        </Text>
        <Text style={[text.muted, { fontSize: 14 }]}>보관 환경이 바뀌었어. 기한도 새로 정할래?</Text>
      </View>
      <View style={styles.sinceBox}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={text.muted}>{envName} 보관 시작일</Text>
          {editingSince ? (
            <DateInput
              value={sinceText}
              onChange={(v) => {
                setSinceText(v);
                const parsed = parseDateInput(v);
                if (parsed) setSince(parsed);
              }}
            />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "500", color: colors.ink }}>
              {formatDot(since)}
              {since === today() ? " (오늘)" : ""}
            </Text>
          )}
        </View>
        {editingSince ? null : (
          <Pressable accessibilityRole="button" onPress={() => setEditingSince(true)} style={styles.smallButton}>
            <Text style={{ fontSize: 14, color: colors.ink }}>날짜 바꾸기</Text>
          </Pressable>
        )}
      </View>
      <View style={{ gap: 8 }}>
        <Text style={text.label}>내가 정한 기한</Text>
        <DeadlinePicker base={since} value={deadline} onChange={setDeadline} />
      </View>
      <Text style={text.caption}>앱은 기한을 대신 판단하지 않아요. 포장지 보관 안내를 보고 정해줘.</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button
          label="그대로 둘게"
          variant="outline"
          style={{ flex: 1 }}
          onPress={() => {
            updateItem(item.id, { storedSince: since });
            onClose();
          }}
        />
        <Button
          label="이걸로 정할래"
          style={{ flex: 1 }}
          disabled={!deadline}
          onPress={() => {
            updateItem(item.id, { storedSince: since, myDeadline: deadline });
            onClose();
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sinceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  smallButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
});
