import { NextResponse } from 'next/server';
import { datadisService } from '@/lib/datadis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { authorizedNif } = body;

    if (!authorizedNif) {
      return NextResponse.json(
        { error: 'Missing required parameter: authorizedNif' },
        { status: 400 }
      );
    }

    const data = await datadisService.cancelAuthorization(authorizedNif);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to cancel authorization' },
      { status: 500 }
    );
  }
}
