# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd my-college-app-frontend
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
   
   Get your Clerk keys from: https://dashboard.clerk.com

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to http://localhost:3000

## Project Structure Overview

- `src/app/` - Next.js App Router pages and components
- `src/lib/` - Utility functions and API client
- `src/stores/` - Zustand state management stores
- `src/app/_components/` - Reusable React components

## Key Features Implemented

✅ User Authentication (Clerk)
✅ Role-based access (Student/Teacher)
✅ News Feed with posts, likes, comments
✅ User Profiles with follower system
✅ Assignment Management
✅ Direct Messaging
✅ Notices & Events
✅ Ask a Doubt feature
✅ State Management (Zustand)
✅ Responsive UI with Tailwind CSS

## Backend Integration

The frontend is ready to connect to your backend API. Update `NEXT_PUBLIC_API_URL` in `.env.local` to point to your backend server.

All API calls are centralized in `src/lib/api.js` and follow the routes specified in the project report.

## Next Steps

1. Set up Clerk authentication
2. Connect to your backend API
3. Test all features
4. Deploy to Vercel

