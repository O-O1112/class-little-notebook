import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const clientDir = join(projectRoot, 'dist', 'client');
const prerenderedDir = join(projectRoot, 'dist', 'server', 'prerendered-routes');
const outputDir = join(projectRoot, 'gh-pages');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(clientDir, outputDir, { recursive: true });
await cp(join(prerenderedDir, 'index.html'), join(outputDir, 'index.html'));
await cp(join(prerenderedDir, '404.html'), join(outputDir, '404.html'));
await writeFile(join(outputDir, '.nojekyll'), '');

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.mjs', '.txt']);
async function rewriteAssetPaths(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteAssetPaths(path);
      continue;
    }
    if (!textExtensions.has(extname(entry.name))) continue;
    const source = await readFile(path, 'utf8');
    const rewritten = source.replaceAll('/_next/', './_next/');
    if (rewritten !== source) await writeFile(path, rewritten);
  }
}

await rewriteAssetPaths(outputDir);
console.log(`GitHub Pages bundle created at ${outputDir}`);
