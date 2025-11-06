import { ChatRoomDO } from './durable-object';

export interface Env {
  CHAT_ROOM: DurableObjectNamespace;
  AI: any; 
  DEFAULT_MODEL: string;
  CORS_ORIGIN: string;
}

function withCORS(headers = new Headers(), origin = '*') {
  headers.set('Access-Control-Allow-Origin', origin || '*');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return headers;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const headers = withCORS(new Headers({ 'Content-Type': 'application/json' }), env.CORS_ORIGIN);

    if (req.method === 'OPTIONS') return new Response(null, { headers });

    const key = url.searchParams.get('session') || 'anon';
    const id = env.CHAT_ROOM.idFromName(key);
    const stub = env.CHAT_ROOM.get(id);

    if (url.pathname === '/ws') {
      return stub.fetch(new Request(new URL('/ws', url.origin).toString(), req));
    }
    if (url.pathname === '/remember' && req.method === 'POST') {
      return stub.fetch(new Request(new URL('/remember', url.origin).toString(), req));
    }
    if (url.pathname === '/reset' && req.method === 'POST') {
      return stub.fetch(new Request(new URL('/reset', url.origin).toString(), req));
    }

    if (url.pathname === '/') {
      return new Response(JSON.stringify({ ok: true, message: 'EuroLeague AI News Scout API' }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  },
};

export { ChatRoomDO };
