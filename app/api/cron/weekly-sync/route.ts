import { NextResponse } from 'next/server';
import { syncClientsFromDatadis, syncConsumptionFromDatadis } from '@/lib/sync';

export const maxDuration = 300;

function getAuthorizationResult(request: Request): { ok: boolean; reason?: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ok: false, reason: 'CRON_SECRET is not configured' };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return { ok: false, reason: 'Invalid Authorization header' };
  }

  return { ok: true };
}

export async function GET(request: Request) {
  try {
    const auth = getAuthorizationResult(request);
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized', details: auth.reason }, { status: 401 });
    }

    const clients = await syncClientsFromDatadis();
    const consumption = await syncConsumptionFromDatadis({ staleDays: 1 });

    return NextResponse.json({
      success: true,
      mode: 'daily_24h',
      clients,
      consumption,
      ranAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Weekly sync failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
