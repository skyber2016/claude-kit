#!/usr/bin/env node

/**
 * generate-plugin-contents.mjs
 * 
 * Auto-generates PLUGIN_CONTENTS.json with file inventory and SHA-256 hashes.
 * 
 * Usage:
 *   node scripts/generate-plugin-contents.mjs
 *   node scripts/generate-plugin-contents.mjs --dry-run   # Preview without writing
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

const EXCLUDE_PATTERNS = [
  /^\.git[\/\\]/,
  /^openspec[\/\\]changes[\/\\]/,
  /^openspec[\/\\]specs[\/\\]/,
  /^\.wiki[\/\\]/,
  /^node_modules[\/\\]/,
  /PLUGIN_CONTENTS\.json$/,
  /^srs-example\.md$/,
];

function shouldExclude(relPath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(relPath));
}

function walkDir(dir, baseDir = dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(baseDir, fullPath);
    
    if (shouldExclude(relPath)) continue;
    
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

function sha256(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

function countDirs(dir, prefix) {
  try {
    return readdirSync(join(dir, prefix), { withFileTypes: true })
      .filter(e => e.isDirectory()).length;
  } catch { return 0; }
}

function countFiles(dir, prefix, ext = '.md') {
  try {
    return readdirSync(join(dir, prefix), { withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith(ext)).length;
  } catch { return 0; }
}

// --- Main ---

const isDryRun = process.argv.includes('--dry-run');

console.log('🔍 Scanning plugin directory...');

const files = walkDir(ROOT)
  .map(f => ({
    path: f.relPath.split(sep).join('/'),
    sha256: sha256(f.fullPath),
  }))
  .sort((a, b) => a.path.localeCompare(b.path));

const counts = {
  skills: countDirs(ROOT, 'skills'),
  agents: countFiles(ROOT, 'agents'),
  rules: countFiles(ROOT, 'rules'),
  commands: countFiles(ROOT, 'commands'),
  memory: countFiles(ROOT, 'memory'),
};

const contents = {
  name: 'ag-kit',
  version: JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8')).version,
  runtime: 'claude-code',
  counts,
  files,
};

const output = JSON.stringify(contents, null, 2) + '\n';

if (isDryRun) {
  console.log('\n📋 Preview (--dry-run):');
  console.log(`   Version: ${contents.version}`);
  console.log(`   Files: ${files.length}`);
  console.log(`   Skills: ${counts.skills}, Agents: ${counts.agents}, Rules: ${counts.rules}, Commands: ${counts.commands}, Memory: ${counts.memory}`);
  console.log('\n   First 5 files:');
  files.slice(0, 5).forEach(f => console.log(`     ${f.path}`));
  console.log('   ...');
} else {
  const outPath = join(ROOT, 'PLUGIN_CONTENTS.json');
  writeFileSync(outPath, output, 'utf8');
  console.log(`✅ Generated: PLUGIN_CONTENTS.json`);
  console.log(`   Version: ${contents.version}`);
  console.log(`   Files: ${files.length}`);
  console.log(`   Skills: ${counts.skills}, Agents: ${counts.agents}, Rules: ${counts.rules}, Commands: ${counts.commands}, Memory: ${counts.memory}`);
}
