#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validatePack} from './lib.mjs';

const args=process.argv.slice(2);
const json=args.includes('--json');
const rootArg=args.find(arg=>!arg.startsWith('--'))||'assets/awakening-v1';
const root=path.resolve(process.cwd(),rootArg);
const result=validatePack(root);
const output={ok:result.ok,root:path.relative(process.cwd(),root)||'.',assets:result.assets.length,files:result.files.length,errors:result.errors,warnings:result.warnings};
if(json)console.log(JSON.stringify(output,null,2));
else{
  console.log(`Awakening asset pack: ${output.root}`);
  console.log(`assets=${output.assets} files=${output.files} status=${output.ok?'PASS':'FAIL'}`);
  for(const warning of output.warnings)console.warn(`WARN ${warning}`);
  for(const error of output.errors)console.error(`ERROR ${error}`);
}
if(!result.ok)process.exitCode=1;

export{validatePack};
