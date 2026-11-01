// 날짜는 YYYY-MM-DD(기기 현지 시간) 문자열로 다룬다.

const pad = (n: number) => String(n).padStart(2, "0");

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): string {
  return toYmd(new Date());
}

export function fromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(ymd: string, days: number): string {
  const d = fromYmd(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

export function addMonths(ymd: string, months: number): string {
  const d = fromYmd(ymd);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toYmd(d);
}

/** b - a (일) */
export function diffDays(a: string, b: string): number {
  return Math.round((fromYmd(b).getTime() - fromYmd(a).getTime()) / 86400000);
}

/** 2026.11.03 */
export function formatDot(ymd: string): string {
  return ymd.replaceAll("-", ".");
}

/** 11월 3일 */
export function formatKorean(ymd: string): string {
  const d = fromYmd(ymd);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** "2026.11.03", "26.11.03", "20261103", "2026-11-03" → YYYY-MM-DD, 잘못된 값이면 null */
export function parseDateInput(input: string): string | null {
  const digits = input.replace(/[^0-9]/g, "");
  let y: number, m: number, d: number;
  if (digits.length === 8) {
    y = Number(digits.slice(0, 4));
    m = Number(digits.slice(4, 6));
    d = Number(digits.slice(6, 8));
  } else if (digits.length === 6) {
    y = 2000 + Number(digits.slice(0, 2));
    m = Number(digits.slice(2, 4));
    d = Number(digits.slice(4, 6));
  } else {
    return null;
  }
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return toYmd(date);
}

export type QuickOffset = { label: string; apply: (ymd: string) => string };

// FR-24, FR-27 빠른 버튼
export const QUICK_OFFSETS: QuickOffset[] = [
  { label: "+7일", apply: (ymd) => addDays(ymd, 7) },
  { label: "+1개월", apply: (ymd) => addMonths(ymd, 1) },
  { label: "+6개월", apply: (ymd) => addMonths(ymd, 6) },
  { label: "+1년", apply: (ymd) => addMonths(ymd, 12) },
];

/** "09:00" → "오전 9:00" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "오전" : "오후";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${hour}:${pad(m)}`;
}
