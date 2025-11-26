// Local Storage API - Mock backend for frontend testing
// This replaces the actual API calls with localStorage operations

// Helper to get data from localStorage
function getStorage(key, defaultValue = []) {
  if (typeof window === "undefined") return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Helper to save data to localStorage
function setStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

// Generate ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Authentication & Profile Management
export const authAPI = {
  register: async (userData) => {
    const users = getStorage("users", []);
    const profiles = getStorage("profiles", []);
    
    // Check if user already exists
    const existingUser = users.find(u => u.userId === userData.userId);
    if (existingUser) {
      throw new Error("User already registered");
    }
    
    // Create user
    const newUser = {
      id: generateId(),
      userId: userData.userId,
      email: userData.email,
      role: userData.role,
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    setStorage("users", users);
    
    // Create profile
    const newProfile = {
      userId: userData.userId,
      username: userData.name || userData.email.split("@")[0],
      name: userData.name || userData.email.split("@")[0],
      bio: "",
      pfp_url: null,
      followingCount: 0,
      followersCount: 0,
      course: userData.course || null,
      major: userData.major || null,
      subjects: userData.role === "Teacher" ? [] : null,
    };
    
    profiles.push(newProfile);
    setStorage("profiles", profiles);
    
    // Create student/teacher record
    if (userData.role === "Student") {
      const students = getStorage("students", []);
      students.push({
        userId: userData.userId,
        course: userData.course,
        major: userData.major,
      });
      setStorage("students", students);
    } else {
      const teachers = getStorage("teachers", []);
      teachers.push({
        userId: userData.userId,
        subjects: [],
      });
      setStorage("teachers", teachers);
    }
    
    return { success: true, user: newUser };
  },
  
  login: async (credentials) => {
    // For Clerk authentication, this is handled by Clerk
    return { success: true };
  },
};

export const userAPI = {
  getUser: async (userId) => {
    const users = getStorage("users", []);
    const profiles = getStorage("profiles", []);
    const students = getStorage("students", []);
    const teachers = getStorage("teachers", []);
    
    const user = users.find(u => u.userId === userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const profile = profiles.find(p => p.userId === userId) || {};
    const student = students.find(s => s.userId === userId);
    const teacher = teachers.find(t => t.userId === userId);
    
    return {
      ...user,
      ...profile,
      course: student?.course,
      major: student?.major,
      subjects: teacher?.subjects || [],
    };
  },
  
  updateProfile: async (userId, profileData) => {
    const profiles = getStorage("profiles", []);
    const teachers = getStorage("teachers", []);
    const index = profiles.findIndex(p => p.userId === userId);
    
    if (index === -1) {
      throw new Error("Profile not found");
    }
    
    profiles[index] = { ...profiles[index], ...profileData };
    setStorage("profiles", profiles);
    
    // If subjects are being updated, also update teachers table
    if (profileData.subjects !== undefined) {
      const teacherIndex = teachers.findIndex(t => t.userId === userId);
      if (teacherIndex !== -1) {
        teachers[teacherIndex] = { ...teachers[teacherIndex], subjects: profileData.subjects };
        setStorage("teachers", teachers);
      }
    }
    
    return { success: true, profile: profiles[index] };
  },
};

// Social Features
export const postAPI = {
  getFeed: async () => {
    const posts = getStorage("posts", []);
    const profiles = getStorage("profiles", []);
    const likes = getStorage("likes", []);
    const comments = getStorage("comments", []);
    
    // Enrich posts with author info, likes, and comments
    return posts.map(post => {
      const author = profiles.find(p => p.userId === post.authorId) || {};
      const postLikes = likes.filter(l => l.postId === post.id);
      const postComments = comments.filter(c => c.postId === post.id).map(comment => {
        const commentUser = profiles.find(p => p.userId === comment.userId) || {};
        return { ...comment, user: commentUser };
      });
      
      return {
        ...post,
        author,
        likes: postLikes,
        comments: postComments,
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  createPost: async (postData) => {
    const posts = getStorage("posts", []);
    const newPost = {
      id: generateId(),
      authorId: postData.userId,
      content: postData.content,
      mediaUrl: postData.mediaUrl || null,
      createdAt: new Date().toISOString(),
    };
    
    posts.push(newPost);
    setStorage("posts", posts);
    
    return newPost;
  },
  
  likePost: async (postId, reactionType = "like", userId = null) => {
    const likes = getStorage("likes", []);
    
    // Check if user already liked this post
    const existingLike = likes.find(l => l.postId === postId && l.userId === userId);
    if (existingLike) {
      // Unlike - remove the like
      const filtered = likes.filter(l => l.id !== existingLike.id);
      setStorage("likes", filtered);
      return { success: true, liked: false };
    }
    
    // Add new like
    const newLike = {
      id: generateId(),
      postId,
      userId: userId,
      reactionType,
      createdAt: new Date().toISOString(),
    };
    
    likes.push(newLike);
    setStorage("likes", likes);
    
    return { success: true, liked: true };
  },
  
  getComments: async (postId) => {
    const comments = getStorage("comments", []);
    return comments.filter(c => c.postId === postId);
  },
  
  addComment: async (postId, commentData) => {
    const comments = getStorage("comments", []);
    const newComment = {
      id: generateId(),
      postId,
      userId: commentData.userId,
      content: commentData.content,
      createdAt: new Date().toISOString(),
    };
    
    comments.push(newComment);
    setStorage("comments", comments);
    
    return newComment;
  },
};

export const followAPI = {
  follow: async (userId) => {
    const follows = getStorage("follows", []);
    const newFollow = {
      id: generateId(),
      followerId: userId, // Current user
      followingId: userId, // User to follow
      createdAt: new Date().toISOString(),
    };
    
    follows.push(newFollow);
    setStorage("follows", follows);
    
    return { success: true };
  },
  
  unfollow: async (userId) => {
    const follows = getStorage("follows", []);
    const filtered = follows.filter(f => f.followingId !== userId);
    setStorage("follows", filtered);
    
    return { success: true };
  },
};

// Academic Features
export const courseAPI = {
  getCourses: async () => {
    // Return sample courses
    return [
      { id: "1", name: "B.Tech", majors: ["Computer Science", "Electronics", "Mechanical"] },
      { id: "2", name: "B.Sc", majors: ["Mathematics", "Physics", "Chemistry"] },
      { id: "3", name: "BBA", majors: ["Finance", "Marketing", "Management"] },
    ];
  },
};

function normalizeText(value) {
  if (!value) return "";
  return value.trim().toLowerCase();
}

export const assignmentAPI = {
  createAssignment: async (assignmentData) => {
    const assignments = getStorage("assignments", []);
    const newAssignment = {
      id: generateId(),
      teacherId: assignmentData.teacherId,
      course: assignmentData.course?.trim() || "",
      major: assignmentData.major?.trim() || "",
      courseNormalized: normalizeText(assignmentData.course),
      majorNormalized: normalizeText(assignmentData.major),
      title: assignmentData.title,
      details: assignmentData.details,
      dueDate: assignmentData.dueDate,
      createdAt: new Date().toISOString(),
    };
    
    assignments.push(newAssignment);
    setStorage("assignments", assignments);
    
    return newAssignment;
  },
  
  getStudentAssignments: async (course, major, studentId = null) => {
    const assignments = getStorage("assignments", []);
    const submissions = getStorage("submissions", []);
    const targetCourse = normalizeText(course);
    const targetMajor = normalizeText(major);
    
    return assignments
      .filter(a => {
        const assignmentCourse = a.courseNormalized ?? normalizeText(a.course);
        const assignmentMajor = a.majorNormalized ?? normalizeText(a.major);
        return assignmentCourse === targetCourse && assignmentMajor === targetMajor;
      })
      .map(assignment => {
        const submission = submissions.find(
          s => s.assignmentId === assignment.id && (!studentId || s.studentId === studentId)
        );
        return {
          ...assignment,
          submitted: !!submission,
        };
      });
  },
  
  submitAssignment: async (assignmentId, submissionData) => {
    const submissions = getStorage("submissions", []);
    const newSubmission = {
      id: generateId(),
      assignmentId,
      studentId: submissionData.studentId,
      submissionDetails: submissionData.submissionDetails,
      submittedAt: new Date().toISOString(),
    };
    
    submissions.push(newSubmission);
    setStorage("submissions", submissions);
    
    return { success: true };
  },
  
  getSubmissions: async (assignmentId) => {
    const submissions = getStorage("submissions", []);
    const users = getStorage("users", []);
    const profiles = getStorage("profiles", []);

    return submissions
      .filter(s => s.assignmentId === assignmentId)
      .map(submission => {
        const user = users.find(u => u.userId === submission.studentId);
        const profile = profiles.find(p => p.userId === submission.studentId);
        return {
          ...submission,
          student: {
            userId: submission.studentId,
            email: user?.email,
            name: profile?.name || profile?.username || user?.email?.split("@")[0] || submission.studentId,
            username: profile?.username,
          },
        };
      });
  },
};

// Queries & Notices
export const queryAPI = {
  submitQuery: async (queryData) => {
    const queries = getStorage("queries", []);
    const newQuery = {
      id: generateId(),
      studentId: queryData.studentId,
      teacherId: queryData.teacherId,
      queryText: queryData.queryText,
      answered: false,
      createdAt: new Date().toISOString(),
    };
    
    queries.push(newQuery);
    setStorage("queries", queries);
    
    return newQuery;
  },
  
  getTeacherQueries: async (teacherId) => {
    const queries = getStorage("queries", []);
    const profiles = getStorage("profiles", []);
    const users = getStorage("users", []);
    
    // Get queries for this teacher and enrich with student info
    const teacherQueries = queries.filter(q => q.teacherId === teacherId);
    
    return teacherQueries.map(query => {
      const student = users.find(u => u.userId === query.studentId);
      const studentProfile = profiles.find(p => p.userId === query.studentId);
      return {
        ...query,
        student: {
          ...student,
          ...studentProfile,
        },
      };
    });
  },
  
  answerQuery: async (queryId, answerData) => {
    const queries = getStorage("queries", []);
    const index = queries.findIndex(q => q.id === queryId);
    
    if (index === -1) {
      throw new Error("Query not found");
    }
    
    queries[index] = {
      ...queries[index],
      answered: true,
      answer: answerData.answer,
      answeredAt: new Date().toISOString(),
      answeredBy: answerData.teacherId,
    };
    
    setStorage("queries", queries);
    return queries[index];
  },
};

export const noticeAPI = {
  getNotices: async () => {
    const notices = getStorage("notices", []);
    return notices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  createNotice: async (noticeData) => {
    const notices = getStorage("notices", []);
    const newNotice = {
      id: generateId(),
      authorId: noticeData.authorId,
      type: noticeData.type || "Notice",
      title: noticeData.title,
      content: noticeData.content,
      createdAt: new Date().toISOString(),
    };
    
    notices.push(newNotice);
    setStorage("notices", notices);
    
    return newNotice;
  },
};

// Direct Messaging
export const chatAPI = {
  startChat: async (chatData) => {
    const chats = getStorage("chats", []);
    const newChat = {
      id: generateId(),
      participants: chatData.participants || [],
      createdAt: new Date().toISOString(),
    };
    
    chats.push(newChat);
    setStorage("chats", chats);
    
    return newChat;
  },
  
  sendMessage: async (chatId, messageData) => {
    const messages = getStorage("messages", []);
    const newMessage = {
      id: generateId(),
      chatId,
      userId: messageData.userId,
      content: messageData.content,
      createdAt: new Date().toISOString(),
    };
    
    messages.push(newMessage);
    setStorage("messages", messages);
    
    return newMessage;
  },
  
  getMessages: async (chatId) => {
    const messages = getStorage("messages", []);
    return messages
      .filter(m => m.chatId === chatId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },
  
  getUserChats: async (userId) => {
    const chats = getStorage("chats", []);
    const messages = getStorage("messages", []);
    const profiles = getStorage("profiles", []);
    
    // Get chats where user is a participant
    const userChats = chats.filter(chat => 
      chat.participants && chat.participants.includes(userId)
    );
    
    // Enrich with last message and participant info
    return userChats.map(chat => {
      const chatMessages = messages.filter(m => m.chatId === chat.id);
      const lastMessage = chatMessages[chatMessages.length - 1];
      const otherParticipantId = chat.participants.find(p => p !== userId);
      const participant = profiles.find(p => p.userId === otherParticipantId) || {};
      
      return {
        ...chat,
        lastMessage: lastMessage?.content || "No messages",
        participant,
      };
    });
  },
};

