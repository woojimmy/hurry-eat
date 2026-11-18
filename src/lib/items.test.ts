import {
  compareByDeadline,
  daysLeft,
  deadlineOf,
  dueLabel,
  isDueToday,
  storedDays,
  TONE_COLORS,
  viewItem,
} from "@/lib/items";
import type { Item, Section } from "@/store/types";

const TODAY = "2026-11-03";

const sections: Section[] = [
  { id: 1, name: "냉장", env: "fridge", alertEnabled: true, sortOrder: 0 },
  { id: 2, name: "냉동", env: "freezer", alertEnabled: false, sortOrder: 1 },
];

function makeItem(patch: Partial<Item> = {}): Item {
  return {
    id: 1,
    name: "우유",
    brand: null,
    quantity: 1,
    remaining: 1,
    status: "active",
    doneAt: null,
    sectionId: 1,
    expiryDate: "2026-11-10",
    expiryType: "use_by",
    manufacturedDate: null,
    myDeadline: null,
    storedSince: TODAY,
    dateSource: "manual",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...patch,
  };
}

const view = (patch: Partial<Item> = {}) => viewItem(makeItem(patch), sections, TODAY);

describe("deadlineOf (실제 기한)", () => {
  it("내가 정한 기한이 있으면 그것을 쓴다", () => {
    expect(deadlineOf(makeItem({ myDeadline: "2026-12-01" }))).toBe("2026-12-01");
  });

  it("없으면 표시 기한을 쓴다", () => {
    expect(deadlineOf(makeItem())).toBe("2026-11-10");
  });

  it("둘 다 없으면 null", () => {
    expect(deadlineOf(makeItem({ expiryDate: null }))).toBeNull();
  });

  it("제조일자만 있는 식품은 내가 정한 기한만 따른다", () => {
    const it = makeItem({ expiryDate: null, expiryType: null, manufacturedDate: "2026-11-01", myDeadline: "2026-11-08" });
    expect(deadlineOf(it)).toBe("2026-11-08");
  });
});

describe("daysLeft", () => {
  it("남은 일수, 오늘이면 0, 지났으면 음수", () => {
    expect(daysLeft(makeItem({ expiryDate: "2026-11-10" }), TODAY)).toBe(7);
    expect(daysLeft(makeItem({ expiryDate: TODAY }), TODAY)).toBe(0);
    expect(daysLeft(makeItem({ expiryDate: "2026-11-01" }), TODAY)).toBe(-2);
  });

  it("기한이 없으면 null", () => {
    expect(daysLeft(makeItem({ expiryDate: null }), TODAY)).toBeNull();
  });

  it("내가 정한 기한을 기준으로 센다", () => {
    expect(daysLeft(makeItem({ myDeadline: "2026-11-05" }), TODAY)).toBe(2);
  });
});

describe("storedDays", () => {
  it("넣은 날을 1일째로 센다", () => {
    expect(storedDays(makeItem({ storedSince: TODAY }), TODAY)).toBe(1);
    expect(storedDays(makeItem({ storedSince: "2026-10-23" }), TODAY)).toBe(12);
  });
});

describe("viewItem", () => {
  it("기한 지남: D+n, overdue", () => {
    const v = view({ expiryDate: "2026-11-01" });
    expect(v.tone).toBe("overdue");
    expect(v.badge).toBe("D+2");
    expect(v.left).toBe(-2);
  });

  it("어제까지였으면 D+1", () => {
    expect(view({ expiryDate: "2026-11-02" }).badge).toBe("D+1");
  });

  it("오늘이 기한이면 '오늘', urgent", () => {
    const v = view({ expiryDate: TODAY });
    expect(v.tone).toBe("urgent");
    expect(v.badge).toBe("오늘");
  });

  it("3일 이내는 urgent, 4일부터 calm", () => {
    expect(view({ expiryDate: "2026-11-06" })).toMatchObject({ tone: "urgent", badge: "D-3" });
    expect(view({ expiryDate: "2026-11-07" })).toMatchObject({ tone: "calm", badge: "D-4" });
  });

  it("기한이 없으면 '기한 없음', calm", () => {
    expect(view({ expiryDate: null })).toMatchObject({ tone: "calm", badge: "기한 없음", left: null });
  });

  it("알림 꺼진 섹션은 경고 대신 '냉동 N일째' (FR-26)", () => {
    const v = view({ sectionId: 2, expiryDate: "2026-11-01", storedSince: "2026-10-23" });
    expect(v.alertOn).toBe(false);
    expect(v.tone).toBe("calm");
    expect(v.badge).toBe("냉동 12일째");
    expect(v.meta).toBe("냉동 · 알림 꺼짐");
  });

  it("없는 섹션이면 알림 켜짐으로 본다", () => {
    const v = view({ sectionId: 99 });
    expect(v.section).toBeUndefined();
    expect(v.alertOn).toBe(true);
    expect(v.meta).toBe("");
  });

  it("수량이 2개 이상이면 제목에 ×남은수량, 1개면 붙이지 않는다", () => {
    expect(view({ quantity: 3, remaining: 2 }).title).toBe("우유 ×2");
    expect(view({ quantity: 3, remaining: 1 }).title).toBe("우유");
  });

  it("브랜드와 섹션 이름을 메타에 담는다", () => {
    expect(view({ brand: "서울우유" }).meta).toBe("서울우유 · 냉장");
    expect(view().meta).toBe("냉장");
  });

  it("tone마다 색이 정의돼 있다", () => {
    expect(Object.keys(TONE_COLORS).sort()).toEqual(["calm", "overdue", "urgent"]);
  });
});

describe("compareByDeadline", () => {
  const sort = (patches: Partial<Item>[]) =>
    patches
      .map((p) => view(p))
      .sort(compareByDeadline)
      .map((v) => v.item.id);

  it("기한 임박순으로 정렬한다 (지난 것이 맨 앞)", () => {
    expect(
      sort([
        { id: 1, expiryDate: "2026-11-10" },
        { id: 2, expiryDate: "2026-11-01" },
        { id: 3, expiryDate: "2026-11-04" },
      ]),
    ).toEqual([2, 3, 1]);
  });

  it("기한 없는 식품과 알림 꺼진 섹션 식품은 맨 뒤", () => {
    expect(
      sort([
        { id: 1, expiryDate: null },
        { id: 2, sectionId: 2, expiryDate: "2026-11-01" },
        { id: 3, expiryDate: "2026-11-30" },
      ]),
    ).toEqual([3, 1, 2]);
  });

  it("기한이 같으면 먼저 등록한 것이 앞", () => {
    expect(
      sort([
        { id: 1, expiryDate: "2026-11-05", createdAt: "2026-11-02T10:00:00.000Z" },
        { id: 2, expiryDate: "2026-11-05", createdAt: "2026-11-01T10:00:00.000Z" },
      ]),
    ).toEqual([2, 1]);
  });
});

describe("isDueToday (FR-16)", () => {
  it("고른 시점(offset)과 남은 일수가 같으면 해당한다", () => {
    expect(isDueToday(view({ expiryDate: "2026-11-04" }), [1, 3])).toBe(true);
    expect(isDueToday(view({ expiryDate: "2026-11-06" }), [1, 3])).toBe(true);
    expect(isDueToday(view({ expiryDate: "2026-11-05" }), [1, 3])).toBe(false);
  });

  it("당일(0) 알림", () => {
    expect(isDueToday(view({ expiryDate: TODAY }), [0])).toBe(true);
    expect(isDueToday(view({ expiryDate: TODAY }), [1])).toBe(false);
  });

  it("기한 지난 식품은 offset과 상관없이 해당한다", () => {
    expect(isDueToday(view({ expiryDate: "2026-10-01" }), [1])).toBe(true);
  });

  it("알림 꺼진 섹션이나 기한 없는 식품은 해당하지 않는다", () => {
    expect(isDueToday(view({ sectionId: 2, expiryDate: "2026-11-01" }), [1])).toBe(false);
    expect(isDueToday(view({ expiryDate: null }), [1])).toBe(false);
  });
});

describe("dueLabel", () => {
  it.each([
    [-1, "기한 지남"],
    [0, "오늘까지"],
    [1, "내일까지"],
    [5, "5일 남음"],
  ])("%i → %s", (left, label) => {
    expect(dueLabel(left)).toBe(label);
  });
});
