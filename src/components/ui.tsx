import { router } from "expo-router";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import type { Tone } from "@/lib/items";
import { TONE_COLORS } from "@/lib/items";
import { colors, fonts } from "@/theme";

export function Screen({
  children,
  dark,
  style,
}: {
  children: ReactNode;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={[{ flex: 1, backgroundColor: dark ? colors.camera : colors.bg }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

export function Header({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <IconButton icon="back" label="뒤로" onPress={onBack ?? (() => router.back())} />
        {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={styles.iconButton}>
      <Icon name={icon} color={color} />
    </Pressable>
  );
}

type ButtonVariant = "brand" | "dark" | "outline" | "ghost";

export function Button({
  label,
  onPress,
  variant = "brand",
  height = 56,
  disabled,
  style,
  fontSize,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  height?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fontSize?: number;
}) {
  const v = BUTTON_VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { height, backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Text
        style={[
          variant === "brand" ? styles.buttonDisplay : styles.buttonText,
          { color: v.fg },
          fontSize ? { fontSize } : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const BUTTON_VARIANTS: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  brand: { bg: colors.brand, fg: colors.ink, border: colors.brand },
  dark: { bg: colors.ink, fg: colors.surface, border: colors.ink },
  outline: { bg: colors.surface, fg: colors.ink, border: colors.border },
  ghost: { bg: "transparent", fg: colors.inkMuted, border: "transparent" },
};

export function Badge({ tone, label }: { tone: Tone; label: string }) {
  const c = TONE_COLORS[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

/** 선택 칩. pill = 섹션 탭, box = 기한 종류처럼 칸을 나눈 버튼 */
export function Chip({
  label,
  selected,
  onPress,
  shape = "pill",
  highlight,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  shape?: "pill" | "box";
  highlight?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = selected ? colors.ink : highlight ? colors.brandSoft : colors.surface;
  const border = selected ? colors.ink : highlight ? colors.brandLine : colors.border;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[shape === "pill" ? styles.chipPill : styles.chipBox, { backgroundColor: bg, borderColor: border }, style]}
    >
      <Text
        style={[styles.chipText, { color: selected ? colors.surface : colors.ink }, highlight && { fontWeight: "700" }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={6}
      style={[
        styles.toggle,
        { backgroundColor: value ? colors.brand : colors.switchOff, justifyContent: value ? "flex-end" : "flex-start" },
      ]}
    >
      <View style={styles.toggleKnob} />
    </Pressable>
  );
}

/** 체크 상자가 붙은 큰 선택 줄 (초기 설정의 알림 시점, 보관 장소) */
export function CheckRow({
  checked,
  onPress,
  children,
  checkFirst,
}: {
  checked: boolean;
  onPress: () => void;
  children: ReactNode;
  checkFirst?: boolean;
}) {
  const box = (
    <View style={[styles.checkBox, checked ? styles.checkBoxOn : styles.checkBoxOff]}>
      {checked ? <Icon name="check" size={18} /> : null}
    </View>
  );
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={[styles.checkRow, checked ? styles.checkRowOn : styles.checkRowOff]}
    >
      {checkFirst ? box : null}
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>{children}</View>
      {checkFirst ? null : box}
    </Pressable>
  );
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View accessibilityLabel={`${total}단계 중 ${current}단계`} style={{ flexDirection: "row", gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: i + 1 === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i + 1 === current ? colors.ink : colors.dot,
          }}
        />
      ))}
    </View>
  );
}

export function EnvTag({ label }: { label: string }) {
  return (
    <View style={styles.envTag}>
      <Text style={styles.envTagText}>{label}</Text>
    </View>
  );
}

/** 아래에서 올라오는 시트 */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.scrimBottom}>
        <Pressable accessibilityLabel="닫기" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: 32 + insets.bottom }]}>
          <View style={styles.grabber} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** 가운데 팝업 */
export function Dialog({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrimCenter}>
        <Pressable accessibilityLabel="닫기" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View accessibilityViewIsModal style={styles.dialog}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export const text = StyleSheet.create({
  display: { fontFamily: fonts.display, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, color: colors.ink },
  sheetTitle: { fontFamily: fonts.display, fontSize: 22, lineHeight: 29, color: colors.ink },
  body: { fontSize: 15, color: colors.ink },
  muted: { fontSize: 13, color: colors.inkMuted },
  caption: { fontSize: 12, lineHeight: 19, color: colors.inkMuted },
  label: { fontSize: 14, fontWeight: "500", color: colors.ink },
  groupTitle: { fontSize: 14, fontWeight: "700" },
});

export const box = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  tint: { backgroundColor: colors.brandTint, borderRadius: 12 },
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  headerTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  button: { borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  buttonDisplay: { fontFamily: fonts.display, fontSize: 18 },
  buttonText: { fontSize: 16, fontWeight: "600" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: fonts.display, fontSize: 14 },
  chipPill: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipBox: { height: 44, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", flex: 1 },
  chipText: { fontSize: 14 },
  toggle: { width: 52, height: 32, borderRadius: 16, padding: 3, flexDirection: "row" },
  toggleKnob: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surface },
  checkRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkRowOn: { backgroundColor: colors.brandSoft, borderWidth: 2, borderColor: colors.brandLine },
  checkRowOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  checkBox: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  checkBoxOn: { backgroundColor: colors.brand },
  checkBoxOff: { borderWidth: 1.5, borderColor: colors.switchOff },
  envTag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.calmBg },
  envTagText: { fontSize: 12, fontWeight: "500", color: colors.calmFg },
  scrimBottom: { flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" },
  scrimCenter: { flex: 1, backgroundColor: colors.scrim, justifyContent: "center", padding: 24 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 16,
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
});
