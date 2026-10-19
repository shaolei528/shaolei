import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../survival-config.js', import.meta.url), 'utf8');

function loadConfig({ hostname, host = hostname, protocol = 'https:' }) {
  const window = {};
  runInNewContext(source, {
    window,
    location: { hostname, host, protocol, pathname: '/prototypes/successor-3-4/live-candidate.html' }
  });
  return window.ABYSSAL_CONFIG;
}

const cloudflare = loadConfig({
  hostname: 'abyssal-wake-relay.bittersweet-havarti.workers.dev',
  host: 'abyssal-wake-relay.bittersweet-havarti.workers.dev'
});
assert.equal(cloudflare.RELAY_URL, 'wss://abyssal-wake-relay.bittersweet-havarti.workers.dev/ws');

const githack = loadConfig({ hostname: 'raw.githack.com' });
assert.equal(githack.RELAY_URL, 'wss://abyssal-wake-relay.zuoranzhang.workers.dev/ws');

const localHttp = loadConfig({ hostname: '127.0.0.1', protocol: 'http:' });
assert.equal(localHttp.RELAY_URL, 'wss://abyssal-wake-relay.zuoranzhang.workers.dev/ws');

console.log('Cloudflare worker pages use their own /ws route; Githack/local pages retain the existing Relay.');
