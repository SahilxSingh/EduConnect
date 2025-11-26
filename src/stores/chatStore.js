import { create } from "zustand";

export const useChatStore = create((set) => ({
  chats: [],
  activeChat: null,
  messages: {},
  loading: false,
  error: null,
  
  setChats: (chats) => set({ chats }),
  
  addChat: (chat) => set((state) => ({
    chats: [...state.chats, chat],
  })),
  
  setActiveChat: (chatId) => set({ activeChat: chatId }),
  
  setMessages: (chatId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: messages,
    },
  })),
  
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message],
    },
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
}));

