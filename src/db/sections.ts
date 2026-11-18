import type { SQLiteDatabase } from "expo-sqlite";

import type { Env, Section } from "@/store/types";

type SectionRow = { id: number; name: string; env: Env; alert_enabled: number; sort_order: number };

export async function loadSections(db: SQLiteDatabase): Promise<Section[]> {
  const rows = await db.getAllAsync<SectionRow>("SELECT * FROM sections ORDER BY sort_order");
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    env: r.env,
    alertEnabled: r.alert_enabled === 1,
    sortOrder: r.sort_order,
  }));
}

export async function saveSection(db: SQLiteDatabase, s: Section) {
  await db.runAsync(
    `INSERT INTO sections (id, name, env, alert_enabled, sort_order) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, env = excluded.env,
       alert_enabled = excluded.alert_enabled, sort_order = excluded.sort_order`,
    s.id,
    s.name,
    s.env,
    s.alertEnabled ? 1 : 0,
    s.sortOrder,
  );
}

export async function deleteSectionRow(db: SQLiteDatabase, id: number) {
  await db.runAsync("DELETE FROM sections WHERE id = ?", id);
}

/** 첫 실행 초기 설정에서만 쓴다. 식품이 이 섹션들을 가리키고 있으면 외래키 오류가 난다 */
export async function replaceSectionRows(db: SQLiteDatabase, list: Section[]) {
  await db.runAsync("DELETE FROM sections");
  for (const s of list) await saveSection(db, s);
}
