import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, Users, Clock } from 'lucide-react';

function getBadgeClass(status: string) {
  const map: Record<string, string> = {
    'Available': 'badge-available', 'On Trip': 'badge-on-trip',
    'In Shop': 'badge-in-shop', 'Retired': 'badge-retired',
    'Draft': 'badge-draft', 'Dispatched': 'badge-dispatched',
    'Completed': 'badge-completed', 'Cancelled': 'badge-cancelled',
  };
  return map[status] || 'badge-draft';
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [filters, setFilters] = useState({ type: 'All', status: 'All', region: 'All' });
  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (role === 'dispatcher' || role === 'driver')) router.replace('/trips');
  }, [status, role]);

  useEffect(() => {
    if (status === 'authenticated') {
      const url = role === 'safety_officer' ? '/api/dashboard/safety' : '/api/dashboard';
      fetch(url).then(r => r.json()).then(setData);
    }
  }, [status, role]);

  if (status === 'loading' || !data) return (
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

  if (role === 'safety_officer') {
    const { kpis, licenseAlerts, complianceTable } = data;
    return (
      <>
        <Head><title>Dashboard — TransitOps</title></Head>
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
                      const isExpired = alert.severity === 'expired';
                      const isCritical = alert.severity === 'critical';
                      const color = isExpired ? 'var(--red)' : isCritical ? 'var(--orange)' : 'var(--accent)';
                      const bg = isExpired ? 'rgba(239,68,68,0.1)' : isCritical ? 'rgba(249,115,22,0.1)' : 'rgba(245,158,11,0.08)';
                      const border = isExpired ? '1px solid rgba(239,68,68,0.3)' : isCritical ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(245,158,11,0.25)';
                      
                      return (
                        <div key={alert._id} style={{
                          background: bg, border, borderRadius: 'var(--radius)', padding: '12px 16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {alert.severity === 'expired'
                              ? <ShieldX size={18} style={{ color: 'var(--red)' }} />
                              : <AlertTriangle size={18} style={{ color }} />}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{alert.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                License: {alert.licenseNumber} · {alert.licenseCategory}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color }}>
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
                        const scoreColor = d.safetyScore >= 80 ? 'var(--green)' : d.safetyScore >= 50 ? 'var(--orange)' : 'var(--red)';
                        const getStatusBadge = (st: string) => {
                          const map: Record<string, string> = { Available: 'badge-available', 'On Trip': 'badge-on-trip', 'Off Duty': 'badge-off-duty', Suspended: 'badge-suspended' };
                          return map[st] || 'badge-draft';
                        };

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

  const { kpis, vehicleStatusCounts, recentTrips } = data;
  const totalNonRetired = Object.values(vehicleStatusCounts as Record<string, number>).reduce((a: number, b: number) => a + b, 0) - vehicleStatusCounts['Retired'];

  return (
    <>
      <Head><title>Dashboard — TransitOps</title></Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div className="page">
            <div className="page-header">
              <h2 className="page-title">Dashboard</h2>
            </div>

            <div className="filters-row">
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>FILTERS</span>
              {['Vehicle Type', 'Status', 'Region'].map((f, i) => (
                <select key={f} className="filter-select">
                  <option>{f}: All</option>
                </select>
              ))}
            </div>

            <div className="kpi-grid">
              {[
                { label: 'ACTIVE VEHICLES', value: kpis.activeVehicles },
                { label: 'AVAILABLE VEHICLES', value: kpis.availableVehicles },
                { label: 'VEHICLES IN MAINTENANCE', value: String(kpis.inMaintenance).padStart(2, '0') },
                { label: 'ACTIVE TRIPS', value: kpis.activeTrips },
                { label: 'PENDING TRIPS', value: String(kpis.pendingTrips).padStart(2, '0') },
                { label: 'DRIVERS ON DUTY', value: kpis.driversOnDuty },
                { label: 'FLEET UTILIZATION', value: `${kpis.fleetUtilization}%` },
              ].map(({ label, value }) => (
                <div key={label} className="kpi-card">
                  <div className="kpi-label">{label}</div>
                  <div className="kpi-value">{value}</div>
                </div>
              ))}
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <div className="card-title">RECENT TRIPS</div>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>TRIP</th>
                      <th>VEHICLE</th>
                      <th>DRIVER</th>
                      <th>STATUS</th>
                      <th>ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrips.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No trips yet</td></tr>
                    )}
                    {recentTrips.map((trip: any) => (
                      <tr key={trip._id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{trip.tripNumber}</td>
                        <td>{trip.vehicleId?.name || '—'}</td>
                        <td>{trip.driverId?.name || '—'}</td>
                        <td><span className={`badge ${getBadgeClass(trip.status)}`}>{trip.status}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {trip.status === 'Draft' ? 'Awaiting vehicle' : trip.status === 'Cancelled' ? '—' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <div className="card-title">VEHICLE STATUS</div>
                <div className="status-bar-chart">
                  {[
                    { label: 'Available', key: 'Available', color: 'var(--green)' },
                    { label: 'On Trip', key: 'On Trip', color: 'var(--blue)' },
                    { label: 'In Shop', key: 'In Shop', color: 'var(--orange)' },
                    { label: 'Retired', key: 'Retired', color: 'var(--red)' },
                  ].map(({ label, key, color }) => {
                    const count = (vehicleStatusCounts as any)[key] || 0;
                    const total = Object.values(vehicleStatusCounts as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={key} className="status-bar-row">
                        <div className="status-bar-label">{label}</div>
                        <div className="status-bar-track">
                          <div className="status-bar-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <div className="status-bar-count">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
