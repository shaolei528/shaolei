import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pruneVerifiedBuildOutputs } from '../cloudflare/release-output-prune.mjs';

const manifestName = '.abyssal-build-manifest.json';
const assetsIgnoreName = '.assetsignore';
const schema = 2;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const root = await mkdtemp(path.join(os.tmpdir(), 'abyssal-build-prune-'));

async function addOutput(name, files, { damage = false, unlisted = false, manifestSchema = schema } = {}) {
  const folder = path.join(root, name);
  await mkdir(folder, { recursive: true });
  const fileHashes = {};
  for (const [relative, content] of Object.entries(files)) {
    const bytes = Buffer.from(content);
    const target = path.join(folder, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    fileHashes[relative.replaceAll(path.sep, '/')] = hash(bytes);
  }
  await writeFile(path.join(folder, assetsIgnoreName), `${manifestName}\n`);
  await writeFile(path.join(folder, manifestName), `${JSON.stringify({ schema: manifestSchema, files: fileHashes }, null, 2)}\n`);
  if (damage) await writeFile(path.join(folder, Object.keys(files)[0]), 'edited outside builder');
  if (unlisted) await writeFile(path.join(folder, 'keep-this.txt'), 'not in manifest');
  return folder;
}

try {
  const activeName = '.cloudflare-site-123456abcdef';
  const active = await addOutput(activeName, { 'index.html': 'active' });
  const old = await addOutput('.cloudflare-site-aaaaaaaaaaaa', { 'nested/game.js': 'generated' }, { manifestSchema: 1 });
  const modified = await addOutput('.cloudflare-site-bbbbbbbbbbbb', { 'index.html': 'edited' }, { damage: true });
  const extraFile = await addOutput('.cloudflare-site-cccccccccccc', { 'index.html': 'generated' }, { unlisted: true });
  const legacy = path.join(root, '.cloudflare-site');
  await mkdir(legacy);
  await writeFile(path.join(legacy, 'user-file.txt'), 'preserve');
  const sibling = path.join(path.dirname(root), `${path.basename(root)}-outside`);
  await mkdir(sibling);
  await writeFile(path.join(sibling, 'outside-file.txt'), 'preserve');

  const result = await pruneVerifiedBuildOutputs({ root, activeName, manifestName, assetsIgnoreName, schema, supportedSchemas: [1, schema] });

  assert.deepEqual(result, { removed: 1, preserved: 3 });
  await readFile(path.join(active, 'index.html'));
  await assert.rejects(readFile(path.join(old, 'nested/game.js')));
  await readFile(path.join(modified, 'index.html'));
  await readFile(path.join(extraFile, 'keep-this.txt'));
  await readFile(path.join(legacy, 'user-file.txt'));
  await readFile(path.join(sibling, 'outside-file.txt'));
  console.log('PASS removes only verified stale packages; preserves active, modified, unlisted, and legacy folders');
} finally {
  await rm(root, { recursive: true, force: true });
  await rm(path.join(path.dirname(root), `${path.basename(root)}-outside`), { recursive: true, force: true });
}
