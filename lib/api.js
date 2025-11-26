import { supabase } from "./supabaseClient";

function normalize(value) {
  return value ? value.trim() : "";
}

async function getInternalUserId(clerkId) {
  if (!clerkId) throw new Error("Missing Clerk user id");
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();

  if (error || !data) {
    throw error || new Error("User not found in Supabase");
  }

  return data.id;
}

async function selectByIds(table, column, ids, columns = "*") {
  const unique = Array.from(new Set((ids || []).filter(Boolean)));
  if (!unique.length) {
    return [];
  }

  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .in(column, unique);

  if (error) throw error;
  return data || [];
}

async function fetchUserSummaries(userIds = []) {
  const unique = Array.from(new Set((userIds || []).filter(Boolean)));
  if (!unique.length) {
    return new Map();
  }

  const [users, profiles] = await Promise.all([
    selectByIds("users", "id", unique, "id, clerk_id, email"),
    selectByIds("profiles", "user_id", unique, "user_id, name, username"),
  ]);

  const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
  const summaryMap = new Map();

  (users || []).forEach((user) => {
    const profile = profileMap.get(user.id);
    summaryMap.set(user.id, {
      userId: user.clerk_id,
      email: user.email,
      name: profile?.name || profile?.username || user.email?.split("@")[0] || "User",
      username: profile?.username,
    });
  });

  return summaryMap;
}

export const authAPI = {
  async register(payload) {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    return data;
  },
};

export const userAPI = {
  async getUser(clerkId) {
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        clerk_id,
        email,
        role,
        profiles (
          username,
          name,
          bio,
          followers_count,
          following_count
        ),
        students (
          course,
          major
        ),
        teachers (
          subjects
        )
      `
      )
      .eq("clerk_id", clerkId)
      .single();

    if (error || !data) {
      throw error || new Error("User not found");
    }

    const studentRow = Array.isArray(data.students) ? data.students[0] : data.students;
    const teacherRow = Array.isArray(data.teachers) ? data.teachers[0] : data.teachers;

    return {
      id: data.id,
      userId: data.clerk_id,
      email: data.email,
      role: data.role,
      username: data.profiles?.username,
      name: data.profiles?.name,
      bio: data.profiles?.bio,
      followersCount: data.profiles?.followers_count ?? 0,
      followingCount: data.profiles?.following_count ?? 0,
      course: studentRow?.course,
      major: studentRow?.major,
      subjects: teacherRow?.subjects || [],
    };
  },

  async updateProfile(clerkId, payload) {
    const internalId = await getInternalUserId(clerkId);

    const profileUpdates = {
      username: payload.username,
      name: payload.name,
      bio: payload.bio,
    };

    const { error } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("user_id", internalId);

    if (error) throw error;

    if (payload.subjects) {
      const { error: teacherError } = await supabase
        .from("teachers")
        .upsert(
          {
            user_id: internalId,
            subjects: payload.subjects,
          },
          { onConflict: "user_id" }
        );

      if (teacherError) throw teacherError;
    }

    return true;
  },

  async getTeachers() {
    const { data, error } = await supabase
      .from("users")
      .select("id, clerk_id, email, role, profiles (name, username)")
      .eq("role", "Teacher")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data || []).map((user) => ({
      id: user.clerk_id,
      email: user.email,
      role: user.role,
      name: user.profiles?.name || user.profiles?.username || user.email?.split("@")[0] || "Teacher",
      username: user.profiles?.username,
    }));
  },
};

export const courseAPI = {
  async getCourses() {
    const { data, error } = await supabase
      .from("courses")
      .select("id, code, name, majors:majors(id, name)")
      .order("name");

    if (error) throw error;

    return (data || []).map((course) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      majors: (course.majors || []).map((major) => major.name),
    }));
  },
};

export const assignmentAPI = {
  async createAssignment({ teacherId, course, major, title, details, dueDate }) {
    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId,
        course,
        major,
        title,
        details,
        dueDate,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to create assignment");
    }

    return data;
  },

  async getTeacherAssignments(clerkId) {
    const response = await fetch(`/api/assignments?teacherId=${encodeURIComponent(clerkId)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load assignments");
    }

    return data.assignments || [];
  },

  async getStudentAssignments(course, major, clerkId) {
    const trimmedCourse = normalize(course);
    const trimmedMajor = normalize(major);

    if (!trimmedCourse || !trimmedMajor) {
      return [];
    }

    const internalStudentId = await getInternalUserId(clerkId);

    const { data: assignments, error } = await supabase
      .from("assignments")
      .select("id, title, details, due_date, course, major, created_at")
      .ilike("course", trimmedCourse)
      .ilike("major", trimmedMajor)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const { data: submissions, error: submissionsError } = await supabase
      .from("assignment_submissions")
      .select("assignment_id")
      .eq("student_id", internalStudentId);

    if (submissionsError) throw submissionsError;

    const submittedIds = new Set((submissions || []).map((submission) => submission.assignment_id));

    return (assignments || []).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      details: assignment.details,
      dueDate: assignment.due_date,
      course: assignment.course,
      major: assignment.major,
      submitted: submittedIds.has(assignment.id),
    }));
  },

  async submitAssignment(assignmentId, { studentId, submissionDetails }) {
    const internalStudentId = await getInternalUserId(studentId);

    const { error } = await supabase.from("assignment_submissions").upsert(
      {
        assignment_id: assignmentId,
        student_id: internalStudentId,
        submission_details: submissionDetails,
      },
      { onConflict: "assignment_id,student_id" }
    );

    if (error) throw error;
    return { success: true };
  },

  async getSubmissions(assignmentId) {
    const { data, error } = await supabase
      .from("assignment_submissions")
      .select("id, submission_details, submitted_at, student_id")
      .eq("assignment_id", assignmentId)
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    const summaries = await fetchUserSummaries((data || []).map((submission) => submission.student_id));

    return (data || []).map((submission) => ({
      id: submission.id,
      submissionDetails: submission.submission_details,
      submittedAt: submission.submitted_at,
      studentId: summaries.get(submission.student_id)?.userId,
      student: summaries.get(submission.student_id),
    }));
  },
};

export const noticeAPI = {
  async getNotices() {
    const { data, error } = await supabase
      .from("notices")
      .select("id, title, content, type, author_id, published_at")
      .order("published_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type,
      createdAt: notice.published_at,
      authorId: notice.author_id,
    }));
  },

  async createNotice({ authorId, title, content, type }) {
    const internalAuthorId = await getInternalUserId(authorId);

    const { error } = await supabase.from("notices").insert({
      author_id: internalAuthorId,
      title,
      content,
      type,
    });

    if (error) throw error;
    return { success: true };
  },
};

export const postAPI = {
  async getFeed() {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, author_id, content, media_url, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!posts?.length) return [];

    const postIds = posts.map((post) => post.id);

    const [reactions, comments] = await Promise.all([
      selectByIds("post_reactions", "post_id", postIds, "id, post_id, user_id, reaction_type, created_at"),
      selectByIds("post_comments", "post_id", postIds, "id, post_id, user_id, content, created_at"),
    ]);

    const userIds = new Set();
    posts.forEach((post) => userIds.add(post.author_id));
    (reactions || []).forEach((reaction) => userIds.add(reaction.user_id));
    (comments || []).forEach((comment) => userIds.add(comment.user_id));

    const userSummaries = await fetchUserSummaries(Array.from(userIds));

    const reactionsByPost = new Map();
    (reactions || []).forEach((reaction) => {
      if (!reactionsByPost.has(reaction.post_id)) {
        reactionsByPost.set(reaction.post_id, []);
      }
      reactionsByPost.get(reaction.post_id).push({
        id: reaction.id,
        postId: reaction.post_id,
        userId: userSummaries.get(reaction.user_id)?.userId,
        reactionType: reaction.reaction_type,
        createdAt: reaction.created_at,
        user: userSummaries.get(reaction.user_id),
      });
    });

    const commentsByPost = new Map();
    (comments || []).forEach((comment) => {
      if (!commentsByPost.has(comment.post_id)) {
        commentsByPost.set(comment.post_id, []);
      }
      commentsByPost.get(comment.post_id).push({
        id: comment.id,
        postId: comment.post_id,
        userId: userSummaries.get(comment.user_id)?.userId,
        content: comment.content,
        createdAt: comment.created_at,
        user: userSummaries.get(comment.user_id),
      });
    });

    return posts.map((post) => ({
      id: post.id,
      authorId: userSummaries.get(post.author_id)?.userId,
      content: post.content,
      mediaUrl: post.media_url,
      createdAt: post.created_at,
      author: userSummaries.get(post.author_id),
      likes: reactionsByPost.get(post.id) || [],
      comments: commentsByPost.get(post.id) || [],
    }));
  },

  async createPost({ userId, content, mediaUrl }) {
    const internalAuthorId = await getInternalUserId(userId);

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: internalAuthorId,
        content,
        media_url: mediaUrl,
      })
      .select("id, author_id, content, media_url, created_at")
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create post");
    }

    const summaries = await fetchUserSummaries([internalAuthorId]);
    return {
      id: data.id,
      authorId: summaries.get(internalAuthorId)?.userId,
      content: data.content,
      mediaUrl: data.media_url,
      createdAt: data.created_at,
      author: summaries.get(internalAuthorId),
      likes: [],
      comments: [],
    };
  },

  async likePost(postId, reactionType = "like", userId) {
    const internalUserId = await getInternalUserId(userId);

    const { data: existing } = await supabase
      .from("post_reactions")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", internalUserId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("post_reactions").delete().eq("id", existing.id);
      if (error) throw error;
      return { success: true, liked: false };
    }

    const { error } = await supabase.from("post_reactions").insert({
      post_id: postId,
      user_id: internalUserId,
      reaction_type: reactionType,
    });

    if (error) throw error;
    return { success: true, liked: true };
  },

  async addComment(postId, { userId, content }) {
    const internalUserId = await getInternalUserId(userId);

    const { data, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: internalUserId,
        content,
      })
      .select("id, post_id, user_id, content, created_at")
      .single();

    if (error || !data) {
      throw error || new Error("Failed to add comment");
    }

    const summaries = await fetchUserSummaries([internalUserId]);
    return {
      id: data.id,
      postId: data.post_id,
      userId: summaries.get(internalUserId)?.userId,
      content: data.content,
      createdAt: data.created_at,
      user: summaries.get(internalUserId),
    };
  },
};

function resolveFollowParams(arg1, arg2) {
  if (typeof arg1 === "object" && arg1 !== null) {
    return { followerId: arg1.followerId, followingId: arg1.followingId };
  }
  return { followerId: arg2, followingId: arg1 };
}

export const followAPI = {
  async follow(targetUserId, currentUserId) {
    const { followerId, followingId } = resolveFollowParams(targetUserId, currentUserId);
    if (!followerId || !followingId) {
      throw new Error("Follower and following ids are required");
    }
    const followerInternal = await getInternalUserId(followerId);
    const followingInternal = await getInternalUserId(followingId);

    const { error } = await supabase.from("follows").upsert(
      {
        follower_id: followerInternal,
        following_id: followingInternal,
      },
      { onConflict: "follower_id,following_id" }
    );

    if (error) throw error;
    return { success: true };
  },

  async unfollow(targetUserId, currentUserId) {
    const { followerId, followingId } = resolveFollowParams(targetUserId, currentUserId);
    if (!followerId || !followingId) {
      throw new Error("Follower and following ids are required");
    }
    const followerInternal = await getInternalUserId(followerId);
    const followingInternal = await getInternalUserId(followingId);

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerInternal)
      .eq("following_id", followingInternal);

    if (error) throw error;
    return { success: true };
  },
};

export const queryAPI = {
  async submitQuery({ studentId, teacherId, queryText }) {
    const [studentInternal, teacherInternal] = await Promise.all([
      getInternalUserId(studentId),
      getInternalUserId(teacherId),
    ]);

    const { error } = await supabase.from("queries").insert({
      student_id: studentInternal,
      teacher_id: teacherInternal,
      query_text: queryText,
      answered: false,
    });

    if (error) throw error;
    return { success: true };
  },

  async getTeacherQueries(teacherId) {
    const internalTeacherId = await getInternalUserId(teacherId);
    const { data, error } = await supabase
      .from("queries")
      .select("id, student_id, query_text, answer, answered, created_at, answered_at")
      .eq("teacher_id", internalTeacherId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const summaries = await fetchUserSummaries((data || []).map((query) => query.student_id));

    return (data || []).map((query) => ({
      id: query.id,
      queryText: query.query_text,
      answer: query.answer,
      answered: query.answered,
      createdAt: query.created_at,
      answeredAt: query.answered_at,
      student: summaries.get(query.student_id),
    }));
  },

  async getStudentQueries(studentId) {
    const internalStudentId = await getInternalUserId(studentId);
    const { data, error } = await supabase
      .from("queries")
      .select("id, teacher_id, query_text, answer, answered, created_at, answered_at")
      .eq("student_id", internalStudentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const summaries = await fetchUserSummaries((data || []).map((query) => query.teacher_id));

    return (data || []).map((query) => {
      const teacher = summaries.get(query.teacher_id);
      return {
        id: query.id,
        queryText: query.query_text,
        answer: query.answer,
        answered: query.answered,
        createdAt: query.created_at,
        answeredAt: query.answered_at,
        teacherName: teacher?.name || teacher?.username || "Teacher",
        teacher,
      };
    });
  },

  async answerQuery(queryId, { teacherId, answer }) {
    await getInternalUserId(teacherId); // Ensure teacher exists
    const { error } = await supabase
      .from("queries")
      .update({
        answered: true,
        answer,
        answered_at: new Date().toISOString(),
      })
      .eq("id", queryId);

    if (error) throw error;
    return { success: true };
  },
};

export const queryAPIWithAnswer = queryAPI;

export const chatAPI = {
  async startChat({ participants = [], name = null }) {
    if (participants.length < 2) {
      throw new Error("At least two participants are required to start a chat");
    }

    const internalParticipants = await Promise.all(participants.map((id) => getInternalUserId(id)));
    const { data: chat, error } = await supabase
      .from("chats")
      .insert({
        name,
        is_group: participants.length > 2,
      })
      .select("id, name, is_group, created_at")
      .single();

    if (error || !chat) {
      throw error || new Error("Failed to start chat");
    }

    const { error: memberError } = await supabase.from("chat_members").insert(
      internalParticipants.map((participantId) => ({
        chat_id: chat.id,
        user_id: participantId,
      }))
    );

    if (memberError) throw memberError;
    return { id: chat.id, name: chat.name, isGroup: chat.is_group, participants };
  },

  async sendMessage(chatId, { userId, content }) {
    const internalUserId = await getInternalUserId(userId);
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        sender_id: internalUserId,
        content,
      })
      .select("id, chat_id, sender_id, content, created_at")
      .single();

    if (error || !data) {
      throw error || new Error("Failed to send message");
    }

    const summaries = await fetchUserSummaries([internalUserId]);
    return {
      id: data.id,
      chatId: data.chat_id,
      userId: summaries.get(internalUserId)?.userId,
      content: data.content,
      createdAt: data.created_at,
    };
  },

  async getMessages(chatId) {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, chat_id, sender_id, content, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const summaries = await fetchUserSummaries((data || []).map((message) => message.sender_id));
    return (data || []).map((message) => ({
      id: message.id,
      chatId: message.chat_id,
      userId: summaries.get(message.sender_id)?.userId,
      content: message.content,
      createdAt: message.created_at,
    }));
  },

  async getUserChats(clerkId) {
    const internalUserId = await getInternalUserId(clerkId);
    const { data: memberRows, error } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("user_id", internalUserId);

    if (error) throw error;
    if (!memberRows?.length) return [];

    const chatIds = memberRows.map((row) => row.chat_id);

    const [chats, participants, messages] = await Promise.all([
      selectByIds("chats", "id", chatIds, "id, name, is_group, created_at"),
      selectByIds("chat_members", "chat_id", chatIds, "chat_id, user_id"),
      selectByIds("chat_messages", "chat_id", chatIds, "id, chat_id, sender_id, content, created_at"),
    ]);

    const userIds = new Set();
    (participants || []).forEach((row) => userIds.add(row.user_id));
    (messages || []).forEach((message) => userIds.add(message.sender_id));

    const summaries = await fetchUserSummaries(Array.from(userIds));

    const messagesByChat = new Map();
    (messages || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .forEach((message) => {
        if (!messagesByChat.has(message.chat_id)) {
          messagesByChat.set(message.chat_id, []);
        }
        messagesByChat.get(message.chat_id).push({
          id: message.id,
          chatId: message.chat_id,
          userId: summaries.get(message.sender_id)?.userId,
          content: message.content,
          createdAt: message.created_at,
        });
      });

    return (chats || [])
      .map((chat) => {
        const chatParticipants = (participants || []).filter((row) => row.chat_id === chat.id);
        const participantSummaries = chatParticipants
          .map((row) => summaries.get(row.user_id))
          .filter(Boolean);
        const otherParticipant =
          participantSummaries.find((summary) => summary.userId !== clerkId) || participantSummaries[0] || null;
        const chatMessages = messagesByChat.get(chat.id) || [];
        const lastMessage = chatMessages[chatMessages.length - 1];

        return {
          id: chat.id,
          name: chat.name,
          isGroup: chat.is_group,
          participant: otherParticipant,
          participants: participantSummaries,
          lastMessage: lastMessage?.content || "",
          lastMessageAt: lastMessage?.createdAt || chat.created_at,
        };
      })
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  },
};

