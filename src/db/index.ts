import type { SQLiteDatabase } from "expo-sqlite";

import type { Db } from "@/store/types";
import { loadDisposals } from "./disposals";
import { loadItems } from "./items";
import { loadSections } from "./sections";
import { loadSettings } from "./settings";

export async function loadDb(db: SQLiteDatabase): Promise<Db> {
  const [sections, items, disposals, settings] = await Promise.all([
    loadSections(db),
    loadItems(db),
    loadDisposals(db),
    loadSettings(db),
  ]);
  return { sections, items, disposals, settings };
}

// 쓰기는 호출한 순서대로 하나씩 실행한다. 하나가 실패해도 뒤의 쓰기는 계속 간다.
let tail: Promise<unknown> = Promise.resolve();

/** 한 트랜잭션으로 묶어 큐에 넣는다. 화면은 메모리 상태를 먼저 바꾸므로 기다리지 않는다 */
export function persist(db: SQLiteDatabase, task: () => Promise<void>) {
  tail = tail
    .then(() => db.withTransactionAsync(task))
    .catch((e) => console.error("[db] 저장 실패", e));
}
