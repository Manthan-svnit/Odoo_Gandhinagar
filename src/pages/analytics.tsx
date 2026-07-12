'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Papa from 'papaparse';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);
  useEffect(() => { if (status === 'authenticated') fetch('/api/reports').then(r => r.json()).then(setData); }, [status]);

  function exportCSV() {
    if (!data) return;
    const rows = data.vehicleROIList.map((v: any) => ({ Vehicle: v.name, 'Reg No': v.registrationNumber, 'Total Cost': v.totalCost, Revenue: v.vRevenue, 'ROI %': v.roi }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transitops_report.csv'; a.click();
  }

  const maxCost = data?.topCostlyVehicles?.[0]?.totalCost || 1;

  return (
    <>
      <Head><title>Analytics — TransitOps</title></Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div className="page">
            <div className="page-header">
              <h2 className="page-title">Reports &amp; Analytics</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={exportCSV}>⬇ Export CSV</button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => window.print()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Export as PDF
                </button>
              </div>
            </div>

            {!data ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
            ) : (
              <>
                <div className="analytics-kpi-grid">
                  <div className="analytics-kpi">
                    <div className="label">FUEL EFFICIENCY</div>
                    <div className="value">{data.fuelEfficiency} km/l</div>
                  </div>
                  <div className="analytics-kpi">
                    <div className="label">FLEET UTILIZATION</div>
                    <div className="value">{data.fleetUtilization}%</div>
                  </div>
                  <div className="analytics-kpi">
                    <div className="label">OPERATIONAL COST</div>
                    <div className="value">₹{data.operationalCost?.toLocaleString()}</div>
                  </div>
                  <div className="analytics-kpi">
                    <div className="label">VEHICLE ROI</div>
                    <div className="value">{data.vehicleROI}%</div>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
                </p>

                <div className="charts-grid">
                  <div className="card">
                    <div className="card-title">MONTHLY REVENUE</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.monthlyRevenue} barSize={28}>
                        <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v: number) => `₹${v/1000}k`} />
                        <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <div className="card-title">TOP COSTLIEST VEHICLES</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                      {data.topCostlyVehicles.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</p>}
                      {data.topCostlyVehicles.map((v: any, i: number) => {
                        const colors = ['#ef4444', '#f97316', '#3b82f6', '#a855f7', '#22c55e'];
                        const pct = (v.totalCost / maxCost) * 100;
                        return (
                          <div key={v._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ width: 80, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>{v.name}</span>
                            <div style={{ flex: 1, height: 16, background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: 8, transition: 'width 0.6s ease' }} />
                            </div>
                            <span style={{ width: 64, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>₹{v.totalCost?.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 16 }}>
                  <div className="card-title">VEHICLE ROI TABLE</div>
                  <div className="table-wrapper" style={{ background: 'transparent', border: 'none' }}>
                    <table>
                      <thead><tr><th>VEHICLE</th><th>REG. NO.</th><th>FUEL COST</th><th>MAINT. COST</th><th>TOTAL COST</th><th>REVENUE</th><th>ROI %</th></tr></thead>
                      <tbody>
                        {data.vehicleROIList.map((v: any) => (
                          <tr key={v._id}>
                            <td style={{ fontWeight: 600 }}>{v.name}</td>
                            <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{v.registrationNumber}</td>
                            <td>₹{v.vFuel?.toLocaleString()}</td>
                            <td>₹{v.vMaint?.toLocaleString()}</td>
                            <td>₹{v.totalCost?.toLocaleString()}</td>
                            <td>₹{v.vRevenue?.toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: v.roi >= 0 ? 'var(--green)' : 'var(--red)' }}>{v.roi}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
