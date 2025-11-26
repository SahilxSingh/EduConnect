# Backend Server Setup Guide

This guide will help you set up the backend API server for the EduConnect application.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we'll use Supabase - free tier available)
- Clerk account (for authentication)

## Step 1: Create Backend Project

1. **Create a new directory for the backend:**
   ```bash
   cd ..
   mkdir my-college-app-backend
   cd my-college-app-backend
   ```

2. **Initialize npm project:**
   ```bash
   npm init -y
   ```

3. **Install required dependencies:**
   ```bash
   npm install express cors dotenv pg @supabase/supabase-js
   npm install -D nodemon
   ```

## Step 2: Set Up Supabase Database

1. **Create a Supabase account:**
   - Go to https://supabase.com
   - Sign up for a free account
   - Create a new project

2. **Get your database credentials:**
   - Go to Project Settings → API
   - Copy your:
     - Project URL
     - `anon` public key (for client-side)
     - `service_role` key (for server-side - keep this secret!)

3. **Set up the database schema:**
   - Go to SQL Editor in Supabase
   - Run the SQL script provided in `database/schema.sql` (see below)

## Step 3: Environment Variables

Create a `.env` file in your backend directory:

```env
PORT=3001
NODE_ENV=development

# Supabase Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key

# CORS
FRONTEND_URL=http://localhost:3000
```

## Step 4: Basic Backend Structure

Create the following file structure:

```
my-college-app-backend/
├── server.js              # Main server file
├── .env                   # Environment variables
├── package.json
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User profile routes
│   ├── posts.js          # Post routes
│   ├── assignments.js    # Assignment routes
│   ├── queries.js        # Query routes
│   ├── notices.js        # Notice routes
│   └── chat.js           # Chat routes
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── postController.js
│   └── ...
├── middleware/
│   └── auth.js           # Authentication middleware
├── config/
│   └── database.js       # Database connection
└── database/
    └── schema.sql        # Database schema
```

## Step 5: Run the Backend

1. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js"
     }
   }
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

   The server should now be running on `http://localhost:3001`

## Step 6: Test the Connection

1. **Check if server is running:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Test registration endpoint:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","userId":"test123","role":"Student","course":"B.Tech","major":"CS"}'
   ```

## Quick Start Script

I've created a complete backend starter in the `backend-starter` folder. To use it:

1. Copy the backend-starter folder
2. Install dependencies: `npm install`
3. Set up your `.env` file
4. Run: `npm run dev`

## Troubleshooting

### Port Already in Use
If port 3001 is already in use:
- Change `PORT=3001` in `.env` to another port (e.g., `3002`)
- Update `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### Database Connection Issues
- Verify your Supabase credentials
- Check if your Supabase project is active
- Ensure the database schema is created

### CORS Errors
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that CORS middleware is properly configured

## Next Steps

1. Implement all API routes according to the project report
2. Add proper error handling
3. Add input validation
4. Set up authentication middleware
5. Deploy to Render (as specified in project report)

