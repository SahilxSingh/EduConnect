import { create } from "zustand";

export const usePostStore = create((set) => ({
  posts: [],
  loading: false,
  error: null,
  
  setPosts: (posts) => set({ posts }),
  
  addPost: (post) => set((state) => ({
    posts: [post, ...state.posts],
  })),
  
  updatePost: (postId, updates) => set((state) => ({
    posts: state.posts.map((post) =>
      post.id === postId ? { ...post, ...updates } : post
    ),
  })),
  
  addLike: (postId, like) => set((state) => ({
    posts: state.posts.map((post) =>
      post.id === postId
        ? { ...post, likes: [...(post.likes || []), like] }
        : post
    ),
  })),
  
  addComment: (postId, comment) => set((state) => ({
    posts: state.posts.map((post) =>
      post.id === postId
        ? { ...post, comments: [...(post.comments || []), comment] }
        : post
    ),
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
}));

