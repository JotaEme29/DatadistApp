import { NextResponse } from 'next/server';
import { syncClientsFromDatadis, syncConsumptionFromDatadis } from '@/lib/sync';

export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
