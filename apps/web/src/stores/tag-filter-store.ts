import { create } from "zustand";

type TagType = "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON";

interface TagFilterStore {
  selectedTagIds: Record<TagType, number[]>;
  setTagFilter: (type: TagType, ids: number[]) => void;
  clearFilters: () => void;
}

export const useTagFilterStore = create<TagFilterStore>((set) => ({
  selectedTagIds: { SUBJECT: [], KNOWLEDGE_POINT: [], ERROR_REASON: [] },
  setTagFilter: (type, ids) =>
    set((state) => ({
      selectedTagIds: { ...state.selectedTagIds, [type]: ids },
    })),
  clearFilters: () =>
    set({ selectedTagIds: { SUBJECT: [], KNOWLEDGE_POINT: [], ERROR_REASON: [] } }),
}));