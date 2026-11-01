import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { OffsetPicker, TimeField } from "@/components/notify";
import { Button, Header, Screen, text } from "@/components/ui";
import { useStore } from "@/store/store";

/** 설정 › 언제 알려줄까 (FR-31) */
export default function NotifySettings() {
  const { settings, updateSettings } = useStore();
  const [offsets, setOffsets] = useState(settings.notifyOffsets);
  const [time, setTime] = useState(settings.notifyTime);

  return (
    <Screen>
      <Header title="언제 알려줄까" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
        <Text style={[text.muted, { fontSize: 16 }]}>여러 개 골라도 돼. 알림은 하루 한 번만 와.</Text>
        <OffsetPicker value={offsets} onChange={setOffsets} />
        <TimeField value={time} onChange={setTime} />
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Button
          label="저장"
          disabled={offsets.length === 0}
          onPress={() => {
            updateSettings({ notifyOffsets: offsets, notifyTime: time });
            router.back();
          }}
        />
      </View>
    </Screen>
  );
}
