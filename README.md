# EduConnect - Frontend

A comprehensive social networking and academic organization platform for college communities.

## Features

- **Social Networking**: News feed, posts, likes, comments, and sharing
- **User Profiles**: Student and Teacher profiles with follower system
- **Direct Messaging**: Real-time chat between users
- **Academic Features**: 
  - Assignment management (create, view, submit)
  - Course-specific content organization
  - "Ask a Doubt" feature for student-teacher communication
- **Notices & Events**: Centralized announcements and event management
- **Authentication**: Secure user authentication with Clerk

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components built with shadcn/ui patterns
- **State Management**: Zustand
- **Authentication**: Clerk
- **Language**: JavaScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Clerk account (for authentication)
- Backend API (when ready)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Fill in your environment variables in `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `NEXT_PUBLIC_API_URL`: Your backend API URL (default: http://localhost:3001)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── _components/        # Reusable components
│   │   ├── ui/            # Basic UI components (Button, Input, Card, etc.)
│   │   ├── shared/        # Shared components (Navbar, etc.)
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── posts/         # Post-related components
│   │   └── messaging/     # Chat/messaging components
│   ├── onboarding/        # Post-signup role selection
│   ├── feed/              # Main news feed
│   ├── profile/           # User profiles
│   ├── assignments/       # Student assignment view
│   ├── teacher/           # Teacher-specific pages
│   ├── notices/           # Notices and events
│   ├── chat/              # Direct messaging
│   ├── ask-doubt/         # Student query submission
│   └── sign-up/           # Registration page
├── lib/
│   ├── api.js             # API client functions
│   ├── useAuth.js         # Authentication hook
│   └── utils.js           # Utility functions
└── stores/                # Zustand state stores
    ├── authStore.js
    ├── postStore.js
    ├── assignmentStore.js
    ├── chatStore.js
    └── noticeStore.js
```

## API Integration

The frontend is designed to work with a backend API. All API calls are centralized in `src/lib/api.js`. The backend should implement the following endpoints as outlined in the project report:

- Authentication & Profile: `/api/auth/*`, `/api/users/*`
- Social Features: `/api/posts/*`, `/api/follow/*`
- Academic Features: `/api/assignments/*`, `/api/courses`
- Queries & Notices: `/api/queries/*`, `/api/notices`
- Messaging: `/api/chat/*`, `/api/chats/*`

## State Management

The application uses Zustand for state management with separate stores for:
- Authentication (`authStore`)
- Posts (`postStore`)
- Assignments (`assignmentStore`)
- Chat (`chatStore`)
- Notices (`noticeStore`)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables
4. Deploy

The application is configured for easy deployment on Vercel.

## Development Notes

- All components are client-side by default (using "use client")
- API calls use the centralized `api.js` file for easy backend integration
- The UI follows shadcn/ui patterns for consistency
- Responsive design with Tailwind CSS
- Error handling implemented for all API calls

## Future Enhancements

- Real-time notifications
- File upload for assignments and posts
- AI-powered post suggestions
- Advanced search functionality
- Mobile app version

## License

This project is part of a college social networking application.
