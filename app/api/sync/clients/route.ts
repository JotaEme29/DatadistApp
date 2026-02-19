import { NextResponse } from 'next/server';
import { syncClientsFromDatadis } from '@/lib/sync';

export const maxDuration = 300; // 5 minutes for sync

export async function POST() {
  try {
    const syncResults = await syncClientsFromDatadis();

    return NextResponse.json({ success: true, results: syncResults });
  } catch (error: any) {
    console.error('Sync Clients Error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to sync clients' },
      { status: 500 }
    );
  }
}
