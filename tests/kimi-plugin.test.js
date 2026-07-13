#!/usr/bin/env node
// Smoke test for the Kimi Code CLI adapter: verify the manifest, commands, and
// skill wiring are present and consistent. Kimi loads the plugin from
// .kimi-plugin/plugin.json, registers commands from .kimi/commands/*.md, and
// keeps the ruleset active via sessionStart.skill.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const MANIFEST = '.kimi-plugin/plugin.json';
const COMMANDS_DIR = '.kimi/commands';
const PINNED_SEMVER = /^\d+\.\d+\.\d+$/;

function readJSON(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

test('kimi plugin manifest exists and has required fields', () => {
  const manifest = readJSON(MANIFEST);
  assert.equal(manifest.name, 'ponytail');
  assert.match(manifest.version, PINNED_SEMVER);
  assert.ok(manifest.description, 'manifest must declare a description');
  assert.ok(manifest.interface, 'manifest must declare an interface');
  assert.equal(manifest.interface.displayName, 'Ponytail');
  assert.equal(manifest.license, 'MIT');
  assert.equal(manifest.skills, './skills/');
  assert.equal(manifest.commands, `./${COMMANDS_DIR}/`);
  assert.equal(manifest.sessionStart.skill, 'ponytail');
});

test('kimi plugin version matches package.json', () => {
  const manifest = readJSON(MANIFEST);
  const packageJson = readJSON('package.json');
  assert.equal(manifest.version, packageJson.version);
});

test('kimi sessionStart skill exists and carries the ruleset', () => {
  const manifest = readJSON(MANIFEST);
  const skillPath = path.join(root, manifest.skills, manifest.sessionStart.skill, 'SKILL.md');
  assert.ok(fs.existsSync(skillPath), `missing skill: ${skillPath}`);
  const skill = read(path.join(manifest.skills, manifest.sessionStart.skill, 'SKILL.md'));
  assert.ok(skill.includes('lazy senior developer'), 'skill must contain the ponytail identity');
  assert.ok(skill.includes('Ponytail'), 'skill must name Ponytail');
});

test('kimi command files exist for every advertised command', () => {
  const manifest = readJSON(MANIFEST);
  const commandsDir = path.join(root, COMMANDS_DIR);
  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.md'));
  assert.ok(files.length > 0, 'no command files found');

  for (const file of files) {
    const content = read(path.join(COMMANDS_DIR, file));
    assert.match(content, /^---\r?\n[\s\S]*?\r?\n---/, `${file} must have frontmatter`);
  }
});

test('kimi command frontmatter has descriptions', () => {
  const commandsDir = path.join(root, COMMANDS_DIR);
  for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith('.md'))) {
    const content = read(path.join(COMMANDS_DIR, file));
    assert.match(content, /^---\r?\n[\s\S]*?description:\s*.+\r?\n[\s\S]*?---/, `${file} must have a description`);
  }
});

test('kimi plugin manifest author matches package.json', () => {
  const manifest = readJSON(MANIFEST);
  const packageJson = readJSON('package.json');
  assert.equal(manifest.author.name, packageJson.author.name);
});
