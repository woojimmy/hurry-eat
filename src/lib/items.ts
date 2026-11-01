import { diffDays, today } from "@/lib/date";
import type { Item, NotifyOffset, Section } from "@/store/types";
import { ENV_LABEL } from "@/store/types";
import { colors } from "@/theme";

/** 실제 기한 = my_deadline → 없으면 expiry_date */
export function deadlineOf(item: Item): string | null {
  return item.myDeadline ?? item.expiryDate;
}

/** 기한까지 남은 일수. 음수면 지남, null이면 기한 없음 */
export function daysLeft(item: Item, base = today()): number | null {
  const deadline = deadlineOf(item);
  return deadline ? diffDays(base, deadline) : null;
}

export type Tone = "overdue" | "urgent" | "calm";

export const TONE_COLORS: Record<Tone, { bg: string; fg: string }> = {
  overdue: { bg: colors.overdueBg, fg: colors.overdueFg },
  urgent: { bg: colors.urgentBg, fg: colors.urgentFg },
  calm: { bg: colors.calmBg, fg: colors.calmFg },
};

/** "얼른먹어" 구역에 넣는 범위 */
const URGENT_DAYS = 3;

export type ItemView = {
  item: Item;
  section: Section | undefined;
  left: number | null;
  alertOn: boolean;
  tone: Tone;
  badge: string;
  title: string;
  meta: string;
};

export function storedDays(item: Item, base = today()): number {
  return diffDays(item.storedSince, base) + 1;
}

export function viewItem(item: Item, sections: Section[], base = today()): ItemView {
  const section = sections.find((s) => s.id === item.sectionId);
  const alertOn = section?.alertEnabled ?? true;
  const left = daysLeft(item, base);
  let tone: Tone = "calm";
  let badge = "";
  if (!alertOn) {
    // FR-26: 알림 꺼진 섹션은 기한 경고 대신 "냉동 N일째"
    badge = `${section ? ENV_LABEL[section.env] : ""} ${storedDays(item, base)}일째`.trim();
  } else if (left === null) {
    badge = "기한 없음";
  } else if (left < 0) {
    tone = "overdue";
    badge = `D+${-left}`;
  } else if (left === 0) {
    tone = "urgent";
    badge = "오늘";
  } else {
    tone = left <= URGENT_DAYS ? "urgent" : "calm";
    badge = `D-${left}`;
  }
  const metaParts = [item.brand, section?.name].filter(Boolean) as string[];
  if (!alertOn) metaParts.push("알림 꺼짐");
  return {
    item,
    section,
    left,
    alertOn,
    tone,
    badge,
    title: item.remaining > 1 ? `${item.name} ×${item.remaining}` : item.name,
    meta: metaParts.join(" · "),
  };
}

/** 기한 임박순. 기한 없는 식품은 맨 뒤 */
export function compareByDeadline(a: ItemView, b: ItemView): number {
  const av = a.alertOn && a.left !== null ? a.left : Number.POSITIVE_INFINITY;
  const bv = b.alertOn && b.left !== null ? b.left : Number.POSITIVE_INFINITY;
  if (av !== bv) return av - bv;
  return a.item.createdAt.localeCompare(b.item.createdAt);
}

/** 오늘 챙길 것(FR-16): 알림 켜진 섹션에서 기한 지남 + 고른 시점에 해당하는 식품 */
export function isDueToday(view: ItemView, offsets: NotifyOffset[]): boolean {
  if (!view.alertOn || view.left === null) return false;
  if (view.left < 0) return true;
  return (offsets as number[]).includes(view.left);
}

export function dueLabel(left: number): string {
  if (left < 0) return "기한 지남";
  if (left === 0) return "오늘까지";
  if (left === 1) return "내일까지";
  return `${left}일 남음`;
}
