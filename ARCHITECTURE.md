# PathForge System Architecture

## 1. High-Level Architecture
The system follows a modern full-stack architecture with a React frontend, an Express.js backend, and an integrated AI engine powered by Google Gemini.

```
[ Frontend: React + Tailwind ] <---(Socket.io)---> [ Backend: Express.js ]
                                                         |
                                                         |---(SQL Queries)---> [ Database: SQLite/MySQL ]
                                                         |
                                                         |---(API Calls)-----> [ AI Engine: Gemini Pro ]
```

## 2. Component Breakdown

### Frontend (React + Vite)
- **State Management**: React Hooks (Context API for Auth/Chat).
- **Styling**: Tailwind CSS for a modern, responsive UI.
- **Visualizations**: Recharts for skill graphs and readiness scores.
- **Real-time**: Socket.io-client for messaging.

### Backend (Node.js + Express)
- **API Layer**: RESTful endpoints for users, jobs, and applications.
- **Auth**: JWT-based authentication with bcrypt password hashing.
- **Real-time**: Socket.io server integrated with Express.
- **File Handling**: Multer for resume uploads.

### Database (SQL)
- **Engine**: SQLite (used here for portability, schema is MySQL compatible).
- **Normalization**: 3NF normalized schema with foreign key constraints.
- **Tables**: Users, Profiles, Skills, Jobs, Applications, Messages, etc.

### AI Engine (Gemini Integration)
- **Career Engine**: Analyzes interests and skills to suggest paths.
- **Resume Intelligence**: Extracts structured data from PDF resumes.
- **Skill Gap**: Compares user profile against job requirements.
- **Job Matching**: Ranks jobs based on Job Readiness Score.

## 3. Data Flow: Job Readiness Score
1. User uploads resume + completes profile.
2. AI extracts skills and experience.
3. System calculates:
   - `Skill Match` (User Skills vs. Goal Path Skills)
   - `Resume Quality` (AI-generated score)
   - `Activity Score` (Applications + Network engagement)
4. Final Score = Weighted average of the above.
