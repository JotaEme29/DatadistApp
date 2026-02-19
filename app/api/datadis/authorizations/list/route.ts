import { NextResponse } from 'next/server';
import { datadisService } from '@/lib/datadis';

export async function GET() {
  try {
    const data = await datadisService.listAuthorizations();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to list authorizations' },
      { status: 500 }
    );
  }
}
