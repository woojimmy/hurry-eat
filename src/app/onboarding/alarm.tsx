import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { OffsetPicker, TimeField } from "@/components/notify";
import { StepLayout, StepTitle } from "@/components/onboarding";
import { addDays, formatKorean, formatTime, today } from "@/lib/date";
import { useStore } from "@/store/store";
import { colors } from "@/theme";

/** 초기 설정 · 알림 (FR-30) */
export default function SetupAlarm() {
  const { settings, updateSettings } = useStore();
  const [offsets, setOffsets] = useState(settings.notifyOffsets);
  const [time, setTime] = useState(settings.notifyTime);

  // 예시: 오늘부터 4일 뒤가 기한인 두부
  const sample = addDays(today(), 4);
  const days = offsets.filter((o) => o <= 4).map((o) => formatKorean(addDays(sample, -o)));

  return (
    <StepLayout
      step={4}
      onSkip={() => router.push("/onboarding/sections")}
      cta="이렇게 알려줘"
      onCta={() => {
        // TODO: expo-notifications 알림 권한 요청
        updateSettings({ notifyOffsets: offsets.length ? offsets : [1, 3], notifyTime: time });
        router.push("/onboarding/sections");
      }}
      footnote="누르면 알림 허용을 물어봐요 · 나중에 설정에서 바꿀 수 있어"
    >
      <StepTitle title="언제 알려줄까?" body="여러 개 골라도 돼. 알림은 하루 한 번만 와." />
      <OffsetPicker value={offsets} onChange={setOffsets} />
      <TimeField value={time} onChange={setTime} />
      {days.length > 0 ? (
        <Text style={{ fontSize: 13, lineHeight: 21, color: colors.inkMuted }}>
          예) 두부 기한이 {formatKorean(sample)}이면{"\n"}
          {days.reverse().join(", ")} {formatTime(time)}에 알려줘.
        </Text>
      ) : null}
    </StepLayout>
  );
}
