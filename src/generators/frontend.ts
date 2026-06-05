import fs from 'fs';
import path from 'path';
import type { ProjectConfig } from '../prompts/project.js';

// Frontend generation is handled in backend.ts for now
// This file exists for future expansion if needed
export async function generateFrontend(targetDir: string, config: ProjectConfig) {
  // Already generated in backend.ts
}