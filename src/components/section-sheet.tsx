import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Button, Chip, Sheet, text, Toggle } from "@/components/ui";
import type { Env } from "@/store/types";
import { ENV_LABEL } from "@/store/types";
import { colors } from "@/theme";

export type SectionDraft = { name: string; env: Env | null; alertEnabled: boolean };

const ENVS: Env[] = ["fridge", "freezer", "room"];

/** 섹션 추가·수정 시트. 보관 환경은 필수 (FR-25) */
export function SectionSheet({
  visible,
  initial,
  title,
  submitLabel,
  onClose,
  onSubmit,
  onDelete,
}: {
  visible: boolean;
  initial?: SectionDraft;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (draft: { name: string; env: Env; alertEnabled: boolean }) => void;
  onDelete?: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      {visible ? (
        <SectionForm
          initial={initial ?? { name: "", env: null, alertEnabled: true }}
          title={title}
          submitLabel={submitLabel}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      ) : null}
    </Sheet>
  );
}

function SectionForm({
  initial,
  title,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  initial: SectionDraft;
  title: string;
  submitLabel: string;
  onSubmit: (draft: { name: string; env: Env; alertEnabled: boolean }) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [env, setEnv] = useState<Env | null>(initial.env);
  const [alertEnabled, setAlertEnabled] = useState(initial.alertEnabled);
  const valid = name.trim() !== "" && env !== null;

  return (
    <>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.ink }}>{title}</Text>
      <View style={{ gap: 8 }}>
        <Text nativeID="section-name" style={text.label}>
          이름
        </Text>
        <TextInput
          accessibilityLabelledBy="section-name"
          value={name}
          onChangeText={setName}
          placeholder="예: 베란다"
          placeholderTextColor={colors.switchOff}
          style={{
            height: 48,
            paddingHorizontal: 12,
            fontSize: 16,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            color: colors.ink,
          }}
        />
      </View>
      <View style={{ gap: 8 }}>
        <Text style={text.label}>보관 환경 (필수)</Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: 6 }}>
          {ENVS.map((e) => (
            <Chip
              key={e}
              shape="box"
              label={ENV_LABEL[e]}
              selected={env === e}
              onPress={() => {
                setEnv(e);
                // 냉동은 기한 알림 기본 꺼짐 (FR-26)
                if (initial.env === null) setAlertEnabled(e !== "freezer");
              }}
            />
          ))}
        </View>
        <Text style={text.caption}>환경이 다른 섹션으로 옮길 때만 기한을 다시 물어봐요</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
        <Text style={text.body}>기한 알림 받기</Text>
        <Toggle label="기한 알림 받기" value={alertEnabled} onChange={setAlertEnabled} />
      </View>
      <Button
        label={submitLabel}
        height={54}
        disabled={!valid}
        onPress={() => env && onSubmit({ name: name.trim(), env, alertEnabled })}
      />
      {onDelete ? (
        <Button label="이 섹션 삭제" variant="ghost" height={44} onPress={onDelete} />
      ) : null}
    </>
  );
}
