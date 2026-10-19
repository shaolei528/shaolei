import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const preview = fs.readFileSync(new URL('../prototypes/successor-3-4/preview.js', import.meta.url), 'utf8');
const entry = fs.readFileSync(new URL('../survival-v21.html', import.meta.url), 'utf8');
const previewServer = fs.readFileSync(new URL('../tools/serve-aw-local-preview.mjs', import.meta.url), 'utf8');
assert.match(previewServer, /const gamePath='\/index\.html'/, 'the local server must advertise the single player entry');
const routeStart = preview.indexOf('const routeFlags = new URLSearchParams(location.search);');
const routeEnd = preview.indexOf('// Make the embedded game a deliberate keyboard target.', routeStart);
assert.ok(routeStart >= 0 && routeEnd > routeStart, 'preview route selection block must remain isolated for verification');
const homeRoute = { location: { search: '?view=graybox&art=revise-pass-3&awGroundStudy=pass7&awTreeCandidate=1&previewFieldRig=2&awCharacterPortrait=1&awPlayerWalkAtlas=1&awPlayerWalkScale=0.7&awGeneratedGround=1' }, URLSearchParams };
vm.runInNewContext(`${preview.slice(routeStart, routeEnd)}\nglobalThis.routeSelection={qaMode,cozyPixelProof,grayboxContinuity,grayboxBuildingPreview,showQaControls,generatedWalkAtlasPreview,treeCandidatePreview,characterPortraitPreview,groundStudyPass,previewArtPass,generatedGroundPreview,previewFieldRigTier,candidateArtMode};`, homeRoute);
assert.deepEqual(JSON.parse(JSON.stringify(homeRoute.routeSelection)), {
  qaMode: true, cozyPixelProof: true, grayboxContinuity: true, grayboxBuildingPreview: true, showQaControls: false,
  generatedWalkAtlasPreview: false, treeCandidatePreview: false,
  characterPortraitPreview: false, groundStudyPass: '', previewArtPass: '',
  generatedGroundPreview: false, previewFieldRigTier: 0, candidateArtMode: false,
}, 'the canonical graybox URL must enable only the selected feature-first scene');
const interactiveHomeRoute = { location: { search: '?view=home-pixel&awQaControls=1' }, URLSearchParams };
vm.runInNewContext(`${preview.slice(routeStart, routeEnd)}\nglobalThis.routeSelection={qaMode,grayboxContinuity,showQaControls};`, interactiveHomeRoute);
assert.deepEqual(JSON.parse(JSON.stringify(interactiveHomeRoute.routeSelection)), {
  qaMode: true, grayboxContinuity: true, showQaControls: true,
}, 'the isolated graybox QA route can keep its explicitly requested controls visible');
assert.match(preview,/awBlackmarshGround/,'MIRE MART scene review requires a developer-only local flag');
assert.match(preview,/routeFlags\.get\('awStartAtMireMart'\)\s*===\s*'1'/,'MIRE MART scene start requires the explicit developer-only QA route');
assert.match(preview,/AW_SUCCESSOR_PREVIEW_START_AT_MIRE_MART=\$\{qaMode\s*&&\s*routeFlags\.get\('awStartAtMireMart'\)\s*===\s*'1'\}/,'scene start location must cross into the guarded iframe only when local QA is enabled');
assert.match(preview,/const startAtGrayboxPreview = grayboxBuildingPreview && routeFlags\.get\('awStartAtGraybox'\) === '1'/,'building collision preview must not force a graybox start unless explicitly requested');
assert.match(preview,/AW_SUCCESSOR_PREVIEW_START_AT_GRAYBOX=\$\{startAtGrayboxPreview\}/,'graybox start must be forwarded separately from enabling the building interaction');

assert.match(entry, /document\.body\.innerHTML\s*=\s*parsed\.body\.innerHTML/, 'V21 mounts a replacement entry DOM at runtime');
assert.match(preview, /const after\s*=\s*Object\.fromEntries\(saveKeys\.map\(key\s*=>\s*\[key,\s*localStorage\.getItem\(key\)\]\)\)/, 'preview must recheck real storage after installation');
assert.match(preview, /if\s*\(unchanged\)\s*\{[\s\S]*?child\.document\.querySelector\('#gate'\)\?\.classList\.add\('hidden'\)/, 'hide only the live mounted gate, and only after real storage equality passes');
assert.match(preview, /child\.document\.querySelector\('#game'\)\?\.classList\.remove\('hidden'\)/, 'show the live game surface after the verified guarded start');
assert.match(preview, /PreviewSocketBlocked[\s\S]*?WebSocket blocked by local successor preview/, 'the proof preview must remain fail-closed for network connections');
assert.match(preview, /http-equiv="Content-Security-Policy" content="connect-src 'self'"/, 'V21 preview network connections must be restricted to same-origin local assets');
assert.match(preview, /securitypolicyviolation[\s\S]*?preview-remote-connect-blocked/, 'blocked remote connection attempts must be observable');
assert.match(preview, /const __previewPrefix\s*=\s*'abyssal_wake_successor_preview_v1:'[\s\S]*?parent\.localStorage[\s\S]*?__previewBacking\.setItem/, 'preview saves must persist only in their dedicated browser-storage namespace');
assert.match(preview, /get length\(\)[\s\S]*?key\(index\)/, 'the isolated save adapter must preserve the Storage enumeration contract without exposing other keys');
assert.match(preview, /routeFlags\.get\('awDevQa'\)\s*===\s*'1'/, 'developer QA mode requires an explicit local preview query flag');
assert.match(preview, /routeFlags\.get\('awQaControls'\)\s*!==\s*'0'/, 'QA diagnostics can be hidden only by the explicit local preview query flag');
assert.match(preview, /generatedWalkAtlasPreview\s*&&\s*Number\.isFinite\(requestedWalkAtlasScale\)\s*\?\s*Math\.max\(\.4,\s*Math\.min\(\.8,\s*requestedWalkAtlasScale\)\)\s*:\s*\.55/, 'walk-atlas scale comparison must stay inside guarded QA, default to the existing .55 presentation, and clamp review input');
assert.match(preview, /AW_SUCCESSOR_GENERATED_WALK_ATLAS_SCALE=\$\{generatedWalkAtlasScale\}/, 'only the guarded child preview receives the candidate walk-atlas comparison scale');
assert.match(preview, /routeFlags\.get\('awArtPreview'\)\s*===\s*'1'/, 'candidate art mode requires an explicit local preview query flag');
assert.match(preview, /routeFlags\.get\('awPlayerCandidate'\)\s*===\s*'1'/, 'the alternate player sheet requires an explicit local QA query flag');
assert.match(preview,/routeFlags\.get\('awGeneratedGround'\)\s*===\s*'1'/,'generated ground comparison requires an explicit local QA query flag');
assert.match(preview,/routeFlags\.get\('awBlackmarshGround'\)\s*===\s*'1'/,'continuous MIRE MART ground requires an explicit local QA query flag');
assert.match(preview,/AW_SUCCESSOR_BLACKMARSH_GROUND_QA=\$\{continuousBlackmarshPreview\}/,'MIRE MART ground candidate switch must be passed into the isolated local preview');
assert.match(preview,/AW_SUCCESSOR_CHARACTER_DOSSIER_QA=\$\{characterPortraitPreview && routeFlags\.get\('awCharacterDossier'\) !== '0'\}/,'the large character dossier can be hidden while the original-image HUD portrait remains under review');
const renderer=fs.readFileSync(new URL('../prototypes/successor-3-4/successor-renderer.js',import.meta.url),'utf8');
const groundStart=renderer.indexOf('function drawGroundBeyondMap(');
const groundEnd=renderer.indexOf('function drawCityBeyondRegion(',groundStart);
assert.ok(groundStart>=0&&groundEnd>groundStart,'HOME map-edge ground continuation must exist');
function runGroundBackdrop(){
  const fills=[];let gradients=0,strokes=0,currentColor='';
  const out={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++},fillRect(x,y,w,h){fills.push({x,y,w,h,color:currentColor})},createLinearGradient(){gradients++;return{addColorStop(){}}},set fillStyle(value){currentColor=value},get fillStyle(){return currentColor}};
  const adapter={project(x,y){return{x:(x-y)*.5,y:(x+y)*.25}}};
  const sandbox={out,adapter,renderCameraX:0,renderCameraY:0,Math};vm.createContext(sandbox);
  vm.runInContext(`${renderer.slice(groundStart,groundEnd)}\nglobalThis.draw=drawGroundBeyondMap;`,sandbox);
  sandbox.draw(320,200);return{fills,gradients,strokes};
}
const groundBackdrop=runGroundBackdrop();
assert.equal(groundBackdrop.gradients,0,'the map edge must not paint a water gradient');
assert.equal(groundBackdrop.strokes,0,'the map edge must not paint water ripple strokes');
assert.ok(groundBackdrop.fills.length>8&&groundBackdrop.fills.every(({x,y,w,h})=>[x,y,w,h].every(Number.isInteger)),'the map edge must continue as pixel ground at integer coordinates');
assert.equal(groundBackdrop.fills[0].color,'#788b5c','the exposed map backdrop must match the graybox ground palette');
assert.ok(groundBackdrop.fills.every(({color})=>color!=='#5e817c'&&color!=='#86a99a'),'visible water must not be placed over coordinates without a matching water collider');
assert.match(renderer,/const grayboxBuildingStart=grayboxBuildingQa&&window\.AW_SUCCESSOR_PREVIEW_START_AT_GRAYBOX===true/,'graybox exterior and spawn require the separate explicit start flag');
assert.match(renderer,/if\(grayboxContinuity\)\{[\s\S]*?drawContinuationGround/,'the selected graybox route must fill the walkable view with continuing ground');
assert.match(renderer,/if\(grayboxContinuity\)\{if\(currentZone==='1:0'\)grayboxScene\?\.drawGrayboxExterior/,'the city-style layers must be replaced by a functional graybox POI on the selected route');
assert.match(renderer,/const grayboxExterior=grayboxBuildingStart&&currentZone==='1:0'/,'town art remains visible when the building-access preview is enabled from the MIRE street start');
assert.match(renderer,/startAtGraybox=grayboxBuildingStart/,'the graybox start must not override an explicit MIRE street start');
assert.match(renderer,/if\(window\.AW_SUCCESSOR_CHARACTER_DOSSIER_QA!==false\)game\.appendChild\(portrait\)/,'the character dossier overlay must be independently suppressible');
assert.match(preview,/const candidateGroundFlags = generatedGroundPreview \? flags\.replace\('window\.AW_SUCCESSOR_GROUND_STUDY=', 'window\.AW_SUCCESSOR_GENERATED_GROUND_QA=true;window\.AW_SUCCESSOR_GROUND_STUDY='\) : flags/,'the guarded child receives the generated ground switch without changing non-QA preview defaults');
assert.match(preview,/generatedGroundPreview = qaMode && routeFlags\.get\('awGeneratedGround'\) === '1'/,'the generated ground art route must require local developer QA mode');
assert.match(preview, /AW_SUCCESSOR_PLAYER_CANDIDATE_QA=\$\{playerCandidatePreview\}/, 'candidate player art must remain isolated to the guarded local QA frame');
assert.match(preview, /window\.AW_DEV_QA=false;if\(\$\{qaMode\}\)window\.AW_DEV_QA=true/, 'normal preview defaults QA to disabled and only the explicit flag can enable it');
assert.match(preview, /window\.AW_ART_PREVIEW=\$\{candidateArtMode\}/, 'candidate-art mode is forwarded only to the isolated child frame');
assert.match(preview, /frame\.tabIndex\s*=\s*0/, 'game iframe must be keyboard-focusable');
assert.match(preview, /pointerdown[\s\S]*?target\s*===\s*childDocument\.querySelector\('canvas'\)[\s\S]*?target\?\.closest\?\.\('\.successor-pad'\)[\s\S]*?frame\.focus\(/, 'canvas and successor movement-pad input must route keyboard focus to the guarded game frame');
assert.match(preview, /previewInputStyle\.textContent\s*=\s*['"][^'"]*\.successor-pad\{display:block!important/, 'guarded desktop preview must expose ordinary mouse movement without enabling QA teleports');
const desktopControls = fs.readFileSync(new URL('../modules/input/platform-inventory-v19.js', import.meta.url), 'utf8');
assert.match(desktopControls, /移动转向\s*·\s*空格朝面向攻击/, 'desktop controls must explain that movement sets the attack facing');
assert.match(preview, /if\s*\(qaMode\)\s*await inject\('prototypes\/successor-3-4\/qa-harness\.js'\)/, 'the QA panel is loaded from the repository-root local asset route only for explicit local QA mode');
assert.match(preview, /AW_SHOW_SUCCESSOR_QA_CONTROLS=\$\{qaMode&&showQaControls\}/, 'hidden QA controls must remain isolated to the guarded preview while preserving the local QA runtime flag');

console.log('PASS successor preview routes canvas and movement-pad focus while keeping save, Relay and QA shortcut guards active');
