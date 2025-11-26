# Local Storage Mode - Frontend Testing

The application is now configured to use **localStorage** instead of API endpoints for frontend testing. All data is stored in the browser's local storage.

## ✅ What's Working

All features are now functional using localStorage:

- ✅ **User Registration** - Saves to localStorage
- ✅ **User Profiles** - Stored and retrieved from localStorage
- ✅ **Posts** - Create, view, like, comment
- ✅ **Assignments** - Create (teachers), view and submit (students)
- ✅ **Notices & Events** - Create and view
- ✅ **Queries** - Submit and view queries
- ✅ **Chat/Messaging** - Send and receive messages
- ✅ **Follow System** - Follow/unfollow users

## 📦 Data Storage

All data is stored in localStorage with these keys:

- `users` - All registered users
- `profiles` - User profile information
- `students` - Student-specific data
- `teachers` - Teacher-specific data
- `posts` - All posts
- `likes` - Post likes/reactions
- `comments` - Post comments
- `assignments` - All assignments
- `submissions` - Assignment submissions
- `queries` - Student queries
- `notices` - Notices and events
- `chats` - Chat conversations
- `messages` - Chat messages
- `follows` - Follow relationships

## 🔄 How It Works

1. **API Calls Redirected**: All API calls in `lib/api.js` are redirected to `lib/localStorageAPI.js`
2. **No Backend Required**: The app works completely offline
3. **Data Persists**: Data persists across page refreshes (stored in browser)
4. **Easy Testing**: You can test all frontend features without setting up a backend

## 🧪 Testing the App

1. **Start the frontend:**
   ```bash
   npm run dev
   ```

2. **Register a user:**
   - Go to `/sign-up`
   - Sign up with Clerk
   - Complete onboarding (select role, course, major)
   - Data is saved to localStorage

3. **Test Features:**
   - Create posts on the feed
   - Like and comment on posts
   - Create assignments (as teacher)
   - View and submit assignments (as student)
   - Create notices/events
   - Send messages
   - Submit queries

## 🔍 Viewing Stored Data

To view data in localStorage:

1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Click on Local Storage
4. Select your domain
5. You'll see all the stored data

## 🔄 Switching to Real Backend

When you're ready to connect to a real backend:

1. Open `lib/api.js`
2. Comment out the localStorage imports:
   ```js
   // import * as localStorageAPI from './localStorageAPI';
   ```
3. Uncomment the real API code at the bottom
4. Update `BASE_URL` if needed
5. Implement all API functions using `apiCall()`

## 📝 Notes

- **Data is per-browser**: Each browser/device has its own localStorage
- **No sync**: Data doesn't sync between devices
- **Limited storage**: localStorage has ~5-10MB limit
- **No server validation**: All validation is client-side only
- **Perfect for testing**: Great for frontend development and testing

## 🐛 Troubleshooting

**Data not persisting?**
- Check browser console for errors
- Verify localStorage is enabled in browser
- Check if storage quota is exceeded

**Features not working?**
- Clear localStorage and try again
- Check browser console for errors
- Verify all components are using the API from `lib/api.js`

**Want to reset all data?**
```javascript
// Run in browser console:
localStorage.clear();
```

