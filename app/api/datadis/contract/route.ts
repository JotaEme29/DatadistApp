import { NextResponse } from 'next/server';
import { datadisService } from '@/lib/datadis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cups = searchParams.get('cups');
    const distributorCode = searchParams.get('distributorCode');
    const authorizedNif = searchParams.get('authorizedNif') || undefined;

    if (!cups || !distributorCode) {
      return NextResponse.json(
        { error: 'Missing required parameters: cups, distributorCode' },
        { status: 400 }
      );
    }

    const data = await datadisService.getContractDetail({
      cups,
      distributorCode,
      authorizedNif
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contract details' },
      { status: 500 }
    );
  }
}
