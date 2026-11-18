// 기획서 4. 데이터 설계의 테이블과 같은 모양. src/db가 이 모양으로 SQLite와 주고받는다.

export type Env = "fridge" | "freezer" | "room";

export const ENV_LABEL: Record<Env, string> = {
  fridge: "냉장",
  freezer: "냉동",
  room: "실온",
};

export type Section = {
  id: number;
  name: string;
  env: Env;
  alertEnabled: boolean;
  sortOrder: number;
};

export type ExpiryType = "use_by" | "best_before";
export type DateSource = "printed_label" | "inferred" | "manual";

export type Item = {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  remaining: number;
  status: "active" | "done";
  doneAt: string | null;
  sectionId: number;
  expiryDate: string | null;
  expiryType: ExpiryType | null;
  manufacturedDate: string | null;
  myDeadline: string | null;
  storedSince: string;
  dateSource: DateSource;
  createdAt: string;
  updatedAt: string;
};

export type Disposal = {
  id: number;
  itemId: number;
  quantity: number;
  disposedAt: string;
  deadlineSnapshot: string | null;
  withinDeadline: boolean;
  outcome: "eaten" | "discarded" | null;
};

export type NotifyOffset = 0 | 1 | 2 | 3 | 7;

export type Settings = {
  notifyEnabled: boolean;
  notifyOffsets: NotifyOffset[];
  notifyTime: string;
  lastSectionId: number | null;
  onboardingDone: boolean;
  aiUsageDate: string | null;
  aiUsageCount: number;
};

export type ItemInput = Pick<
  Item,
  | "name"
  | "brand"
  | "quantity"
  | "sectionId"
  | "expiryDate"
  | "expiryType"
  | "manufacturedDate"
  | "myDeadline"
  | "storedSince"
  | "dateSource"
>;

export type Db = {
  sections: Section[];
  items: Item[];
  disposals: Disposal[];
  settings: Settings;
};

export const DEFAULT_SECTIONS: Omit<Section, "id" | "sortOrder">[] = [
  { name: "냉장", env: "fridge", alertEnabled: true },
  { name: "냉동", env: "freezer", alertEnabled: false },
  { name: "실온", env: "room", alertEnabled: true },
  { name: "김치냉장고", env: "fridge", alertEnabled: true },
];

export const DEFAULT_SETTINGS: Settings = {
  notifyEnabled: true,
  notifyOffsets: [1, 3],
  notifyTime: "09:00",
  lastSectionId: null,
  onboardingDone: false,
  aiUsageDate: null,
  aiUsageCount: 0,
};
