import { NextResponse } from 'next/server';
import { datadisService } from '@/lib/datadis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorizedNif = searchParams.get('authorizedNif') || undefined;

    // Use our service to fetch data
    const data = await datadisService.getSupplies(authorizedNif);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in /api/datadis/supplies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch supplies' },
      { status: 500 }
    );
  }
}
