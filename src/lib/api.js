// API client for backend communication
// Replace BASE_URL with your actual backend URL when deploying

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }
    
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Authentication & Profile Management
export const authAPI = {
  register: async (userData) => {
    return apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
  
  login: async (credentials) => {
    return apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
};

export const userAPI = {
  getUser: async (userId) => {
    return apiCall(`/api/users/${userId}`);
  },
  
  updateProfile: async (userId, profileData) => {
    return apiCall(`/api/users/${userId}/profile`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },
};

// Social Features
export const postAPI = {
  getFeed: async () => {
    return apiCall("/api/posts");
  },
  
  createPost: async (postData) => {
    return apiCall("/api/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  },
  
  likePost: async (postId, reactionType = "like") => {
    return apiCall(`/api/posts/${postId}/like`, {
      method: "POST",
      body: JSON.stringify({ reactionType }),
    });
  },
  
  getComments: async (postId) => {
    return apiCall(`/api/posts/${postId}/comments`);
  },
  
  addComment: async (postId, commentData) => {
    return apiCall(`/api/posts/${postId}/comment`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  },
};

export const followAPI = {
  follow: async (userId) => {
    return apiCall(`/api/follow/${userId}`, {
      method: "POST",
    });
  },
  
  unfollow: async (userId) => {
    return apiCall(`/api/unfollow/${userId}`, {
      method: "DELETE",
    });
  },
};

// Academic Features
export const courseAPI = {
  getCourses: async () => {
    return apiCall("/api/courses");
  },
};

export const assignmentAPI = {
  createAssignment: async (assignmentData) => {
    return apiCall("/api/assignments", {
      method: "POST",
      body: JSON.stringify(assignmentData),
    });
  },
  
  getStudentAssignments: async (course, major) => {
    return apiCall(`/api/assignments/student/${course}/${major}`);
  },
  
  submitAssignment: async (assignmentId, submissionData) => {
    return apiCall(`/api/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: JSON.stringify(submissionData),
    });
  },
  
  getSubmissions: async (assignmentId) => {
    return apiCall(`/api/assignments/${assignmentId}/submissions`);
  },
};

// Queries & Notices
export const queryAPI = {
  submitQuery: async (queryData) => {
    return apiCall("/api/queries", {
      method: "POST",
      body: JSON.stringify(queryData),
    });
  },
  
  getTeacherQueries: async (teacherId) => {
    return apiCall(`/api/queries/teacher/${teacherId}`);
  },
};

export const noticeAPI = {
  getNotices: async () => {
    return apiCall("/api/notices");
  },
  
  createNotice: async (noticeData) => {
    return apiCall("/api/notices", {
      method: "POST",
      body: JSON.stringify(noticeData),
    });
  },
};

// Direct Messaging
export const chatAPI = {
  startChat: async (chatData) => {
    return apiCall("/api/chat/start", {
      method: "POST",
      body: JSON.stringify(chatData),
    });
  },
  
  sendMessage: async (chatId, messageData) => {
    return apiCall(`/api/chat/${chatId}/message`, {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  },
  
  getMessages: async (chatId) => {
    return apiCall(`/api/chat/${chatId}/messages`);
  },
  
  getUserChats: async (userId) => {
    return apiCall(`/api/chats/${userId}`);
  },
};

