import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { goHomeFresh, StepLayout, StepTitle } from "@/components/onboarding";
import { useStore } from "@/store/store";
import { colors, fonts } from "@/theme";

const PAGES = [
  { title: "포장지 날짜를\n찍기만 해", body: "AI가 날짜랑 이름을 읽어줘.\n틀리면 한 번 고치면 끝!", Art: ShootArt },
  { title: "먹었거나 버렸으면\n옆으로 밀어서 치워", body: "실수로 밀었어도 괜찮아.\n30일 안에는 다시 꺼낼 수 있어.", Art: SwipeArt },
  { title: "챙길 게 있는 날만\n하루 한 번 알려줄게", body: "알림이 와도 귀찮지 않게,\n여러 개를 한 번에 모아서 보내.", Art: AlarmArt },
];

/** 가이드 3장 (FR-30). replay=1이면 설정의 "사용법 다시 보기" */
export default function Guide() {
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const { updateSettings } = useStore();
  const [page, setPage] = useState(0);
  const { title, body, Art } = PAGES[page];
  const last = page === PAGES.length - 1;

  const skip = () => {
    if (replay) return router.back();
    // 건너뛰면 기본값(1일 전 + 3일 전, 오전 9시, 섹션 4개)으로 시작
    updateSettings({ onboardingDone: true });
    goHomeFresh();
  };

  const next = () => {
    if (!last) return setPage(page + 1);
    if (replay) return router.back();
    router.push("/onboarding/alarm");
  };

  return (
    <StepLayout
      step={page + 1}
      onSkip={skip}
      cta={last ? (replay ? "다 봤어" : "알림 정하러 가기") : "다음"}
      onCta={next}
    >
      <Art />
      <StepTitle title={title} body={body} />
    </StepLayout>
  );
}

function ShootArt() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.art, styles.dark, { gap: 14 }]}>
      <Text style={{ fontSize: 14, color: colors.dot }}>날짜를 이 칸에 맞춰줘</Text>
      <View style={styles.guideBox}>
        <Text style={{ fontFamily: fonts.display, fontSize: 30, color: colors.surface }}>26.11.03</Text>
      </View>
      <View style={styles.shutter} />
    </View>
  );
}

function SwipeArt() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.art, { backgroundColor: colors.brandTint, paddingHorizontal: 20, gap: 12, alignItems: "stretch" }]}
    >
      <View style={styles.swipeTrack}>
        <View style={styles.swipeCard}>
          <Text style={{ fontSize: 17, fontWeight: "500", color: colors.ink }}>우유 ×2</Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.urgentBg }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 14, color: colors.urgentFg }}>오늘</Text>
          </View>
        </View>
        <View style={{ width: 110, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 16, color: colors.brand }}>처리했어</Text>
        </View>
      </View>
      <Text style={{ alignSelf: "center", fontFamily: fonts.display, fontSize: 28, color: colors.link }}>← 쓱</Text>
      <View style={[styles.swipeTrack, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: 0.6 }]} />
    </View>
  );
}

function AlarmArt() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.art, styles.dark, { paddingHorizontal: 18, gap: 12, alignItems: "stretch" }]}
    >
      <Text style={{ alignSelf: "center", fontSize: 44, fontWeight: "300", color: colors.surface }}>9:00</Text>
      <View style={styles.noti}>
        <Text style={{ fontSize: 12, color: colors.inkMuted }}>얼른먹어 · 지금</Text>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.ink }}>오늘 챙길 거 2개 있어!</Text>
        <Text style={{ fontSize: 14, color: colors.ink }}>우유 내일까지, 두부 3일 남음. 얼른먹어!</Text>
      </View>
      <View style={[styles.noti, { opacity: 0.55 }]}>
        <Text style={{ fontSize: 12, color: colors.inkMuted }}>얼른먹어 · 어제</Text>
        <Text style={{ fontSize: 14, color: colors.ink }}>계란 3일 남았어</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { height: 320, borderRadius: 28, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  dark: { backgroundColor: "#2A2C24" },
  guideBox: {
    width: 230,
    height: 96,
    borderWidth: 3,
    borderColor: colors.brand,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: { width: 60, height: 60, borderRadius: 30, borderWidth: 4, borderColor: colors.surface },
  swipeTrack: { height: 68, borderRadius: 14, overflow: "hidden", backgroundColor: colors.ink, flexDirection: "row" },
  swipeCard: {
    flex: 1,
    marginLeft: -70,
    paddingLeft: 86,
    paddingRight: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noti: { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
});
