import { NextResponse } from 'next/server';
import { datadisService } from '@/lib/datadis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cups = searchParams.get('cups');
    const distributorCode = searchParams.get('distributorCode');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const authorizedNif = searchParams.get('authorizedNif') || undefined;

    if (!cups || !distributorCode || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: cups, distributorCode, startDate, endDate' },
        { status: 400 }
      );
    }

    const data = await datadisService.getMaxPower({
      cups,
      distributorCode,
      startDate,
      endDate,
      authorizedNif
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch max power data' },
      { status: 500 }
    );
  }
}
