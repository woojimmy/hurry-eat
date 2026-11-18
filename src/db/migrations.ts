import type { SQLiteDatabase } from "expo-sqlite";

import { DEFAULT_SECTIONS } from "@/store/types";

// 스키마 버전은 PRAGMA user_version으로 관리한다. 테이블 모양은 기획서 4. 데이터 설계.
const DB_VERSION = 1;

export const SCHEMA_V1 = `
CREATE TABLE sections (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  env TEXT NOT NULL CHECK (env IN ('fridge', 'freezer', 'room')),
  alert_enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL
);
CREATE TABLE items (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  quantity INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'done')),
  done_at TEXT,
  section_id INTEGER NOT NULL REFERENCES sections(id),
  expiry_date TEXT,
  expiry_type TEXT CHECK (expiry_type IN ('use_by', 'best_before')),
  manufactured_date TEXT,
  my_deadline TEXT,
  stored_since TEXT NOT NULL,
  date_source TEXT NOT NULL CHECK (date_source IN ('printed_label', 'inferred', 'manual')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE disposals (
  id INTEGER PRIMARY KEY NOT NULL,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  disposed_at TEXT NOT NULL,
  deadline_snapshot TEXT,
  within_deadline INTEGER NOT NULL,
  outcome TEXT CHECK (outcome IN ('eaten', 'discarded'))
);
CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
CREATE INDEX idx_items_status_section ON items(status, section_id);
CREATE INDEX idx_disposals_disposed_at ON disposals(disposed_at);
CREATE INDEX idx_disposals_item_id ON disposals(item_id);
`;

export async function migrate(db: SQLiteDatabase) {
  // 외래키는 연결마다 켜야 한다.
  await db.execAsync("PRAGMA foreign_keys = ON");

  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;
  if (current >= DB_VERSION) return;

  if (current === 0) {
    await db.execAsync("PRAGMA journal_mode = 'wal'");
    await db.withTransactionAsync(async () => {
      await db.execAsync(SCHEMA_V1);
      for (const [i, s] of DEFAULT_SECTIONS.entries()) {
        await db.runAsync(
          "INSERT INTO sections (id, name, env, alert_enabled, sort_order) VALUES (?, ?, ?, ?, ?)",
          i + 1,
          s.name,
          s.env,
          s.alertEnabled ? 1 : 0,
          i,
        );
      }
      await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
    });
  }
  // 다음 버전: if (current === 1) { ... } 블록을 추가하고 DB_VERSION을 올린다.
}
