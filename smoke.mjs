import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.argv[2] ?? fileURLToPath(new URL('.', import.meta.url)));
const allowed = new Set(['.nojekyll', 'CNAME', 'README.md', 'index.html', 'og.png', 'smoke.mjs']);
const allowedRoot = new Set([...allowed, '.github']);
const ignoredLocal = new Set(['.git', '.gitignore', '.next', '.vinext', '.wrangler', '.openai', 'node_modules', 'app', 'public']);
const files = readdirSync(root).filter((name) => !ignoredLocal.has(name));

for (const name of files) {
  if (!allowedRoot.has(name)) {
    throw new Error(`Unexpected public artifact: ${basename(name)}`);
  }
}

for (const name of allowed) {
  if (!existsSync(resolve(root, name))) throw new Error(`Missing public artifact: ${name}`);
  if (!statSync(resolve(root, name)).isFile()) throw new Error(`Public artifact is not a file: ${name}`);
}

const pagesWorkflow = resolve(root, '.github', 'workflows', 'pages.yml');
if (!existsSync(pagesWorkflow) || !statSync(pagesWorkflow).isFile()) throw new Error('Missing Pages workflow');

const html = readFileSync(resolve(root, 'index.html'), 'utf8');
for (const value of ['Codicent Audit AI', 'Varje krav. Varje avvikelse. Samma spårbara flöde.', 'Från enstaka audits till en löpande dialog.', 'Nästa audit börjar där den förra slutade.', 'Tre roller. En gemensam historik.', 'mailto:info@codicent.com']) {
  if (!html.includes(value)) throw new Error(`Missing required site content: ${value}`);
}

for (const pattern of [/Volvo Penta/i, /customer[_-]?id/i, /localhost:\d+/i, /@volvo/i, /M3_PASSWORD/i, /<script\b/i]) {
  if (pattern.test(html)) throw new Error(`Public site contains forbidden detail: ${pattern}`);
}

if ((html.match(/<h1\b/g) ?? []).length !== 1) throw new Error('Public site must contain exactly one h1');
if (readFileSync(resolve(root, 'CNAME'), 'utf8').trim() !== 'audit.codicent.ai') throw new Error('Unexpected CNAME');

console.log('Audit public-site checks passed');
