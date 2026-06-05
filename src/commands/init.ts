import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { collectProjectConfig, type ProjectConfig } from '../prompts/project.js';
import { logger } from '../utils/logger.js';
import { generateCLAUDEMd } from '../generators/claude-md.js';
import { generateBackend, generateFrontend } from '../generators/backend.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function initProject(name: string, options: any) {
  logger.step(`Creating project: ${chalk.bold(name)}`);

  // Validate project name
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    logger.error('Project name can only contain letters, numbers, hyphens, and underscores');
    process.exit(1);
  }

  // Check if directory exists
  const targetDir = path.join(process.cwd(), name);
  if (fs.existsSync(targetDir) && !options.force) {
    logger.error(`Directory "${name}" already exists. Use --force to overwrite.`);
    process.exit(1);
  }

  // Collect configuration from user (or use defaults if --yes)
  let config: ProjectConfig;
  if (options.yes) {
    config = {
      name,
      template: options.template || 'blog',
      includeBackend: true,
      includeFrontend: true,
      features: ['auth', 'database', 'api', 'frontend'],
    };
    logger.info(`Using defaults: template=${config.template}, backend=${config.includeBackend}, frontend=${config.includeFrontend}`);
  } else {
    config = await collectProjectConfig(name);
  }

  // Create project directory
  logger.info('Creating project structure...');
  fs.mkdirSync(targetDir, { recursive: true });

  // Generate based on template and selections
  if (config.includeBackend || config.template === 'todo-api') {
    logger.info('Generating backend...');
    await generateBackend(targetDir, config);
  }

  if (config.includeFrontend || config.template === 'portfolio') {
    logger.info('Generating frontend...');
    await generateFrontend(targetDir, config);
  }

  // Generate main CLAUDE.md
  logger.info('Generating teaching CLAUDE.md...');
  await generateCLAUDEMd(targetDir, config);

  // Generate README
  logger.info('Generating README...');
  await generateREADME(targetDir, config);

  logger.success(`Project "${name}" created successfully!`);
  console.log('');
  console.log(chalk.bold('Next steps:'));
  console.log(`  ${chalk.green(`cd ${name}`)}`);
  if (config.includeBackend) {
    console.log(`  ${chalk.cyan('cd backend && pip install -r requirements.txt && uvicorn src.main:app --reload')}`);
  }
  if (config.includeFrontend) {
    console.log(`  ${chalk.cyan('cd frontend && npm install && npm run dev')}`);
  }
  console.log('');
  console.log(`  ${chalk.yellow('Open CLAUDE.md in your editor to start learning!')}`);
}

async function generateREADME(targetDir: string, config: ProjectConfig) {
  const backendSetup = config.includeBackend ? `
### Backend Setup
\`\`\`bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload
\`\`\`
API will be available at http://localhost:8000
API docs at http://localhost:8000/docs
` : '';

  const frontendSetup = config.includeFrontend ? `
### Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
App will be available at http://localhost:5173
` : '';

  const backendLine = config.includeBackend ? '- `backend/` — Python FastAPI backend' : '';
  const frontendLine = config.includeFrontend ? '- `frontend/` — React + Vite frontend' : '';

  const readme = `# ${config.name}

A project created with Project Seed.

## Quick Start
${backendSetup}${frontendSetup}
## Project Structure

- \`CLAUDE.md\` — Teaching guide for this project (READ THIS!)
${backendLine}
${frontendLine}
`;

  fs.writeFileSync(path.join(targetDir, 'README.md'), readme);
}