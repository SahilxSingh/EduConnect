import { create } from "zustand";

export const useAuthStore = create((set) => ({
  currentUser: null,
  userProfile: null,
  role: null, // 'Student' or 'Teacher'
  course: null,
  major: null,
  isAuthenticated: false,
  
  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
  
  setUserProfile: (profile) => set({ userProfile: profile }),
  
  setUserRole: (role, course = null, major = null) => 
    set({ role, course, major }),
  
  updateProfile: (updates) => 
    set((state) => ({
      userProfile: { ...state.userProfile, ...updates },
    })),
  
  logout: () => set({
    currentUser: null,
    userProfile: null,
    role: null,
    course: null,
    major: null,
    isAuthenticated: false,
  }),
}));

