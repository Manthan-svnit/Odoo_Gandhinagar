import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

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

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/dashboard').then(r => r.json()).then(setData);
    }
  }, [status]);

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
