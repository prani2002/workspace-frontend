// Fast scope/security guard (no deps, ~50 ms). Used by `npm run guard`, hooks and CI.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const json = process.argv.includes('--json');
const idsFile = path.join(root, '.fde/scope-ids.json');
const allowed = new Set([...(existsSync(idsFile) ? JSON.parse(readFileSync(idsFile, 'utf8')).ids ?? [] : []), 'base', 'sample']);

const errors = [];
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) && !p.endsWith('.d.ts') && files.push(p);
  }
})(path.join(root, 'src'));

// 1) every route has a valid scope tag
const routesSrc = readFileSync(path.join(root, 'src/routes.tsx'), 'utf8');
const paths = [...routesSrc.matchAll(/\bpath:\s*'([^']+)'/g)].length;
const scopes = [...routesSrc.matchAll(/\bscope:\s*'([^']+)'/g)].map((m) => m[1]);
if (paths !== scopes.length) errors.push(`src/routes.tsx: ${paths} paths but ${scopes.length} scope tags (every route needs scope)`);
for (const s of scopes) if (!allowed.has(s)) errors.push(`src/routes.tsx: scope '${s}' is not in SCOPE.md (known: ${[...allowed].join(', ')})`);
const sample = scopes.filter((s) => s === 'sample').length;

// 2) security and API-handling rules
for (const file of files) {
  const rel = path.relative(root, file);
  const src = readFileSync(file, 'utf8');
  if (/\bfetch\(/.test(src) && !rel.endsWith('api/client.ts')) errors.push(`${rel}: call the API through src/api/client.ts, not fetch() directly`);
  if (/(local|session)Storage[^;\n]*(token|jwt|password)/i.test(src)) errors.push(`${rel}: never store tokens or passwords in web storage (sessions use httpOnly cookies)`);
  if (/dangerouslySetInnerHTML|\beval\(|new Function\(/.test(src) && !src.includes('fde-allow-unsafe')) errors.push(`${rel}: unsafe HTML/eval (add a justified "fde-allow-unsafe" comment only after review)`);
  if (/https?:\/\/(?!localhost|127\.0\.0\.1|www\.w3\.org)[\w.-]+\.[a-z]{2,}\/api/.test(src)) errors.push(`${rel}: hard-coded API host (use relative /api paths)`);
}

if (json) console.log(JSON.stringify({ errors, sample, routes: scopes.length }));
else if (errors.length) console.error(`SCOPE GUARD (frontend):\n- ${errors.join('\n- ')}`);
process.exit(errors.length ? 2 : 0);
