#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {normalizeManifest,runtimeManifest} from './lib.mjs';

const args=process.argv.slice(2);
const manifestArg=args.find(arg=>!arg.startsWith('--'))||'assets/awakening-v1/manifest.json';
const outFlag=args.indexOf('--out');
const outArg=outFlag>=0?args[outFlag+1]:null;
const manifestPath=path.resolve(process.cwd(),manifestArg);
let manifest;
try{manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));}catch(error){console.error(`Cannot read ${manifestArg}: ${error.message}`);process.exit(1);}
const normalized=normalizeManifest(manifest);
const runtime=runtimeManifest(normalized);
const payload=JSON.stringify(runtime,null,2)+'\n';
if(outArg){
  const outPath=path.resolve(process.cwd(),outArg);
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  fs.writeFileSync(outPath,payload);
  console.log(`Wrote runtime atlas manifest: ${path.relative(process.cwd(),outPath)}`);
}else process.stdout.write(payload);
