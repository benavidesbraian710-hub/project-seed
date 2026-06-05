import fs from 'fs';
import path from 'path';
import type { ProjectConfig } from '../prompts/project.js';

export async function generateBackend(targetDir: string, config: ProjectConfig) {
  const backendDir = path.join(targetDir, 'backend');
  const srcDir = path.join(backendDir, 'src');

  // Create directory structure
  fs.mkdirSync(path.join(srcDir, 'models'), { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'routes'), { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'middleware'), { recursive: true });
  fs.mkdirSync(path.join(backendDir, 'tests'), { recursive: true });

  // requirements.txt
  const requirements = `fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
pydantic==2.5.3
pydantic[email]==2.5.3
python-jose[cryptography]==3.3.0
passlib[argon2]==1.7.4
python-multipart==0.0.6
`;

  fs.writeFileSync(path.join(backendDir, 'requirements.txt'), requirements);

  // main.py - Entry point with detailed comments
  const mainPy = `"""
${config.name} - Backend API Entry Point

This is the main entry point for your FastAPI application.
The comments in this file explain WHAT each part does and WHY it's structured this way.

To run the server:
    uvicorn src.main:app --reload

To view API documentation:
    http://localhost:8000/docs (Swagger UI)
    http://localhost:8000/redoc (ReDoc)
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Import database configuration
# WHY: Separating database setup allows us to change database providers without touching application code
from src.database import engine, get_db

# Import models
# WHY: Models define the data structure. FastAPI uses them for automatic validation and OpenAPI docs
from src.models.user import User
from src.models.post import Post

# Import routers (API endpoints)
# WHY: Separating routes into different files makes the codebase easier to maintain
# Each router handles a specific domain (users, posts, auth)
from src.routes import auth, users, posts

# Create database tables
# WHY: create_all() creates tables that don't exist yet. It won't overwrite existing data.
from src.database import Base
Base.metadata.create_all(bind=engine)

# Create FastAPI app instance
# docs_url and redoc_url are enabled by default. Set to None to disable.
app = FastAPI(
    title="${config.name}",
    description="API for ${config.name}. See CLAUDE.md for development guide.",
    version="1.0.0",
)

# CORS Middleware
# WHY: CORS allows your frontend (running on a different port) to communicate with this API.
# Without this, browser security would block requests from localhost:5173 to localhost:8000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with prefixes
# prefix="/api" groups all endpoints under /api/*
# tags=["..."] organizes endpoints in documentation
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(posts.router, prefix="/api/posts", tags=["Posts"])

@app.get("/")
async def root():
    """Root endpoint - useful for health checks"""
    return {
        "message": "${config.name} API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}
`;

  fs.writeFileSync(path.join(srcDir, 'main.py'), mainPy);

  // database.ts
  const databaseTs = `"""
Database Configuration

This file sets up the database connection using SQLAlchemy.
SQLAlchemy is an ORM (Object-Relational Mapper) that lets you interact with databases
using Python objects instead of raw SQL queries.

WHY SQLAlchemy?
- It works with multiple database providers (PostgreSQL, SQLite, MySQL)
- It prevents SQL injection attacks automatically
- It makes database code portable across different databases
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL
# For development, we use SQLite (a simple file-based database)
# For production, you'd use PostgreSQL or another database server
# The DATABASE_URL environment variable allows easy switching between environments
import os
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./${config.name.replace('-', '_')}.db")

# Create engine
# check_same_thread=False is needed for SQLite with FastAPI
# It allows multiple threads to access the database (FastAPI runs each request in a different thread)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=True  # Set to False in production to disable SQL logging
)

# SessionLocal is used to create database sessions
# WHY: Each request gets its own session, preventing conflicts
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
# All models inherit from this. It provides the table creation functionality.
Base = declarative_base()

def get_db():
    """
    Dependency that provides a database session to each request.

    FastAPI's Depends() system automatically handles:
    - Creating a session for each request
    - Closing it after the request completes
    - Rolling back on errors
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`;

  fs.writeFileSync(path.join(srcDir, 'database.py'), databaseTs);

  // models/__init__.py
  fs.writeFileSync(path.join(srcDir, 'models', '__init__.py'), `from src.database import Base
from src.models.user import User
from src.models.post import Post
`);

  fs.writeFileSync(path.join(srcDir, 'models', 'base.py'), '');

  // user model
  const userModel = `"""
User Model

This defines the 'users' table in the database.
Each field corresponds to a column in the table.

WHY SEPARATE MODELS?
- Clarity: Each model is responsible for one database table
- Testing: You can test each model independently
- Maintenance: Changes to one model don't affect others
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from src.database import Base


class User(Base):
    """
    User model representing the users table.

    Columns:
    - id: Primary key (auto-incremented)
    - username: Unique username for login
    - email: Unique email address
    - hashed_password: Encrypted password (NEVER store plain passwords!)
    - is_active: Soft delete flag (deleted users aren't removed, just deactivated)
    - created_at: When the account was created
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship: A user can have many posts
    # back_populates links this to the Post model's user relationship
    posts = relationship("Post", back_populates="author")

    def __repr__(self):
        return f"<User {self.username}>"
`;

  fs.writeFileSync(path.join(srcDir, 'models', 'user.py'), userModel);

  // post model
  const postModel = `"""
Post Model

Represents blog posts. Each post belongs to a user (the author).
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from src.database import Base


class Post(Base):
    """
    Post model representing the posts table.

    Columns:
    - id: Primary key
    - title: Post title (indexed for faster search)
    - content: Post body (Text type for long content)
    - author_id: Foreign key to users table
    - created_at: Publication timestamp
    - updated_at: Last edit timestamp
    """
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), index=True, nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship: Each post belongs to one user
    author = relationship("User", back_populates="posts")

    def __repr__(self):
        return f"<Post {self.title}>"
`;

  fs.writeFileSync(path.join(srcDir, 'models', 'post.py'), postModel);

  // routes/__init__.py
  fs.writeFileSync(path.join(srcDir, 'routes', '__init__.py'), `from src.routes import auth, users, posts
`);

  // auth routes
  const authRoutes = `"""
Authentication Routes

Handles user registration, login, and token management.
Uses JWT (JSON Web Tokens) for stateless authentication.

WHY JWT?
- Stateless: Server doesn't need to store session data
- Scalable: Works across multiple servers
- Mobile-friendly: Can be stored on mobile devices
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from src.database import get_db
from src.models.user import User
from src.schemas import Token, UserCreate, UserResponse
from src.auth import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    Steps:
    1. Check if username/email already exists
    2. Hash the password (NEVER store plain passwords!)
    3. Create new user in database
    4. Return user info (without password)
    """
    # Check if user exists
    db_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    # Create new user with hashed password
    hashed_pwd = hash_password(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pwd
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login and get access token.

    Uses OAuth2PasswordRequestForm which expects:
    - username (form field)
    - password (form field)

    Returns JWT token on success.
    """
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": user.username}
    )

    return {"access_token": access_token, "token_type": "bearer"}
`;

  fs.writeFileSync(path.join(srcDir, 'routes', 'auth.py'), authRoutes);

  // auth.py utility
  const authUtils = `"""
Authentication Utilities

Handles password hashing and JWT token creation.
These are separated into a utility module so they can be reused across the app.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User

# JWT Configuration
# These should be environment variables in production!
SECRET_KEY = "your-secret-key-change-in-production"  # Generate with: openssl rand -hex 32
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
# argon2 has no password length limit (unlike bcrypt's 72 bytes)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# OAuth2 scheme for extracting token from requests
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: The payload to encode in the token
        expires_delta: Optional expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[str]:
    """Decode and validate a JWT token, return username if valid"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        return username
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from a JWT token.

    FastAPI's Depends() system handles:
    1. Extracting token from Authorization header
    2. Decoding and validating the token
    3. Looking up the user in the database
    4. Returning the user object

    If any step fails, it raises HTTP 401 automatically.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    username = decode_token(token)
    if username is None:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    return user
`;

  fs.writeFileSync(path.join(srcDir, 'auth.py'), authUtils);

  // users routes
  const usersRoutes = `"""
User Routes

Handles user-related endpoints (profile, settings, etc.)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.schemas import UserResponse
from src.auth import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user's profile information.

    This endpoint is protected (requires authentication).
    The get_current_user dependency validates the JWT token
    and returns the authenticated user.
    """
    return current_user


@router.get("/{username}", response_model=UserResponse)
async def get_user_by_username(username: str, db: Session = Depends(get_db)):
    """
    Get any user's public profile by username.

    This endpoint is public (no authentication required).
    """
    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
`;

  fs.writeFileSync(path.join(srcDir, 'routes', 'users.py'), usersRoutes);

  // posts routes
  const postsRoutes = `"""
Post Routes

Handles all blog post operations:
- List all posts (public)
- Get single post (public)
- Create post (authenticated)
- Update post (owner only)
- Delete post (owner only)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.user import User
from src.models.post import Post
from src.schemas import PostCreate, PostResponse
from src.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[PostResponse])
async def list_posts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    List all posts with pagination.

    Query parameters:
    - skip: Number of posts to skip (for pagination)
    - limit: Maximum number of posts to return

    Default returns first 100 posts, ordered by creation date (newest first).
    """
    posts = db.query(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: int, db: Session = Depends(get_db)):
    """Get a single post by ID"""
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return post


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new post.

    Requires authentication (current_user from JWT).
    The new post is automatically assigned to the authenticated user.
    """
    new_post = Post(
        title=post.title,
        content=post.content,
        author_id=current_user.id
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return new_post


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing post.

    Only the author can update their own posts.
    Returns 403 Forbidden if another user tries to update.
    """
    db_post = db.query(Post).filter(Post.id == post_id).first()

    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check ownership
    if db_post.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )

    db_post.title = post.title
    db_post.content = post.content

    db.commit()
    db.refresh(db_post)

    return db_post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a post.

    Only the author can delete their own posts.
    """
    db_post = db.query(Post).filter(Post.id == post_id).first()

    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    if db_post.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )

    db.delete(db_post)
    db.commit()

    return None
`;

  fs.writeFileSync(path.join(srcDir, 'routes', 'posts.py'), postsRoutes);

  // schemas
  fs.mkdirSync(path.join(srcDir, 'schemas'), { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'schemas', '__init__.py'), `from src.schemas.user import *
from src.schemas.post import *
`);

  const schemasUser = `"""
Pydantic Schemas for User

Schemas define the shape of data (request/response) for each endpoint.
Unlike SQLAlchemy models which define database structure, schemas define API contracts.

WHY SEPARATE?
- Database models may change, API contracts should be stable
- Schemas can have validation rules (e.g., email format, password min length)
- Schemas can exclude sensitive fields from responses
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    """Schema for creating a new user (registration)"""
    password: str = Field(..., min_length=6)


class UserResponse(UserBase):
    """
    Schema for user response data.
    Excludes password and internal fields.
    """
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Allow creating from ORM objects


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
`;

  fs.writeFileSync(path.join(srcDir, 'schemas', 'user.py'), schemasUser);

  const schemasPost = `"""
Pydantic Schemas for Post
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PostBase(BaseModel):
    """Base post schema with common fields"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)


class PostCreate(PostBase):
    """Schema for creating a new post"""
    pass


class PostResponse(PostBase):
    """
    Schema for post response.
    Includes metadata fields.
    """
    id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
`;

  fs.writeFileSync(path.join(srcDir, 'schemas', 'post.py'), schemasPost);

  // middleware
  fs.mkdirSync(path.join(srcDir, 'middleware'), { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'middleware', '__init__.py'), '');

  // tests
  const testAuth = `"""
Authentication Tests

Tests for user registration, login, and JWT token handling.
Run with: pytest tests/test_auth.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.main import app
from src.database import Base, get_db

# Test database (SQLite in memory for speed)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_register_user():
    """Test user registration endpoint"""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "id" in data


def test_register_duplicate_username():
    """Test that duplicate usernames are rejected"""
    # Register first user
    client.post(
        "/api/auth/register",
        json={
            "username": "duplicateuser",
            "email": "first@example.com",
            "password": "testpass123"
        }
    )

    # Try to register with same username
    response = client.post(
        "/api/auth/register",
        json={
            "username": "duplicateuser",
            "email": "second@example.com",
            "password": "testpass123"
        }
    )
    assert response.status_code == 400


def test_login():
    """Test user login and JWT token generation"""
    # Register user first
    client.post(
        "/api/auth/register",
        json={
            "username": "loginuser",
            "email": "login@example.com",
            "password": "testpass123"
        }
    )

    # Login
    response = client.post(
        "/api/auth/login",
        data={
            "username": "loginuser",
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password():
    """Test that wrong password is rejected"""
    response = client.post(
        "/api/auth/login",
        data={
            "username": "nonexistent",
            "password": "wrong"
        }
    )
    assert response.status_code == 401
`;

  fs.writeFileSync(path.join(backendDir, 'tests', 'test_auth.py'), testAuth);
}

export async function generateFrontend(targetDir: string, config: ProjectConfig) {
  const frontendDir = path.join(targetDir, 'frontend');
  const srcDir = path.join(frontendDir, 'src');

  fs.mkdirSync(path.join(srcDir, 'components'), { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'pages'), { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'api'), { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'hooks'), { recursive: true });

  const packageJson = `{
  "name": "${config.name}-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}`;

  fs.writeFileSync(path.join(frontendDir, 'package.json'), packageJson);

  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})`;

  fs.writeFileSync(path.join(frontendDir, 'vite.config.ts'), viteConfig);

  const tsconfig = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;

  fs.writeFileSync(path.join(frontendDir, 'tsconfig.json'), tsconfig);

  const tsconfigNode = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`;

  fs.writeFileSync(path.join(frontendDir, 'tsconfig.node.json'), tsconfigNode);

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

  fs.writeFileSync(path.join(frontendDir, 'index.html'), indexHtml);

  const mainTsx = `/**
 * Entry Point - React App
 *
 * This is where the React app starts.
 * React renders the App component into the #root div in index.html.
 *
 * WHY THIS FILE?
 * - Bundles all components and renders them to the page
 * - Sets up the router for navigation between pages
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

  fs.writeFileSync(path.join(srcDir, 'main.tsx'), mainTsx);

  const indexCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}`;

  fs.writeFileSync(path.join(srcDir, 'index.css'), indexCss);

  const AppTsx = `/**
 * App Component - Main Application Component
 *
 * This is the root component that wraps all other components.
 * It sets up routing, authentication context, and global layout.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PostPage from './pages/PostPage'
import CreatePostPage from './pages/CreatePostPage'

function App() {
  // Track authentication state
  // isAuthenticated is stored in localStorage to persist across page refreshes
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('token') !== null
  })

  const handleLogin = (token: string) => {
    localStorage.setItem('token', token)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  return (
    <BrowserRouter>
      <div className="app">
        {/* Header with navigation and auth status */}
        <header style={{ background: 'white', padding: '15px 20px', borderBottom: '1px solid #eee' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>{'${config.name}'}</h1>
            <nav style={{ display: 'flex', gap: 20 }}>
              <a href="/" style={{ color: '#333', textDecoration: 'none' }}>Home</a>
              {isAuthenticated ? (
                <>
                  <a href="/create" style={{ color: '#333', textDecoration: 'none' }}>New Post</a>
                  <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>Logout</button>
                </>
              ) : (
                <>
                  <a href="/login" style={{ color: '#333', textDecoration: 'none' }}>Login</a>
                  <a href="/register" style={{ color: '#333', textDecoration: 'none' }}>Register</a>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Main content area */}
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route
              path="/create"
              element={isAuthenticated ? <CreatePostPage /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
`;

  fs.writeFileSync(path.join(srcDir, 'App.tsx'), AppTsx);

  // API client
  const apiClient = `/**
 * API Client - Axios instance with interceptors
 *
 * This configures the HTTP client for making API requests.
 * Axios interceptors automatically add the JWT token to all requests.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`
  }
  return config
})

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
`;

  fs.writeFileSync(path.join(srcDir, 'api', 'client.ts'), apiClient);

  // pages
  const HomePageTsx = `/**
 * Home Page - List all blog posts
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

interface Post {
  id: number
  title: string
  content: string
  author_id: number
  created_at: string
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/posts')
      .then((res) => {
        setPosts(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch posts:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Recent Posts</h2>
      <div style={{ display: 'grid', gap: 20 }}>
        {posts.map((post) => (
          <div key={post.id} style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>
              <Link to={\`/post/\${post.id}\`} style={{ color: '#007bff', textDecoration: 'none' }}>
                {post.title}
              </Link>
            </h3>
            <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
              Posted on {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
`;

  fs.writeFileSync(path.join(srcDir, 'pages', 'HomePage.tsx'), HomePageTsx);

  const LoginPageTsx = `/**
 * Login Page
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

interface LoginPageProps {
  onLogin: (token: string) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', {
        username,
        password,
      })
      onLogin(res.data.access_token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 20 }}>Login</h2>
      {error && <div style={{ background: '#fee', color: '#c00', padding: 10, borderRadius: 6, marginBottom: 15 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
            required
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          Login
        </button>
      </form>
    </div>
  )
}
`;

  fs.writeFileSync(path.join(srcDir, 'pages', 'LoginPage.tsx'), LoginPageTsx);

  const RegisterPageTsx = `/**
 * Register Page
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

interface RegisterPageProps {
  onLogin: (token: string) => void
}

export default function RegisterPage({ onLogin }: RegisterPageProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/auth/register', { username, email, password })
      // Auto-login after registration
      const res = await api.post('/auth/login', { username, password })
      onLogin(res.data.access_token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 20 }}>Register</h2>
      {error && <div style={{ background: '#fee', color: '#c00', padding: 10, borderRadius: 6, marginBottom: 15 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
            required
          />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
            required
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          Register
        </button>
      </form>
    </div>
  )
}
`;

  fs.writeFileSync(path.join(srcDir, 'pages', 'RegisterPage.tsx'), RegisterPageTsx);

  const PostPageTsx = `/**
 * Post Detail Page
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'

interface Post {
  id: number
  title: string
  content: string
  author_id: number
  created_at: string
}

export default function PostPage() {
  const { id } = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(\`/posts/\${id}\`)
      .then((res) => {
        setPost(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch post:', err)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div>Loading...</div>
  if (!post) return <div>Post not found</div>

  return (
    <div>
      <h1 style={{ marginBottom: 10 }}>{post.title}</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Posted on {new Date(post.created_at).toLocaleDateString()}
      </p>
      <div style={{ background: 'white', padding: 30, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <p style={{ lineHeight: 1.8 }}>{post.content}</p>
      </div>
    </div>
  )
}
`;

  fs.writeFileSync(path.join(srcDir, 'pages', 'PostPage.tsx'), PostPageTsx);

  const CreatePostPageTsx = `/**
 * Create Post Page
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function CreatePostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/posts', { title, content })
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create post')
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 20 }}>Create New Post</h2>
      {error && <div style={{ background: '#fee', color: '#c00', padding: 10, borderRadius: 6, marginBottom: 15 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
            required
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Content (Markdown supported)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Publish Post
        </button>
      </form>
    </div>
  )
}
`;

  fs.writeFileSync(path.join(srcDir, 'pages', 'CreatePostPage.tsx'), CreatePostPageTsx);
}