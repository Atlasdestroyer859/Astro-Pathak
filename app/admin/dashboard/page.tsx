'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Booking } from '@/lib/supabase';
import { buildAdminWhatsAppUrl, buildConfirmWhatsAppUrl, buildCancelWhatsAppUrl } from '@/lib/whatsapp';
import { TIME_SLOTS } from '@/lib/constants';

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-pending', confirmed: 'badge-confirmed',
  cancelled: 'badge-cancelled', completed: 'badge-confirmed',
};

const MODE_LABELS: Record<string, string> = {
  phone: '📞 Phone', video: '📹 Video', 'in-person': '🏛️ In-Person',
};

function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(m)-1]} ${y}`;
}

interface Toast { id: number; msg: string; type: 'success' | 'error'; }

/* ── Excel Export ─────────────────────────────────────────────────── */
async function exportToExcel(bookings: Booking[]) {
  const XLSX = await import('xlsx');
  const rows = bookings.map(b => ({
    'Booking ID':    b.booking_id,
    'Name':          b.name,
    'Phone':         `+91 ${b.phone}`,
    'Date of Birth': b.dob,
    'Time of Birth': b.tob || '',
    'Birth City':    b.birth_city,
    'Service':       b.service,
    'Date':          b.appointment_date,
    'Time Slot':     b.time_slot,
    'Mode':          b.mode,
    'Status':        b.status,
    'Query':         b.query || '',
    'Meet Link':     b.meet_link || '',
    'Admin Notes':   b.admin_notes || '',
    'Booked On':     b.created_at ? new Date(b.created_at).toLocaleString('en-IN') : '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  // Column widths
  ws['!cols'] = [
    { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 12 },
    { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 40 }, { wch: 36 }, { wch: 30 }, { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
  const filename = `AstroPathak_Bookings_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_ADMIN_BYPASS === 'true';

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [filterDate, setFilterDate]   = useState('');
  const [filterMode, setFilterMode]   = useState('all');
  const [selected, setSelected]       = useState<Booking | null>(null);
  const [meetLink, setMeetLink]       = useState('');
  const [adminNotes, setAdminNotes]   = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [toasts, setToasts]           = useState<Toast[]>([]);
  const [realtimePulse, setRealtimePulse] = useState(false);
  const [exporting, setExporting]     = useState(false);

  const toast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const fetchBookings = useCallback(async () => {
    if (DEV_MODE) {
      // Show mock bookings in dev mode so dashboard looks functional
      setBookings([
        {
          id: 'mock-1', booking_id: 'AP-2026-0001', name: 'Priya Sharma', phone: '9876543210',
          dob: '1990-06-15', tob: '08:30', birth_city: 'Delhi',
          service: 'Kundli Analysis', appointment_date: new Date().toISOString().split('T')[0],
          time_slot: '10:00 AM', mode: 'video', status: 'pending',
          query: 'Looking for career guidance', created_at: new Date().toISOString(),
        } as Booking,
        {
          id: 'mock-2', booking_id: 'AP-2026-0002', name: 'Rakesh Gupta', phone: '9812345678',
          dob: '1985-03-22', tob: '', birth_city: 'Noida',
          service: 'Marriage Compatibility', appointment_date: new Date().toISOString().split('T')[0],
          time_slot: '02:00 PM', mode: 'phone', status: 'confirmed',
          query: '', created_at: new Date(Date.now() - 86400000).toISOString(),
        } as Booking,
        {
          id: 'mock-3', booking_id: 'AP-2026-0003', name: 'Sunita Verma', phone: '9654321098',
          dob: '1995-11-08', tob: '14:15', birth_city: 'Lucknow',
          service: 'Career & Finance', appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time_slot: '11:00 AM', mode: 'in-person', status: 'pending',
          query: 'Business expansion in 2026', created_at: new Date(Date.now() - 3600000).toISOString(),
        } as Booking,
      ]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    setBookings(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!DEV_MODE) {
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) router.push('/admin/login');
      });
    }
    fetchBookings();
    if (!DEV_MODE) {
      const channel = supabase.channel('bookings-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
          fetchBookings();
          setRealtimePulse(true);
          setTimeout(() => setRealtimePulse(false), 2000);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [fetchBookings, router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  async function updateBooking(id: string, updates: Record<string, unknown>) {
    if (DEV_MODE) {
      // Optimistic update in dev mode
      setBookings(bs => bs.map(b => b.id === id ? { ...b, ...(updates.action === 'confirm' ? { status: 'confirmed' } : updates.action === 'cancel' ? { status: 'cancelled' } : updates) } : b));
      toast('Updated (dev mode — not persisted)');
      return;
    }
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) { toast('Booking updated ✓'); fetchBookings(); }
    else toast('Update failed', 'error');
  }

  function openModal(b: Booking) {
    setSelected(b);
    setMeetLink(b.meet_link || '');
    setAdminNotes(b.admin_notes || '');
    setProposedTime(b.confirmed_time_slot || '');
  }

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    if (q && !b.name.toLowerCase().includes(q) && !b.booking_id.toLowerCase().includes(q) && !b.phone.includes(q)) return false;
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (filterService !== 'all' && b.service !== filterService) return false;
    if (filterMode !== 'all' && b.mode !== filterMode) return false;
    if (filterDate && b.appointment_date !== filterDate) return false;
    return true;
  });

  const services = Array.from(new Set(bookings.map(b => b.service)));
  const stats = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    today:     bookings.filter(b => b.appointment_date === new Date().toISOString().split('T')[0]).length,
  };

  async function handleExport() {
    setExporting(true);
    try {
      await exportToExcel(filtered.length > 0 ? filtered : bookings);
      toast(`Exported ${filtered.length > 0 ? filtered.length : bookings.length} bookings to Excel ✓`);
    } catch {
      toast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="admin-layout">
      {/* Toast */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.type === 'success' ? '✓' : '✗'}</span>
            <span className="toast-msg">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-text">AstroPathak</div>
          <div className="admin-sidebar-logo-sub">Admin Panel</div>
        </div>
        <nav className="admin-nav">
          <span className="admin-nav-item active">
            <span className="admin-nav-icon">◈</span> Dashboard
          </span>
          <Link href="/admin/availability" className="admin-nav-item">
            <span className="admin-nav-icon">◷</span> Availability
          </Link>
          <Link href="/" className="admin-nav-item">
            <span className="admin-nav-icon">◻</span> View Website
          </Link>
          <Link href="/book" className="admin-nav-item">
            <span className="admin-nav-icon">✎</span> Book Form
          </Link>
        </nav>
        {DEV_MODE && (
          <div style={{ padding: '10px 16px', margin: '8px 10px', background: 'rgba(196,98,45,0.15)', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-head)', letterSpacing: '1px', color: 'rgba(245,232,200,0.6)', lineHeight: 1.6 }}>
            DEV MODE<br />Supabase not connected.<br />Data is mocked.
          </div>
        )}
        <div className="admin-sidebar-footer">
          {!DEV_MODE && (
            <button className="admin-nav-item" onClick={signOut} style={{ color: 'rgba(196,98,45,0.7)' }}>
              <span className="admin-nav-icon">⎋</span> Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="admin-topbar-title">Bookings Dashboard</span>
            {realtimePulse && <div className="pulse-dot" title="Live update received" />}
          </div>
          <div className="admin-topbar-right">
            {/* Excel Export */}
            <button
              className="btn-ghost-rust"
              onClick={handleExport}
              disabled={exporting || bookings.length === 0}
              style={{ fontSize: 10, padding: '8px 14px', letterSpacing: '1.5px' }}
              title="Export visible bookings to Excel"
            >
              {exporting
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="spinner" style={{ width: 13, height: 13, border: '2px solid rgba(180,120,40,0.3)', borderTopColor: 'var(--rust)' }} />
                    Exporting…
                  </span>
                : <>⬇ Export Excel{filtered.length !== bookings.length ? ` (${filtered.length})` : ''}</>
              }
            </button>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '2px', color: 'var(--brown-mid)' }}>
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="admin-content">
          {/* Stats */}
          <div className="admin-stats-grid">
            {[
              { label: 'Total Bookings',  value: stats.total,     sub: 'All time',          cls: '' },
              { label: 'Pending Review',  value: stats.pending,   sub: 'Awaiting confirmation', cls: 'rust' },
              { label: 'Confirmed',       value: stats.confirmed, sub: 'Active sessions',   cls: 'brown' },
              { label: 'Today\'s Appts',  value: stats.today,     sub: 'Scheduled for today', cls: 'gold' },
            ].map(s => (
              <div key={s.label} className={`admin-stat-card ${s.cls}`}>
                <div className="admin-stat-label">{s.label}</div>
                <div className="admin-stat-value">{s.value}</div>
                <div className="admin-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="admin-filters">
            <input className="admin-filter-input" placeholder="Search name, ID, phone…"
              value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 200 }} />
            <select className="admin-filter-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="admin-filter-input" value={filterMode} onChange={e => setFilterMode(e.target.value)}>
              <option value="all">All Modes</option>
              <option value="phone">Phone Call</option>
              <option value="video">Video Call</option>
              <option value="in-person">In-Person</option>
            </select>
            <select className="admin-filter-input" value={filterService} onChange={e => setFilterService(e.target.value)}>
              <option value="all">All Services</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" className="admin-filter-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            {(search || filterStatus !== 'all' || filterService !== 'all' || filterDate || filterMode !== 'all') && (
              <button className="btn-ghost-rust" onClick={() => { setSearch(''); setFilterStatus('all'); setFilterService('all'); setFilterDate(''); setFilterMode('all'); }}>
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="table-wrap">
              <div className="empty-state">
                <div className="empty-state-icon">◈</div>
                <div className="empty-state-text">No bookings found</div>
              </div>
            </div>
          ) : (
            <div className="table-wrap" style={{ overflowX: 'auto' }}>
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Client</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id}>
                      <td><span className="table-booking-id">{b.booking_id}</span></td>
                      <td>
                        <div className="table-name">{b.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--brown-lt)' }}>+91 {b.phone}</div>
                      </td>
                      <td style={{ fontSize: 14, maxWidth: 160 }}>{b.service}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(b.appointment_date)}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{b.time_slot}</td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '1px', color: 'var(--brown-mid)' }}>
                          {MODE_LABELS[b.mode] || b.mode}
                        </span>
                      </td>
                      <td><span className={`badge ${STATUS_COLORS[b.status] || 'badge-na'}`}>{b.status}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="tbl-btn" onClick={() => openModal(b)} title="View Details">👁</button>
                          {b.status === 'pending' && (
                            <button className="tbl-btn confirm" onClick={() => updateBooking(b.id, { action: 'confirm' })} title="Confirm">✓</button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button className="tbl-btn cancel" onClick={() => { if (confirm('Cancel this booking?')) updateBooking(b.id, { action: 'cancel' }); }} title="Cancel">✗</button>
                          )}
                          <a href={buildAdminWhatsAppUrl(b)} target="_blank" rel="noreferrer" className="tbl-btn" title="WhatsApp">💬</a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">{selected.name}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 10, color: 'var(--rust)', letterSpacing: '1.5px', marginTop: 4 }}>{selected.booking_id}</div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">Client Information</div>
              <div className="modal-grid">
                {[
                  ['Name',          selected.name],
                  ['Phone',         `+91 ${selected.phone}`],
                  ['Date of Birth', formatDate(selected.dob)],
                  ['Time of Birth', selected.tob || 'Not provided'],
                  ['Birth City',    selected.birth_city],
                  ['Mode',          MODE_LABELS[selected.mode] || selected.mode],
                ].map(([k, v]) => (
                  <div key={k} className="modal-field">
                    <span className="modal-field-label">{k}</span>
                    <span className="modal-field-value">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">Appointment</div>
              <div className="modal-grid">
                {[
                  ['Service',   selected.service],
                  ['Date',      formatDate(selected.appointment_date)],
                  ['Time Slot', selected.time_slot],
                  ['Status',    selected.status],
                  ['Booked On', formatDate(selected.created_at?.split('T')[0] || '')],
                ].map(([k, v]) => (
                  <div key={k} className="modal-field">
                    <span className="modal-field-label">{k}</span>
                    <span className="modal-field-value">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {selected.query && (
              <div className="modal-section">
                <div className="modal-section-title">Client Query</div>
                <div style={{ fontStyle: 'italic', color: 'var(--brown-mid)', fontSize: 16, lineHeight: 1.75, background: 'rgba(180,120,40,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>{selected.query}</div>
              </div>
            )}

            {/* Propose Alternative Time */}
            <div className="modal-section">
              <div className="modal-section-title">Confirmed Time Slot</div>
              <select
                className="modal-input"
                value={proposedTime || selected.time_slot}
                onChange={e => setProposedTime(e.target.value)}
                style={{ marginTop: 8 }}
              >
                {TIME_SLOTS.map(s => (
                  <option key={s} value={s}>{s}{s === selected.time_slot ? ' (client requested)' : ''}</option>
                ))}
              </select>
              {proposedTime && proposedTime !== selected.time_slot && (
                <div className="info-box" style={{ marginTop: 10, fontSize: 13, background: 'rgba(196,98,45,0.06)', borderColor: 'rgba(196,98,45,0.2)' }}>
                  ⏰ Client requested <strong>{selected.time_slot}</strong> — you are proposing <strong>{proposedTime}</strong>. The confirmation email will highlight this change.
                </div>
              )}
            </div>

            {/* Meet link — for video mode */}
            {selected.mode === 'video' && (
              <div className="modal-section">
                <div className="modal-section-title">Google Meet Link</div>
                <input className="modal-input" value={meetLink} onChange={e => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx" />
                <span style={{ fontSize: 12, color: 'var(--brown-lt)', fontStyle: 'italic', marginTop: 6, display: 'block' }}>
                  This link will be sent to the client via WhatsApp
                </span>
              </div>
            )}

            <div className="modal-section">
              <div className="modal-section-title">Admin Notes</div>
              <textarea className="modal-input form-textarea" value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                placeholder="Internal notes (not shared with client)…" style={{ minHeight: 80, marginTop: 8 }} />
            </div>

            <div className="modal-actions">
              {selected.status === 'pending' && (
                <button className="btn-rust" style={{ fontSize: 11, padding: '10px 20px' }}
                  onClick={() => {
                    updateBooking(selected.id, {
                      action: 'confirm',
                      meet_link: meetLink,
                      admin_notes: adminNotes,
                      confirmed_time_slot: proposedTime || selected.time_slot,
                    });
                    setSelected(null);
                  }}>
                  ✓ Confirm
                </button>
              )}
              <button className="btn-outline-rust" style={{ fontSize: 11, padding: '9px 18px' }}
                onClick={() => { updateBooking(selected.id, { meet_link: meetLink, admin_notes: adminNotes }); setSelected(null); }}>
                Save
              </button>
              <a href={buildConfirmWhatsAppUrl({ ...selected, confirmed_time_slot: proposedTime || selected.confirmed_time_slot, meet_link: meetLink || selected.meet_link })}
                target="_blank" rel="noreferrer"
                className="btn-outline-rust" style={{ fontSize: 11, padding: '9px 18px', background: 'rgba(34,139,34,0.07)', borderColor: 'rgba(34,139,34,0.35)', color: '#1a6b1a' }}>
                💬 Confirm Notify
              </a>
              <a href={buildCancelWhatsAppUrl(selected)}
                target="_blank" rel="noreferrer"
                className="btn-outline-rust" style={{ fontSize: 11, padding: '9px 18px', background: 'rgba(154,62,24,0.06)', borderColor: 'rgba(154,62,24,0.3)', color: 'var(--rust-dk)' }}>
                💬 Cancel Notify
              </a>
              {selected.status !== 'cancelled' && (
                <button className="btn-ghost-rust" style={{ fontSize: 11, padding: '9px 18px', color: 'var(--rust-dk)', borderColor: 'rgba(154,62,24,0.3)' }}
                  onClick={() => { if (confirm('Cancel booking?')) { updateBooking(selected.id, { action: 'cancel' }); setSelected(null); } }}>
                  ✗ Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
