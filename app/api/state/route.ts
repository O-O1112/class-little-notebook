import { env } from 'cloudflare:workers';

export const dynamic = 'force-dynamic';

const STATE_ID = 'default';
const MAX_PAYLOAD_BYTES = 2_000_000;

type StoredState = {
  id: string;
  payload: string;
  updated_at: number;
};

function json(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', 'no-store');
  return Response.json(data, {
    ...init,
    headers,
  });
}

function database() {
  if (!env.DB) throw new Error('D1 binding DB is unavailable.');
  return env.DB;
}

export async function GET() {
  try {
    const row = await database()
      .prepare(
        'SELECT id, payload, updated_at FROM workspace_state WHERE id = ?1',
      )
      .bind(STATE_ID)
      .first<StoredState>();

    if (!row) return json({ data: null, updatedAt: null });

    try {
      return json({ data: JSON.parse(row.payload), updatedAt: row.updated_at });
    } catch {
      return json({ error: '資料庫內容格式不正確。' }, { status: 500 });
    }
  } catch {
    return json({ error: '目前無法連線到資料庫。' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { data?: unknown };
    if (!body || typeof body !== 'object' || body.data === undefined) {
      return json({ error: '缺少要保存的班級資料。' }, { status: 400 });
    }

    const payload = JSON.stringify(body.data);
    if (new TextEncoder().encode(payload).byteLength > MAX_PAYLOAD_BYTES) {
      return json({ error: '班級資料超過可保存的大小。' }, { status: 413 });
    }

    const updatedAt = Date.now();
    await database()
      .prepare(
        `INSERT INTO workspace_state (id, payload, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(id) DO UPDATE SET
           payload = excluded.payload,
           updated_at = excluded.updated_at`,
      )
      .bind(STATE_ID, payload, updatedAt)
      .run();

    return json({ ok: true, updatedAt });
  } catch {
    return json({ error: '目前無法保存到資料庫。' }, { status: 503 });
  }
}
