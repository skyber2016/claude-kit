#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const options = {root: process.cwd(), output: null};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--root') options.root = path.resolve(argv[++i]);
    else if (argv[i] === '--output') options.output = path.resolve(argv[++i]);
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  options.output ??= path.join(options.root, 'dist', 'claude-plugin');
  return options;
}

function copyTree(source, destination) {
  if (!fs.existsSync(source)) return 0;
  fs.cpSync(source, destination, {recursive: true});
  let count = 0;
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else count += 1;
    }
  };
  visit(source);
  return count;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function inventory(output) {
  const files = [];
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else files.push({path: path.relative(output, full).split(path.sep).join('/'), sha256: sha256(full)});
    }
  };
  visit(output);
  return files;
}

export function buildPlugin(root, output) {
  fs.rmSync(output, {recursive: true, force: true});
  fs.mkdirSync(output, {recursive: true});

  const version = fs.readFileSync(path.join(root, '.agents', 'VERSION'), 'utf8').trim();

  // Plugin manifest
  const template = JSON.parse(fs.readFileSync(path.join(root, '.agents', 'hooks', 'plugin', 'claude-extension.template.json'), 'utf8'));
  template.version = version;
  fs.writeFileSync(path.join(output, 'claude-extension.json'), `${JSON.stringify(template, null, 2)}\n`, 'utf8');

  // Plugin context file
  fs.copyFileSync(path.join(root, '.agents', 'hooks', 'plugin', 'CLAUDE_PLUGIN.md'), path.join(output, 'CLAUDE.md'));

  // Copy core content
  const counts = {
    skills: copyTree(path.join(root, '.agents', 'skills'), path.join(output, 'skills')),
    agents: copyTree(path.join(root, '.agents', 'agent'), path.join(output, 'agents')),
    rules: copyTree(path.join(root, '.claude', 'rules'), path.join(output, 'rules')),
    commands: copyTree(path.join(root, '.claude', 'commands'), path.join(output, 'commands')),
    memory: copyTree(path.join(root, '.agents', 'memory'), path.join(output, 'memory'))
  };

  // Copy hooks and config
  fs.mkdirSync(path.join(output, 'hooks'), {recursive: true});
  fs.copyFileSync(path.join(root, '.claude', 'settings.json'), path.join(output, 'settings.json'));
  fs.copyFileSync(path.join(root, '.agents', 'hooks', 'validate-tool-call.mjs'), path.join(output, 'hooks', 'validate-tool-call.mjs'));

  // Plugin hooks.json with portable ${CLAUDE_PLUGIN_ROOT} paths
  const hooksConfig = {
    hooks: [{
      matcher: 'Bash',
      hooks: [{
        type: 'command',
        command: "echo '$INPUT' | node ${CLAUDE_PLUGIN_ROOT}/hooks/validate-tool-call.mjs"
      }]
    }]
  };
  fs.writeFileSync(path.join(output, 'hooks', 'hooks.json'), `${JSON.stringify(hooksConfig, null, 2)}\n`, 'utf8');

  // .claude-plugin/plugin.json for Claude Code plugin discovery
  const pluginDir = path.join(output, '.claude-plugin');
  fs.mkdirSync(pluginDir, {recursive: true});
  const pluginMeta = {
    name: 'claude-kit',
    version,
    description: 'AI agent engineering kit for Claude Code with 20 specialist agents, 47 skills, 13 slash commands, orchestration, MCP guidance, and safety hooks.',
    author: {name: 'skyber2016', url: 'https://github.com/skyber2016'}
  };
  fs.writeFileSync(path.join(pluginDir, 'plugin.json'), `${JSON.stringify(pluginMeta, null, 2)}\n`, 'utf8');

  // .mcp.json for MCP server discovery
  const mcpConfig = JSON.parse(fs.readFileSync(path.join(root, '.agents', 'mcp_config.json'), 'utf8'));
  fs.writeFileSync(path.join(output, '.mcp.json'), `${JSON.stringify(mcpConfig, null, 2)}\n`, 'utf8');

  // Build SHA-256 content inventory
  const manifest = {
    name: 'ag-kit',
    version,
    runtime: 'claude-code',
    counts,
    files: inventory(output)
  };
  fs.writeFileSync(path.join(output, 'PLUGIN_CONTENTS.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

import url from 'node:url';

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const manifest = buildPlugin(options.root, options.output);
    console.log(`Built Claude Code plugin: ${options.output}`);
    console.log(JSON.stringify(manifest.counts));
  } catch (error) {
    console.error(`Plugin build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
