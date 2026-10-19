import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pruneVerifiedBuildOutputs } from './release-output-prune.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestName = '.abyssal-build-manifest.json';
const assetsIgnoreName = '.assetsignore';
const releaseFormatVersion = 2;
const fixedFiles = [
  'index.html',
  'prototypes/successor-3-4/live-candidate.html',
  'prototypes/successor-3-4/live-candidate.js',
  'prototypes/successor-3-4/camera-adapter.js',
  'modules/render/graybox-scene-painter.js',
  'modules/interaction/resource-work.js',
  'prototypes/successor-3-4/successor-renderer.js',
  'modules/presentation/gameplay-particles-v1.js',
  'data/presentation/gameplay-particles-v1.json',
  'data/crafting/recipes-v1.json',
  'data/loot/shared-chest-v1.json',
  'data/loot/creature-rewards-v1.json',
  'data/world/boss-encounters-v1.json',
  'data/world/water-bodies-v1.json',
  'data/farming/crops-v1.json',
  'data/farming/livestock-v1.json',
  'data/fishing/fish-v1.json',
  'data/cooking/recipes-v1.json',
  'data/pets/companions-v1.json',
  'data/social/npc-relationships-v1.json',
  'data/building/structures-v1.json',
  'modules/render/defense-structure-render-v1.js',
  'modules/ui/route-guidance-v1.js',
  'survival-v21.html',
  'ui-shell.html',
  'survival-config.js',
  'assets/player_sheet.png',
  'assets/monster_sheet.png',
  'assets/camp_props.png',
  'assets/resource_sheet.png',
  'assets/art-v21/terrain-v21.png',
];

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function safePath(base, relative) {
  const target = path.resolve(base, relative);
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error(`Unsafe release path: ${relative}`);
  }
  return target;
}

async function listFiles(folder, prefix = '') {
  const found = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not allowed in release output: ${relative}`);
    if (entry.isDirectory()) found.push(...await listFiles(path.join(folder, entry.name), relative));
    else if (entry.isFile()) found.push(relative);
    else throw new Error(`Unsupported release output entry: ${relative}`);
  }
  return found;
}

const entryHtml = await readFile(path.join(root, 'survival-v21.html'), 'utf8');
const moduleList = entryHtml.match(/const files=(\[[\s\S]*?\]);for\(const name of files\)/);
if (!moduleList) throw new Error('Could not find the V21 module list; release packaging stopped.');
const moduleFiles = [...moduleList[1].matchAll(/'([^']+\.js)'/g)].map((match) => match[1]);
if (moduleFiles.length < 30) throw new Error(`Unexpectedly short V21 module list (${moduleFiles.length}); release packaging stopped.`);

const sourceFiles = [...new Set([...fixedFiles, ...moduleFiles])].sort();
const sourceHashes = {};
const releaseBytesByFile = new Map();
for (const relative of sourceFiles) {
  let bytes = await readFile(safePath(root, relative));
  if (relative === 'index.html') {
    const html = bytes.toString('utf8');
    const candidate = './prototypes/successor-3-4/live-candidate.html';
    if (!html.includes('<head>') || !html.includes('</html>')) {
      throw new Error('Root entry source shape changed; 3/4-only release entry stopped.');
    }
    bytes = Buffer.from(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${candidate}"><title>ABYSSAL WAKE · 深渊苏醒</title></head><body><p>正在进入《深渊苏醒》3/4 版本… <a href="${candidate}">点击继续</a></p><script>window.location.replace('${candidate}');</script></body></html>`, 'utf8');
  } else if (relative === 'survival-v21.html') {
    const html = bytes.toString('utf8');
    const redirect = '<script>(function(){if(window.top===window.self){window.location.replace("./prototypes/successor-3-4/live-candidate.html");}})();</script>';
    if (html.split('<head>').length !== 2 || !html.includes('const files=[')) {
      throw new Error('V21 release source shape changed; 3/4 redirect packaging stopped.');
    }
    bytes = Buffer.from(html.replace('<head>', `<head>${redirect}`), 'utf8');
  } else if (relative === 'ui-shell.html') {
    const html = bytes.toString('utf8');
    const redirect = '<script>(function(){if(window.top===window.self){window.location.replace("./prototypes/successor-3-4/live-candidate.html");}})();</script>';
    if (html.split('<head>').length !== 2 || !html.includes('id="gate"')) {
      throw new Error('UI shell source shape changed; legacy-route redirect packaging stopped.');
    }
    // V21 fetches this file as an internal UI template. Redirect only direct browser visits.
    bytes = Buffer.from(html.replace('<head>', `<head>${redirect}`), 'utf8');
  }
  releaseBytesByFile.set(relative, bytes);
  sourceHashes[relative] = hash(bytes);
}
const sourceDigest = hash(JSON.stringify({ format: releaseFormatVersion, files: sourceHashes })).slice(0, 12);
const outputRelative = `.cloudflare-site-${sourceDigest}`;
const output = path.join(root, outputRelative);
const previousManifestPath = path.join(output, manifestName);
let previous = null;
let outputExists = true;
try {
  await stat(output);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  outputExists = false;
}

if (outputExists) {
  const existing = await listFiles(output);
  if (existing.length && !existing.includes(manifestName)) {
    throw new Error('Release output already contains files without this builder manifest; preserved it and stopped.');
  }
  try {
    previous = JSON.parse(await readFile(previousManifestPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Release manifest is invalid; preserved output and stopped: ${error.message}`);
  }
  if (previous && (previous.schema !== releaseFormatVersion || !previous.files || typeof previous.files !== 'object')) {
    throw new Error('Release manifest schema is unsupported; preserved output and stopped.');
  }
  if (previous) {
    const canonicalPrevious = `${JSON.stringify(previous, null, 2)}\n`;
    if (await readFile(previousManifestPath, 'utf8') !== canonicalPrevious) {
      throw new Error('Release manifest was modified outside this builder; preserved output and stopped.');
    }
    if (JSON.stringify(previous.files) !== JSON.stringify(sourceHashes)) {
      throw new Error('Content-addressed release folder does not match its sources; preserved output and stopped.');
    }
  }
  const expectedAssetsIgnore = `${manifestName}\n`;
  if (existing.includes(assetsIgnoreName) && await readFile(path.join(output, assetsIgnoreName), 'utf8') !== expectedAssetsIgnore) {
    throw new Error('Cloudflare assets ignore file was modified outside this builder; preserved output and stopped.');
  }
  const known = new Set([manifestName, assetsIgnoreName]);
  for (const relative of Object.keys(previous?.files || {})) known.add(relative);
  const extra = existing.filter((relative) => !known.has(relative));
  if (extra.length) throw new Error(`Unexpected files in release output; preserved them and stopped: ${extra.slice(0, 5).join(', ')}`);
  for (const [relative, oldHash] of Object.entries(previous?.files || {})) {
    if (!sourceFiles.includes(relative)) {
      throw new Error(`Release would need to remove a previously packaged file (${relative}); preserved output and stopped.`);
    }
    const bytes = await readFile(safePath(output, relative));
    if (hash(bytes) !== oldHash) throw new Error(`Packaged file changed outside this builder (${relative}); preserved it and stopped.`);
  }
}

await mkdir(output, { recursive: true });
const currentFiles = {};
let totalBytes = 0;
for (const relative of sourceFiles) {
  const bytesToPackage = releaseBytesByFile.get(relative);
  const destination = safePath(output, relative);
  let bytes;
  try {
    bytes = await readFile(destination);
    if (hash(bytes) !== hash(bytesToPackage)) {
      throw new Error(`Packaged file differs from its source (${relative}); preserved output and stopped.`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytesToPackage, { flag: 'wx' });
    bytes = bytesToPackage;
  }
  currentFiles[relative] = hash(bytes);
  totalBytes += bytes.byteLength;
}

const expectedAssetsIgnore = `${manifestName}\n`;
const assetsIgnorePath = path.join(output, assetsIgnoreName);
try {
  if (await readFile(assetsIgnorePath, 'utf8') !== expectedAssetsIgnore) {
    throw new Error('Cloudflare assets ignore file differs from expected generated content; preserved output and stopped.');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  await writeFile(assetsIgnorePath, expectedAssetsIgnore, { flag: 'wx' });
}
const expectedManifest = `${JSON.stringify({ schema: releaseFormatVersion, files: currentFiles }, null, 2)}\n`;
try {
  if (await readFile(previousManifestPath, 'utf8') !== expectedManifest) {
    throw new Error('Release manifest differs from expected generated content; preserved output and stopped.');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  await writeFile(previousManifestPath, expectedManifest, { flag: 'wx' });
}

const wranglerPath = path.join(root, 'wrangler.jsonc');
const wranglerText = await readFile(wranglerPath, 'utf8');
const dirPattern = /("directory"\s*:\s*")\.\/\.cloudflare-site(?:-[a-f0-9]{12})?("\s*)/g;
const dirMatches = [...wranglerText.matchAll(dirPattern)];
if (dirMatches.length !== 1) throw new Error('Wrangler assets.directory is not the expected generated release path; preserved config and stopped.');
const activeDirectory = dirMatches[0][0].match(/\.\/\.cloudflare-site(?:-[a-f0-9]{12})?/)[0];
if (activeDirectory !== `./${outputRelative}`) {
  const nextWranglerText = wranglerText.replace(dirPattern, `$1./${outputRelative}$2`);
  if (await readFile(wranglerPath, 'utf8') !== wranglerText) throw new Error('Wrangler config changed during packaging; preserved it and stopped.');
  await writeFile(wranglerPath, nextWranglerText);
}

const pruned = await pruneVerifiedBuildOutputs({
  root,
  activeName: outputRelative,
  manifestName,
  assetsIgnoreName,
  schema: releaseFormatVersion,
  supportedSchemas: [1, releaseFormatVersion],
});
console.log(`Prepared ${sourceFiles.length} public files (${(totalBytes / 1024 / 1024).toFixed(2)} MiB) in ${outputRelative}.`);
console.log(`Removed ${pruned.removed} verified stale build folder(s); preserved ${pruned.preserved} unverified folder(s).`);
console.log('Only the 3/4 candidate entry, its V21 runtime, and required gameplay art are included.');
