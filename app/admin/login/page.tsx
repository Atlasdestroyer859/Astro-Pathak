'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Icon } from '@/components/Icon';

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_ADMIN_BYPASS === 'true';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If dev bypass is on, go straight to dashboard
  useEffect(() => {
    if (DEV_BYPASS) {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/admin/dashboard');
  }

  // Show loading while redirect happens in dev mode
  if (DEV_BYPASS) {
    return (
      <div className="admin-login-page">
        <div style={{ textAlign: 'center', color: 'var(--cream)' }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px', borderTopColor: 'var(--rust)' }} />
          <p style={{ fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: '2px', opacity: 0.5 }}>
            Opening dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Logo placeholder — will be replaced with actual logo */}
        <div className="admin-login-logo">
          <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48" style={{ margin: '0 auto 8px', display: 'block' }}>
            <circle cx="22" cy="22" r="20" stroke="var(--rust)" strokeWidth="1.2" />
            <circle cx="22" cy="22" r="14" stroke="var(--gold)" strokeWidth="0.8" />
            <circle cx="22" cy="22" r="4" fill="var(--rust)" opacity="0.7" />
            <line x1="2" y1="22" x2="42" y2="22" stroke="var(--border-md)" strokeWidth="0.6" />
            <line x1="22" y1="2" x2="22" y2="42" stroke="var(--border-md)" strokeWidth="0.6" />
          </svg>
          <div className="admin-login-logo-text">AstroPathak</div>
          <div className="admin-login-logo-sub">Admin Access</div>
        </div>

        <h1 className="admin-login-title">Sign In</h1>
        <p className="admin-login-desc">Restricted to authorised personnel only</p>

        {error && (
          <div className="admin-login-error">
            <Icon name="x" size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@astropathak.com"
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 17, height: 17, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  Signing in…
                </span>
              : 'Sign In to Dashboard'
            }
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href="/" className="back-link" style={{ justifyContent: 'center' }}>
            <Icon name="arrow-left" size={13} /> Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
