import { NextResponse } from 'next/server';
import { syncConsumptionFromDatadis } from '@/lib/sync';

export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const staleDays = Number(body?.staleDays);
    const results = await syncConsumptionFromDatadis({
      staleDays: Number.isFinite(staleDays) && staleDays > 0 ? staleDays : 0,
    });

    if (results.suppliesFound === 0) {
      return NextResponse.json({ success: true, message: 'No supplies to sync', results });
    }
    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error('Sync Consumption Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync consumption' },
      { status: 500 }
    );
  }
}
