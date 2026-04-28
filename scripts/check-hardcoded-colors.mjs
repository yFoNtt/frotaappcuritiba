#!/usr/bin/env node
/**
 * Falha o CI se algum arquivo em src/ usar classes Tailwind de cor "hardcoded"
 * (ex.: text-green-600, bg-yellow-500, border-red-300).
 *
 * Status colors devem usar tokens semânticos:
 *   text-success / warning / destructive / info
 *   bg-success-soft text-success-soft-foreground (e variantes)
 *
 * Allowlist:
 *   - src/components/ui/toast.tsx (variante interna do shadcn — intocável)
 *   - src/test/**                  (testes podem inspecionar classes literais)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const ALLOWLIST = new Set([
  'src/components/ui/toast.tsx',
]);
const ALLOW_DIR_PREFIX = ['src/test/'];

const COLORS = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
];
const PROPS = ['text', 'bg', 'border', 'from', 'to', 'via', 'ring', 'placeholder', 'divide', 'fill', 'stroke', 'outline'];
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const PATTERN = new RegExp(
  `\\b(?:${PROPS.join('|')})-(?:${COLORS.join('|')})-(?:${SHADES.join('|')})\\b`,
  'g'
);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (/\.(tsx?|css)$/.test(entry)) {
      yield full;
    }
  }
}

const violations = [];

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  if (ALLOWLIST.has(rel)) continue;
  if (ALLOW_DIR_PREFIX.some((p) => rel.startsWith(p))) continue;

  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const matches = line.match(PATTERN);
    if (matches) {
      for (const m of matches) {
        violations.push({ file: rel, line: idx + 1, match: m, snippet: line.trim() });
      }
    }
  });
}

if (violations.length === 0) {
  console.log('✅ No hardcoded Tailwind color classes found in src/.');
  process.exit(0);
}

console.error(`❌ Found ${violations.length} hardcoded Tailwind color class(es):\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  →  ${v.match}`);
  console.error(`    ${v.snippet}\n`);
}
console.error(
  'Use semantic tokens instead: text-success / warning / destructive / info\n' +
  'or bg-{token}-soft + text-{token}-soft-foreground for badges.\n' +
  'See mem://style/semantic-status-tokens.\n' +
  'If a literal color is truly required, add the file to the ALLOWLIST in scripts/check-hardcoded-colors.mjs.'
);
process.exit(1);
