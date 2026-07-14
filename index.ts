#!/usr/bin/env node
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';

interface ClaudeSettings {
  env?: Record<string, string>;
  [key: string]: unknown;
}

const LOCAL = resolve('.claude', 'settings.json');

function expandTilde(p: string): string {
  if (p === '~') return homedir();
  if (p.startsWith('~/')) return join(homedir(), p.slice(2));
  return p;
}

function readJSON(file: string): ClaudeSettings {
  let raw: string;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') throw new Error(`arquivo não encontrado: ${file}`);
    throw e;
  }
  try {
    return JSON.parse(raw) as ClaudeSettings;
  } catch (e) {
    throw new Error(`JSON inválido em ${file}: ${(e as Error).message}`);
  }
}

function isEnv(v: unknown): v is Record<string, string> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function detectIndent(raw: string): string {
  const m = raw.match(/^[ \t]+(?=\S)/m);
  return m ? m[0] : '  ';
}

function list(): void {
  if (!existsSync(LOCAL)) { console.log('env vazio'); return; }
  const raw = readFileSync(LOCAL, 'utf8');
  let data: ClaudeSettings;
  try { data = JSON.parse(raw) as ClaudeSettings; } catch { console.log('env vazio'); return; }
  if (!isEnv(data.env)) { console.log('env vazio'); return; }
  for (const [k, v] of Object.entries(data.env)) console.log(`${k} = ${v}`);
}

function apply(srcPath: string): void {
  const data = readJSON(srcPath);
  if (!isEnv(data.env))
    throw new Error(`arquivo não contém 'env': ${srcPath}`);

  let local: ClaudeSettings = {};
  let indent = '  ';
  if (existsSync(LOCAL)) {
    const raw = readFileSync(LOCAL, 'utf8');
    try { local = JSON.parse(raw) as ClaudeSettings; } catch { local = {}; }
    indent = detectIndent(raw);
  } else {
    mkdirSync(dirname(LOCAL), { recursive: true });
  }

  // env vazio da origem => env vazio no destino (substituição integral)
  local.env = data.env;
  const tmp = `${LOCAL}.tmp`;
  writeFileSync(tmp, JSON.stringify(local, null, indent) + '\n');
  renameSync(tmp, LOCAL);

  const count = Object.keys(data.env).length;
  console.log(count > 0
    ? `env aplicado de ${srcPath}: ${count} variáveis`
    : `env aplicado (vazio) de ${srcPath}`);
}

const HELP = `set-claude-env — copia o bloco env de um settings para o .claude/settings.json local

Uso:
  set-claude-env -f <arquivo>   aplica env do <arquivo> no settings local
  set-claude-env               lista as variáveis de env do settings local
  set-claude-env -h | --help   mostra esta ajuda

Nota: aplicar env exige reiniciar a sessão Claude Code.`;

const args = process.argv.slice(2);
let fileArg: string | null = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0); }
  else if (a === '-f') { fileArg = args[i + 1] ?? null; i++; }
  else { console.error(`flag desconhecida: ${a}\n\n${HELP}`); process.exit(1); }
}

if (fileArg) {
  try { apply(expandTilde(fileArg)); }
  catch (e) { console.error((e as Error).message); process.exit(1); }
} else {
  list();
}
