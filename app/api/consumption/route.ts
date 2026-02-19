import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cups = searchParams.get('cups');
  const startDate = searchParams.get('startDate'); // YYYY-MM-DD
  const endDate = searchParams.get('endDate');     // YYYY-MM-DD

  if (!cups || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: cups, startDate, endDate' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('consumption_data')
      .select('*')
      .eq('cups', cups)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch consumption data' },
      { status: 500 }
    );
  }
}
