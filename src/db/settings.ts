import type { SQLiteDatabase } from "expo-sqlite";

import { DEFAULT_SETTINGS, type NotifyOffset, type Settings } from "@/store/types";

// settings 테이블은 키-값. 값이 없는 키는 기본값을 쓴다.
const KEYS = {
  notifyEnabled: "notify_enabled",
  notifyOffsets: "notify_offsets",
  notifyTime: "notify_time",
  lastSectionId: "last_section_id",
  onboardingDone: "onboarding_done",
  aiUsageDate: "ai_usage_date",
  aiUsageCount: "ai_usage_count",
} as const satisfies Record<keyof Settings, string>;

const OFFSETS: number[] = [0, 1, 2, 3, 7];

function encode<K extends keyof Settings>(key: K, value: Settings[K]): string | null {
  if (value === null) return null;
  if (key === "notifyOffsets") return (value as NotifyOffset[]).join(",");
  if (typeof value === "boolean") return value ? "1" : "0";
  return String(value);
}

export async function loadSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>("SELECT key, value FROM settings");
  const raw = new Map(rows.map((r) => [r.key, r.value]));
  const d = DEFAULT_SETTINGS;
  const get = (k: keyof Settings) => raw.get(KEYS[k]);
  const offsets = get("notifyOffsets")
    ?.split(",")
    .map(Number)
    .filter((n) => OFFSETS.includes(n)) as NotifyOffset[] | undefined;
  const sectionId = get("lastSectionId");
  return {
    notifyEnabled: get("notifyEnabled") === undefined ? d.notifyEnabled : get("notifyEnabled") === "1",
    notifyOffsets: offsets && offsets.length > 0 ? offsets : d.notifyOffsets,
    notifyTime: get("notifyTime") ?? d.notifyTime,
    lastSectionId: sectionId === undefined ? d.lastSectionId : Number(sectionId),
    onboardingDone: get("onboardingDone") === undefined ? d.onboardingDone : get("onboardingDone") === "1",
    aiUsageDate: get("aiUsageDate") ?? d.aiUsageDate,
    aiUsageCount: get("aiUsageCount") === undefined ? d.aiUsageCount : Number(get("aiUsageCount")),
  };
}

/** 바뀐 키만 쓴다. null이면 키를 지운다 */
export async function saveSettings(db: SQLiteDatabase, patch: Partial<Settings>) {
  for (const key of Object.keys(patch) as (keyof Settings)[]) {
    const value = encode(key, patch[key] as never);
    if (value === null) await db.runAsync("DELETE FROM settings WHERE key = ?", KEYS[key]);
    else
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        KEYS[key],
        value,
      );
  }
}
