import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendAdminNotification } from '@/lib/email';

/** Generate sequential booking ID: AP-2026-0001 */
async function generateBookingId(db: ReturnType<typeof createServerClient>): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await db
    .from('bookings')
    .select('*', { count: 'exact', head: true });
  const seq = ((count ?? 0) + 1).toString().padStart(4, '0');
  return `AP-${year}-${seq}`;
}

function isDevMode() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, dob, tob, birth_city, service, appointment_date, time_slot, mode, query } = body;

    if (!name || !phone || !dob || !birth_city || !service || !appointment_date || !time_slot || !mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (isDevMode()) {
      const year = new Date().getFullYear();
      const seq = Math.floor(1 + Math.random() * 9999).toString().padStart(4, '0');
      const booking_id = `AP-${year}-${seq}`;
      return NextResponse.json(
        { booking: { booking_id, name, phone, service, appointment_date, time_slot, mode, status: 'pending' }, booking_id },
        { status: 201 }
      );
    }

    const db = createServerClient();
    const booking_id = await generateBookingId(db);

    // ── Insert booking (with email) ───────────────────────────────────
    const { data, error } = await db.from('bookings').insert({
      booking_id,
      name:             name.trim(),
      phone:            phone.trim(),
      email:            email?.trim() || null,   // ← email saved
      dob,
      tob:              tob || null,
      birth_city:       birth_city.trim(),
      service,
      appointment_date,
      time_slot,
      mode,
      query:            query?.trim() || null,
      status:           'pending',
    }).select().single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── Auto-block slot so others can't book same date+time ───────────
    try {
      await db.from('blocked_slots')
        .insert({ slot_date: appointment_date, time_slot });
      console.log(`[SLOT] Auto-blocked ${appointment_date} ${time_slot}`);
    } catch (err) {
      console.warn('[SLOT] Could not block slot (may already exist):', (err as Error)?.message);
    }

    // ── Admin notification email ───────────────────────────────────────
    try {
      await sendAdminNotification({ booking_id, name, phone, service, appointment_date, time_slot, mode });
    } catch (err) {
      console.error('Admin email error (non-fatal):', err);
    }

    return NextResponse.json({ booking: data, booking_id }, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (isDevMode()) return NextResponse.json({ bookings: [] });
    const db = createServerClient();
    const url = new URL(req.url);
    const status  = url.searchParams.get('status');
    const service = url.searchParams.get('service');
    const date    = url.searchParams.get('date');
    const search  = url.searchParams.get('search');

    let q = db.from('bookings').select('*').order('created_at', { ascending: false });
    if (status  && status  !== 'all') q = q.eq('status',           status);
    if (service && service !== 'all') q = q.eq('service',          service);
    if (date)                         q = q.eq('appointment_date', date);
    if (search)                       q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%,booking_id.ilike.%${search}%`);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bookings: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
