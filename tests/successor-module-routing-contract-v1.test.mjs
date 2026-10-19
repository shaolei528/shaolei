import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mapPath=path.join(repoRoot,'docs','SUCCESSOR_MODULE_MAP.md');
const map=fs.readFileSync(mapPath,'utf8');

const ownerSection=map.split('## Canonical module owners')[1]?.split('### Cross-module transactions')[0];
assert.ok(ownerSection,'canonical owner table must exist');
const canonicalOwners=Array.from(ownerSection.matchAll(/^\|\s*([^|]+?)\s*\|/gm),m=>m[1].trim())
  .filter(name=>name!=='Canonical owner'&&!/^[-:]+$/.test(name));

const cardsSection=map.split('## Canonical module handoff cards')[1]?.split('## Current preview boundary')[0];
assert.ok(cardsSection,'canonical handoff card index must exist');
const cards=Array.from(cardsSection.matchAll(/^\|\s*([^|]+?)\s*\|\s*\[[^\]]+\]\(([^)]+\.md)\)\s*\|\s*([^|]+?)\s*\|$/gm),m=>({
  owner:m[1].trim(),
  relativePath:m[2].trim(),
  status:m[3].trim()
})).filter(card=>card.owner!=='Canonical owner');

assert.deepEqual(cards.map(card=>card.owner),canonicalOwners,'each canonical owner must have exactly one indexed card in the same order');
assert.equal(new Set(cards.map(card=>card.owner)).size,cards.length,'canonical card owners must be unique');
for(const card of cards){
  const cardPath=path.resolve(path.dirname(mapPath),card.relativePath);
  assert.ok(fs.existsSync(cardPath),`${card.owner} card must exist: ${card.relativePath}`);
  const expectedStatus=card.owner==='Fishing & Catch Log'?'IMPLEMENTED · LOCAL ONLY':'DRAFT';
  assert.equal(card.status,expectedStatus,`${card.owner} card status must reflect its current implementation boundary`);
}

const visionPath=path.join(repoRoot,'docs','GAMEPLAY_VISION_AND_REFERENCE_ANALYSIS_V1.md');
const vision=fs.readFileSync(visionPath,'utf8');
const routingSection=vision.split('### 27-owner reference routing index')[1]?.split('**Coverage:**')[0];
assert.ok(routingSection,'five-game reference routing index must exist');
const routingRows=routingSection.split(/\r?\n/)
  .filter(line=>line.startsWith('|')&&!/^\|\s*[-:| ]+\|$/.test(line))
  .map(line=>line.split('|').slice(1,-1).map(cell=>cell.trim()))
  .filter(cells=>cells[0]!=='Canonical owner');
assert.deepEqual(routingRows.map(cells=>cells[0]),canonicalOwners,'five-game routing rows must cover canonical owners in map order');
for(const [index,row] of routingRows.entries()){
  assert.equal(row.length,4,`${row[0]} must keep all four routing columns`);
  assert.ok(row[2],`${row[0]} must have an original ABYSSAL WAKE task trigger`);
  assert.ok(row[3],`${row[0]} must name its cooperating interface/owners`);
}

console.log(JSON.stringify({ok:true,canonicalOwners:canonicalOwners.length,indexedCards:cards.length,brokenLinks:0,duplicateOwners:0,referenceRows:routingRows.length,missingTriggers:0,missingInterfaces:0}));
