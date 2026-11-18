import { SplashScreen } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { loadDb, persist } from "@/db";
import { clearHistoryRows, deleteDisposalRow, insertDisposal } from "@/db/disposals";
import { deleteItemRow, saveItem } from "@/db/items";
import { deleteSectionRow, replaceSectionRows, saveSection } from "@/db/sections";
import { saveSettings } from "@/db/settings";
import { today } from "@/lib/date";
import { deadlineOf } from "@/lib/items";
import type { Db, Disposal, Env, Item, ItemInput, Section, Settings } from "@/store/types";

// 화면은 메모리 상태를 동기적으로 읽고 쓴다. 바뀔 때마다 같은 내용을 SQLite에 저장하고(src/db),
// 앱을 켤 때 SQLite에서 불러와 메모리 상태를 채운다.

export type SnackbarState = {
  key: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const RESTORE_DAYS = 30;

function nextIdAfter(db: Db): number {
  const ids = [...db.sections, ...db.items, ...db.disposals].map((x) => x.id);
  return Math.max(0, ...ids) + 1;
}

function useStoreValue(initial: Db) {
  const sqlite = useSQLiteContext();
  const [db, setDb] = useState<Db>(initial);
  // 같은 이벤트에서 변경 함수를 연달아 불러도 최신 상태를 읽도록 ref에도 둔다.
  const dbRef = useRef<Db>(initial);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const nextId = useRef(nextIdAfter(initial));
  const newId = () => nextId.current++;
  const now = () => new Date().toISOString();

  const commit = (next: Db) => {
    dbRef.current = next;
    setDb(next);
  };
  const save = (task: () => Promise<void>) => persist(sqlite, task);

  const showSnackbar = (s: Omit<SnackbarState, "key">) => setSnackbar({ ...s, key: Date.now() });

  const addItem = (input: ItemInput): number => {
    const d = dbRef.current;
    const id = newId();
    const t = now();
    const item: Item = { ...input, id, remaining: input.quantity, status: "active", doneAt: null, createdAt: t, updatedAt: t };
    commit({ ...d, items: [...d.items, item], settings: { ...d.settings, lastSectionId: input.sectionId } });
    save(async () => {
      await saveItem(sqlite, item);
      await saveSettings(sqlite, { lastSectionId: input.sectionId });
    });
    return id;
  };

  const updateItem = (id: number, patch: Partial<ItemInput>) => {
    const d = dbRef.current;
    const it = d.items.find((x) => x.id === id);
    if (!it || it.status === "done") return;
    const next: Item = { ...it, ...patch, updatedAt: now() };
    // 수량을 고치면 남은 수량도 같은 만큼 바뀐다.
    if (patch.quantity !== undefined) {
      next.remaining = Math.max(1, it.remaining + (patch.quantity - it.quantity));
    }
    commit({ ...d, items: d.items.map((x) => (x.id === id ? next : x)) });
    save(() => saveItem(sqlite, next));
  };

  const disposeItem = (id: number, quantity: number): number => {
    const d = dbRef.current;
    const disposalId = newId();
    const item = d.items.find((it) => it.id === id);
    if (!item || item.status === "done") return disposalId;
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
    const updated: Item = {
      ...item,
      remaining,
      status: remaining === 0 ? "done" : "active",
      doneAt: remaining === 0 ? t : null,
    };
    commit({
      ...d,
      disposals: [...d.disposals, disposal],
      items: d.items.map((it) => (it.id === id ? updated : it)),
    });
    save(async () => {
      await insertDisposal(sqlite, disposal);
      await saveItem(sqlite, updated);
    });
    return disposalId;
  };

  const restoreDisposal = (disposalId: number) => {
    const d = dbRef.current;
    const disposal = d.disposals.find((x) => x.id === disposalId);
    if (!disposal) return;
    const item = d.items.find((it) => it.id === disposal.itemId);
    const restored: Item | undefined = item && {
      ...item,
      remaining: item.remaining + disposal.quantity,
      status: "active",
      doneAt: null,
    };
    commit({
      ...d,
      disposals: d.disposals.filter((x) => x.id !== disposalId),
      items: d.items.map((it) => (restored && it.id === restored.id ? restored : it)),
    });
    save(async () => {
      await deleteDisposalRow(sqlite, disposalId);
      if (restored) await saveItem(sqlite, restored);
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
    const d = dbRef.current;
    commit({
      ...d,
      items: d.items.filter((it) => it.id !== id),
      disposals: d.disposals.filter((x) => x.itemId !== id),
    });
    save(() => deleteItemRow(sqlite, id));
  };

  /** 기록 전체 지우기: done 상태 items와 모든 disposals 삭제 */
  const clearHistory = () => {
    const d = dbRef.current;
    commit({ ...d, items: d.items.filter((it) => it.status !== "done"), disposals: [] });
    save(() => clearHistoryRows(sqlite));
  };

  const addSection = (input: { name: string; env: Env; alertEnabled: boolean }) => {
    const d = dbRef.current;
    const section: Section = { ...input, id: newId(), sortOrder: d.sections.length };
    commit({ ...d, sections: [...d.sections, section] });
    save(() => saveSection(sqlite, section));
    return section.id;
  };

  const updateSection = (id: number, patch: Partial<Omit<Section, "id">>) => {
    const d = dbRef.current;
    const current = d.sections.find((s) => s.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    commit({ ...d, sections: d.sections.map((s) => (s.id === id ? next : s)) });
    save(() => saveSection(sqlite, next));
  };

  /** FR-06: 최소 1개는 남긴다. 식품은 moveTo 섹션으로 옮기고, 없으면 남은 첫 섹션으로 옮긴다 */
  const deleteSection = (id: number, moveTo: number | null) => {
    const d = dbRef.current;
    if (d.sections.length <= 1) return;
    const sections = d.sections
      .filter((s) => s.id !== id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s, i) => ({ ...s, sortOrder: i }));
    // 치운 식품도 섹션을 가리키므로, 활성 식품이 없어도 옮겨야 외래키가 유지된다.
    const target = moveTo !== null && sections.some((s) => s.id === moveTo) ? moveTo : sections[0].id;
    const moved = d.items.filter((it) => it.sectionId === id).map((it) => ({ ...it, sectionId: target }));
    const lastGone = d.settings.lastSectionId === id;
    commit({
      ...d,
      sections,
      items: d.items.map((it) => (it.sectionId === id ? { ...it, sectionId: target } : it)),
      settings: lastGone ? { ...d.settings, lastSectionId: null } : d.settings,
    });
    save(async () => {
      for (const it of moved) await saveItem(sqlite, it);
      await deleteSectionRow(sqlite, id);
      for (const s of sections) await saveSection(sqlite, s);
      if (lastGone) await saveSettings(sqlite, { lastSectionId: null });
    });
  };

  const reorderSections = (ids: number[]) => {
    const d = dbRef.current;
    const sections = ids
      .map((id) => d.sections.find((s) => s.id === id))
      .filter((s): s is Section => !!s)
      .map((s, i) => ({ ...s, sortOrder: i }));
    commit({ ...d, sections });
    save(async () => {
      for (const s of sections) await saveSection(sqlite, s);
    });
  };

  /** 초기 설정의 보관 장소 단계: 고른 기본 섹션 + 직접 추가한 섹션으로 교체 (첫 실행, 식품이 없을 때) */
  const replaceSections = (list: Omit<Section, "id" | "sortOrder">[]) => {
    const d = dbRef.current;
    const sections = list.map((s, i) => ({ ...s, id: newId(), sortOrder: i }));
    commit({ ...d, sections, settings: { ...d.settings, lastSectionId: null } });
    save(async () => {
      await replaceSectionRows(sqlite, sections);
      await saveSettings(sqlite, { lastSectionId: null });
    });
  };

  const updateSettings = (patch: Partial<Settings>) => {
    const d = dbRef.current;
    commit({ ...d, settings: { ...d.settings, ...patch } });
    save(() => saveSettings(sqlite, patch));
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

function StoreBody({ initial, children }: { initial: Db; children: ReactNode }) {
  const value = useStoreValue(initial);
  useEffect(() => {
    // DB를 다 불러온 뒤에 스플래시를 내린다.
    SplashScreen.hideAsync();
  }, []);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** SQLiteProvider 안에서 DB를 불러온 뒤에 화면을 그린다 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const sqlite = useSQLiteContext();
  const [initial, setInitial] = useState<Db | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    loadDb(sqlite).then(
      (d) => alive && setInitial(d),
      (e) => alive && setError(e ?? new Error("DB를 불러오지 못했어요")),
    );
    return () => {
      alive = false;
    };
  }, [sqlite]);

  if (error) throw error;
  if (!initial) return null;
  return <StoreBody initial={initial}>{children}</StoreBody>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
