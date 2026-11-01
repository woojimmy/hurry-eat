import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { goHomeFresh, StepLayout, StepTitle } from "@/components/onboarding";
import { SectionSheet } from "@/components/section-sheet";
import { CheckRow, EnvTag } from "@/components/ui";
import { DEFAULT_SECTIONS, useStore } from "@/store/store";
import type { Section } from "@/store/types";
import { ENV_LABEL } from "@/store/types";
import { colors } from "@/theme";

type Row = Omit<Section, "id" | "sortOrder"> & { key: string; checked: boolean };

/** 초기 설정 · 보관 장소 (FR-30) */
export default function SetupSections() {
  const { replaceSections, updateSettings } = useStore();
  const [rows, setRows] = useState<Row[]>(() =>
    DEFAULT_SECTIONS.map((s) => ({ ...s, key: s.name, checked: true })),
  );
  const [adding, setAdding] = useState(false);
  const picked = rows.filter((r) => r.checked);

  const finish = (useRows: boolean) => {
    if (useRows) replaceSections(picked.map(({ name, env, alertEnabled }) => ({ name, env, alertEnabled })));
    updateSettings({ onboardingDone: true });
    goHomeFresh();
  };

  return (
    <StepLayout
      step={5}
      onSkip={() => finish(false)}
      cta="다 됐어! 시작하기"
      onCta={() => finish(picked.length > 0)}
    >
      <StepTitle title="우리 집엔 뭐가 있어?" body="없는 곳은 빼줘. 식품을 넣을 때 고를 칸이야." />
      <View accessibilityLabel="보관 장소" style={{ gap: 8 }}>
        {rows.map((r) => (
          <CheckRow
            key={r.key}
            checkFirst
            checked={r.checked}
            onPress={() => setRows(rows.map((x) => (x.key === r.key ? { ...x, checked: !x.checked } : x)))}
          >
            <Text style={{ flex: 1, fontSize: 17, fontWeight: "500", color: colors.ink }}>{r.name}</Text>
            <EnvTag label={ENV_LABEL[r.env]} />
          </CheckRow>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => setAdding(true)}
          style={{
            minHeight: 56,
            borderRadius: 14,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.switchOff,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 16, color: colors.ink }}>+ 직접 추가 (예: 베란다)</Text>
        </Pressable>
      </View>
      <Text style={{ fontSize: 13, lineHeight: 21, color: colors.inkMuted }}>
        {picked.length === 0
          ? "하나는 골라줘. 안 고르면 기본 칸 4개로 시작해."
          : "냉동 칸은 기한 알림이 꺼진 채로 시작해.\n나중에 설정 › 섹션 관리에서 바꿀 수 있어."}
      </Text>

      <SectionSheet
        visible={adding}
        title="새 섹션"
        submitLabel="추가하기"
        onClose={() => setAdding(false)}
        onSubmit={(draft) => {
          setRows([...rows, { ...draft, key: `custom-${rows.length}-${draft.name}`, checked: true }]);
          setAdding(false);
        }}
      />
    </StepLayout>
  );
}
