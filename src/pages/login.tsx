import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AlertCircle } from 'lucide-react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) return { redirect: { destination: '/dashboard', permanent: false } };
  return { props: {} };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) { setError('Invalid credentials. Please check your email and password.'); return; }
    router.push('/dashboard');
  }

  return (
    <>
      <Head><title>Sign In — TransitOps</title></Head>
      <div className="login-page">
        <div className="login-sidebar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <div className="logo-icon">TO</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>TransitOps</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Smart Transport Operations Platform</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>One login, four roles:</p>
            <div className="login-roles">
              {['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'].map(r => (
                <div key={r} className="login-role-item"><div className="login-role-dot" />{r}</div>
              ))}
            </div>
          </div>
          <div className="login-hint">
            <p>
              Access is scoped by role after login:<br />
              • Fleet Manager → Fleet, Maintenance<br />
              • Dispatcher → Dashboard, Trips<br />
              • Safety Officer → Drivers, Compliance<br />
              • Financial Analyst → Fuel &amp; Expenses, Analytics
            </p>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 24 }}>
            TRANSITOPS © 2026 · RBAC Enabled
          </div>
        </div>

        <div className="login-form-side">
          <div className="login-form-box">
            <h2 className="login-form-title">Sign in to your account</h2>
            <p className="login-form-sub">Enter your credentials to continue</p>

            {error && (
              <div className="error-box">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">EMAIL</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="raven@transitops.in" required />
              </div>
              <div className="form-group">
                <label className="form-label">PASSWORD</label>
                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>

              <div className="login-meta">
                <label className="checkbox-row" style={{ marginBottom: 0 }}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  Remember me
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14, justifyContent: 'center', marginTop: 4 }} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Demo Credentials:</strong>
              admin@transitops.in / admin123 (Fleet Manager)<br />
              dispatcher@transitops.in / demo123 (Dispatcher)
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
