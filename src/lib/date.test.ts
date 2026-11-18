import {
  addDays,
  addMonths,
  diffDays,
  formatDot,
  formatKorean,
  formatTime,
  fromYmd,
  parseDateInput,
  QUICK_OFFSETS,
  toYmd,
} from "@/lib/date";

describe("toYmd / fromYmd", () => {
  it("한 자리 월·일을 0으로 채운다", () => {
    expect(toYmd(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("문자열 → Date → 문자열로 돌아온다", () => {
    expect(toYmd(fromYmd("2026-11-03"))).toBe("2026-11-03");
    expect(toYmd(fromYmd("2028-02-29"))).toBe("2028-02-29");
  });
});

describe("addDays", () => {
  it("월말·연말을 넘어간다", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("윤년 2월 29일을 지난다", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("음수와 0도 된다", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-11-03", 0)).toBe("2026-11-03");
  });
});

describe("addMonths", () => {
  it("일반적인 경우 같은 날짜로 간다", () => {
    expect(addMonths("2026-11-03", 1)).toBe("2026-12-03");
  });

  it("다음 달에 같은 날이 없으면 그 달 마지막 날로 맞춘다", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-08-31", 1)).toBe("2026-09-30");
  });

  it("해를 넘긴다", () => {
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-11-03", 6)).toBe("2027-05-03");
  });

  it("윤일에서 1년 뒤는 2월 28일이다", () => {
    expect(addMonths("2028-02-29", 12)).toBe("2029-02-28");
  });
});

describe("diffDays", () => {
  it("b - a 를 일 단위로 돌려준다", () => {
    expect(diffDays("2026-11-03", "2026-11-03")).toBe(0);
    expect(diffDays("2026-11-03", "2026-11-04")).toBe(1);
    expect(diffDays("2026-11-04", "2026-11-03")).toBe(-1);
  });

  it("월·연도를 넘어도 맞다", () => {
    expect(diffDays("2026-01-31", "2026-03-01")).toBe(29);
    expect(diffDays("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("윤년을 반영한다", () => {
    expect(diffDays("2028-01-01", "2029-01-01")).toBe(366);
    expect(diffDays("2026-01-01", "2027-01-01")).toBe(365);
  });

  it("서머타임이 있는 달을 지나도 정수 일수다", () => {
    expect(diffDays("2026-03-01", "2026-04-01")).toBe(31);
    expect(diffDays("2026-10-25", "2026-11-02")).toBe(8);
  });
});

describe("표시 형식", () => {
  it("formatDot", () => {
    expect(formatDot("2026-11-03")).toBe("2026.11.03");
  });

  it("formatKorean은 0을 붙이지 않는다", () => {
    expect(formatKorean("2026-11-03")).toBe("11월 3일");
    expect(formatKorean("2026-01-15")).toBe("1월 15일");
  });

  it("formatTime", () => {
    expect(formatTime("09:00")).toBe("오전 9:00");
    expect(formatTime("00:00")).toBe("오전 12:00");
    expect(formatTime("12:30")).toBe("오후 12:30");
    expect(formatTime("13:05")).toBe("오후 1:05");
    expect(formatTime("23:59")).toBe("오후 11:59");
  });
});

describe("parseDateInput", () => {
  it.each([
    ["2026.11.03", "2026-11-03"],
    ["2026-11-03", "2026-11-03"],
    ["20261103", "2026-11-03"],
    ["2026/11/03", "2026-11-03"],
    ["26.11.03", "2026-11-03"],
    ["261103", "2026-11-03"],
    ["2028.02.29", "2028-02-29"],
  ])("%s → %s", (input, expected) => {
    expect(parseDateInput(input)).toBe(expected);
  });

  it.each([
    ["빈 문자열", ""],
    ["숫자가 아님", "abc"],
    ["자릿수가 모자람", "2026.11"],
    ["7자리", "2026110"],
    ["13월", "2026.13.01"],
    ["0월", "2026.00.10"],
    ["32일", "2026.01.32"],
    ["평년 2월 29일", "2026.02.29"],
    ["4월 31일", "2026.04.31"],
  ])("잘못된 값은 null: %s", (_name, input) => {
    expect(parseDateInput(input)).toBeNull();
  });
});

describe("QUICK_OFFSETS (FR-24, FR-27)", () => {
  const apply = (label: string, ymd: string) => QUICK_OFFSETS.find((q) => q.label === label)!.apply(ymd);

  it("네 개의 버튼이 순서대로 있다", () => {
    expect(QUICK_OFFSETS.map((q) => q.label)).toEqual(["+7일", "+1개월", "+6개월", "+1년"]);
  });

  it("각 버튼이 기준일에 더한다", () => {
    expect(apply("+7일", "2026-11-03")).toBe("2026-11-10");
    expect(apply("+1개월", "2026-11-03")).toBe("2026-12-03");
    expect(apply("+6개월", "2026-11-03")).toBe("2027-05-03");
    expect(apply("+1년", "2026-11-03")).toBe("2027-11-03");
  });

  it("월말 제조일자도 넘치지 않는다", () => {
    expect(apply("+1개월", "2026-01-31")).toBe("2026-02-28");
    expect(apply("+1년", "2028-02-29")).toBe("2029-02-28");
  });
});
