import { readdir, readFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const outputName = /^\.cloudflare-site(?:-[a-f0-9]{12})?$/;

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function inside(base, relative) {
  const target = path.resolve(base, relative);
  const fromBase = path.relative(base, target);
  if (!fromBase || fromBase === '..' || fromBase.startsWith(`..${path.sep}`) || path.isAbsolute(fromBase)) {
    throw new Error(`Unsafe generated path: ${relative}`);
  }
  return target;
}

async function listTreeEntries(folder, prefix = '') {
  const found = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${relative}`);
    if (entry.isDirectory()) {
      found.push(`${relative}/`, ...await listTreeEntries(path.join(folder, entry.name), relative));
    } else if (entry.isFile()) {
      found.push(relative);
    } else {
      throw new Error(`Unexpected filesystem entry: ${relative}`);
    }
  }
  return found.sort();
}

async function isVerifiedGeneratedOutput(folder, { manifestName, assetsIgnoreName, supportedSchemas }) {
  try {
    const manifestPath = path.join(folder, manifestName);
    const manifestText = await readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestText);
    if (!supportedSchemas.includes(manifest?.schema) || !manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) {
      return false;
    }
    if (manifestText !== `${JSON.stringify(manifest, null, 2)}\n`) return false;

    const files = Object.keys(manifest.files);
    const expected = new Set([manifestName, assetsIgnoreName, ...files]);
    for (const relative of files) {
      if (typeof manifest.files[relative] !== 'string' || !/^[a-f0-9]{64}$/.test(manifest.files[relative])) return false;
      if (!relative || relative.includes('\\') || path.posix.normalize(relative) !== relative || relative.startsWith('/')) return false;
      let directory = path.posix.dirname(relative);
      while (directory !== '.') {
        expected.add(`${directory}/`);
        directory = path.posix.dirname(directory);
      }
    }

    const actualEntries = await listTreeEntries(folder);
    if (JSON.stringify(actualEntries) !== JSON.stringify([...expected].sort())) return false;
    if (await readFile(path.join(folder, assetsIgnoreName), 'utf8') !== `${manifestName}\n`) return false;

    for (const [relative, expectedHash] of Object.entries(manifest.files)) {
      const bytes = await readFile(inside(folder, relative));
      if (hash(bytes) !== expectedHash) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function pruneVerifiedBuildOutputs({ root, activeName, manifestName, assetsIgnoreName, schema, supportedSchemas = [schema] }) {
  const rootPath = path.resolve(root);
  const entries = await readdir(rootPath, { withFileTypes: true });
  let removed = 0;
  let preserved = 0;

  for (const entry of entries) {
    if (!entry.isDirectory() || !outputName.test(entry.name) || entry.name === activeName) continue;
    const target = inside(rootPath, entry.name);
    if (!await isVerifiedGeneratedOutput(target, { manifestName, assetsIgnoreName, supportedSchemas })) {
      preserved += 1;
      continue;
    }
    await rm(target, { recursive: true });
    removed += 1;
  }

  return { removed, preserved };
}
