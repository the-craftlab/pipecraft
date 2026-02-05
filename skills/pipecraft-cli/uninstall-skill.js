#!/usr/bin/env node

/**
 * Pre-uninstall script for @pipecraft/claude-skill
 * Removes the skill from AI tool directories
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAME = 'pipecraft';

const isGlobal = process.env.npm_config_global === 'true' ||
                 process.argv.includes('-g') ||
                 process.argv.includes('--global');

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

function removeSkill(targetDir) {
  try {
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

function main() {
  const removed = [];

  for (const [tool, paths] of Object.entries(targets)) {
    const targetDir = isGlobal ? paths.global : paths.local;
    if (removeSkill(targetDir)) {
      removed.push(`${tool}: ${targetDir}`);
    }
  }

  if (removed.length > 0) {
    console.log(`\n🗑️  Pipecraft skill removed from:`);
    removed.forEach(loc => console.log(`   ${loc}`));
    console.log('');
  }
}

main();
