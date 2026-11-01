import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStore } from "@/store/store";
import { colors } from "@/theme";

const DURATION = 4000;

export function Snackbar() {
  const { snackbar, hideSnackbar } = useStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!snackbar) return;
    const t = setTimeout(hideSnackbar, DURATION);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snackbar?.key]);

  if (!snackbar) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: 24 + insets.bottom }]}>
      <View accessibilityLiveRegion="polite" style={styles.bar}>
        <Text style={styles.message} numberOfLines={2}>
          {snackbar.message}
        </Text>
        {snackbar.actionLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              snackbar.onAction?.();
              hideSnackbar();
            }}
            style={styles.action}
          >
            <Text style={styles.actionText}>{snackbar.actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16 },
  bar: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 4,
    gap: 8,
  },
  message: { flex: 1, color: colors.surface, fontSize: 15 },
  action: { minHeight: 44, paddingHorizontal: 12, justifyContent: "center" },
  actionText: { color: colors.brand, fontSize: 15, fontWeight: "700" },
});
