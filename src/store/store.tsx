import { createContext, useContext, useRef, useState, type ReactNode } from "react";

import { today } from "@/lib/date";
import { deadlineOf } from "@/lib/items";
import type { Disposal, Env, Item, ItemInput, Section, Settings } from "@/store/types";

// 지금은 메모리에만 저장한다. 데이터 설계의 SQLite 테이블과 같은 모양이라 저장소만 바꾸면 된다.

type Db = {
  sections: Section[];
  items: Item[];
  disposals: Disposal[];
  settings: Settings;
};

export type SnackbarState = {
  key: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const RESTORE_DAYS = 30;

export const DEFAULT_SECTIONS: Omit<Section, "id" | "sortOrder">[] = [
  { name: "냉장", env: "fridge", alertEnabled: true },
  { name: "냉동", env: "freezer", alertEnabled: false },
  { name: "실온", env: "room", alertEnabled: true },
  { name: "김치냉장고", env: "fridge", alertEnabled: true },
];

const DEFAULT_SETTINGS: Settings = {
  notifyEnabled: true,
  notifyOffsets: [1, 3],
  notifyTime: "09:00",
  lastSectionId: null,
  onboardingDone: false,
  aiUsageDate: null,
  aiUsageCount: 0,
};

const initialDb: Db = {
  sections: DEFAULT_SECTIONS.map((s, i) => ({ ...s, id: i + 1, sortOrder: i })),
  items: [],
  disposals: [],
  settings: DEFAULT_SETTINGS,
};

function useStoreValue() {
  const [db, setDb] = useState<Db>(initialDb);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const nextId = useRef(100);
  const newId = () => nextId.current++;
  const now = () => new Date().toISOString();

  const showSnackbar = (s: Omit<SnackbarState, "key">) => setSnackbar({ ...s, key: Date.now() });

  const addItem = (input: ItemInput): number => {
    const id = newId();
    const t = now();
    setDb((d) => ({
      ...d,
      items: [
        ...d.items,
        { ...input, id, remaining: input.quantity, status: "active", doneAt: null, createdAt: t, updatedAt: t },
      ],
      settings: { ...d.settings, lastSectionId: input.sectionId },
    }));
    return id;
  };

  const updateItem = (id: number, patch: Partial<ItemInput>) => {
    setDb((d) => ({
      ...d,
      items: d.items.map((it) => {
        if (it.id !== id || it.status === "done") return it;
        const next = { ...it, ...patch, updatedAt: now() };
        // 수량을 고치면 남은 수량도 같은 만큼 바뀐다.
        if (patch.quantity !== undefined) {
          next.remaining = Math.max(1, it.remaining + (patch.quantity - it.quantity));
        }
        return next;
      }),
    }));
  };

  const disposeItem = (id: number, quantity: number): number => {
    const disposalId = newId();
    setDb((d) => {
      const item = d.items.find((it) => it.id === id);
      if (!item || item.status === "done") return d;
      const qty = Math.min(quantity, item.remaining);
      const deadline = deadlineOf(item);
      const t = now();
      const disposal: Disposal = {
        id: disposalId,
        itemId: id,
        quantity: qty,
        disposedAt: t,
        deadlineSnapshot: deadline,
        withinDeadline: deadline === null || today() <= deadline,
        outcome: null,
      };
      const remaining = item.remaining - qty;
      return {
        ...d,
        disposals: [...d.disposals, disposal],
        items: d.items.map((it) =>
          it.id === id
            ? { ...it, remaining, status: remaining === 0 ? "done" : "active", doneAt: remaining === 0 ? t : null }
            : it,
        ),
      };
    });
    return disposalId;
  };

  const restoreDisposal = (disposalId: number) => {
    setDb((d) => {
      const disposal = d.disposals.find((x) => x.id === disposalId);
      if (!disposal) return d;
      return {
        ...d,
        disposals: d.disposals.filter((x) => x.id !== disposalId),
        items: d.items.map((it) =>
          it.id === disposal.itemId
            ? { ...it, remaining: it.remaining + disposal.quantity, status: "active", doneAt: null }
            : it,
        ),
      };
    });
  };

  /** 처리 + 되돌리기 스낵바 (FR-11) */
  const disposeWithUndo = (item: Item, quantity: number) => {
    const disposalId = disposeItem(item.id, quantity);
    showSnackbar({
      message: quantity >= item.remaining ? `${item.name} 치웠어` : `${item.name} ${quantity}개 치웠어`,
      actionLabel: "되돌리기",
      onAction: () => restoreDisposal(disposalId),
    });
  };

  /** 잘못 등록 삭제 (FR-28): 아카이브와 통계를 거치지 않는다 */
  const deleteItem = (id: number) => {
    setDb((d) => ({
      ...d,
      items: d.items.filter((it) => it.id !== id),
      disposals: d.disposals.filter((x) => x.itemId !== id),
    }));
  };

  /** 기록 전체 지우기: done 상태 items와 모든 disposals 삭제 */
  const clearHistory = () => {
    setDb((d) => ({
      ...d,
      items: d.items.filter((it) => it.status !== "done"),
      disposals: [],
    }));
  };

  const addSection = (input: { name: string; env: Env; alertEnabled: boolean }) => {
    const id = newId();
    setDb((d) => ({
      ...d,
      sections: [...d.sections, { ...input, id, sortOrder: d.sections.length }],
    }));
    return id;
  };

  const updateSection = (id: number, patch: Partial<Omit<Section, "id">>) => {
    setDb((d) => ({ ...d, sections: d.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  };

  /** FR-06: 최소 1개는 남긴다. 식품이 있으면 moveTo 섹션으로 옮긴다 */
  const deleteSection = (id: number, moveTo: number | null) => {
    setDb((d) => {
      if (d.sections.length <= 1) return d;
      return {
        ...d,
        sections: d.sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, sortOrder: i })),
        items: moveTo === null ? d.items : d.items.map((it) => (it.sectionId === id ? { ...it, sectionId: moveTo } : it)),
        settings: d.settings.lastSectionId === id ? { ...d.settings, lastSectionId: null } : d.settings,
      };
    });
  };

  const reorderSections = (ids: number[]) => {
    setDb((d) => ({
      ...d,
      sections: ids
        .map((id) => d.sections.find((s) => s.id === id))
        .filter((s): s is Section => !!s)
        .map((s, i) => ({ ...s, sortOrder: i })),
    }));
  };

  /** 초기 설정의 보관 장소 단계: 고른 기본 섹션 + 직접 추가한 섹션으로 교체 */
  const replaceSections = (list: Omit<Section, "id" | "sortOrder">[]) => {
    setDb((d) => ({
      ...d,
      sections: list.map((s, i) => ({ ...s, id: newId(), sortOrder: i })),
      settings: { ...d.settings, lastSectionId: null },
    }));
  };

  const updateSettings = (patch: Partial<Settings>) => {
    setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  };

  return {
    ...db,
    sections: [...db.sections].sort((a, b) => a.sortOrder - b.sortOrder),
    snackbar,
    showSnackbar,
    hideSnackbar: () => setSnackbar(null),
    addItem,
    updateItem,
    disposeItem,
    disposeWithUndo,
    restoreDisposal,
    deleteItem,
    clearHistory,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    replaceSections,
    updateSettings,
  };
}

type Store = ReturnType<typeof useStoreValue>;

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
