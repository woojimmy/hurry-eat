import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { DateInput, DeadlinePicker } from "@/components/date-field";
import { MoveSheet } from "@/components/move-sheet";
import { Button, Chip, Dialog, Header, Screen, Sheet, text } from "@/components/ui";
import { formatDot, formatKorean, parseDateInput, today } from "@/lib/date";
import { useStore } from "@/store/store";
import type { ExpiryType, Item } from "@/store/types";
import { colors } from "@/theme";

type DateKind = ExpiryType | "manufactured";

const KINDS: { value: DateKind; label: string }[] = [
  { value: "use_by", label: "소비기한" },
  { value: "best_before", label: "유통기한" },
  { value: "manufactured", label: "제조일자" },
];

/** 확인 폼 (흐름 A). id가 있으면 수정 화면으로 쓴다 */
export default function Confirm() {
  const params = useLocalSearchParams<{ id?: string; name?: string; brand?: string; sectionId?: string }>();
  const { items } = useStore();
  const editing = params.id ? items.find((it) => it.id === Number(params.id)) : undefined;
  // 수정 화면은 식품이 정해진 뒤에 폼을 그린다
  return <ConfirmForm key={editing?.id ?? "new"} editing={editing} params={params} />;
}

function ConfirmForm({
  editing,
  params,
}: {
  editing: Item | undefined;
  params: { name?: string; brand?: string; sectionId?: string };
}) {
  const { sections, settings, addItem, updateItem } = useStore();

  const initialSection =
    editing?.sectionId ??
    (params.sectionId ? Number(params.sectionId) : null) ??
    settings.lastSectionId ??
    sections[0]?.id;

  const [kind, setKind] = useState<DateKind>(
    editing ? (editing.expiryDate ? (editing.expiryType ?? "use_by") : "manufactured") : "use_by",
  );
  const [dateText, setDateText] = useState(() => {
    const d = editing ? (editing.expiryDate ?? editing.manufacturedDate) : null;
    return d ? formatDot(d) : "";
  });
  const [name, setName] = useState(editing?.name ?? params.name ?? "");
  const [brand, setBrand] = useState(editing?.brand ?? params.brand ?? "");
  const [sectionId, setSectionId] = useState<number>(
    sections.some((s) => s.id === initialSection) ? initialSection : sections[0].id,
  );
  const [quantity, setQuantity] = useState(editing?.quantity ?? 1);
  const [myDeadline, setMyDeadline] = useState<string | null>(editing?.myDeadline ?? null);
  const [pastConfirmed, setPastConfirmed] = useState(false);
  const [pastPopup, setPastPopup] = useState(false);
  const [done, setDone] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const date = parseDateInput(dateText);
  const isMfg = kind === "manufactured";

  const save = () => {
    if (!name.trim()) return setError("이름을 적어줘");
    if (!date) return setError("날짜를 2026.11.03처럼 적어줘");
    if (isMfg && !myDeadline) return setError("제조일자만 있으면 언제까지 먹을지 정해줘");
    // FR-29: 오늘 이전 기한은 한 번 확인한다
    if (!isMfg && date < today() && !pastConfirmed && editing?.expiryDate !== date) {
      setPastPopup(true);
      return;
    }
    setError(null);

    const fields = {
      name: name.trim(),
      brand: brand.trim() || null,
      quantity,
      expiryDate: isMfg ? null : date,
      expiryType: isMfg ? null : kind,
      manufacturedDate: isMfg ? date : (editing?.manufacturedDate ?? null),
      myDeadline,
    };

    if (editing) {
      const from = sections.find((s) => s.id === editing.sectionId);
      const to = sections.find((s) => s.id === sectionId);
      // 흐름 D: 보관 환경이 바뀔 때만 보관 시작일을 오늘로 갱신하고 기한을 다시 묻는다
      const envChanged = !!from && !!to && from.env !== to.env;
      updateItem(editing.id, { ...fields, sectionId, ...(envChanged ? { storedSince: today() } : null) });
      if (envChanged) setMoving(true);
      else router.back();
      return;
    }

    addItem({ ...fields, sectionId, storedSince: today(), dateSource: "manual" });
    setDone(true);
  };

  const fromSection = sections.find((s) => s.id === editing?.sectionId);
  const toSection = sections.find((s) => s.id === sectionId);

  return (
    <Screen>
      <Header title={editing ? "고치기" : "이거 맞아?"} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 8 }}>
            <Text nativeID="date-label" style={text.label}>
              {isMfg ? "제조일자" : "표시 기한"}
            </Text>
            <DateInput id="date" large value={dateText} onChange={setDateText} />
            <View accessibilityRole="radiogroup" accessibilityLabel="기한 종류" style={styles.row6}>
              {KINDS.map((k) => (
                <Chip
                  key={k.value}
                  shape="box"
                  label={k.label}
                  selected={kind === k.value}
                  onPress={() => {
                    setKind(k.value);
                    setPastConfirmed(false);
                  }}
                />
              ))}
            </View>
          </View>

          {isMfg || myDeadline ? (
            <View style={{ gap: 8 }}>
              <Text style={text.label}>언제까지 먹을래? {isMfg ? "(필수)" : ""}</Text>
              {date ? (
                <DeadlinePicker base={date} value={myDeadline} onChange={setMyDeadline} />
              ) : (
                <Text style={text.caption}>날짜를 먼저 적어줘</Text>
              )}
            </View>
          ) : null}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text nativeID="name-label" style={text.label}>
                이름 (필수)
              </Text>
              <TextInput
                accessibilityLabelledBy="name-label"
                value={name}
                onChangeText={setName}
                placeholder="우유"
                placeholderTextColor={colors.switchOff}
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text nativeID="brand-label" style={text.label}>
                브랜드
              </Text>
              <TextInput
                accessibilityLabelledBy="brand-label"
                value={brand}
                onChangeText={setBrand}
                placeholder="선택"
                placeholderTextColor={colors.switchOff}
                style={styles.input}
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={text.label}>어디에 넣을까?</Text>
            <View accessibilityRole="radiogroup" accessibilityLabel="섹션" style={styles.wrap}>
              {sections.map((s) => (
                <Chip key={s.id} label={s.name} selected={sectionId === s.id} onPress={() => setSectionId(s.id)} />
              ))}
            </View>
          </View>

          <View style={styles.qtyRow}>
            <Text style={text.label}>수량</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <StepButton label="−" a11y="수량 줄이기" onPress={() => setQuantity((q) => Math.max(1, q - 1))} />
              <Text accessibilityLabel={`수량 ${quantity}개`} style={styles.qty}>
                {quantity}
              </Text>
              <StepButton label="+" a11y="수량 늘리기" onPress={() => setQuantity((q) => Math.min(99, q + 1))} />
            </View>
          </View>

          {error ? <Text style={{ color: colors.overdueFg, fontSize: 14 }}>{error}</Text> : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button label={editing ? "저장" : "냉장고에 넣기"} onPress={save} />
        </View>
      </KeyboardAvoidingView>

      <Dialog visible={pastPopup} onClose={() => setPastPopup(false)}>
        <Text style={[text.sheetTitle, { lineHeight: 29 }]}>
          {date ? formatKorean(date) : ""}은{"\n"}이미 지난 날이야
        </Text>
        <Text style={{ fontSize: 15, color: colors.inkMuted }}>이 날짜가 뭐야?</Text>
        <Button
          label="제조일자야"
          onPress={() => {
            setKind("manufactured");
            setPastPopup(false);
          }}
        />
        <Button
          label="기한이 지난 거야"
          variant="outline"
          onPress={() => {
            setPastConfirmed(true);
            setPastPopup(false);
          }}
        />
        <Text style={text.caption}>
          제조일자면 다음 칸에서 언제까지 먹을지 정해줘. 기한이 지났으면 그대로 넣고 &quot;기한 지남&quot;에 보여줄게.
        </Text>
      </Dialog>

      <Sheet visible={done} onClose={() => router.back()}>
        <Text style={[text.sheetTitle, { textAlign: "center", paddingVertical: 8 }]}>냉장고에 넣었어! 🧊</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            label="하나 더 등록"
            variant="outline"
            style={{ flex: 1 }}
            onPress={() =>
              // FR-03: 이름·브랜드·섹션 유지
              router.replace({
                pathname: "/camera",
                params: { name: name.trim(), brand: brand.trim(), sectionId: String(sectionId) },
              })
            }
          />
          <Button label="끝" style={{ flex: 1 }} onPress={() => router.back()} />
        </View>
      </Sheet>

      {editing && fromSection && toSection ? (
        <MoveSheet
          visible={moving}
          item={editing}
          from={fromSection}
          to={toSection}
          onClose={() => {
            setMoving(false);
            router.back();
          }}
        />
      ) : null}
    </Screen>
  );
}

function StepButton({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} style={styles.step}>
      <Text style={{ fontSize: 20, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, gap: 18 },
  row6: { flexDirection: "row", gap: 6 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qty: { width: 40, textAlign: "center", fontSize: 18, fontWeight: "700", color: colors.ink },
  step: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
});
