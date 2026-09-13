import type { Config, Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";

const ROOM_TTL_MS = 10 * 60 * 1000;
const STORE_NAME = "deep-sea-duo-rooms";

type Room = {
  roomCode: string;
  hostToken: string;
  offer: string;
  answer: string | null;
  expiresAt: number;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  },
});

const validRoomCode = (value: unknown) => /^\d{6}$/.test(String(value ?? ""));
const validToken = (value: unknown) => /^[a-f0-9]{32,128}$/i.test(String(value ?? ""));
const validSignal = (value: unknown, type: "offer" | "answer") => {
  if (typeof value !== "string" || value.length < 10 || value.length > 200_000) return false;
  try {
    const parsed = JSON.parse(value);
    return parsed?.type === type && typeof parsed?.sdp === "string" && parsed.sdp.length > 0;
  } catch {
    return false;
  }
};

function roomStore() {
  const deployContext = globalThis.Netlify?.context?.deploy?.context;
  if (deployContext === "production") {
    return getStore(STORE_NAME, { consistency: "strong" });
  }
  return getDeployStore(STORE_NAME);
}

async function readRoom(roomCode: string): Promise<Room | null> {
  const store = roomStore();
  const room = await store.get(roomCode, { type: "json" }) as Room | null;
  if (!room) return null;
  if (!Number.isFinite(room.expiresAt) || room.expiresAt <= Date.now()) {
    await store.delete(roomCode);
    return null;
  }
  return room;
}

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "health";
    if (action === "health") return json({ ok: true, service: "deep-sea-duo-room", version: 1 });

    const roomCode = url.searchParams.get("roomCode") ?? "";
    if (!validRoomCode(roomCode)) return json({ error: "invalid_room_code" }, 400);
    const room = await readRoom(roomCode);
    if (!room) return json({ error: "room_not_found" }, 404);

    if (action === "offer") return json({ offer: room.offer });
    if (action === "status") return json({ hasAnswer: typeof room.answer === "string" });
    if (action === "poll") {
      const hostToken = url.searchParams.get("hostToken") ?? "";
      if (!validToken(hostToken) || hostToken !== room.hostToken) {
        return json({ error: "invalid_host_credentials" }, 403);
      }
      return json({ answer: room.answer });
    }
    return json({ error: "unknown_action" }, 400);
  }

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const action = String(body.action ?? "");
  const store = roomStore();

  if (action === "create") {
    const roomCode = String(body.roomCode ?? "");
    const hostToken = String(body.hostToken ?? "");
    const offer = body.offer;
    if (!validRoomCode(roomCode)) return json({ error: "invalid_room_code" }, 400);
    if (!validToken(hostToken)) return json({ error: "invalid_host_credentials" }, 400);
    if (!validSignal(offer, "offer")) return json({ error: "invalid_offer" }, 400);
    if (await readRoom(roomCode)) return json({ error: "room_code_collision" }, 409);

    const room: Room = {
      roomCode,
      hostToken,
      offer: String(offer),
      answer: null,
      expiresAt: Date.now() + ROOM_TTL_MS,
    };
    await store.setJSON(roomCode, room);
    return json({ ok: true, expiresIn: Math.floor(ROOM_TTL_MS / 1000) });
  }

  if (action === "answer") {
    const roomCode = String(body.roomCode ?? "");
    const answer = body.answer;
    if (!validRoomCode(roomCode)) return json({ error: "invalid_room_code" }, 400);
    if (!validSignal(answer, "answer")) return json({ error: "invalid_answer" }, 400);
    const room = await readRoom(roomCode);
    if (!room || room.answer) return json({ error: "room_not_found_or_joined" }, 409);
    room.answer = String(answer);
    await store.setJSON(roomCode, room);
    return json({ ok: true });
  }

  if (action === "close") {
    const roomCode = String(body.roomCode ?? "");
    const hostToken = String(body.hostToken ?? "");
    if (!validRoomCode(roomCode) || !validToken(hostToken)) {
      return json({ error: "invalid_host_credentials" }, 400);
    }
    const room = await readRoom(roomCode);
    if (room && room.hostToken === hostToken) await store.delete(roomCode);
    return json({ ok: true });
  }

  return json({ error: "unknown_action" }, 400);
};

export const config: Config = {
  path: "/room",
};
