# Supabase Database Schema Analysis & Recommendations

## 🔍 Current Schema Analysis

Based on my thorough review of your EduConnect application, here's what I found:

### Authentication System

- **Clerk** is used for authentication (not Supabase Auth)
- Clerk provides: `userId` (clerk_id), `email`, `name`
- Your app uses Clerk's `userId` as the primary identifier

---

## ❌ Current Schema Issues

### 1. **CRITICAL: Inconsistent Foreign Key Usage**

Your code has **major inconsistencies** in how it references users:

**In `lib/api.js`:**

```javascript
// Line ~15: Looking for 'clerk_id' column
.eq("clerk_id", clerkId)
```

**In `app/api/register/route.js`:**

```javascript
// Using 'id' as the conflict column, NOT 'clerk_id'
{ onConflict: "id" }
// And inserting clerk ID into 'id' column
id: clerkId,
```

**Problem:** The code is confused about:

- Whether `users.id` stores internal UUID or Clerk ID
- Whether there's a separate `clerk_id` column
- How to properly link tables

### 2. **Redundant User/Profile Split**

Based on the image you provided and the code:

**Current Structure:**

- `users` table: Basic auth data (id, email, role, clerk_id?)
- `profiles` table: User display data (username, name, bio, followers_count, etc.)

**Problems:**

- Unnecessary complexity with two tables
- Risk of orphaned records
- Confusing which table stores what
- Profile data split illogically

### 3. **Missing Columns & Unclear Structure**

From your code usage:

- Code looks for `clerk_id` in users table, but register route uses `id`
- Unclear if `users.id` is UUID (Supabase) or Clerk ID (string)
- Profile fields scattered between tables

---

## ✅ Recommended New Schema

### Core Principle: **Merge users + profiles into single `users` table**

Here's the optimized schema:

### **1. USERS TABLE** (Main user table)

```sql
CREATE TABLE users (
    -- Primary key: Use Clerk ID directly
    id TEXT PRIMARY KEY,  -- Clerk user ID (e.g., "user_2abc123...")

    -- Authentication & Basic Info
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Student', 'Teacher')),

    -- Profile Information (merged from old profiles table)
    username VARCHAR(100),
    name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    bio TEXT,
    pfp_url VARCHAR(500),  -- Profile picture URL
    image_url VARCHAR(500), -- Alias for compatibility

    -- Social Counts
    following_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
```

**Why this works:**

- ✅ Clerk ID is the primary key (simple, no UUID confusion)
- ✅ All user data in one place (no joins needed)
- ✅ Matches your code's expectations
- ✅ No orphaned profiles

---

### **2. STUDENTS TABLE** (Student-specific data)

```sql
CREATE TABLE students (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    course VARCHAR(100),  -- e.g., "B.Tech", "B.Sc"
    major VARCHAR(100),   -- e.g., "Computer Science"
    year INTEGER,         -- Optional: year of study
    enrollment_number VARCHAR(50), -- Optional
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_students_course ON students(course);
CREATE INDEX idx_students_major ON students(major);
CREATE INDEX idx_students_course_major ON students(course, major);
```

---

### **3. TEACHERS TABLE** (Teacher-specific data)

```sql
CREATE TABLE teachers (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    subjects TEXT[] DEFAULT '{}',  -- Array of subjects taught
    department VARCHAR(100),       -- Optional
    designation VARCHAR(100),      -- Optional: "Professor", "Assistant Professor"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_teachers_subjects ON teachers USING GIN(subjects);
```

---

### **4. POSTS TABLE** (Feed posts)

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,  -- Optional image/video URL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
```

---

### **5. POST_REACTIONS TABLE** (Likes/reactions)

```sql
CREATE TABLE post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'celebrate')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate likes
    UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user ON post_reactions(user_id);
```

---

### **6. POST_COMMENTS TABLE**

```sql
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_post_comments_post ON post_comments(post_id);
CREATE INDEX idx_post_comments_user ON post_comments(user_id);
CREATE INDEX idx_post_comments_created ON post_comments(created_at DESC);
```

---

### **7. FOLLOWS TABLE** (Social following)

```sql
CREATE TABLE follows (
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)  -- Can't follow yourself
);

-- Indexes
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

---

### **8. ASSIGNMENTS TABLE**

```sql
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

-- Indexes
CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_course_major ON assignments(course, major);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
```

---

### **9. ASSIGNMENT_SUBMISSIONS TABLE**

```sql
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_details TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    grade VARCHAR(10),  -- Optional: "A", "B+", etc.
    feedback TEXT,      -- Optional: teacher feedback

    -- One submission per student per assignment
    UNIQUE(assignment_id, student_id)
);

-- Indexes
CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);
```

---

### **10. NOTICES TABLE**

```sql
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'event', 'announcement')),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notices_author ON notices(author_id);
CREATE INDEX idx_notices_published ON notices(published_at DESC);
CREATE INDEX idx_notices_type ON notices(type);
```

---

### **11. QUERIES TABLE** (Ask Doubt feature)

```sql
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

-- Indexes
CREATE INDEX idx_queries_student ON queries(student_id);
CREATE INDEX idx_queries_teacher ON queries(teacher_id);
CREATE INDEX idx_queries_answered ON queries(answered);
CREATE INDEX idx_queries_created ON queries(created_at DESC);
```

---

### **12. CHATS TABLE**

```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),  -- Optional: for group chats
    is_group BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **13. CHAT_MEMBERS TABLE**

```sql
CREATE TABLE chat_members (
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (chat_id, user_id)
);

-- Indexes
CREATE INDEX idx_chat_members_user ON chat_members(user_id);
```

---

### **14. CHAT_MESSAGES TABLE**

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
```

---

## 🔧 Implementation Steps

### Step 1: Create New Database in Supabase

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a **new project** (don't use the old one with redundant data)
3. Get your new credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

### Step 2: Run SQL Commands

Copy and paste the SQL from this document into Supabase SQL Editor:

1. Go to SQL Editor in Supabase Dashboard
2. Create a new query
3. Paste the table creation SQL
4. Run it

### Step 3: Enable Row Level Security (RLS)

**Important for security!** Enable RLS on all tables:

```sql
-- Enable RLS on all tables
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

-- Example RLS policies (customize as needed)

-- Users: Anyone can read, users can update their own
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Posts: Anyone can read, users can insert/update/delete their own
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (author_id = auth.uid());

-- Similar policies for other tables...
```

**Note:** Since you're using Clerk (not Supabase Auth), you'll need to use **service role key** for backend operations, not RLS. The above RLS is optional but recommended if you add Supabase Auth later.

---

## 📝 Code Changes Required

### Update `.env` file:

```env
# New Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_new_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key
SUPABASE_SERVICE_KEY=your_new_service_key

# Clerk (keep as is)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### Update `app/api/register/route.js`:

**Change from:**

```javascript
const { data: userRecord, error: userError } = await supabaseAdmin
  .from("users")
  .upsert(
    {
      id: clerkId,  // ✅ This is correct now
      email,
      role,
    },
    { onConflict: "id" }
  )
  .select("id")
  .single();

// Then separate profile insert - REMOVE THIS
const { error: profileError } = await supabaseAdmin
  .from("profiles")
  .upsert({ ... });
```

**Change to:**

```javascript
// Merge profile data into users table
const { data: userRecord, error: userError } = await supabaseAdmin
  .from("users")
  .upsert(
    {
      id: clerkId, // Clerk ID is primary key
      email,
      role,
      username: displayName,
      name: displayName,
      // bio, pfp_url etc can be added later
    },
    { onConflict: "id" }
  )
  .select("id")
  .single();

// No more separate profiles table insert!
```

### Update `lib/api.js`:

**Change all `getInternalUserId` calls:**

**OLD (looking for internal UUID):**

```javascript
async function getInternalUserId(clerkId) {
  if (!clerkId) throw new Error("Missing Clerk user id");
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId) // ❌ Wrong column
    .single();
  return data.id;
}
```

**NEW (Clerk ID IS the ID):**

```javascript
// Actually, you don't need this function anymore!
// Just use clerkId directly since it's the primary key
function getInternalUserId(clerkId) {
  if (!clerkId) throw new Error("Missing Clerk user id");
  return clerkId; // ✅ Simple!
}

// Or remove the function entirely and use clerkId directly
```

**Update queries to remove profile joins:**

**OLD:**

```javascript
const { data, error } = await supabase
  .from("users")
  .select(
    `
    id,
    clerk_id,  // ❌ No longer needed
    email,
    role,
    profiles (  // ❌ No longer exists
      username,
      name,
      bio
    ),
    students (course, major),
    teachers (subjects)
  `
  )
  .eq("clerk_id", clerkId);
```

**NEW:**

```javascript
const { data, error } = await supabase
  .from("users")
  .select(
    `
    id,
    email,
    role,
    username,
    name,
    bio,
    following_count,
    followers_count,
    students (course, major),
    teachers (subjects)
  `
  )
  .eq("id", clerkId); // ✅ Direct match
```

### Update all foreign keys in API calls:

Since `users.id` now stores Clerk ID directly, all foreign key references work naturally:

```javascript
// Posts
await supabase.from("posts").insert({
  author_id: clerkId,  // ✅ Works directly
  content,
  media_url
});

// Assignments
await supabase.from("assignments").insert({
  teacher_id: clerkId,  // ✅ Works directly
  ...
});

// No more getInternalUserId conversions needed!
```

---

## 🎯 Summary of Changes

### What's Fixed:

1. ✅ **Single users table** - No more users/profiles split
2. ✅ **Clerk ID as primary key** - No UUID confusion
3. ✅ **No internal ID conversion** - Simpler, faster code
4. ✅ **Consistent foreign keys** - All tables reference `users.id` (Clerk ID)
5. ✅ **All profile data in users** - username, name, bio, counts, etc.
6. ✅ **Proper normalization** - Student/teacher data in separate tables
7. ✅ **Complete feature support** - All app features covered

### Code Simplifications:

- ❌ Remove `getInternalUserId()` complexity
- ❌ Remove `profiles` table joins
- ❌ Remove inconsistent `clerk_id` vs `id` handling
- ✅ Direct Clerk ID usage everywhere
- ✅ Simpler queries and inserts
- ✅ Faster performance (no joins needed for basic user data)

---

## 🚀 Next Steps

1. **Review this schema** - Make sure it meets your needs
2. **Create new Supabase project**
3. **Run SQL commands** in Supabase SQL Editor
4. **Update `.env` file** with new credentials
5. **Update code** per the changes above
6. **Test registration flow**
7. **Test each feature** (posts, assignments, chat, etc.)

---

## 📊 Schema Diagram

```
┌─────────────────┐
│     USERS       │ ← Clerk ID as primary key
│  (merged from   │   Contains all profile data
│ users+profiles) │
└────────┬────────┘
         │
         ├──────────┬──────────┬──────────┐
         │          │          │          │
    ┌────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌──▼─────┐
    │STUDENTS│ │TEACHERS│ │ POSTS  │ │FOLLOWS │
    └────────┘ └────────┘ └────┬───┘ └────────┘
                                │
                         ┌──────┴───────┐
                         │              │
                   ┌─────▼─────┐ ┌─────▼────────┐
                   │REACTIONS  │ │  COMMENTS    │
                   └───────────┘ └──────────────┘
```

Let me know if you need any clarification or want me to help implement these changes! 🚀
