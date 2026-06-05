'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SERVICES, TIME_SLOTS, CONSULTATION_MODES, OFFICE } from '@/lib/constants';
import { Icon } from '@/components/Icon';

type FormData = {
  name: string; phone: string; email: string; dob: string; tob: string; birth_city: string;
  service: string; appointment_date: string; time_slot: string; mode: string; query: string;
};

const today   = new Date().toISOString().split('T')[0];
const maxDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(m) - 1]} ${y}`;
}

function modeLabel(m: string) {
  return CONSULTATION_MODES.find(x => x.value === m)?.label || m;
}

const STEPS = ['Personal Info', 'Appointment', 'Review & Confirm'];

export default function BookPage() {
  const router = useRouter();
  const [step, setStep]           = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]       = useState<Partial<FormData>>({});
  const [stepError, setStepError] = useState('');
  const [form, setForm]           = useState<FormData>({
    name: '', phone: '', email: '', dob: '', tob: '', birth_city: '',
    service: '', appointment_date: '', time_slot: '', mode: '', query: '',
  });
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [dayBlocked, setDayBlocked]     = useState(false);

  // Fetch blocked slots whenever date changes
  useEffect(() => {
    if (!form.appointment_date) { setBlockedSlots([]); setDayBlocked(false); return; }
    fetch(`/api/availability?date=${form.appointment_date}`)
      .then(r => r.json())
      .then(d => { setBlockedSlots(d.blocked || []); setDayBlocked(d.dayBlocked || false); })
      .catch(() => {});
  }, [form.appointment_date]);

  function set(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
    setStepError('');
  }

  function validateStep1(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.match(/^[6-9]\d{9}$/)) errs.phone = 'Enter valid 10-digit mobile number';
    if (!form.dob) errs.dob = 'Date of birth is required';
    if (!form.birth_city.trim()) errs.birth_city = 'Birth city is required';
    setErrors(errs);
    const failed = Object.keys(errs).length > 0;
    if (failed) {
      setStepError('Please fill all required fields highlighted below.');
      setTimeout(() => document.querySelector('.form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
    return !failed;
  }

  function validateStep2(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.service)          errs.service = 'Please select a service';
    if (!form.appointment_date) errs.appointment_date = 'Please select a date';
    if (!form.time_slot)        errs.time_slot = 'Please click a time slot';
    if (!form.mode)             errs.mode = 'Please select a consultation mode';
    setErrors(errs);
    const failed = Object.keys(errs).length > 0;
    if (failed) {
      const missing: string[] = [];
      if (errs.service)          missing.push('Service');
      if (errs.appointment_date) missing.push('Date');
      if (errs.time_slot)        missing.push('Time Slot');
      if (errs.mode)             missing.push('Consultation Mode');
      setStepError(`Still needed: ${missing.join(' · ')}`);
      setTimeout(() => document.querySelector('.step-error-banner')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
    return !failed;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit booking');
      }
      const data = await res.json();
      router.push(`/confirmation/${data.booking_id}`);
    } catch (e: unknown) {
      alert((e as Error).message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const selectedMode = CONSULTATION_MODES.find(m => m.value === form.mode);

  return (
    <div className="booking-page">
      <Link href="/" className="back-link">
        <Icon name="arrow-left" size={14} /> Back to Home
      </Link>

      <div className="booking-page-header">
        <p className="booking-eyebrow">Vedic Consultation</p>
        <h1>Book Your Reading</h1>
        <p style={{ color: 'var(--brown-mid)', fontStyle: 'italic', fontSize: 16 }}>
          Fill in your details — our team will confirm via WhatsApp
        </p>
      </div>

      {/* Step Indicator */}
      <div className="booking-steps" style={{ maxWidth: 820, margin: '0 auto 28px' }}>
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`booking-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
              <div className="booking-step-circle">
                {step > i + 1 ? <Icon name="check" size={15} stroke="#fff" /> : i + 1}
              </div>
              <div className="booking-step-label">{label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`booking-step-line ${step > i + 1 ? 'done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Personal Info ── */}
      {step === 1 && (
        <div className="booking-card">
          <div className="booking-card-header">
            <h2>Personal Information</h2>
            <p>Tell us about yourself for an accurate reading</p>
          </div>
          <div className="booking-card-body">
            {stepError && (
              <div className="step-error-banner">
                <Icon name="x" size={14} stroke="#9a3e18" /> {stepError}
              </div>
            )}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name <span className="req">*</span></label>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="As per Kundli (e.g. Rahul Sharma)" autoComplete="name" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp Number <span className="req">*</span></label>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="10-digit mobile number" maxLength={10} type="tel" inputMode="numeric" />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
              <div className="form-group full">
                <label className="form-label">Email Address <span style={{ opacity: 0.5, fontStyle: 'italic', fontWeight: 400 }}>(optional — for booking confirmation)</span></label>
                <input className="form-input" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="your@email.com" type="email" autoComplete="email" />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth <span className="req">*</span></label>
                <input className="form-input" type="date" value={form.dob}
                  onChange={e => set('dob', e.target.value)} max={today} min="1920-01-01" />
                {errors.dob && <span className="form-error">{errors.dob}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Time of Birth</label>
                <input className="form-input" type="time" value={form.tob} onChange={e => set('tob', e.target.value)} />
                <span className="form-hint">Leave blank if unknown — mention in query</span>
              </div>
              <div className="form-group full">
                <label className="form-label">Birth City <span className="req">*</span></label>
                <input className="form-input" value={form.birth_city} onChange={e => set('birth_city', e.target.value)}
                  placeholder="City where you were born (e.g. Lucknow, Uttar Pradesh)" autoComplete="off" />
                {errors.birth_city && <span className="form-error">{errors.birth_city}</span>}
              </div>
            </div>
            <div className="form-nav">
              <span />
              <button type="button" className="btn-rust"
                onClick={() => { if (validateStep1()) { setStepError(''); setStep(2); } }}>
                Continue <Icon name="arrow-right" size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Appointment ── */}
      {step === 2 && (
        <div className="booking-card">
          <div className="booking-card-header">
            <h2>Appointment Details</h2>
            <p>Choose your service, date, time &amp; consultation mode</p>
          </div>
          <div className="booking-card-body">
            {stepError && (
              <div className="step-error-banner">
                <Icon name="x" size={14} stroke="#9a3e18" /> {stepError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div className="form-group">
                <label className="form-label">Select Service <span className="req">*</span></label>
                <select className="form-select" value={form.service} onChange={e => set('service', e.target.value)}>
                  <option value="">— Choose a service —</option>
                  {SERVICES.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
                {errors.service && <span className="form-error">{errors.service}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Date <span className="req">*</span></label>
                <input className="form-input" type="date" value={form.appointment_date}
                  onChange={e => { set('appointment_date', e.target.value); set('time_slot', ''); }} min={today} max={maxDate} />
                {dayBlocked && (
                  <div className="step-error-banner" style={{ marginTop: 8 }}>
                    <Icon name="x" size={14} stroke="#9a3e18" /> Pandit ji is not available on this date. Please choose another date.
                  </div>
                )}
                {errors.appointment_date && <span className="form-error">{errors.appointment_date}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Select Time Slot <span className="req">*</span></label>
                <div className="slot-grid">
                  {TIME_SLOTS.map(slot => {
                    const isBlocked = blockedSlots.includes(slot) || dayBlocked;
                    return (
                      <button key={slot} type="button"
                        className={`slot-btn ${form.time_slot === slot ? 'selected' : ''} ${isBlocked ? 'blocked' : ''}`}
                        onClick={() => !isBlocked && set('time_slot', slot)}
                        disabled={isBlocked}
                        title={isBlocked ? 'Not available' : ''}
                        style={{ textDecoration: isBlocked ? 'line-through' : 'none', opacity: isBlocked ? 0.4 : 1, cursor: isBlocked ? 'not-allowed' : 'pointer' }}>
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {errors.time_slot && <span className="form-error">{errors.time_slot}</span>}
              </div>

              {/* ── Consultation Mode — 3 options ── */}
              <div className="form-group">
                <label className="form-label">Consultation Mode <span className="req">*</span></label>
                <div className="mode-grid-3">
                  {CONSULTATION_MODES.map(m => (
                    <div key={m.value}
                      className={`mode-card ${form.mode === m.value ? 'selected' : ''}`}
                      onClick={() => set('mode', m.value)}
                      role="button" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && set('mode', m.value)}>
                      <div className="mode-card-icon-wrap">
                        <Icon name={m.icon} size={24}
                          stroke={form.mode === m.value ? 'var(--rust)' : 'var(--brown-mid)'} />
                      </div>
                      <div className="mode-card-title">{m.label}</div>
                      <div className="mode-card-desc">{m.desc}</div>
                    </div>
                  ))}
                </div>
                {errors.mode && <span className="form-error">{errors.mode}</span>}
              </div>

              {/* In-person address info */}
              {form.mode === 'in-person' && (
                <div className="info-box">
                  <strong style={{ fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '2px', color: 'var(--rust)', display: 'block', marginBottom: 8 }}>
                    OFFICE ADDRESS
                  </strong>
                  <span style={{ whiteSpace: 'pre-line', lineHeight: 1.9 }}>{OFFICE.address}</span>
                </div>
              )}

              {/* Phone info */}
              {form.mode === 'phone' && (
                <div className="info-box">
                  We will call you on your WhatsApp number <strong>+91 {form.phone || '___'}</strong> at the selected time.
                  Please keep your phone available.
                </div>
              )}

              {/* Video info */}
              {form.mode === 'video' && (
                <div className="info-box">
                  A <strong>Google Meet link</strong> will be sent to your WhatsApp before the session.
                  Please ensure a stable internet connection.
                </div>
              )}

            </div>

            <div className="form-nav">
              <button type="button" className="btn-ghost-rust" onClick={() => { setStepError(''); setStep(1); }}>
                <Icon name="arrow-left" size={14} /> Back
              </button>
              <button type="button" className="btn-rust"
                onClick={() => { if (validateStep2()) { setStepError(''); setStep(3); } }}>
                Continue <Icon name="arrow-right" size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Confirm ── */}
      {step === 3 && (
        <div className="booking-card">
          <div className="booking-card-header">
            <h2>Review &amp; Confirm</h2>
            <p>Verify your details — our team will contact you on WhatsApp to confirm</p>
          </div>
          <div className="booking-card-body">

            {/* Summary */}
            <div className="booking-summary">
              {([
                ['Name',          form.name],
                ['Phone',         `+91 ${form.phone}`],
                ...(form.email ? [['Email', form.email] as [string, string]] : []),
                ['Date of Birth', formatDate(form.dob)],
                ['Time of Birth', form.tob || 'Not provided'],
                ['Birth City',    form.birth_city],
                ['Service',          form.service],
                ['Date',             formatDate(form.appointment_date)],
                ['Time Slot',        form.time_slot],
                ['Mode',             modeLabel(form.mode)],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="summary-row">
                  <span className="summary-label">{k}</span>
                  <span className="summary-value">{v}</span>
                </div>
              ))}
            </div>

            {/* What happens next */}
            <div className="info-box" style={{ marginBottom: 20 }}>
              <strong>What happens next?</strong><br />
              After submitting, Pandit ji&apos;s team will contact you on WhatsApp at{' '}
              <strong>+91 {form.phone}</strong> to confirm your appointment, discuss the consultation
              fee, and — if Video Call — share the Google Meet link.
            </div>

            {/* Optional query */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Your Query / Specific Questions <span style={{ opacity: 0.5, fontStyle: 'italic' }}>(optional)</span></label>
              <textarea
                className="form-textarea"
                value={form.query}
                onChange={e => set('query', e.target.value)}
                placeholder="Describe what you'd like guidance on — career decisions, marriage prospects, health concerns, a specific question…"
                rows={4}
              />
            </div>

            <div className="form-nav">
              <button type="button" className="btn-ghost-rust" onClick={() => { setStepError(''); setStep(2); }}>
                <Icon name="arrow-left" size={14} /> Back
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ maxWidth: 240 }}
              >
                {submitting
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="spinner" style={{ width: 17, height: 17, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                      Submitting…
                    </span>
                  : <>Confirm Booking <Icon name="check" size={15} stroke="#fff" /></>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
