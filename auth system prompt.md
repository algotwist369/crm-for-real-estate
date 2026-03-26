You are a senior full-stack developer with expertise in React, React Query, authentication systems, and scalable frontend architecture.

I already have a backend authentication system built with Node.js, Express, and MongoDB that uses HttpOnly cookies for storing JWT tokens.

backend - C:\Users\ADMIN\Desktop\lead_real\backend
frontend - C:\Users\ADMIN\Desktop\lead_real\frontend

Backend API endpoints:
- POST /api/auth/admin/login → logs in user and sets HttpOnly cookie
- POST /api/auth/admin/register → registers user and sets cookie
- POST /api/auth/logout → clears cookie

Your task is to build a complete, production-grade React authentication system using the following stack:
- React (functional components)
- React Router
- @tanstack/react-query
- Axios (with withCredentials enabled)
- Context API (for global auth state)
- Tailwind CSS (for UI)

Follow senior-level architecture and best practices.

----------------------------------

🔐 REQUIREMENTS:

1. AXIOS SETUP
- Create a reusable axios instance
- Enable withCredentials: true
- Add interceptor for handling 401 errors globally

----------------------------------

2. REACT QUERY SETUP
- Configure QueryClient and Provider
- Use proper query keys
- Disable retry for auth queries where needed

----------------------------------

3. AUTH API HOOKS (REUSABLE)
Create reusable hooks:
- useLogin()
- useRegister()
- useLogout()
- useAuthUser()

Each hook must:
- Use React Query (useMutation / useQuery)
- Handle loading, error, success states
- Be reusable across the app

----------------------------------

4. AUTH CONTEXT PROVIDER
- Create AuthContext + AuthProvider
- Store:
  - user
  - isAuthenticated
- Sync with React Query (DO NOT duplicate state unnecessarily)
- Provide a clean API:
  - login()
  - logout()
  - register()

----------------------------------

5. PROTECTED ROUTES
- Create a reusable <ProtectedRoute /> component
- Redirect unauthenticated users to /login
- Show loader while checking auth

----------------------------------

6. ROUTING STRUCTURE
Implement:
- /login
- /register
- /dashboard (protected)

----------------------------------

7. LOGIN & REGISTER UI
- Build clean Tailwind forms
- Handle:
  - validation
  - loading states
  - error messages
- Use reusable form logic

----------------------------------

8. LOGOUT FLOW
- Call API
- Clear auth state
- Invalidate React Query cache

----------------------------------

9. GLOBAL ERROR HANDLING
- Handle 401 errors → auto logout
- Show proper error messages

----------------------------------

10. BEST PRACTICES (VERY IMPORTANT)
- Do NOT store tokens in localStorage
- Rely on cookies only
- Keep code modular and reusable
- Separate:
  - api layer
  - hooks
  - context
  - components

----------------------------------

11. BONUS (IF POSSIBLE)
- Add loading skeleton
- Add toast notifications
- Add role-based auth (if user has role field)

----------------------------------

OUTPUT FORMAT:
- Folder structure
- Complete code for each file
- Clear comments explaining logic
- Follow clean and scalable architecture

Think like a senior engineer building a production SaaS app.
Avoid shortcuts. Write clean, maintainable, reusable code.