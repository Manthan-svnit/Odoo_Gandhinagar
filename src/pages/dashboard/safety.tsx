import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, Users, Clock } from 'lucide-react';

function getSeverityStyle(severity: string) {
  if (severity === 'expired') return { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)' };
  if (severity === 'critical') return { background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: 'var(--orange)' };
  return { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--accent)' };
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    Available: 'badge-available',
    'On Trip': 'badge-on-trip',
    'Off Duty': 'badge-off-duty',
    Suspended: 'badge-suspended',
  };
  return map[status] || 'badge-draft';
}

function getSafetyColor(score: number) {
  if (score >= 80) return 'var(--green)';
  if (score >= 50) return 'var(--orange)';
  return 'var(--red)';
}

export default function SafetyDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/dashboard/safety')
        .then((r) => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
        .then(setData)
        .catch((e) => setError(e.message));
    }
  }, [status]);

  if (status === 'loading' || (!data && !error)) return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page">
          <div className="error-box"><AlertTriangle size={16} /> {error}</div>
        </div>
      </div>
    </div>
  );

  const { kpis, licenseAlerts, complianceTable } = data;

  return (
    <>
      <Head><title>Safety Dashboard — TransitOps</title></Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div className="page">
            <div className="page-header">
              <h2 className="page-title">Safety Officer Dashboard</h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Last updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'TOTAL DRIVERS', value: kpis.totalDrivers, icon: Users, color: 'var(--blue)' },
                { label: 'ACTIVE DRIVERS', value: kpis.activeDrivers, icon: ShieldCheck, color: 'var(--green)' },
                { label: 'SUSPENDED DRIVERS', value: kpis.suspendedDrivers, icon: ShieldX, color: 'var(--red)' },
                { label: 'AVG SAFETY SCORE', value: `${kpis.avgSafetyScore}/100`, icon: ShieldAlert, color: kpis.avgSafetyScore >= 70 ? 'var(--green)' : 'var(--orange)' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="kpi-card" style={{ borderTop: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div className="kpi-label">{label}</div>
                    <Icon size={18} style={{ color, opacity: 0.7 }} />
                  </div>
                  <div className="kpi-value" style={{ fontSize: 26 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* License Expiry Alert Panel */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} style={{ color: 'var(--orange)' }} />
                LICENSE EXPIRY ALERTS
                {licenseAlerts.length > 0 && (
                  <span style={{
                    background: 'var(--red)', color: '#fff', fontSize: 11, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 10, marginLeft: 4,
                  }}>
                    {licenseAlerts.length}
                  </span>
                )}
              </div>

              {licenseAlerts.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <ShieldCheck size={32} style={{ color: 'var(--green)', margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ color: 'var(--green)' }}>All licenses are valid — no alerts at this time.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {licenseAlerts.map((alert: any) => {
                    const sty = getSeverityStyle(alert.severity);
                    return (
                      <div key={alert._id} style={{
                        ...sty, borderRadius: 'var(--radius)', padding: '12px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {alert.severity === 'expired'
                            ? <ShieldX size={18} style={{ color: 'var(--red)' }} />
                            : <AlertTriangle size={18} style={{ color: sty.color }} />}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{alert.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              License: {alert.licenseNumber} · {alert.licenseCategory}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: sty.color }}>
                            {alert.daysLeft <= 0 ? 'EXPIRED' : `${alert.daysLeft} day${alert.daysLeft !== 1 ? 's' : ''} left`}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Expires: {new Date(alert.licenseExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Driver Compliance Table */}
            <div className="card">
              <div className="card-title">DRIVER COMPLIANCE TABLE</div>
              <div className="table-wrapper" style={{ background: 'transparent', border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>DRIVER</th>
                      <th>LICENSE NO.</th>
                      <th>CATEGORY</th>
                      <th>LICENSE EXPIRY</th>
                      <th>SAFETY SCORE</th>
                      <th>TRIPS</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceTable.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No drivers found</td></tr>
                    )}
                    {complianceTable.map((d: any) => {
                      const expiry = new Date(d.licenseExpiryDate);
                      const now = new Date();
                      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const expiryColor = daysLeft <= 0 ? 'var(--red)' : daysLeft <= 30 ? 'var(--orange)' : 'var(--text-primary)';
                      const scoreColor = getSafetyColor(d.safetyScore);

                      return (
                        <tr key={d._id}>
                          <td style={{ fontWeight: 600 }}>{d.name}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 12 }}>{d.licenseNumber}</td>
                          <td>{d.licenseCategory}</td>
                          <td style={{ color: expiryColor, fontWeight: daysLeft <= 30 ? 600 : 400 }}>
                            {expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {daysLeft <= 0 && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: 'var(--red)' }}>EXPIRED</span>}
                            {daysLeft > 0 && daysLeft <= 30 && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: 'var(--orange)' }}>SOON</span>}
                          </td>
                          <td>
                            <div className="safety-score-bar">
                              <div className="safety-score-track">
                                <div className="safety-score-fill" style={{ width: `${d.safetyScore}%`, background: scoreColor }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor }}>{d.safetyScore}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 500 }}>{d.tripsCompleted}</td>
                          <td><span className={`badge ${getStatusBadge(d.status)}`}>{d.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
