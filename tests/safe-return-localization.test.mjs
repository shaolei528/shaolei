import assert from 'node:assert/strict';
import fs from 'node:fs';

const gameplay=fs.readFileSync(new URL('../modules/survival/gameplay-v9.js',import.meta.url),'utf8');
const ux=fs.readFileSync(new URL('../modules/ui/ux-cn-v11.js',import.meta.url),'utf8');

assert.match(gameplay,/toast\('Safe return recorded · total ' \+ state\.successfulReturns\)/,'survival return statistic must use neutral wording');
assert.match(ux,/m=text\.match\(\/\^Safe return recorded · total \(\\d\+\)\$\/\);if\(m\)return '安全返回已记录 · 累计 '\+m\[1\];/,'Chinese UI must localize the neutral return statistic and preserve its count');
assert.match(ux,/if\(text\.startsWith\('Expedition complete'\)\) return '远征完成：你安全返回了营地。';/,'existing true expedition completion wording must remain unchanged');

console.log(JSON.stringify({ok:true,returnStatistic:'neutral-and-localized',completionMessage:'unchanged'}));
