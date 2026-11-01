import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button, Screen } from "@/components/ui";
import { colors, fonts } from "@/theme";

const POINTS = ["포장지 날짜를 찍으면 AI가 읽어줘", "챙길 게 있는 날만, 하루 한 번 알려줘", "기한 안에 챙기면 칭찬해줄게"];

/** 첫 실행 · 환영 */
export default function Welcome() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.mark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={styles.markText}>11.03</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        찍으면 기한 등록,{"\n"}늦기 전에 <Text style={styles.highlight}>얼른먹어!</Text>
      </Text>
      <View style={{ gap: 12 }}>
        {POINTS.map((p, i) => (
          <View key={p} style={styles.point}>
            <Text style={styles.pointNum}>{i + 1}</Text>
            <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>{p}</Text>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ gap: 12 }}>
        <Button label="시작하기" fontSize={19} onPress={() => router.push("/onboarding/guide")} />
        <Text style={styles.note}>로그인 없이 바로 써요. 데이터는 이 폰에만 저장돼요</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24, gap: 28 },
  mark: {
    alignSelf: "center",
    width: 180,
    height: 180,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { fontFamily: fonts.display, fontSize: 40, color: colors.ink, backgroundColor: colors.brand, paddingHorizontal: 6 },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 42, color: colors.ink, textAlign: "center" },
  highlight: { backgroundColor: colors.brand },
  point: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  pointNum: { fontFamily: fonts.display, fontSize: 18, color: colors.link },
  note: { fontSize: 12, color: colors.inkMuted, textAlign: "center" },
});
