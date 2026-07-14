import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const CLI = resolve('index.ts');
const tmp = mkdtempSync(join(tmpdir(), 'set-claude-env-'));
let pass = 0;

function run(args, cwd = tmp) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' });
}

try {
  // 1. apply cria .claude + settings.json
  const origem1 = join(tmp, 'origem1.json');
  writeFileSync(origem1, JSON.stringify({ env: { FOO: 'bar', BAZ: 'qux' } }));
  let r = run(['-f', origem1]);
  assert.equal(r.status, 0, r.stderr);
  const local1 = join(tmp, '.claude', 'settings.json');
  assert.ok(existsSync(local1), 'settings local não criado');
  assert.deepEqual(JSON.parse(readFileSync(local1, 'utf8')).env, { FOO: 'bar', BAZ: 'qux' });
  pass++;

  // 2. apply preserva outras chaves e substitui env integral
  const tmp2 = mkdtempSync(join(tmpdir(), 'set-claude-env-2-'));
  mkdirSync(join(tmp2, '.claude'), { recursive: true });
  writeFileSync(join(tmp2, '.claude', 'settings.json'),
    JSON.stringify({ env: { OLD: 'x' }, permissions: { allow: ['npm'] } }, null, 4));
  const origem2 = join(tmp2, 'origem2.json');
  writeFileSync(origem2, JSON.stringify({ env: { NEW: 'y' } }));
  r = run(['-f', origem2], tmp2);
  assert.equal(r.status, 0, r.stderr);
  const out2 = JSON.parse(readFileSync(join(tmp2, '.claude', 'settings.json'), 'utf8'));
  assert.deepEqual(out2.env, { NEW: 'y' });
  assert.deepEqual(out2.permissions, { allow: ['npm'] });
  // indent preservada (4 espaços)
  assert.ok(readFileSync(join(tmp2, '.claude', 'settings.json'), 'utf8').includes('    "env"'));
  pass++;

  // 3. list mostra chave = valor
  r = run([]);
  assert.ok(r.stdout.includes('FOO = bar'), r.stdout);
  pass++;

  // 4. list sem local => env vazio
  const tmp3 = mkdtempSync(join(tmpdir(), 'set-claude-env-3-'));
  r = run([], tmp3);
  assert.equal(r.stdout.trim(), 'env vazio');
  pass++;

  // 5. env vazio na origem => env vazio no destino (substituição integral)
  const tmp5 = mkdtempSync(join(tmpdir(), 'set-claude-env-5-'));
  mkdirSync(join(tmp5, '.claude'), { recursive: true });
  writeFileSync(join(tmp5, '.claude', 'settings.json'),
    JSON.stringify({ env: { OLD: 'x' }, permissions: { allow: ['npm'] } }, null, 2));
  const origem5 = join(tmp5, 'origem5.json');
  writeFileSync(origem5, JSON.stringify({ env: {} }));
  r = run(['-f', origem5], tmp5);
  assert.equal(r.status, 0, r.stderr);
  const out5 = JSON.parse(readFileSync(join(tmp5, '.claude', 'settings.json'), 'utf8'));
  assert.deepEqual(out5.env, {});
  assert.deepEqual(out5.permissions, { allow: ['npm'] });
  pass++;

  // 6. origem sem env => erro e sai != 0
  const origem3 = join(tmp, 'origem3.json');
  writeFileSync(origem3, JSON.stringify({ other: 1 }));
  r = run(['-f', origem3]);
  assert.notEqual(r.status, 0);
  assert.ok(/não contém 'env'/.test(r.stderr), r.stderr);
  pass++;

  // 7. origem inexistente => mensagem distinta
  r = run(['-f', '/nope/missing.json']);
  assert.notEqual(r.status, 0);
  assert.ok(/não encontrado/.test(r.stderr), r.stderr);
  pass++;

  // 8. expansão de ~
  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) {
    const origemHome = join(home, '.set-claude-env-test-origem.json');
    writeFileSync(origemHome, JSON.stringify({ env: { HOME_T: '1' } }));
    const tmp4 = mkdtempSync(join(tmpdir(), 'set-claude-env-4-'));
    r = run(['-f', '~/.set-claude-env-test-origem.json'], tmp4);
    assert.equal(r.status, 0, r.stderr);
    rmSync(origemHome, { force: true });
    pass++;
  }

  console.log(`ok (${pass} checks)`);
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
