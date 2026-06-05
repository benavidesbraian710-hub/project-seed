#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initProject } from './commands/init.js';

const program = new Command();

program
  .name('project-seed')
  .description('Generate complete real projects with teaching CLAUDE.md for beginners')
  .version('1.0.0');

program
  .command('init')
  .description('Create a new project with complete structure and teaching documentation')
  .argument('<name>', 'Project name (will create directory)')
  .option('-t, --template <type>', 'Project template (blog, todo-api, portfolio)', 'blog')
  .option('-f, --force', 'Overwrite existing directory')
  .option('-y, --yes', 'Skip interactive prompts and use defaults')
  .action(async (name, options) => {
    await initProject(name, options);
  });

program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log(`  ${chalk.green('$ project-seed init my-blog')}`);
  console.log(`  ${chalk.green('$ project-seed init my-api --template todo-api')}`);
  console.log(`  ${chalk.green('$ project-seed init my-site --force')}`);
});

program.parse();