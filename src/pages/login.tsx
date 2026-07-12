import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { AlertCircle, Truck, Navigation, Shield, BarChart2 } from 'lucide-react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) return { redirect: { destination: '/dashboard', permanent: false } };
  return { props: {} };
};

const ROLE_OPTIONS = [
  { value: 'fleet_manager', label: 'Fleet Manager', icon: Truck, color: '#f59e0b' },
  { value: 'dispatcher', label: 'Dispatcher', icon: Navigation, color: '#3b82f6' },
  { value: 'safety_officer', label: 'Safety Officer', icon: Shield, color: '#22c55e' },
  { value: 'financial_analyst', label: 'Financial Analyst', icon: BarChart2, color: '#a855f7' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('Please select your role before signing in.');
      return;
    }

    setLoading(true);
    const result = await signIn('credentials', {
      email,
      password,
      role: selectedRole,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError(result.error === 'CredentialsSignin'
        ? 'Invalid credentials or role mismatch. Make sure you selected the correct role for your account.'
        : result.error
      );
      return;
    }
    router.push('/dashboard');
  }

  return (
    <>
      <Head><title>Sign In — TransitOps</title></Head>
      <div className="login-page">
        <div className="login-sidebar">
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' }}>
              <div className="logo-icon">TO</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>TransitOps</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Smart Transport Operations Platform</div>
              </div>
            </Link>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Select your role and sign in:</p>
            <div className="login-roles">
              {ROLE_OPTIONS.map(r => (
                <div key={r.value} className="login-role-item"><div className="login-role-dot" style={{ background: r.color }} />{r.label}</div>
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
            <p className="login-form-sub">Select your role and enter credentials to continue</p>

            {error && (
              <div className="error-box">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* ── ROLE SELECTOR ── */}
              <div className="form-group">
                <label className="form-label">SELECT YOUR ROLE *</label>
                <div className="role-selector-grid">
                  {ROLE_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      className={`role-selector-card ${selectedRole === value ? 'role-selector-active' : ''}`}
                      style={{ '--role-color': color } as any}
                      onClick={() => setSelectedRole(value)}
                    >
                      <div className="role-selector-icon" style={{ background: selectedRole === value ? color : 'var(--bg-hover)', color: selectedRole === value ? '#000' : 'var(--text-muted)' }}>
                        <Icon size={16} />
                      </div>
                      <span className="role-selector-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">EMAIL</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@transitops.in" required />
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
                <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14, justifyContent: 'center', marginTop: 4 }} disabled={loading || !selectedRole}>
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
