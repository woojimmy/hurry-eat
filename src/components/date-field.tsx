import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Chip, text } from "@/components/ui";
import { formatDot, parseDateInput, QUICK_OFFSETS } from "@/lib/date";
import { colors } from "@/theme";

/** 날짜 입력칸. 2026.11.03 / 261103 / 20261103 모두 받는다 */
export function DateInput({
  id,
  value,
  onChange,
  highlight,
  large,
  placeholder = "2026.11.03",
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  highlight?: boolean;
  large?: boolean;
  placeholder?: string;
}) {
  const invalid = value.trim() !== "" && parseDateInput(value) === null;
  return (
    <View style={{ gap: 4 }}>
      <TextInput
        nativeID={id}
        value={value}
        onChangeText={onChange}
        onBlur={() => {
          const parsed = parseDateInput(value);
          if (parsed) onChange(formatDot(parsed));
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.switchOff}
        keyboardType="number-pad"
        style={[
          styles.input,
          large && { height: 52, fontSize: 18 },
          highlight && styles.highlight,
          invalid && { borderColor: colors.overdueFg },
        ]}
      />
      {invalid ? <Text style={[text.caption, { color: colors.overdueFg }]}>날짜를 2026.11.03처럼 적어줘</Text> : null}
    </View>
  );
}

/** 내가 정한 기한 고르기: 빠른 버튼 + 결과 미리보기 + 직접 고르기 */
export function DeadlinePicker({
  base,
  value,
  onChange,
}: {
  /** 빠른 버튼의 기준일 (제조일자 또는 보관 시작일) */
  base: string;
  value: string | null;
  onChange: (ymd: string | null) => void;
}) {
  const [direct, setDirect] = useState(false);
  const [draft, setDraft] = useState(value ? formatDot(value) : "");
  return (
    <View style={{ gap: 8 }}>
      <View accessibilityRole="radiogroup" accessibilityLabel="빠른 기한 선택" style={{ flexDirection: "row", gap: 6 }}>
        {QUICK_OFFSETS.map((q) => {
          const result = q.apply(base);
          return (
            <Chip
              key={q.label}
              shape="box"
              label={q.label}
              highlight={!direct && value === result}
              onPress={() => {
                setDirect(false);
                onChange(result);
              }}
            />
          );
        })}
      </View>
      {direct ? (
        <DateInput
          value={draft}
          onChange={(v) => {
            setDraft(v);
            onChange(parseDateInput(v));
          }}
        />
      ) : null}
      <Pressable accessibilityRole="button" onPress={() => setDirect(true)} style={{ minHeight: 32, justifyContent: "center" }}>
        <Text style={{ fontSize: 13, color: colors.link }}>
          {value ? `→ ${formatDot(value)}까지` : "→ 아직 안 정했어"}
          {direct ? "" : " · 날짜 직접 고르기"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  highlight: { borderWidth: 2, borderColor: colors.brandLine, backgroundColor: colors.brandSoft },
});
