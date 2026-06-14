# geminiStudy single-file deploy

Base44 backend functions **cannot import sibling local files** (`./aiNormalize.ts`, `./aiDebug.ts`).
The deployed entry point is **`entry.ts` only** (see `function.jsonc`).

## After editing helpers

1. Edit `aiNormalize.ts` and/or `aiDebug.ts` (easier to read).
2. Re-merge into `entry.ts`:

```bash
cd base44/functions/geminiStudy
node -e "
const fs=require('fs');
const strip=s=>s.replace(/^export type /gm,'type ').replace(/^export const /gm,'const ').replace(/^export function /gm,'function ').replace(/^export /gm,'');
const normalize=strip(fs.readFileSync('aiNormalize.ts','utf8'));
const debug=strip(fs.readFileSync('aiDebug.ts','utf8'));
let entry=fs.readFileSync('entry.ts','utf8');
const start=entry.indexOf('// Inlined helpers');
const end=entry.indexOf('const MODEL =');
const head=entry.slice(0,entry.indexOf('import { z }'));
const tail=entry.slice(end);
fs.writeFileSync('entry.ts', head + '// Inlined helpers — Base44 functions cannot import sibling local files.\\n\\n' + normalize + '\\n\\n' + debug + '\\n\\n' + tail);
"
```

3. Remove duplicate `import { z }` if the merge script re-inserted one.
4. Publish on Base44.

Verify live deploy: Network → `geminiStudy` response includes `"_meta": { "model": "gemma-4-31b-it", "build": "inline-gemma-v1" }`.
