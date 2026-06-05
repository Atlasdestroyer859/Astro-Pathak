import nodemailer from 'nodemailer';

const EMAIL_USER  = process.env.EMAIL_USER;
const EMAIL_PASS  = process.env.EMAIL_PASS; // Gmail App Password
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || EMAIL_USER;

/** Returns null if email is not configured — callers must handle gracefully */
function createTransport() {
  if (!EMAIL_USER || !EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

function formatDate(d: string) {
  if (!d) return d;
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(m)-1]} ${y}`;
}

/** Send booking confirmation to the client */
export async function sendClientConfirmation(booking: {
  booking_id: string; name: string; email?: string;
  service: string; appointment_date: string; time_slot: string;
  confirmed_time_slot?: string | null; mode: string; meet_link?: string | null;
}) {
  if (!booking.email) return; // email not collected
  const transport = createTransport();
  if (!transport) return;

  const confirmedTime = booking.confirmed_time_slot || booking.time_slot;
  const timeChanged   = booking.confirmed_time_slot && booking.confirmed_time_slot !== booking.time_slot;
  const meetLink      = booking.meet_link;

  await transport.sendMail({
    from: `"Astro Pathak" <${EMAIL_USER}>`,
    to: booking.email,
    subject: `Booking Confirmed — ${booking.booking_id} | Astro Pathak`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2c1810; background: #f5e8c8; padding: 40px 32px; border-radius: 8px;">
        <h1 style="font-family: 'Cinzel Decorative', serif; color: #c4622d; font-size: 24px; margin-bottom: 4px;">Astro Pathak</h1>
        <p style="font-size: 12px; letter-spacing: 2px; color: #8a6008; margin-bottom: 32px;">VEDIC JYOTISH GUIDANCE</p>

        <h2 style="color: #2c1810; font-size: 20px;">✅ Your Booking is Confirmed!</h2>
        <p>Namaste <strong>${booking.name}</strong>,</p>
        <p style="line-height: 1.8;">Your consultation has been confirmed by Pandit H.R. Pathak. We look forward to speaking with you.</p>

        ${timeChanged ? `<div style="background: #fff8e8; border-left: 3px solid #c4622d; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-style: italic; color: #5a2d14;">⏰ <strong>Note:</strong> Your time has been adjusted from <del>${booking.time_slot}</del> to <strong>${confirmedTime}</strong></div>` : ''}

        <div style="background: white; border-radius: 6px; padding: 20px 24px; margin: 24px 0; border-left: 3px solid #c4622d;">
          <table style="width: 100%; font-size: 15px; line-height: 2;">
            <tr><td style="color: #8a6008; font-size: 11px; letter-spacing: 1px;">BOOKING ID</td><td><strong style="color: #c4622d;">${booking.booking_id}</strong></td></tr>
            <tr><td style="color: #8a6008; font-size: 11px; letter-spacing: 1px;">SERVICE</td><td>${booking.service}</td></tr>
            <tr><td style="color: #8a6008; font-size: 11px; letter-spacing: 1px;">DATE</td><td>${formatDate(booking.appointment_date)}</td></tr>
            <tr><td style="color: #8a6008; font-size: 11px; letter-spacing: 1px;">TIME</td><td><strong>${confirmedTime}</strong></td></tr>
            <tr><td style="color: #8a6008; font-size: 11px; letter-spacing: 1px;">MODE</td><td>${booking.mode}</td></tr>
            ${meetLink ? `<tr><td style="color: #8a6008; font-size: 11px; letter-spacing: 1px;">MEET LINK</td><td><a href="${meetLink}" style="color: #c4622d;">${meetLink}</a></td></tr>` : ''}
          </table>
        </div>

        ${booking.mode === 'video'
          ? '<p style="color: #5a2d14; font-style: italic;">A Google Meet link will be shared on WhatsApp before your session.</p>'
          : booking.mode === 'phone'
          ? '<p style="color: #5a2d14; font-style: italic;">We will call you at your confirmed appointment time.</p>'
          : '<p style="color: #5a2d14; font-style: italic;">Office: 1503, Tower I, Rajhans Residency, Greater Noida West – 201308</p>'
        }

        <p style="margin-top: 24px;">For queries, WhatsApp us at <strong>+91 9643437281</strong></p>
        <p style="font-style: italic; color: #8a6008; margin-top: 32px;">॥ ज्योतिष से जीवन को रोशन करें ॥</p>
        <hr style="border: none; border-top: 1px solid rgba(180,120,40,0.3); margin: 24px 0;" />
        <p style="font-size: 12px; color: #7a4a28;">Astro Pathak — For spiritual guidance purposes only.</p>
      </div>
    `,
  });
}

/** Notify admin of a new booking */
export async function sendAdminNotification(booking: {
  booking_id: string; name: string; phone: string;
  service: string; appointment_date: string; time_slot: string; mode: string;
}) {
  const transport = createTransport();
  if (!transport || !ADMIN_EMAIL) return;

  await transport.sendMail({
    from: `"Astro Pathak System" <${EMAIL_USER}>`,
    to: ADMIN_EMAIL,
    subject: `New Booking ${booking.booking_id} — ${booking.service}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; color: #2c1810; padding: 32px; background: #fdf4e0; border-radius: 8px;">
        <h2 style="color: #c4622d;">New Booking Received</h2>
        <table style="width: 100%; font-size: 15px; line-height: 2.2; margin-top: 16px;">
          <tr><td><strong>ID</strong></td><td style="color: #c4622d;">${booking.booking_id}</td></tr>
          <tr><td><strong>Client</strong></td><td>${booking.name}</td></tr>
          <tr><td><strong>Phone</strong></td><td>+91 ${booking.phone}</td></tr>
          <tr><td><strong>Service</strong></td><td>${booking.service}</td></tr>
          <tr><td><strong>Date</strong></td><td>${formatDate(booking.appointment_date)}</td></tr>
          <tr><td><strong>Time</strong></td><td>${booking.time_slot}</td></tr>
          <tr><td><strong>Mode</strong></td><td>${booking.mode}</td></tr>
        </table>
        <p style="margin-top: 24px;"><a href="http://localhost:3000/admin/dashboard" style="color: #c4622d;">Open Admin Dashboard →</a></p>
      </div>
    `,
  });
}

/** Send cancellation notice to the client */
export async function sendCancellationEmail(booking: {
  booking_id: string; name: string; email?: string | null;
  service: string; appointment_date: string; time_slot: string;
}) {
  if (!booking.email) return;
  const transport = createTransport();
  if (!transport) return;

  await transport.sendMail({
    from: `"Astro Pathak" <${EMAIL_USER}>`,
    to: booking.email,
    subject: `Booking Cancelled — ${booking.booking_id} | Astro Pathak`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2c1810; background: #f5e8c8; padding: 40px 32px; border-radius: 8px;">
        <h1 style="font-family: 'Cinzel Decorative', serif; color: #c4622d; font-size: 24px; margin-bottom: 4px;">Astro Pathak</h1>
        <p style="font-size: 12px; letter-spacing: 2px; color: #8a6008; margin-bottom: 32px;">VEDIC JYOTISH GUIDANCE</p>

        <h2 style="color: #2c1810; font-size: 20px;">❌ Booking Cancelled</h2>
        <p>Namaste <strong>${booking.name}</strong>,</p>
        <p style="line-height: 1.8;">We regret to inform you that your consultation booking has been cancelled.</p>

        <div style="background: white; border-radius: 6px; padding: 20px 24px; margin: 24px 0; border-left: 3px solid #9a3e18;">
          <table style="width: 100%; font-size: 15px; line-height: 2;">
            <tr><td style="color: #8a6008; font-size: 11px; letter-spacing: 1px;">BOOKING ID</td><td><strong style="color: #9a3e18;">${booking.booking_id}</strong></td></tr>
            <tr><td style="color: #8a6008; font-size: 11px; letter-spacing: 1px;">SERVICE</td><td>${booking.service}</td></tr>
            <tr><td style="color: #8a6008; font-size: 11px; letter-spacing: 1px;">DATE</td><td>${formatDate(booking.appointment_date)}</td></tr>
            <tr><td style="color: #8a6008; font-size: 11px; letter-spacing: 1px;">TIME</td><td>${booking.time_slot}</td></tr>
          </table>
        </div>

        <p style="line-height: 1.8;">If you'd like to reschedule, please visit our website or WhatsApp us at <strong>+91 9643437281</strong>.</p>
        <p style="font-style: italic; color: #8a6008; margin-top: 32px;">॥ ज्योतिष से जीवन को रोशन करें ॥</p>
        <hr style="border: none; border-top: 1px solid rgba(180,120,40,0.3); margin: 24px 0;" />
        <p style="font-size: 12px; color: #7a4a28;">Astro Pathak — For spiritual guidance purposes only.</p>
      </div>
    `,
  });
}
