const STATE_ID = 'default';
const MAX_PAYLOAD_BYTES = 2_000_000;

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'no-store');
  return Response.json(data, { ...init, headers });
}

async function stateApi(request, env) {
  if (!env.DB) return json({ error: '目前無法連線到資料庫。' }, { status: 503 });

  try {
    if (request.method === 'GET') {
      const row = await env.DB
        .prepare('SELECT id, payload, updated_at FROM workspace_state WHERE id = ?1')
        .bind(STATE_ID)
        .first();

      if (!row) return json({ data: null, updatedAt: null });
      return json({ data: JSON.parse(row.payload), updatedAt: row.updated_at });
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      if (!body || typeof body !== 'object' || body.data === undefined) {
        return json({ error: '缺少要保存的班級資料。' }, { status: 400 });
      }

      const payload = JSON.stringify(body.data);
      if (new TextEncoder().encode(payload).byteLength > MAX_PAYLOAD_BYTES) {
        return json({ error: '班級資料超過可保存的大小。' }, { status: 413 });
      }

      const updatedAt = Date.now();
      await env.DB
        .prepare(`INSERT INTO workspace_state (id, payload, updated_at)
          VALUES (?1, ?2, ?3)
          ON CONFLICT(id) DO UPDATE SET
            payload = excluded.payload,
            updated_at = excluded.updated_at`)
        .bind(STATE_ID, payload, updatedAt)
        .run();

      return json({ ok: true, updatedAt });
    }

    return json({ error: '不支援的請求方法。' }, { status: 405 });
  } catch {
    return json({ error: '目前無法保存或讀取資料庫。' }, { status: 503 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/state') return stateApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
