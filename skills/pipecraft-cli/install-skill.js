#!/usr/bin/env node

/**
 * Post-install script for @pipecraft/claude-skill
 * Copies SKILL.md to the appropriate skills directory based on install context
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAME = 'pipecraft';
const SKILL_FILE = 'SKILL.md';

// Detect if this is a global or local install
const isGlobal = process.env.npm_config_global === 'true' ||
                 process.argv.includes('-g') ||
                 process.argv.includes('--global');

// Target directories for different AI tools
const targets = {
  'claude-code': {
    global: path.join(os.homedir(), '.claude', 'skills', SKILL_NAME),
    local: path.join(process.cwd(), '.claude', 'skills', SKILL_NAME)
  },
  'cursor': {
    global: path.join(os.homedir(), '.cursor', 'skills', SKILL_NAME),
    local: path.join(process.cwd(), '.cursor', 'skills', SKILL_NAME)
  }
};

function copySkill(targetDir) {
  try {
    // Create directory if it doesn't exist
    fs.mkdirSync(targetDir, { recursive: true });

    // Copy SKILL.md
    const sourcePath = path.join(__dirname, SKILL_FILE);
    const destPath = path.join(targetDir, SKILL_FILE);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      return true;
    }
    return false;
  } catch (error) {
    // Silently fail - user may not have permissions
    return false;
  }
}

function main() {
  const installed = [];

  for (const [tool, paths] of Object.entries(targets)) {
    const targetDir = isGlobal ? paths.global : paths.local;
    if (copySkill(targetDir)) {
      installed.push(`${tool}: ${targetDir}`);
    }
  }

  if (installed.length > 0) {
    console.log(`\n✅ Pipecraft skill installed for:`);
    installed.forEach(loc => console.log(`   ${loc}`));
    console.log(`\nUse /pipecraft in Claude Code or ask about Pipecraft CI/CD setup.\n`);
  }
}

main();
