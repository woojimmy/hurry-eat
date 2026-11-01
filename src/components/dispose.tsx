import { useState } from "react";
import { Text, View } from "react-native";

import { Button, Sheet, text } from "@/components/ui";
import { formatKorean } from "@/lib/date";
import { daysLeft, deadlineOf, dueLabel } from "@/lib/items";
import { useStore } from "@/store/store";
import type { Item } from "@/store/types";

/** 처리 흐름 (흐름 B): 수량이 2개 이상이면 "1개만 / 전부" 시트를 먼저 띄운다 */
export function useDispose(onDone?: () => void) {
  const { disposeWithUndo } = useStore();
  const [target, setTarget] = useState<Item | null>(null);

  const finish = (item: Item, qty: number) => {
    setTarget(null);
    disposeWithUndo(item, qty);
    onDone?.();
  };

  const request = (item: Item) => {
    if (item.remaining > 1) setTarget(item);
    else finish(item, 1);
  };

  const sheet = <QtySheet item={target} onClose={() => setTarget(null)} onPick={finish} />;
  return { request, sheet };
}

function QtySheet({
  item,
  onClose,
  onPick,
}: {
  item: Item | null;
  onClose: () => void;
  onPick: (item: Item, qty: number) => void;
}) {
  const left = item ? daysLeft(item) : null;
  const deadline = item ? deadlineOf(item) : null;
  const sub = [item?.brand, left !== null && deadline ? (left < 0 ? `${formatKorean(deadline)} 지남` : dueLabel(left)) : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <Sheet visible={!!item} onClose={onClose}>
      {item ? (
        <>
          <View style={{ gap: 6 }}>
            <Text style={text.sheetTitle}>
              {item.name} {item.remaining}개 있어. 몇 개 치울까?
            </Text>
            {sub ? <Text style={[text.muted, { fontSize: 14 }]}>{sub}</Text> : null}
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button label="1개만" variant="outline" style={{ flex: 1 }} onPress={() => onPick(item, 1)} />
            <Button label={`전부 (${item.remaining}개)`} style={{ flex: 1 }} onPress={() => onPick(item, item.remaining)} />
          </View>
          <Text style={text.muted}>
            1개만 치우면 {item.name} {item.remaining - 1}개가 목록에 남아요
          </Text>
          <Button label="취소" variant="ghost" height={44} onPress={onClose} />
        </>
      ) : null}
    </Sheet>
  );
}
