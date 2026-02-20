type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

const DAILY_SYNC_STALE_DAYS = 1;

function resolveSiteBaseUrl(): string {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL;
  if (!base) {
    throw new Error('Missing Netlify URL environment variable (URL/DEPLOY_PRIME_URL/DEPLOY_URL)');
  }
  return base.startsWith('http') ? base : `https://${base}`;
}

async function fetchJson(url: string, init?: RequestInit): Promise<JsonValue> {
  const res = await fetch(url, init);
  const text = await res.text();
  let body: JsonValue = text;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw text if response is not JSON.
  }

  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) ${url}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }

  return body;
}

export default async function handler() {
  const baseUrl = resolveSiteBaseUrl();
  const clientsUrl = `${baseUrl}/api/sync/clients`;
  const consumptionUrl = `${baseUrl}/api/sync/consumption`;

  const clients = await fetchJson(clientsUrl, { method: 'POST' });
  const consumption = await fetchJson(consumptionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staleDays: DAILY_SYNC_STALE_DAYS }),
  });

  return new Response(
    JSON.stringify({
      success: true,
      mode: 'netlify_daily_24h',
      ranAt: new Date().toISOString(),
      clients,
      consumption,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
