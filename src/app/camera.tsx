import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconButton, Screen } from "@/components/ui";
import { today } from "@/lib/date";
import { useStore } from "@/store/store";
import { colors } from "@/theme";

const DAILY_AI_LIMIT = 20;

// TODO: expo-camera 미리보기 + 가이드 박스 영역만 잘라 AI 인식(FR-01). 지금은 화면 틀만 있다.
export default function Camera() {
  const { settings } = useStore();
  const keep = useLocalSearchParams<{ name?: string; brand?: string; sectionId?: string }>();
  const used = settings.aiUsageDate === today() ? settings.aiUsageCount : 0;
  const left = Math.max(0, DAILY_AI_LIMIT - used);

  const toConfirm = () => router.replace({ pathname: "/confirm", params: keep });

  return (
    <Screen dark>
      <View style={styles.header}>
        <IconButton icon="close" label="닫기" color={colors.surface} onPress={() => router.back()} />
        <Text style={styles.quota}>오늘 인식 {left}회 남음</Text>
      </View>
      <View style={styles.preview}>
        <Text style={styles.guideTitle}>날짜를 이 칸에 맞춰줘</Text>
        <View style={styles.guideBox} />
        <Text style={styles.guideHint}>
          이 칸 안만 잘라서 읽어요{"\n"}반짝이는 비닐은 살짝 기울이면 잘 보여
        </Text>
      </View>
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={toConfirm} style={styles.manual}>
          <Text style={styles.manualText}>직접 입력</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="촬영" onPress={toConfirm} style={styles.shutter}>
          <View style={styles.shutterInner} />
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quota: { fontSize: 13, color: colors.cameraMuted, paddingRight: 12 },
  preview: { flex: 1, backgroundColor: colors.cameraPreview, alignItems: "center", justifyContent: "center", gap: 20 },
  guideTitle: { fontSize: 18, fontWeight: "500", color: colors.surface },
  guideBox: { width: 300, maxWidth: "80%", height: 120, borderWidth: 3, borderColor: colors.surface, borderRadius: 12 },
  guideHint: { fontSize: 13, lineHeight: 21, color: colors.cameraMuted, textAlign: "center" },
  footer: { paddingTop: 28, paddingHorizontal: 24, paddingBottom: 40, flexDirection: "row", alignItems: "center" },
  manual: { flex: 1, minHeight: 44, justifyContent: "center" },
  manualText: { fontSize: 15, fontWeight: "500", color: colors.brand },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.surface },
});
