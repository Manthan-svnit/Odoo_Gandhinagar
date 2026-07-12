import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp, Fuel, Wrench, AlertTriangle, Clock } from 'lucide-react';

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function FinanceDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/dashboard/finance')
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

  const { kpis, vehicleROI, tripChart } = data;

  return (
    <>
      <Head><title>Finance Dashboard — TransitOps</title></Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div className="page">
            <div className="page-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 className="page-title">Financial Analyst Dashboard</h2>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Last updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Export as PDF
              </button>
            </div>

            {/* KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'TOTAL REVENUE', value: formatCurrency(kpis.totalRevenue), icon: DollarSign, color: 'var(--green)' },
                { label: 'OPERATIONAL COSTS', value: formatCurrency(kpis.totalOperationalCost), icon: TrendingUp, color: 'var(--red)' },
                { label: 'NET PROFIT', value: formatCurrency(kpis.netProfit), icon: DollarSign, color: kpis.netProfit >= 0 ? 'var(--green)' : 'var(--red)' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="kpi-card" style={{ borderTop: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div className="kpi-label">{label}</div>
                    <Icon size={18} style={{ color, opacity: 0.7 }} />
                  </div>
                  <div className="kpi-value" style={{ fontSize: 24 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'FUEL COSTS', value: formatCurrency(kpis.totalFuelCost), icon: Fuel, color: 'var(--orange)' },
                { label: 'MAINTENANCE COSTS', value: formatCurrency(kpis.totalMaintenanceCost), icon: Wrench, color: 'var(--purple)' },
                { label: 'AVG FUEL EFFICIENCY', value: `${kpis.avgFuelEfficiency} km/l`, icon: Fuel, color: 'var(--blue)' },
                { label: 'COMPLETED TRIPS', value: `${kpis.completedTrips} / ${kpis.totalTrips}`, icon: TrendingUp, color: 'var(--accent)' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="analytics-kpi" style={{ borderTop: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div className="label">{label}</div>
                    <Icon size={16} style={{ color, opacity: 0.6 }} />
                  </div>
                  <div className="value" style={{ fontSize: 20 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Revenue vs Operational Cost Bar Chart */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title">REVENUE vs OPERATIONAL COST — COMPLETED TRIPS</div>
              {tripChart.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <p>No completed trips with revenue data yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tripChart} barGap={4} barSize={24}>
                    <XAxis dataKey="trip" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} width={60}
                      tickFormatter={(v: number) => v >= 1000 ? `₹${v / 1000}k` : `₹${v}`} />
                    <Tooltip
                      formatter={(v: any, name: any) => [formatCurrency(Number(v)), name === 'revenue' ? 'Revenue' : 'Op. Cost']}
                      contentStyle={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontSize: 13 }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Legend
                      formatter={(value: string) => value === 'revenue' ? 'Revenue' : 'Operational Cost'}
                      wrapperStyle={{ fontSize: 12, color: '#8b949e' }}
                    />
                    <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ROI Breakdown Table */}
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                ROI BREAKDOWN PER VEHICLE
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost × 100
              </p>
              <div className="table-wrapper" style={{ background: 'transparent', border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>VEHICLE</th>
                      <th>REG. NO.</th>
                      <th>TYPE</th>
                      <th>ACQ. COST</th>
                      <th>FUEL COST</th>
                      <th>MAINT. COST</th>
                      <th>REVENUE</th>
                      <th>ROI %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleROI.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No vehicles found</td></tr>
                    )}
                    {vehicleROI.map((v: any) => (
                      <tr key={v._id}>
                        <td style={{ fontWeight: 600 }}>{v.name}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 12 }}>{v.registrationNumber}</td>
                        <td><span className="badge badge-draft">{v.type}</span></td>
                        <td>{formatCurrency(v.acquisitionCost)}</td>
                        <td>{formatCurrency(v.fuelCost)}</td>
                        <td>{formatCurrency(v.maintenanceCost)}</td>
                        <td style={{ fontWeight: 600, color: 'var(--green)' }}>{formatCurrency(v.revenue)}</td>
                        <td style={{
                          fontWeight: 700,
                          color: v.roi >= 0 ? 'var(--green)' : 'var(--red)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: v.roi > 10 ? 'var(--green)' : v.roi >= 0 ? 'var(--orange)' : 'var(--red)',
                            }} />
                            {v.roi}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Row */}
              {vehicleROI.length > 0 && (
                <div className="total-cost-bar" style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div>
                      <div className="total-cost-label">Total Fleet Revenue</div>
                      <div className="total-cost-value" style={{ color: 'var(--green)' }}>{formatCurrency(kpis.totalRevenue)}</div>
                    </div>
                    <div>
                      <div className="total-cost-label">Total Operational Cost</div>
                      <div className="total-cost-value" style={{ color: 'var(--red)' }}>{formatCurrency(kpis.totalOperationalCost)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="total-cost-label">Net Profit</div>
                    <div className="total-cost-value" style={{ color: kpis.netProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {formatCurrency(kpis.netProfit)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
