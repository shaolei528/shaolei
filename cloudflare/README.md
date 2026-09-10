# ABYSSAL WAKE — Cloudflare Realtime Relay

This directory is an isolated Cloudflare Workers + Durable Objects application for the V17 multiplayer transport.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shaolei528/shaolei/tree/main/cloudflare)

## Endpoints

- `GET /health` — health check
- `GET /` — plain service banner
- `WebSocket /ws` — realtime game transport using protocol `abyssal-relay-v1`

The Durable Object uses the WebSocket Hibernation API, so idle rooms can hibernate while browser WebSocket connections remain attached to Cloudflare's network.

No application secrets or database credentials are required.
