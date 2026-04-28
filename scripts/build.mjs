import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { cpSync } from 'node:fs';

const root = process.cwd();
const outputDir = join(root, 'dist');
const copyTargets = ['api', 'assets', 'css', 'js', 'index.html'];

function minifyHtml(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function minifyJs(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'))
    .join('\n');
}

async function minifyFile(filePath) {
  const extension = extname(filePath);

  if (!['.css', '.html', '.js'].includes(extension)) {
    return;
  }

  const source = await readFile(filePath, 'utf8');
  const minified = extension === '.html'
    ? minifyHtml(source)
    : extension === '.css'
      ? minifyCss(source)
      : minifyJs(source);

  await writeFile(filePath, `${minified}\n`);
}

async function walk(directory) {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else {
      files.push(path);
    }
  }

  return files;
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const target of copyTargets) {
  const from = join(root, target);
  const to = join(outputDir, target);
  await mkdir(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

for (const file of await walk(outputDir)) {
  await minifyFile(file);
}

console.log(`Built ${relative(root, outputDir)} for production.`);
