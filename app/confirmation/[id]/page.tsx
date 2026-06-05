'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Booking } from '@/lib/supabase';
import { buildClientConfirmationWhatsAppUrl } from '@/lib/whatsapp';

function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(m)-1]} ${y}`;
}

const MODE_LABELS: Record<string, string> = {
  phone:       'Phone Call',
  video:       'Video Call (Google Meet)',
  'in-person': 'In-Person — Greater Noida West',
};

export default function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    params.then(({ id }) => {
      setBookingId(id);
      supabase.from('bookings').select('*').eq('booking_id', id).single()
        .then(({ data }) => { setBooking(data); setLoading(false); });
    });
  }, [params]);

  if (loading) return (
    <div className="confirmation-page">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 44, height: 44, margin: '0 auto' }} />
        <p style={{ marginTop: 16, fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: '2px', color: 'var(--brown-mid)' }}>Loading…</p>
      </div>
    </div>
  );

  if (!booking) return (
    <div className="confirmation-page">
      <div className="confirmation-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>◈</div>
        <h2 style={{ fontFamily: 'var(--font-deco)', color: 'var(--brown)', marginBottom: 12 }}>Booking Not Found</h2>
        <p style={{ color: 'var(--brown-mid)', marginBottom: 24, fontStyle: 'italic' }}>
          Could not find booking <strong>{bookingId}</strong>
        </p>
        <Link href="/book" className="btn-rust">Book Again</Link>
      </div>
    </div>
  );

  const whatsappUrl = buildClientConfirmationWhatsAppUrl(booking, booking.phone);

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-icon-wrap">✓</div>
        <h1 className="confirmation-title">Booking Received!</h1>
        <p className="confirmation-sub">
          Your consultation request has been submitted successfully.
          Our team will contact you on WhatsApp to confirm.
        </p>
        <div className="confirmation-booking-id">{booking.booking_id}</div>

        <div className="conf-rows">
          {([
            ['Name',          booking.name],
            ['Phone',         `+91 ${booking.phone}`],
            ['Service',       booking.service],
            ['Date',          formatDate(booking.appointment_date)],
            ['Time',          booking.time_slot],
            ['Mode',          MODE_LABELS[booking.mode] || booking.mode],
            ['Date of Birth', formatDate(booking.dob)],
            ['Time of Birth', booking.tob || 'Not provided'],
            ['Birth City',    booking.birth_city],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="conf-row">
              <span className="conf-key">{k}</span>
              <span className="conf-val">{v}</span>
            </div>
          ))}
        </div>

        {/* What happens next */}
        <div className="conf-info">
          <strong>What happens next?</strong><br />
          Pandit ji&apos;s team will contact you on WhatsApp at <strong>+91 {booking.phone}</strong>{' '}
          within 2–4 hours to confirm your appointment and discuss the consultation fee.
        </div>

        {/* Mode-specific info */}
        {booking.mode === 'in-person' && (
          <div className="conf-info">
            <strong>Office Address:</strong><br />
            1503, Tower I, Rajhans Residency,<br />
            Bishrakh Jalalpur, Sector 1,<br />
            Greater Noida West – 201308, UP
          </div>
        )}
        {booking.mode === 'video' && booking.meet_link && (
          <div className="conf-info">
            <strong>Google Meet Link:</strong>{' '}
            <a href={booking.meet_link} target="_blank" rel="noreferrer" style={{ color: 'var(--rust)' }}>
              {booking.meet_link}
            </a>
          </div>
        )}
        {booking.mode === 'video' && !booking.meet_link && (
          <div className="conf-info">
            A <strong>Google Meet link</strong> will be shared on WhatsApp before your session.
          </div>
        )}
        {booking.mode === 'phone' && (
          <div className="conf-info">
            We will call you on <strong>+91 {booking.phone}</strong> at the confirmed time. Please keep your phone available.
          </div>
        )}

        <div className="conf-actions">
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-rust">Share on WhatsApp</a>
          <a href={`https://wa.me/919643437281?text=${encodeURIComponent(`Namaste, I have a query about my booking ${booking.booking_id}`)}`}
            target="_blank" rel="noreferrer" className="btn-outline-rust">Contact Pandit ji</a>
          <Link href="/" className="btn-ghost-rust" style={{ textAlign: 'center' }}>Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
