# Project Seed

**CLI tool to scaffold real projects with teaching CLAUDE.md for beginners**

[Homepage](https://github.com/benavidesbraian710-hub/project-seed) · [Report Bug](https://github.com/benavidesbraian710-hub/project-seed/issues)

---

## What is Project Seed?

Project Seed generates complete, production-ready project structures for beginners learning to develop with Claude Code.

Unlike basic project templates, every generated project includes:

- **Working code** — Not a skeleton, but real features (auth, CRUD, API)
- **Teaching CLAUDE.md** — Explains WHY each file exists, not just what it does
- **Step-by-step guides** — How to add new features, debug, deploy

```
用户: project-seed init my-blog
生成: my-blog/
  ├── CLAUDE.md           ← 教学指南（251行，解释每个文件）
  ├── backend/            ← Python FastAPI（带详细注释）
  ├── frontend/           ← React + Vite + TypeScript
  └── README.md           ← 快速启动说明
```

## Quick Start

### 安装

```bash
# Clone 后本地安装
git clone https://github.com/benavidesbraian710-hub/project-seed.git
cd project-seed
npm install
npm run build

# 或者链接到全局
npm link
```

### 创建项目

```bash
# 交互模式（问答）
project-seed init my-project

# 跳过问答，使用默认配置
project-seed init my-project --yes

# 指定模板
project-seed init my-api --template todo-api
project-seed init my-site --template portfolio
```

## Templates

| Template | Description | Tech Stack |
|----------|-------------|------------|
| `blog` | 用户注册登录 + 文章发布（默认） | FastAPI + React + SQLite |
| `todo-api` | REST API + JWT 认证 | FastAPI + SQLite |
| `portfolio` | 静态网站 | React + Vite |

## What's Included

Each generated project comes with:

### Backend (Python FastAPI)

- JWT 用户认证（注册/登录）
- SQLAlchemy ORM + SQLite
- RESTful API 端点
- Pydantic 数据验证
- 单元测试示例
- 详细代码注释

### Frontend (React)

- React 18 + TypeScript + Vite
- React Router 路由
- Axios API 客户端（含 auth interceptor）
- 完整页面：登录、注册、文章列表、文章详情、创建

### Teaching CLAUDE.md

```
CLAUDE.md 包含：
1. 项目结构说明（每个文件是干嘛的）
2. 运行指南（怎么启动 dev server）
3. 学习路径（先看哪个文件，再看哪个）
4. 添加新功能的步骤（以 comments 为例）
5. 常见任务指南（添加环境变量、数据库字段等）
6. Claude Code 协作技巧（怎么提问更有效）
7. 故障排查
```

## Project Structure

```
project-seed/
├── src/
│   ├── index.ts              # CLI 入口，Commander.js
│   ├── commands/
│   │   └── init.ts           # init 命令逻辑
│   ├── prompts/
│   │   └── project.ts        # Inquirer.js 交互式问卷
│   ├── generators/
│   │   ├── backend.ts         # 生成 Python FastAPI 后端
│   │   ├── frontend.ts        # 生成 React 前端
│   │   └── claude-md.ts      # 生成教学 CLAUDE.md
│   └── utils/
│       └── logger.ts         # 彩色日志输出
├── package.json
└── tsconfig.json
```

## Development

```bash
# 构建
npm run build

# 开发模式（watch）
npm run dev

# 本地测试
node dist/index.js init test-project --yes

# 查看帮助
node dist/index.js --help
```

## Generated Project Example

生成的 `CLAUDE.md` 大约 250 行，包含：

- 项目概览和功能列表
- 完整目录结构图
- 运行命令（backend + frontend）
- 学习路径（5 个步骤）
- 添加新 API 端点的代码示例
- 添加新前端页面的步骤
- Claude Code 提问技巧
- 故障排查指南

## Why Project Seed?

大多数项目模板只给你文件结构，不解释为什么。

新手最大问题：**不知道一个真实项目长什么样，不知道怎么添加功能**。

Project Seed 通过：
1. 生成完整可运行的项目（不是骨架）
2. 在每个关键文件里写注释解释 WHY
3. 提供教学 CLAUDE.md，手把手教你下一步做什么

## License

MIT

---

_Generated with Claude Code_