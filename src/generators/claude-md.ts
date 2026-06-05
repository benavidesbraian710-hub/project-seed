import fs from 'fs';
import path from 'path';
import type { ProjectConfig } from '../prompts/project.js';

/**
 * Generate the main CLAUDE.md - Teaching Guide
 *
 * This is the KEY DIFFERENTIATOR of project-seed.
 * Instead of just listing project config, this teaches HOW to work on the project.
 */
export async function generateCLAUDEMd(targetDir: string, config: ProjectConfig) {
  const claudeMd = generateTeachingCLAUDE(config);
  fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), claudeMd);

  // Also generate backend-specific CLAUDE.md
  if (config.includeBackend) {
    const backendClaudeMd = generateBackendCLAUDE(config);
    fs.writeFileSync(path.join(targetDir, 'backend', 'CLAUDE.md'), backendClaudeMd);
  }

  // Also generate frontend-specific CLAUDE.md
  if (config.includeFrontend) {
    const frontendClaudeMd = generateFrontendCLAUDE(config);
    fs.writeFileSync(path.join(targetDir, 'frontend', 'CLAUDE.md'), frontendClaudeMd);
  }
}

function generateTeachingCLAUDE(config: ProjectConfig): string {
  return `# ${config.name} - Developer Guide

> **What is this file?** This is your project's teaching guide — it explains HOW to work on this project, not just what it is. Read this before making any changes!

## 🎯 Project Overview

This is a **${getProjectTypeLabel(config.template)}** project created with project-seed. It includes:

${config.includeBackend ? `- **Backend**: Python FastAPI with SQLite database
` : ''}${config.includeFrontend ? `- **Frontend**: React 18 + Vite + TypeScript
` : ''}
- **Authentication**: JWT-based user authentication
${config.template === 'blog' ? '- **Features**: User registration, blog posts, comments' : ''}

## 📁 Project Structure

\`\`\`
${config.name}/
├── CLAUDE.md          ← YOU ARE HERE - Teaching guide
├── README.md          ← Quick start instructions
${config.includeBackend ? `├── backend/
│   ├── src/
│   │   ├── main.py         ← API entry point (START HERE for backend)
│   │   ├── database.py     ← Database connection setup
│   │   ├── auth.py         ← JWT authentication utilities
│   │   ├── models/         ← Database table definitions
│   │   ├── routes/         ← API endpoint handlers
│   │   └── schemas/        ← Request/response validation
│   ├── tests/              ← Test files
│   └── requirements.txt    ← Python dependencies
` : ''}${config.includeFrontend ? `├── frontend/
│   ├── src/
│   │   ├── App.tsx         ← Main React component (START HERE for frontend)
│   │   ├── main.tsx        ← React entry point
│   │   ├── pages/          ← Page components
│   │   ├── api/            ← API client configuration
│   │   └── components/     ← Reusable UI components
│   ├── package.json
│   └── vite.config.ts
` : ''}\`\`\`

## 🚀 How to Run

### Backend
\`\`\`bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload
\`\`\`

Backend runs at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Frontend runs at: http://localhost:5173

## 📚 Learning Path

Work through these steps in order to understand how this project works:

### Step 1: Run the project
- Start backend and frontend (instructions above)
- Open http://localhost:8000/docs and explore the API
- Open http://localhost:5173 and try registering a user

### Step 2: Understand the backend structure
- Read \`backend/src/main.py\` — this is the API entry point
- Read \`backend/src/models/user.py\` — this defines the users table
- Read \`backend/src/routes/auth.py\` — this handles registration/login

### Step 3: Add a new API endpoint
Here's how to add a new feature to the backend:

1. **Define the data model** in \`src/models/\`
   - Create a new model file (e.g., \`comment.py\`)
   - Define the database table columns

2. **Create the schema** in \`src/schemas/\`
   - Define request/response shapes with Pydantic

3. **Add the route** in \`src/routes/\`
   - Create a new router file
   - Add endpoint handlers (GET, POST, etc.)
   - Register the router in \`main.py\`

4. **Write tests** in \`tests/\`
   - Test happy path
   - Test error cases

Example: Adding a "comments" feature
\`\`\`python
# 1. backend/src/models/comment.py
from sqlalchemy import Column, Integer, String, ForeignKey
from src.database import Base

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    content = Column(String(500), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"))
    author_id = Column(Integer, ForeignKey("users.id"))

# 2. backend/src/schemas/comment.py
from pydantic import BaseModel
class CommentCreate(BaseModel):
    content: str
    post_id: int

class CommentResponse(BaseModel):
    id: int
    content: str
    post_id: int
    author_id: int

# 3. backend/src/routes/comments.py
from fastapi import APIRouter, Depends
from src.schemas.comment import CommentCreate, CommentResponse

router = APIRouter()

@router.post("/", response_model=CommentResponse)
async def create_comment(comment: CommentCreate, db=Depends(get_db)):
    # implementation here
    pass

# 4. backend/src/main.py
from src.routes.comments import router as comments_router
app.include_router(comments_router, prefix="/api/comments", tags=["Comments"])
\`\`\`

### Step 4: Understand the frontend structure
- Read \`frontend/src/App.tsx\` — main component with routing
- Read \`frontend/src/api/client.ts\` — API client with auth
- Read \`frontend/src/pages/HomePage.tsx\` — how pages work

### Step 5: Add a new frontend page
1. Create a new file in \`src/pages/\` (e.g., \`AboutPage.tsx\`)
2. Add a route in \`App.tsx\`
3. Link to it from navigation

## 🔧 Common Development Tasks

### Adding a new environment variable
1. Add to \`.env\` file in project root
2. Access in backend: \`import os; os.getenv("VAR_NAME")\`
3. Access in frontend: \`import.meta.env.VITE_VAR_NAME\`

### Adding a new database field
1. Edit the model in \`src/models/\`
2. Run migration: \`python -c "from src.models.base import Base; from src.database import engine; Base.metadata.create_all(bind=engine)"\`
3. Update the schema in \`src/schemas/\`
4. Update frontend API call if needed

### Adding authentication to a new endpoint
\`\`\`python
from src.auth import get_current_user

@router.get("/protected")
async def protected_endpoint(current_user: User = Depends(get_current_user)):
    # Only authenticated users can access this
    return {"user": current_user.username}
\`\`\`

## 📖 How to Use Claude Code with This Project

### Before you start
1. Read this CLAUDE.md (you've done that!)
2. Run the project and explore the current features
3. Think about what you want to add or change

### When asking Claude Code to help
Be specific about what you want:

\`\`\`
❌ BAD: "help me with the backend"
✅ GOOD: "Add an endpoint to get all posts by a specific user, including pagination"

❌ BAD: "fix the frontend"
✅ GOOD: "The login page shows an error message that doesn't disappear after successful login. Fix this by clearing the error state after navigation."

❌ BAD: "add authentication"
✅ GOOD: "Add role-based authentication where posts can be marked as 'published' or 'draft', and only authors can see their draft posts."
\`\`\`

### Using checkpoints for experiments
When experimenting with new features:
1. Say "I want to try something risky" and Claude will suggest creating a checkpoint
2. Make your changes
3. If something breaks, use \`/rewind\` to go back
4. If it works, continue!

## 🧪 Testing

### Run backend tests
\`\`\`bash
cd backend
pytest tests/ -v
\`\`\`

### Run frontend tests (if configured)
\`\`\`bash
cd frontend
npm test
\`\`\`

## 🛠️ Troubleshooting

### "Module not found" errors
\`\`\`bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
\`\`\`

### Database errors
The SQLite database file might be corrupted. Delete it and restart:
\`\`\`bash
rm ${config.name.replace('-', '_')}.db
uvicorn src.main:app --reload
\`\`\`

### Port already in use
\`\`\`bash
# Find and kill the process
lsof -i :8000  # backend
lsof -i :5173  # frontend
kill -9 <PID>
\`\`\`

## 🎓 What's Next?

Once you're comfortable with this project structure, try:

1. **Add more features** — Comments, categories, search
2. **Deploy** — Docker, Fly.io, Railway, or Render
3. **Add tests** — Increase coverage with pytest
4. **Add validation** — Pydantic models for all inputs
5. **Improve UX** — Better error handling, loading states

---

**Generated by project-seed**
For more learning resources, visit https://github.com/anthropics/claude-code
`;
}

function getProjectTypeLabel(template: string): string {
  const labels: Record<string, string> = {
    'blog': 'Blog System',
    'todo-api': 'Todo API',
    'portfolio': 'Portfolio Website',
  };
  return labels[template] || template;
}

function generateBackendCLAUDE(config: ProjectConfig): string {
  return `# Backend Guide

Specific backend development guide for ${config.name}.

## Backend Structure

\`\`\`
backend/
├── src/
│   ├── main.py           # API entry point (FastAPI app)
│   ├── database.py       # Database connection (SQLAlchemy)
│   ├── auth.py           # JWT authentication
│   ├── models/           # SQLAlchemy models (database tables)
│   │   ├── user.py       # Users table
│   │   └── post.py       # Posts table
│   ├── routes/           # API endpoints (routers)
│   │   ├── auth.py       # /api/auth/* endpoints
│   │   ├── users.py      # /api/users/* endpoints
│   │   └── posts.py      # /api/posts/* endpoints
│   └── schemas/          # Pydantic models (request/response)
├── tests/
│   └── test_auth.py      # Authentication tests
└── requirements.txt      # Python packages
\`\`\`

## Key Files Explained

### main.py
The API entry point. This is where:
- FastAPI app is created
- Middleware is configured (CORS)
- Routes are registered

### models/*.py
Define database tables. Each class = one table, each Column = one column.

### routes/*.py
Define API endpoints. Each function = one endpoint.
Use \`@router.get()\`, \`@router.post()\`, etc. decorators.

### schemas/*.py
Define request/response shapes. FastAPI uses these for:
- Validation (auto-returns 422 on invalid data)
- Documentation (auto-generates OpenAPI schema)

## Adding New Endpoints

\`\`\`python
# 1. Create route in routes/new_feature.py
from fastapi import APIRouter, Depends
router = APIRouter()

@router.get("/items")
async def list_items():
    return [{"id": 1, "name": "Item 1"}]

# 2. Register in main.py
from src.routes.new_feature import router as new_feature_router
app.include_router(new_feature_router, prefix="/api", tags=["New Feature"])
\`\`\`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | sqlite:///app.db | Database connection string |
`;
}

function generateFrontendCLAUDE(config: ProjectConfig): string {
  return `# Frontend Guide

Specific frontend development guide for ${config.name}.

## Frontend Structure

\`\`\`
frontend/
├── src/
│   ├── App.tsx           # Main component with routing
│   ├── main.tsx          # React entry point
│   ├── index.css         # Global styles
│   ├── api/
│   │   └── client.ts     # Axios instance with auth
│   └── pages/
│       ├── HomePage.tsx      # Post list
│       ├── LoginPage.tsx     # Login form
│       ├── RegisterPage.tsx  # Registration form
│       ├── PostPage.tsx      # Single post view
│       └── CreatePostPage.tsx # New post form
├── package.json
└── vite.config.ts
\`\`\`

## Key Concepts

### React Components
- Pages live in \`src/pages/\`
- Reusable components in \`src/components/\`
- Use Hooks (\`useState\`, \`useEffect\`) for state management

### API Client (\`api/client.ts\`)
- Axios instance configured with base URL
- Auth token automatically added to all requests
- 401 errors trigger logout

### Routing (\`react-router-dom\`)
- \`<Routes>\` wraps all routes
- \`<Route path="..." element={...} />\` defines each route
- \`<Navigate to="..." />\` redirects

## Adding a New Page

1. Create \`src/pages/NewPage.tsx\`
2. Add route in \`App.tsx\`
3. Link from navigation

\`\`\`tsx
// src/pages/NewPage.tsx
export default function NewPage() {
  return <div>New Page Content</div>
}

// App.tsx - add import and route
import NewPage from './pages/NewPage'
<Route path="/new" element={<NewPage />} />
\`\`\`

## State Management

Simple state with useState:
\`\`\`tsx
const [count, setCount] = useState(0)
\`\`\`

Persisted state with localStorage:
\`\`\`tsx
const [token, setToken] = useState(() => localStorage.getItem('token'))
\`\`\`

## Styling

Global styles in \`index.css\`. Use inline styles for component-specific styling:
\`\`\`tsx
<div style={{ padding: 20, background: 'white' }}>
  Content
</div>
\`\`\`
`;
}