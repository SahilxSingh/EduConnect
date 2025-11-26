import { create } from "zustand";

export const useNoticeStore = create((set) => ({
  notices: [],
  loading: false,
  error: null,
  
  setNotices: (notices) => set({ notices }),
  
  addNotice: (notice) => set((state) => ({
    notices: [notice, ...state.notices],
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
}));

