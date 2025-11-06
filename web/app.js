const API_BASE = (location.hostname === 'localhost')
    ? 'http://127.0.0.1:8787'
    : 'https://euroleague-ai-news-scout.dionysioulampros.workers.dev'; 

const session = localStorage.getItem('session') || crypto.randomUUID();
localStorage.setItem('session', session);


const chatEl = document.getElementById('chat');
function addMsg(text, who) {
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.textContent = text;
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
}


function connect() {
    const ws = new WebSocket(`${API_BASE}/ws?session=${encodeURIComponent(session)}`);
    ws.onopen = () => console.log('WS connected');
    ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'reply') addMsg(data.text, 'bot');
        if (data.type === 'error') addMsg('Error: ' + data.error, 'bot');
    };
    ws.onclose = () => setTimeout(connect, 1000);
    window._ws = ws;
}
connect();


const input = document.getElementById('text');
document.getElementById('send').onclick = () => {
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    window._ws?.send(JSON.stringify({ type: 'chat', text }));
};


// Remember favorite team
const team = document.getElementById('team');
document.getElementById('save').onclick = async () => {
    const favoriteTeam = team.value.trim();
    if (!favoriteTeam) return;
    const r = await fetch(`${API_BASE}/remember?session=${encodeURIComponent(session)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favoriteTeam })
    });
    const j = await r.json();
    addMsg('Got it. I will remember: ' + j.prefs.favoriteTeam, 'bot');
};


document.getElementById('reset').onclick = async () => {
    await fetch(`${API_BASE}/reset?session=${encodeURIComponent(session)}`, { method: 'POST' });
    addMsg('Memory cleared for this session.', 'bot');
};


input.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('send').click(); });