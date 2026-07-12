import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

const RBAC = [
  { role: 'Fleet Manager', fleet: '✓', drivers: '✓', trips: '✓', fuelExp: '✓', analytics: '✓' },
  { role: 'Dispatcher', fleet: 'View', drivers: '—', trips: '✓', fuelExp: '—', analytics: '—' },
  { role: 'Safety Officer', fleet: '—', drivers: '✓', trips: 'View', fuelExp: '—', analytics: '—' },
  { role: 'Financial Analyst', fleet: 'View', drivers: '—', trips: '—', fuelExp: '✓', analytics: '✓' },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({ depotName: '', currency: 'INR (₹)', distanceUnit: 'Kilometers' });
  const [saved, setSaved] = useState(false);
  const role = (session?.user as any)?.role;

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);
  useEffect(() => {
    if (status === 'authenticated') fetch('/api/settings').then(r => r.json()).then(setSettings);
  }, [status]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const s = (k: string, v: string) => setSettings(p => ({ ...p, [k]: v }));

  return (
    <>
      <Head><title>Settings — TransitOps</title></Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div className="page">
            <div className="page-header"><h2 className="page-title">Settings &amp; RBAC</h2></div>
            <div className="settings-grid">
              <div className="card">
                <div className="card-title">GENERAL</div>
                <form onSubmit={handleSave}>
                  <div className="form-group">
                    <label className="form-label">DEPOT NAME</label>
                    <input className="form-input" value={settings.depotName} onChange={e => s('depotName', e.target.value)} placeholder="Gandhinagar Depot GJ4" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CURRENCY</label>
                    <select className="form-select" value={settings.currency} onChange={e => s('currency', e.target.value)}>
                      <option>INR (₹)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">DISTANCE UNIT</label>
                    <select className="form-select" value={settings.distanceUnit} onChange={e => s('distanceUnit', e.target.value)}>
                      <option>Kilometers</option>
                      <option>Miles</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={role !== 'fleet_manager'} style={{ marginTop: 4 }}>
                    {saved ? '✓ Saved!' : 'Save Changes'}
                  </button>
                  {role !== 'fleet_manager' && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Only Fleet Manager can modify settings.</p>}
                </form>
              </div>

              <div className="card rbac-table">
                <div className="card-title">ROLE-BASED ACCESS (RBAC)</div>
                <div className="table-wrapper" style={{ background: 'transparent', border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>ROLE</th>
                        <th>FLEET</th>
                        <th>DRIVERS</th>
                        <th>TRIPS</th>
                        <th>FUEL/EXP.</th>
                        <th>ANALYTICS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RBAC.map(r => (
                        <tr key={r.role}>
                          <td style={{ fontWeight: 600 }}>{r.role}</td>
                          {[r.fleet, r.drivers, r.trips, r.fuelExp, r.analytics].map((val, i) => (
                            <td key={i} className={val === '✓' ? 'rbac-check' : val === '—' ? 'rbac-cross' : 'rbac-view'}>
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
