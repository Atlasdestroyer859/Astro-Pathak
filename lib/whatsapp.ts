import { Booking } from './supabase';

const ADMIN_PHONE = process.env.NEXT_PUBLIC_ADMIN_PHONE || '9643437281';

const MODE_TEXT: Record<string, string> = {
  phone:       '📞 Phone Call',
  video:       '📹 Video Call (Google Meet)',
  'in-person': '🏛️ In-Person — Greater Noida West',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(month) - 1]} ${year}`;
}

/** Admin self-notification when a new booking comes in */
export function buildAdminWhatsAppUrl(booking: Booking): string {
  const message = `🔔 *NEW BOOKING — Astro Pathak*

📋 *Booking ID:* ${booking.booking_id}
👤 *Name:* ${booking.name}
📱 *Phone:* +91 ${booking.phone}
⭐ *Service:* ${booking.service}
📅 *Date:* ${formatDate(booking.appointment_date)}
⏰ *Time:* ${booking.time_slot}
🎯 *Mode:* ${MODE_TEXT[booking.mode] || booking.mode}
🎂 *DOB:* ${formatDate(booking.dob)}
⏱️ *TOB:* ${booking.tob || 'Not provided'}
🏙️ *Birth City:* ${booking.birth_city}

📝 *Query:* ${booking.query || 'None'}

Open admin dashboard to confirm or cancel.`;

  return `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
}

/** Send to CLIENT — booking confirmed */
export function buildConfirmWhatsAppUrl(booking: Booking): string {
  const confirmedTime = booking.confirmed_time_slot || booking.time_slot;
  const timeChanged   = booking.confirmed_time_slot && booking.confirmed_time_slot !== booking.time_slot;

  let modeDetails = '';
  if (booking.mode === 'video') {
    modeDetails = booking.meet_link
      ? `🔗 *Google Meet:* ${booking.meet_link}`
      : '🔗 Google Meet link will be shared before the session';
  } else if (booking.mode === 'phone') {
    modeDetails = `📞 We will call you on *+91 ${booking.phone}* at the confirmed time`;
  } else {
    modeDetails = `📍 *Office:* 1503, Tower I, Rajhans Residency, Greater Noida West – 201308`;
  }

  const timeNote = timeChanged ? `\n⏰ *Note:* Time changed from ~${booking.time_slot}~ to *${confirmedTime}*` : '';

  const message = `✅ *Booking Confirmed — Astro Pathak*

Namaste *${booking.name}* Ji! 🙏

Your consultation has been confirmed.${timeNote}

📋 *Booking ID:* ${booking.booking_id}
⭐ *Service:* ${booking.service}
📅 *Date:* ${formatDate(booking.appointment_date)}
⏰ *Time:* ${confirmedTime}
🎯 *Mode:* ${MODE_TEXT[booking.mode] || booking.mode}
${modeDetails}

💬 *Consultation fee will be discussed before the session.*

For queries: *+91 ${ADMIN_PHONE}*

_Astro Pathak — Pandit H.R. Pathak_
_ज्योतिष से जीवन को रोशन करें_ 🌟`;

  return `https://wa.me/91${booking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

/** Send to CLIENT — booking cancelled */
export function buildCancelWhatsAppUrl(booking: Booking): string {
  const message = `❌ *Booking Cancelled — Astro Pathak*

Namaste *${booking.name}* Ji,

We regret to inform you that your booking has been cancelled.

📋 *Booking ID:* ${booking.booking_id}
⭐ *Service:* ${booking.service}
📅 *Date:* ${formatDate(booking.appointment_date)}
⏰ *Time:* ${booking.time_slot}

If you wish to reschedule, please book again at our website or contact us directly.

📞 *+91 ${ADMIN_PHONE}*

_Astro Pathak — Pandit H.R. Pathak_
_ज्योतिष से जीवन को रोशन करें_ 🌟`;

  return `https://wa.me/91${booking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

/** Legacy — kept for backward compat */
export function buildClientConfirmationWhatsAppUrl(booking: Booking, _phone: string): string {
  return buildConfirmWhatsAppUrl(booking);
}
