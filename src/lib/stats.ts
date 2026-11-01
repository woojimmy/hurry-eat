import { useStore } from "@/store/store";

/** FR-18: 이번 달 정리한 식품, 기한 안에 챙긴 식품 (positive only) */
export function useMonthStats() {
  const { disposals } = useStore();
  const now = new Date();
  const thisMonth = disposals.filter((d) => {
    const t = new Date(d.disposedAt);
    return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
  });
  return {
    cleared: thisMonth.reduce((n, d) => n + d.quantity, 0),
    within: thisMonth.filter((d) => d.withinDeadline).reduce((n, d) => n + d.quantity, 0),
  };
}
