// node scripts/set-api.mjs https://my-api.onrender.com   -> points the /api rewrite in vercel.json at your backend
import { readFileSync, writeFileSync } from 'node:fs';
const url = process.argv[2]?.replace(/\/+$/, '');
if (!url || !/^https:\/\/[\w.-]+(:\d+)?$/.test(url)) { console.error('Usage: npm run set-api -- https://your-api-host'); process.exit(1); }
const file = new URL('../vercel.json', import.meta.url);
const cfg = JSON.parse(readFileSync(file, 'utf8'));
cfg.rewrites[0].destination = `${url}/api/:path*`;
writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
console.log(`vercel.json: /api -> ${url}/api`);
