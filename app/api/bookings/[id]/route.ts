import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendClientConfirmation, sendCancellationEmail } from '@/lib/email';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, meet_link, admin_notes, confirmed_time_slot } = body;
    const db = createServerClient();

    // Fetch existing booking
    const { data: existing, error: fetchErr } = await db
      .from('bookings').select('*').eq('id', id).single();
    if (fetchErr || !existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (action === 'confirm')  updates.status = 'confirmed';
    if (action === 'cancel')   updates.status = 'cancelled';
    if (action === 'complete') updates.status = 'completed';
    if (meet_link           !== undefined) updates.meet_link           = meet_link;
    if (admin_notes         !== undefined) updates.admin_notes         = admin_notes;
    if (confirmed_time_slot !== undefined) updates.confirmed_time_slot = confirmed_time_slot;

    const { data, error } = await db.from('bookings').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // ── Confirmation email ────────────────────────────────────────────
    if (action === 'confirm' && existing.email) {
      sendClientConfirmation({
        booking_id:          existing.booking_id,
        name:                existing.name,
        email:               existing.email,
        service:             existing.service,
        appointment_date:    existing.appointment_date,
        time_slot:           existing.time_slot,
        confirmed_time_slot: confirmed_time_slot ?? existing.confirmed_time_slot,
        mode:                existing.mode,
        meet_link:           meet_link ?? existing.meet_link,
      }).catch(err => console.error('Confirmation email error:', err));
    }

    // ── Cancellation email ────────────────────────────────────────────
    console.log(`[PATCH] action=${action} email=${existing.email} booking=${existing.booking_id}`);
    if (action === 'cancel' && existing.email) {
      console.log(`[EMAIL] Sending cancellation to ${existing.email}`);
      sendCancellationEmail({
        booking_id:       existing.booking_id,
        name:             existing.name,
        email:            existing.email,
        service:          existing.service,
        appointment_date: existing.appointment_date,
        time_slot:        existing.time_slot,
      }).then(() => console.log(`[EMAIL] Cancellation sent OK to ${existing.email}`))
        .catch(err => console.error('[EMAIL] Cancellation FAILED:', err));
    } else if (action === 'cancel') {
      console.log('[EMAIL] Skipped — no email on booking');
    }

    // ── Auto-unblock slot on cancel ───────────────────────────────────
    if (action === 'cancel') {
      const db2 = createServerClient();
      db2.from('blocked_slots')
        .delete()
        .eq('slot_date', existing.appointment_date)
        .eq('time_slot', existing.time_slot)
        .then(() => console.log(`[SLOT] Unblocked ${existing.appointment_date} ${existing.time_slot}`))
        .catch(err => console.warn('[SLOT] Unblock failed:', err?.message));
    }

    return NextResponse.json({ booking: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const db = createServerClient();
  const { data, error } = await db.from('bookings').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ booking: data });
}
