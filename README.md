# PathForge · AI Career Navigator

PathForge is an AI-powered career navigation platform that helps students, recruiters, and administrators connect, evaluate skills, and discover opportunities. The application combines career guidance, resume intelligence, job matching, and chat collaboration in a single dashboard.

## Key Features
- AI-driven career guidance and resume analysis
- Role-based dashboard support for students, recruiters, and admins
- Real-time messaging powered by Socket.io
- Job listings and application tracking
- Student profile management and skills gap analysis
- Admin tools for user and database insights

## Tech Stack
- Frontend: React 19, Vite, Tailwind CSS
- Backend: Express, Socket.io, SQLite (via Better SQLite3)
- AI: Google Gemini via `@google/genai`
- Authentication: JWT

## Getting Started
### Prerequisites
- Node.js 20+ installed
- npm package manager
- A valid Gemini API key for AI features

### Install dependencies
```bash
npm install
```

### Environment variables
Create a `.env` file from `.env.example` and set your environment values.

Example `.env` values:
```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run the app
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts
- `npm run dev` — Start the development server
- `npm run build` — Build the client for production
- `npm run preview` — Preview the production build locally
- `npm run clean` — Remove the `dist` output folder
- `npm run lint` — Run TypeScript type checks
- `npm run start` — Start the server in production mode

## Project Structure
- `server.ts` — Main Express/Vite server entrypoint
- `src/main.tsx` — React app entrypoint
- `src/App.tsx` — Application routing and layout
- `src/context/AuthContext.tsx` — Authentication state management
- `src/pages` — Main application pages and views
- `src/components` — Reusable UI components
- `src/server` — Backend routes, services, and database utilities

## API Overview
- `POST /api/auth/register` — Create a new account
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET /api/profile/:userId` — Fetch user profile
- `PUT /api/profile/:userId` — Update profile details
- `GET /api/jobs` — List available jobs
- `POST /api/jobs/:jobId/apply` — Apply for a job
- `POST /api/ai/analyze-resume` — Analyze resume content
- `POST /api/ai/career-guidance` — Get personalized career suggestions
- `GET /api/chat/history/:userId/:otherId` — Fetch chat history
- `POST /api/chat/send` — Send a chat message

## Notes
- The database initializes automatically on first startup.
- AI routes require `GEMINI_API_KEY` to be configured.

## License
This repository is currently configured as a private project.
