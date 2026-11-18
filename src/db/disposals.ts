import type { SQLiteDatabase } from "expo-sqlite";

import type { Disposal } from "@/store/types";

type DisposalRow = {
  id: number;
  item_id: number;
  quantity: number;
  disposed_at: string;
  deadline_snapshot: string | null;
  within_deadline: number;
  outcome: "eaten" | "discarded" | null;
};

export async function loadDisposals(db: SQLiteDatabase): Promise<Disposal[]> {
  const rows = await db.getAllAsync<DisposalRow>("SELECT * FROM disposals ORDER BY id");
  return rows.map((r) => ({
    id: r.id,
    itemId: r.item_id,
    quantity: r.quantity,
    disposedAt: r.disposed_at,
    deadlineSnapshot: r.deadline_snapshot,
    withinDeadline: r.within_deadline === 1,
    outcome: r.outcome,
  }));
}

export async function insertDisposal(db: SQLiteDatabase, d: Disposal) {
  await db.runAsync(
    `INSERT INTO disposals (id, item_id, quantity, disposed_at, deadline_snapshot, within_deadline, outcome)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    d.id,
    d.itemId,
    d.quantity,
    d.disposedAt,
    d.deadlineSnapshot,
    d.withinDeadline ? 1 : 0,
    d.outcome,
  );
}

export async function deleteDisposalRow(db: SQLiteDatabase, id: number) {
  await db.runAsync("DELETE FROM disposals WHERE id = ?", id);
}

/** 기록 전체 지우기: done 상태 items와 모든 disposals 삭제 */
export async function clearHistoryRows(db: SQLiteDatabase) {
  await db.runAsync("DELETE FROM disposals");
  await db.runAsync("DELETE FROM items WHERE status = 'done'");
}
