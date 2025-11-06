type Role = 'system' | 'user' | 'assistant';

export interface MemoryState {
  messages: { role: Role; content: string; ts: number }[];
  prefs: { favoriteTeam?: string };
}

export class ChatRoomDO implements DurableObject {
  private state: DurableObjectState;
  private env: any; 

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  private async getState(): Promise<MemoryState> {
    return (await this.state.storage.get<MemoryState>('state')) ?? { messages: [], prefs: {} };
  }

  private async putState(s: MemoryState) {
    await this.state.storage.put('state', s);
  }

  async fetch(req: Request) {
    const url = new URL(req.url);

    // Remember favorite team
    if (url.pathname === '/remember' && req.method === 'POST') {
      const { favoriteTeam } = await req.json<any>();
      const st = await this.getState();
      st.prefs.favoriteTeam = favoriteTeam;
      await this.putState(st);
      return new Response(JSON.stringify({ ok: true, prefs: st.prefs }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Reset memory
    if (url.pathname === '/reset' && req.method === 'POST') {
      await this.state.storage.delete('state');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // WebSocket chat
    if (url.pathname === '/ws' && req.method === 'GET') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

      server.accept();

      server.addEventListener('message', async (evt) => {
        try {
          const payload = JSON.parse(String(evt.data || '{}'));

          if (payload.type === 'ping') {
            server.send(JSON.stringify({ type: 'pong', t: Date.now() }));
            return;
          }

          if (payload.type === 'chat' && typeof payload.text === 'string') {
            const st = await this.getState();
            st.messages.push({ role: 'user', content: payload.text, ts: Date.now() });

            const sys = `You are EuroLeague AI News Scout. Be concise. Today is ${new Date()
              .toISOString()
              .slice(0, 10)}.`;
            const memoryPref = st.prefs.favoriteTeam
              ? `User's favorite team: ${st.prefs.favoriteTeam}.`
              : '';

            const history = st.messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

            const messages = [{ role: 'system', content: `${sys} ${memoryPref}` }, ...history] as Array<{
              role: Role;
              content: string;
            }>;

            const model = (this.env?.DEFAULT_MODEL as string) ?? '@cf/meta/llama-3.3-70b-instruct';
            const result = await this.env.AI.run(model, { messages });
            const reply = result?.response ?? result?.result ?? JSON.stringify(result);

            st.messages.push({ role: 'assistant', content: reply, ts: Date.now() });
            await this.putState(st);

            server.send(JSON.stringify({ type: 'reply', text: reply }));
          }
        } catch (err: any) {
          server.send(JSON.stringify({ type: 'error', error: String(err?.message || err) }));
        }
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not found', { status: 404 });
  }
}
