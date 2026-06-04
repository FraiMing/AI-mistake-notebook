import { create } from "zustand";

type TagType = "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON";

interface TagFilterStore {
  selectedTagIds: Record<TagType, number[]>;
  setTagFilter: (type: TagType, ids: number[]) => void;
  clearFilters: () => void;
  // TODO: step 8 zone tabs —— 当前预留，第八步 Tab 切换时启用
  zone?: "TEMPORARY" | "ARCHIVED";
  setZone: (zone?: "TEMPORARY" | "ARCHIVED") => void;
}

export const useTagFilterStore = create<TagFilterStore>((set) => ({
  selectedTagIds: { SUBJECT: [], KNOWLEDGE_POINT: [], ERROR_REASON: [] },
  setTagFilter: (type, ids) =>
    set((state) => ({
      selectedTagIds: { ...state.selectedTagIds, [type]: ids },
    })),
  clearFilters: () =>
    set({ selectedTagIds: { SUBJECT: [], KNOWLEDGE_POINT: [], ERROR_REASON: [] } }),
  zone: undefined,
  setZone: (zone) => set({ zone }),
}));
