import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { X, AlertCircle } from 'lucide-react';

function MaintenanceModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({ vehicleId: '', serviceType: '', description: '', cost: '', date: new Date().toISOString().slice(0, 10) });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch('/api/vehicles').then(r => r.json()).then(v => setVehicles(v.filter((veh: any) => veh.status !== 'Retired' && veh.status !== 'On Trip')));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const res = await fetch('/api/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Error'); return; }
    onSave();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><div className="modal-title">Log Service Record</div><button className="modal-close" onClick={onClose}><X size={18} /></button></div>
        {error && <div className="error-box"><AlertCircle size={14} />{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">VEHICLE</label>
            <select className="form-select" value={form.vehicleId} onChange={e => f('vehicleId', e.target.value)} required>
              <option value="">— Select Vehicle —</option>
              {vehicles.map((v: any) => <option key={v._id} value={v._id}>{v.name} ({v.registrationNumber})</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">SERVICE TYPE</label><input className="form-input" value={form.serviceType} onChange={e => f('serviceType', e.target.value)} placeholder="Oil Change" required /></div>
          <div className="form-group"><label className="form-label">DESCRIPTION</label><input className="form-input" value={form.description} onChange={e => f('description', e.target.value)} placeholder="Optional details..." /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">COST (₹)</label><input className="form-input" type="number" value={form.cost} onChange={e => f('cost', e.target.value)} placeholder="2500" required /></div>
            <div className="form-group"><label className="form-label">DATE</label><input className="form-input" type="date" value={form.date} onChange={e => f('date', e.target.value)} required /></div>
          </div>
          <div className="form-group"><label className="form-label">STATUS</label><input className="form-input" value="Active" disabled /></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const role = (session?.user as any)?.role;

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);

  async function load() {
    const res = await fetch('/api/maintenance');
    setLogs(await res.json());
  }

  useEffect(() => { if (status === 'authenticated') load(); }, [status]);

  async function closeLog(id: string) {
    await fetch(`/api/maintenance/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'close' }) });
    load();
  }

  return (
    <>
      <Head><title>Maintenance — TransitOps</title></Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div className="page">
            <div className="page-header">
              <h2 className="page-title">Maintenance</h2>
              {role === 'fleet_manager' && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Log Service</button>}
            </div>

            <div className="split-layout">
              <div className="card">
                <div className="card-title">LOG SERVICE RECORD</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Click &quot;+ Log Service&quot; to create a new maintenance record. Creating an active record automatically switches the vehicle status to <strong style={{ color: 'var(--orange)' }}>In Shop</strong>.</p>
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, fontSize: 13 }}>
                    <span className="badge badge-available" style={{ minWidth: 70, justifyContent: 'center' }}>Available</span>
                    <span style={{ color: 'var(--text-muted)' }}>─── creating active record ───→</span>
                    <span className="badge badge-in-shop" style={{ minWidth: 70, justifyContent: 'center' }}>In Shop</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                    <span className="badge badge-in-shop" style={{ minWidth: 70, justifyContent: 'center' }}>In Shop</span>
                    <span style={{ color: 'var(--text-muted)' }}>─── closing record (not retired) ───→</span>
                    <span className="badge badge-available" style={{ minWidth: 70, justifyContent: 'center' }}>Available</span>
                  </div>
                  <p className="rule-note" style={{ marginTop: 16 }}>Note: In Shop vehicles are removed from the dispatch pool.</p>
                </div>
              </div>

              <div>
                <div className="card-title">SERVICE LOG</div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>VEHICLE</th><th>SERVICE</th><th>COST</th><th>DATE</th><th>STATUS</th>{role === 'fleet_manager' && <th>ACTIONS</th>}</tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No maintenance records</td></tr>}
                      {logs.map((log: any) => (
                        <tr key={log._id}>
                          <td style={{ fontWeight: 600 }}>{log.vehicleId?.name || '—'}</td>
                          <td>{log.serviceType}</td>
                          <td>₹{log.cost?.toLocaleString()}</td>
                          <td style={{ fontSize: 12 }}>{new Date(log.date).toLocaleDateString()}</td>
                          <td><span className={`badge ${log.status === 'Active' ? 'badge-active' : 'badge-closed'}`}>{log.status === 'Active' ? 'In Shop' : 'Completed'}</span></td>
                          {role === 'fleet_manager' && (
                            <td>{log.status === 'Active' && <button className="btn btn-sm" style={{ background: 'var(--green)', color: '#fff' }} onClick={() => closeLog(log._id)}>Close</button>}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {showModal && <MaintenanceModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
          </div>
        </div>
      </div>
    </>
  );
}
