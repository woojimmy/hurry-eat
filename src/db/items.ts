import type { SQLiteDatabase } from "expo-sqlite";

import type { DateSource, ExpiryType, Item } from "@/store/types";

type ItemRow = {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  remaining: number;
  status: "active" | "done";
  done_at: string | null;
  section_id: number;
  expiry_date: string | null;
  expiry_type: ExpiryType | null;
  manufactured_date: string | null;
  my_deadline: string | null;
  stored_since: string;
  date_source: DateSource;
  created_at: string;
  updated_at: string;
};

export async function loadItems(db: SQLiteDatabase): Promise<Item[]> {
  const rows = await db.getAllAsync<ItemRow>("SELECT * FROM items ORDER BY id");
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    quantity: r.quantity,
    remaining: r.remaining,
    status: r.status,
    doneAt: r.done_at,
    sectionId: r.section_id,
    expiryDate: r.expiry_date,
    expiryType: r.expiry_type,
    manufacturedDate: r.manufactured_date,
    myDeadline: r.my_deadline,
    storedSince: r.stored_since,
    dateSource: r.date_source,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/** 등록, 수정, 처리, 복구 모두 이 한 함수로 저장한다 */
export async function saveItem(db: SQLiteDatabase, it: Item) {
  await db.runAsync(
    `INSERT INTO items (
       id, name, brand, quantity, remaining, status, done_at, section_id,
       expiry_date, expiry_type, manufactured_date, my_deadline, stored_since,
       date_source, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, brand = excluded.brand, quantity = excluded.quantity,
       remaining = excluded.remaining, status = excluded.status, done_at = excluded.done_at,
       section_id = excluded.section_id, expiry_date = excluded.expiry_date,
       expiry_type = excluded.expiry_type, manufactured_date = excluded.manufactured_date,
       my_deadline = excluded.my_deadline, stored_since = excluded.stored_since,
       date_source = excluded.date_source, updated_at = excluded.updated_at`,
    it.id,
    it.name,
    it.brand,
    it.quantity,
    it.remaining,
    it.status,
    it.doneAt,
    it.sectionId,
    it.expiryDate,
    it.expiryType,
    it.manufacturedDate,
    it.myDeadline,
    it.storedSince,
    it.dateSource,
    it.createdAt,
    it.updatedAt,
  );
}

/** 잘못 등록 삭제(FR-28). 처리 기록은 외래키 CASCADE로 같이 지워진다 */
export async function deleteItemRow(db: SQLiteDatabase, id: number) {
  await db.runAsync("DELETE FROM items WHERE id = ?", id);
}
