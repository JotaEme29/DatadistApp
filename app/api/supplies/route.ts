import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const nif = searchParams.get('nif');

  try {
    let query = supabase
      .from('client_supplies')
      .select('*');

    if (nif) {
      query = query.eq('client_nif', nif);
    }

    if (search) {
      query = query.or(`cups.ilike.%${search}%,address.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch supplies' },
      { status: 500 }
    );
  }
}
