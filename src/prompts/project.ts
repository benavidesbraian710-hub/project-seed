import inquirer from 'inquirer';

export interface ProjectConfig {
  name: string;
  template: 'blog' | 'todo-api' | 'portfolio';
  includeBackend: boolean;
  includeFrontend: boolean;
  features: string[];
}

export async function collectProjectConfig(name: string): Promise<ProjectConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'What type of project do you want to create?',
      choices: [
        { name: '📝 Blog System — User auth, posts, comments (full-stack)', value: 'blog' },
        { name: '✅ Todo API — REST API with JWT auth (backend only)', value: 'todo-api' },
        { name: '🌐 Portfolio — React static site (frontend only)', value: 'portfolio' },
      ],
      default: 'blog',
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Which features do you want to include? (press Space to select)',
      choices: [
        { name: 'User Authentication (注册/登录/JWT)', value: 'auth', checked: true },
        { name: 'Database Integration (数据库)', value: 'database', checked: true },
        { name: 'API Endpoints (REST API)', value: 'api', checked: true },
        { name: 'Frontend Pages (前端页面)', value: 'frontend', checked: true },
        { name: 'Unit Tests (单元测试)', value: 'tests', checked: false },
        { name: 'Docker Support (Docker支持)', value: 'docker', checked: false },
      ],
      when: (answers: any) => answers.template === 'blog',
    },
    {
      type: 'confirm',
      name: 'includeBackend',
      message: 'Include backend (Python FastAPI)?',
      default: true,
      when: (answers: any) => answers.template === 'blog',
    },
    {
      type: 'confirm',
      name: 'includeFrontend',
      message: 'Include frontend (React + Vite)?',
      default: true,
      when: (answers: any) => answers.template === 'blog',
    },
    {
      type: 'confirm',
      name: 'includeBackend',
      message: 'Include backend (Python FastAPI)?',
      default: true,
      when: (answers: any) => answers.template === 'todo-api',
    },
  ]);

  return {
    name,
    template: answers.template,
    includeBackend: answers.includeBackend ?? true,
    includeFrontend: answers.includeFrontend ?? false,
    features: answers.features ?? ['auth', 'database', 'api'],
  };
}