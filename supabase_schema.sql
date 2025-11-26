-- EduConnect - Complete Supabase Database Schema
-- Run this in Supabase SQL Editor after creating a new project

-- =============================================================================
-- 1. USERS TABLE (Main user table - merged users + profiles)
-- =============================================================================
CREATE TABLE users (
    -- Primary key: Clerk user ID
    id TEXT PRIMARY KEY,
    
    -- Authentication & Basic Info
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Student', 'Teacher')),
    
    -- Profile Information
    username VARCHAR(100),
    name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    bio TEXT,
    pfp_url VARCHAR(500),
    image_url VARCHAR(500),
    
    -- Social Counts
    following_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);

-- =============================================================================
-- 2. STUDENTS TABLE (Student-specific data)
-- =============================================================================
CREATE TABLE students (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    course VARCHAR(100),
    major VARCHAR(100),
    year INTEGER,
    enrollment_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for students
CREATE INDEX idx_students_course ON students(course);
CREATE INDEX idx_students_major ON students(major);
CREATE INDEX idx_students_course_major ON students(course, major);

-- =============================================================================
-- 3. TEACHERS TABLE (Teacher-specific data)
-- =============================================================================
CREATE TABLE teachers (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    subjects TEXT[] DEFAULT '{}',
    department VARCHAR(100),
    designation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for teachers
CREATE INDEX idx_teachers_subjects ON teachers USING GIN(subjects);

-- =============================================================================
-- 4. POSTS TABLE (Feed posts)
-- =============================================================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for posts
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- =============================================================================
-- 5. POST_REACTIONS TABLE (Likes/reactions)
-- =============================================================================
CREATE TABLE post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'celebrate')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate reactions
    UNIQUE(post_id, user_id)
);

-- Indexes for post_reactions
CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user ON post_reactions(user_id);

-- =============================================================================
-- 6. POST_COMMENTS TABLE (Comments on posts)
-- =============================================================================
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for post_comments
CREATE INDEX idx_post_comments_post ON post_comments(post_id);
CREATE INDEX idx_post_comments_user ON post_comments(user_id);
CREATE INDEX idx_post_comments_created ON post_comments(created_at DESC);

-- =============================================================================
-- 7. FOLLOWS TABLE (Social following)
-- =============================================================================
CREATE TABLE follows (
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Indexes for follows
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- =============================================================================
-- 8. ASSIGNMENTS TABLE
-- =============================================================================
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course VARCHAR(100) NOT NULL,
    major VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for assignments
CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_course_major ON assignments(course, major);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- =============================================================================
-- 9. ASSIGNMENT_SUBMISSIONS TABLE
-- =============================================================================
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_details TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    grade VARCHAR(10),
    feedback TEXT,
    
    -- One submission per student per assignment
    UNIQUE(assignment_id, student_id)
);

-- Indexes for assignment_submissions
CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);

-- =============================================================================
-- 10. NOTICES TABLE
-- =============================================================================
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'event', 'announcement')),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notices
CREATE INDEX idx_notices_author ON notices(author_id);
CREATE INDEX idx_notices_published ON notices(published_at DESC);
CREATE INDEX idx_notices_type ON notices(type);

-- =============================================================================
-- 11. QUERIES TABLE (Ask Doubt feature)
-- =============================================================================
CREATE TABLE queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    answer TEXT,
    answered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    answered_at TIMESTAMPTZ
);

-- Indexes for queries
CREATE INDEX idx_queries_student ON queries(student_id);
CREATE INDEX idx_queries_teacher ON queries(teacher_id);
CREATE INDEX idx_queries_answered ON queries(answered);
CREATE INDEX idx_queries_created ON queries(created_at DESC);

-- =============================================================================
-- 12. CHATS TABLE
-- =============================================================================
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    is_group BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 13. CHAT_MEMBERS TABLE
-- =============================================================================
CREATE TABLE chat_members (
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (chat_id, user_id)
);

-- Indexes for chat_members
CREATE INDEX idx_chat_members_user ON chat_members(user_id);

-- =============================================================================
-- 14. CHAT_MESSAGES TABLE
-- =============================================================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat_messages
CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Important: Since you're using Clerk auth (not Supabase Auth), 
-- you'll primarily use the service role key for backend operations.
-- However, enabling RLS is still recommended for security.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES (Service Role Bypass)
-- =============================================================================
-- Since you're using Clerk and service role key for all operations,
-- these policies allow service role to bypass RLS while still protecting data

-- Users table policies
CREATE POLICY "Allow service role full access to users" ON users
    FOR ALL USING (true);

-- Students table policies
CREATE POLICY "Allow service role full access to students" ON students
    FOR ALL USING (true);

-- Teachers table policies
CREATE POLICY "Allow service role full access to teachers" ON teachers
    FOR ALL USING (true);

-- Posts table policies
CREATE POLICY "Allow service role full access to posts" ON posts
    FOR ALL USING (true);

-- Post reactions table policies
CREATE POLICY "Allow service role full access to post_reactions" ON post_reactions
    FOR ALL USING (true);

-- Post comments table policies
CREATE POLICY "Allow service role full access to post_comments" ON post_comments
    FOR ALL USING (true);

-- Follows table policies
CREATE POLICY "Allow service role full access to follows" ON follows
    FOR ALL USING (true);

-- Assignments table policies
CREATE POLICY "Allow service role full access to assignments" ON assignments
    FOR ALL USING (true);

-- Assignment submissions table policies
CREATE POLICY "Allow service role full access to assignment_submissions" ON assignment_submissions
    FOR ALL USING (true);

-- Notices table policies
CREATE POLICY "Allow service role full access to notices" ON notices
    FOR ALL USING (true);

-- Queries table policies
CREATE POLICY "Allow service role full access to queries" ON queries
    FOR ALL USING (true);

-- Chats table policies
CREATE POLICY "Allow service role full access to chats" ON chats
    FOR ALL USING (true);

-- Chat members table policies
CREATE POLICY "Allow service role full access to chat_members" ON chat_members
    FOR ALL USING (true);

-- Chat messages table policies
CREATE POLICY "Allow service role full access to chat_messages" ON chat_messages
    FOR ALL USING (true);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================
-- Create a function to automatically update updated_at timestamps

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS FOR FOLLOW COUNTS
-- =============================================================================
-- Create functions to automatically update follower/following counts

-- Function to increment counts when a follow is created
CREATE OR REPLACE FUNCTION increment_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment following count for follower
    UPDATE users 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for following
    UPDATE users 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement counts when a follow is deleted
CREATE OR REPLACE FUNCTION decrement_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrement following count for follower
    UPDATE users 
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
    
    -- Decrement followers count for following
    UPDATE users 
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.following_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to follows table
CREATE TRIGGER increment_follow_counts_trigger
    AFTER INSERT ON follows
    FOR EACH ROW EXECUTE FUNCTION increment_follow_counts();

CREATE TRIGGER decrement_follow_counts_trigger
    AFTER DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION decrement_follow_counts();

-- =============================================================================
-- DONE! Your database schema is now ready.
-- =============================================================================
-- Next steps:
-- 1. Update your .env file with new Supabase credentials
-- 2. Update your code as per SUPABASE_SCHEMA_ANALYSIS.md
-- 3. Test the registration flow
-- 4. Test each feature of your app
