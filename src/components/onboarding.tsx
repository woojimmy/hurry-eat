import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, ProgressDots, Screen } from "@/components/ui";
import { colors, fonts } from "@/theme";

export const SETUP_STEPS = 5;

/** 첫 실행 단계 공통 틀: 진행 점 + 건너뛰기 + 본문 + 아래 큰 버튼 */
export function StepLayout({
  step,
  onSkip,
  cta,
  onCta,
  footnote,
  children,
}: {
  step: number;
  onSkip: () => void;
  cta: string;
  onCta: () => void;
  footnote?: string;
  children: ReactNode;
}) {
  return (
    <Screen>
      <View style={styles.top}>
        <ProgressDots total={SETUP_STEPS} current={step} />
        <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}>
          <Text style={{ fontSize: 15, color: colors.inkMuted }}>건너뛰기</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>
      <View style={styles.bottom}>
        <Button label={cta} height={58} fontSize={19} onPress={onCta} />
        {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
      </View>
    </Screen>
  );
}

export function StepTitle({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.lead}>{body}</Text>
    </View>
  );
}

/** 온보딩 스택을 비우고 홈으로 */
export function goHomeFresh() {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/");
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skip: { minHeight: 44, justifyContent: "center" },
  body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 24, flexGrow: 1 },
  bottom: { paddingHorizontal: 24, paddingBottom: 24, gap: 10 },
  footnote: { fontSize: 12, color: colors.inkMuted, textAlign: "center" },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, color: colors.ink },
  lead: { fontSize: 17, lineHeight: 27, color: colors.inkMuted },
});
