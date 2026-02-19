import { NextResponse } from 'next/server';
import { datadisService } from '@/lib/datadis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const cups = searchParams.get('cups');
    const distributorCode = searchParams.get('distributorCode');
    const pointType = searchParams.get('pointType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const measurementType = searchParams.get('measurementType') || '0'; // Default to hourly
    const authorizedNif = searchParams.get('authorizedNif') || undefined;

    if (!cups || !distributorCode || !pointType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: cups, distributorCode, pointType, startDate, endDate' },
        { status: 400 }
      );
    }

    const data = await datadisService.getConsumptionData({
      cups,
      distributorCode,
      pointType: parseInt(pointType),
      startDate,
      endDate,
      measurementType: parseInt(measurementType),
      authorizedNif
    });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message && error.message.includes('429')) {
       return NextResponse.json(
        { error: 'Límite de consultas diarias alcanzado para este suministro. Intente mañana.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch consumption data' },
      { status: 500 }
    );
  }
}
