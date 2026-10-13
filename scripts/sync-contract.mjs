// Copies the API contract from the sibling backend repo (workspace layout) so this repo stays self-contained in CI.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
const src = new URL('../../backend/openapi.yaml', import.meta.url);
if (!existsSync(src)) { console.error('../backend/openapi.yaml not found. Run this from the workspace layout, or copy the file into api/openapi.yaml by hand.'); process.exit(1); }
mkdirSync(new URL('../api/', import.meta.url), { recursive: true });
copyFileSync(src, new URL('../api/openapi.yaml', import.meta.url));
console.log('api/openapi.yaml updated from backend');
