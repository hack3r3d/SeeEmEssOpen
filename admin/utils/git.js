import { execSync } from 'child_process';
import { getCmsRoot, getBranchWords } from '../config.js';

export function randomWord() {
  const words = getBranchWords();
  return words[Math.floor(Math.random() * words.length)];
}

export function runGit(cmd, cwd = getCmsRoot()) {
  console.log('Running:', cmd);
  return execSync(cmd, { cwd, encoding: 'utf-8' });
}

export function generateBranchName() {
  return `publish-${randomWord()}-${randomWord()}-${Date.now()}`;
}
