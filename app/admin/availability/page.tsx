'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TIME_SLOTS } from '@/lib/constants';

interface BlockedRecord { id: string; slot_date: string; time_slot: string | null; reason?: string; }

const today = new Date().toISOString().split('T')[0];

function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(m)-1]} ${y}`;
}

export default function AvailabilityPage() {
  const [date, setDate]             = useState(today);
  const [records, setRecords]       = useState<BlockedRecord[]>([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState<string | null>(null);
  const [toast, setToast]           = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const fetchSlots = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    const res = await fetch(`/api/availability?date=${date}`);
    const data = await res.json();
    setRecords(data.records || []);
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const dayRecord   = records.find(r => !r.time_slot);
  const dayBlocked  = !!dayRecord;
  const blockedSet  = new Set(records.filter(r => !!r.time_slot).map(r => r.time_slot as string));

  async function toggleDay() {
    setSaving('day');
    if (dayBlocked) {
      await fetch('/api/availability', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: dayRecord!.id }) });
      showToast(`${formatDate(date)} is now available`);
    } else {
      await fetch('/api/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot_date: date }) });
      showToast(`${formatDate(date)} is now fully blocked`);
    }
    await fetchSlots();
    setSaving(null);
  }

  async function toggleSlot(slot: string) {
    setSaving(slot);
    const existing = records.find(r => r.time_slot === slot);
    if (existing) {
      await fetch('/api/availability', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing.id }) });
      showToast(`${slot} is now available`);
    } else {
      await fetch('/api/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot_date: date, time_slot: slot }) });
      showToast(`${slot} is now blocked`);
    }
    await fetchSlots();
    setSaving(null);
  }

  return (
    <div className="admin-layout">
      {toast && (
        <div className="toast-container">
          <div className="toast success"><span>✓</span><span className="toast-msg">{toast}</span></div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-text">AstroPathak</div>
          <div className="admin-sidebar-logo-sub">Admin Panel</div>
        </div>
        <nav className="admin-nav">
          <Link href="/admin/dashboard" className="admin-nav-item">
            <span className="admin-nav-icon">◈</span> Dashboard
          </Link>
          <span className="admin-nav-item active">
            <span className="admin-nav-icon">◷</span> Availability
          </span>
          <Link href="/" className="admin-nav-item">
            <span className="admin-nav-icon">◻</span> View Website
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <div className="admin-topbar">
          <span className="admin-topbar-title">Manage Availability</span>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '2px', color: 'var(--brown-mid)' }}>
            Block dates &amp; time slots
          </span>
        </div>

        <div className="admin-content">
          {/* Date picker card */}
          <div className="table-wrap" style={{ padding: '28px 32px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label style={{ fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '2px', color: 'var(--brown-mid)', display: 'block', marginBottom: 8 }}>
                  SELECT DATE
                </label>
                <input
                  type="date"
                  className="admin-filter-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={{ fontSize: 15, padding: '10px 14px', width: '100%' }}
                />
              </div>

              <div style={{ paddingTop: 24 }}>
                <button
                  className={dayBlocked ? 'btn-rust' : 'btn-ghost-rust'}
                  onClick={toggleDay}
                  disabled={saving === 'day' || loading}
                  style={{
                    fontSize: 11, padding: '10px 20px', letterSpacing: '1.5px',
                    background: dayBlocked ? 'var(--rust)' : undefined,
                    color: dayBlocked ? '#fff' : undefined,
                    minWidth: 200,
                  }}
                >
                  {saving === 'day'
                    ? '…'
                    : dayBlocked
                    ? `✗ Unblock ${formatDate(date)}`
                    : `✗ Block Entire Day — ${formatDate(date)}`}
                </button>
              </div>
            </div>

            {dayBlocked && (
              <div className="info-box" style={{ marginTop: 20, background: 'rgba(154,62,24,0.06)', borderColor: 'rgba(154,62,24,0.25)' }}>
                <strong style={{ color: 'var(--rust)' }}>Entire day is blocked.</strong> Clients cannot book any slot on {formatDate(date)}.
                Click the button above to unblock.
              </div>
            )}
          </div>

          {/* Time slots grid */}
          <div className="table-wrap" style={{ padding: '28px 32px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '2px', color: 'var(--brown-mid)', marginBottom: 20 }}>
              TIME SLOTS — {formatDate(date)}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                  {TIME_SLOTS.map(slot => {
                    const isBlocked = blockedSet.has(slot) || dayBlocked;
                    const isSaving  = saving === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => !dayBlocked && toggleSlot(slot)}
                        disabled={isSaving || loading || dayBlocked}
                        style={{
                          padding: '12px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${isBlocked ? 'rgba(154,62,24,0.4)' : 'var(--border)'}`,
                          background: isBlocked ? 'rgba(154,62,24,0.08)' : 'var(--cream)',
                          color: isBlocked ? 'var(--rust-dk)' : 'var(--brown)',
                          fontFamily: 'var(--font-head)',
                          fontSize: 11,
                          letterSpacing: '1px',
                          cursor: dayBlocked ? 'not-allowed' : 'pointer',
                          opacity: dayBlocked && !blockedSet.has(slot) ? 0.4 : 1,
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          textDecoration: isBlocked ? 'line-through' : 'none',
                        }}
                      >
                        {isSaving ? '…' : isBlocked ? `✗ ${slot}` : `✓ ${slot}`}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--brown-mid)', fontStyle: 'italic' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--cream)', border: '1.5px solid var(--border)', display: 'inline-block' }} />
                    Available — clients can book
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(154,62,24,0.08)', border: '1.5px solid rgba(154,62,24,0.4)', display: 'inline-block' }} />
                    Blocked — hidden from booking form
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
