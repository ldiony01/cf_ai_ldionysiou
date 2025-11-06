# EuroLeague AI News Scout


A minimal Cloudflare app demonstrating: Workers AI (Llama 3.3), Durable Objects memory, WebSocket realtime chat, and a simple Pages frontend.

This chat bot gives info about your favorite euroleague team. You can save your favorite team.


## Requirements
- Node 18+
- `npm install -D wrangler`
- Cloudflare account with Workers AI enabled


## Configuration
In `wrangler.toml` set:
- `CORS_ORIGIN` to `*` to run locally (currently set to the deployed URL)
- Optional: adjust `DEFAULT_MODEL`


## Run locally

```
npx wrangler dev
```

This starts the Worker on `127.0.0.1:8787`. Open `web/index.html` in a local server or serve with:

```
python -m http.server -d web 8080
```


## Deploy

```bash
wrangler deploy
```

Then host `web/` via Cloudflare Pages:

```bash
wrangler pages project create euroleague-ai-news-scout 
wrangler pages deploy ./web
```

Update `API_BASE` in `web/app.js` with your Worker URL.

---

**Already deployed at:** [`https://euroleague-ai-news-scout.pages.dev`](https://euroleague-ai-news-scout.pages.dev)