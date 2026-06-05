import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Public read using anon key
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/** GET /api/availability?date=YYYY-MM-DD
 *  Returns blocked slots + whether the whole day is blocked */
export async function GET(req: NextRequest) {
  const date = new URL(req.url).searchParams.get('date');
  if (!date) return NextResponse.json({ blocked: [], dayBlocked: false });

  const { data } = await anonClient().from('blocked_slots').select('*').eq('slot_date', date);
  const dayBlocked  = data?.some(s => !s.time_slot) ?? false;
  const blocked     = data?.filter(s => !!s.time_slot).map(s => s.time_slot as string) ?? [];
  const records     = data ?? [];

  return NextResponse.json({ blocked, dayBlocked, records });
}

/** POST /api/availability — block a slot or entire day
 *  Body: { slot_date: 'YYYY-MM-DD', time_slot?: string, reason?: string }
 *  time_slot omitted or null → blocks entire day */
export async function POST(req: NextRequest) {
  try {
    const { slot_date, time_slot, reason } = await req.json();
    const db = createServerClient();
    const { data, error } = await db
      .from('blocked_slots')
      .insert({ slot_date, time_slot: time_slot || null, reason: reason || null })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ record: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

/** DELETE /api/availability — unblock a slot
 *  Body: { id: string } */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const db = createServerClient();
    const { error } = await db.from('blocked_slots').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
