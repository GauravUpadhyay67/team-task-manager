# Team Task Manager

A full-stack web application for team collaboration where users can create projects, assign tasks, and track progress with **role-based access control** (Admin/Member).

## 🚀 Live Demo

[Live Application URL](https://your-app.up.railway.app)

## 📋 Features

### Authentication
- User registration with Name, Email, Password
- Secure login with JWT tokens
- Protected routes and persistent sessions

### Project Management
- Create and manage projects
- Project creator automatically becomes Admin
- Add/remove team members by email
- Members can view assigned projects

### Task Management
- Create tasks with Title, Description, Due Date, Priority
- Assign tasks to project members
- Update task status: **To Do → In Progress → Done**
- Priority levels: Low, Medium, High
- Visual Kanban-style task board

### Dashboard
- Total tasks and projects overview
- Tasks breakdown by status with progress bars
- Tasks per user with completion stats
- Overdue task tracking
- Recent tasks table

### Role-Based Access Control
- **Admin**: Create/edit/delete tasks, manage members, full project control
- **Member**: View assigned tasks, update task status only

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router |
| Styling | Vanilla CSS (Dark Theme, Glassmorphism) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken, bcryptjs) |
| Deployment | Railway |

## 📁 Project Structure

```
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context provider
│   │   ├── pages/          # Page components
│   │   └── utils/          # API utility
│   └── vite.config.js
├── server/                 # Express Backend
│   ├── config/             # Database config
│   ├── controllers/        # Route handlers
│   ├── middleware/          # Auth & role middleware
│   ├── models/             # Mongoose schemas
│   └── routes/             # API routes
└── package.json            # Root scripts
```

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login and get JWT
- `GET /api/auth/me` — Get current user

### Projects
- `GET /api/projects` — List user's projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Get project details
- `PUT /api/projects/:id` — Update project (Admin)
- `DELETE /api/projects/:id` — Delete project (Admin)
- `POST /api/projects/:id/members` — Add member (Admin)
- `DELETE /api/projects/:id/members/:userId` — Remove member (Admin)

### Tasks
- `POST /api/tasks` — Create task (Admin)
- `GET /api/tasks/project/:projectId` — List project tasks
- `PUT /api/tasks/:id` — Update task
- `DELETE /api/tasks/:id` — Delete task (Admin)

### Dashboard
- `GET /api/dashboard/stats` — Get statistics

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
```

### 2. Install dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 3. Configure environment
Create a `.env` file in the root:
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
PORT=5000
```

### 4. Run in development
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🚀 Deployment (Railway)

1. Push code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repo
4. Set environment variables (MONGO_URI, JWT_SECRET, NODE_ENV=production)
5. Build command: `cd client && npm install && npm run build`
6. Start command: `node server/server.js`

## 👤 Author

Your Name - [GitHub](https://github.com/your-username)
