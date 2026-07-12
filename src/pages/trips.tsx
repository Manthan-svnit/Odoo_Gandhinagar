import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Plus, X, AlertCircle, CheckCircle } from 'lucide-react';

function getBadgeClass(status: string) {
  const map: Record<string, string> = { 'Draft': 'badge-draft', 'Dispatched': 'badge-dispatched', 'Completed': 'badge-completed', 'Cancelled': 'badge-cancelled' };
  return map[status] || 'badge-draft';
}

const LIFECYCLE_STEPS = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

function LifecycleStepper({ status }: { status: string }) {
  const mainSteps = ['Draft', 'Dispatched', 'Completed'];
  return (
    <div className="trip-lifecycle">
      {mainSteps.map((step, i) => {
        const isDone = mainSteps.indexOf(status) > i || (status === 'Completed' && step === 'Completed');
        const isActive = status === step;
        const isCancelled = status === 'Cancelled';
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: step !== 'Completed' ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div className={`lifecycle-dot ${isActive && !isCancelled ? 'active' : ''} ${isDone && !isActive ? 'completed' : ''} ${isCancelled && step === 'Dispatched' ? 'cancelled' : ''}`}>
                {isDone && !isActive ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, color: isActive ? 'var(--blue)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{step}</span>
            </div>
            {step !== 'Completed' && <div className={`lifecycle-line ${mainSteps.indexOf(status) > i ? 'active' : ''}`} />}
          </div>
        );
      })}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginLeft: 8 }}>
        <div className={`lifecycle-dot ${status === 'Cancelled' ? 'cancelled' : ''}`} style={{ background: status === 'Cancelled' ? 'var(--red)' : undefined }}>4</div>
        <span style={{ fontSize: 10, color: status === 'Cancelled' ? 'var(--red)' : 'var(--text-muted)' }}>Cancelled</span>
      </div>
    </div>
  );
}

function CreateTripModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDistance: '', revenue: '' });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [capWarn, setCapWarn] = useState<any>(null);

  useEffect(() => {
    fetch('/api/vehicles?available=true').then(r => r.json()).then(setVehicles);
    fetch('/api/drivers').then(r => r.json()).then(d => setDrivers(d.filter((dr: any) => dr.status === 'Available' && new Date(dr.licenseExpiryDate) >= new Date())));
  }, []);

  const f = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }));
    if (k === 'cargoWeight' || k === 'vehicleId') {
      const vId = k === 'vehicleId' ? v : form.vehicleId;
      const cw = k === 'cargoWeight' ? Number(v) : Number(form.cargoWeight);
      const veh = vehicles.find((v: any) => v._id === vId);
      if (veh && cw > 0) {
        if (cw > veh.maxLoadCapacity) setCapWarn({ cap: veh.maxLoadCapacity, weight: cw, over: cw - veh.maxLoadCapacity });
        else setCapWarn(null);
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const res = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Error creating trip'); return; }
    onSave();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 520 }}>
        <div className="modal-header">
          <div className="modal-title">Create Trip</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="error-box"><AlertCircle size={14} />{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">SOURCE</label><input className="form-input" value={form.source} onChange={e => f('source', e.target.value)} placeholder="Gandhinagar Depot" required /></div>
          <div className="form-group"><label className="form-label">DESTINATION</label><input className="form-input" value={form.destination} onChange={e => f('destination', e.target.value)} placeholder="Ahmedabad Hub" required /></div>
          <div className="form-group">
            <label className="form-label">VEHICLE (AVAILABLE ONLY)</label>
            <select className="form-select" value={form.vehicleId} onChange={e => f('vehicleId', e.target.value)} required>
              <option value="">— Select Vehicle —</option>
              {vehicles.map((v: any) => <option key={v._id} value={v._id}>{v.name} — {v.maxLoadCapacity} kg capacity</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">DRIVER (AVAILABLE ONLY)</label>
            <select className="form-select" value={form.driverId} onChange={e => f('driverId', e.target.value)} required>
              <option value="">— Select Driver —</option>
              {drivers.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">CARGO WEIGHT (kg)</label><input className="form-input" type="number" value={form.cargoWeight} onChange={e => f('cargoWeight', e.target.value)} placeholder="700" required /></div>
            <div className="form-group"><label className="form-label">PLANNED DISTANCE (km)</label><input className="form-input" type="number" value={form.plannedDistance} onChange={e => f('plannedDistance', e.target.value)} placeholder="38" required /></div>
          </div>
          <div className="form-group"><label className="form-label">REVENUE (₹)</label><input className="form-input" type="number" value={form.revenue} onChange={e => f('revenue', e.target.value)} placeholder="0" /></div>
          {capWarn && (
            <div className="capacity-warning">
              <div className="warn-line">Vehicle Capacity: {capWarn.cap} kg</div>
              <div className="warn-line">Cargo Weight: {capWarn.weight} kg</div>
              <div className="warn-error"><X size={12} />Capacity exceeded by {capWarn.over} kg — dispatch blocked</div>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !!capWarn}>{loading ? <span className="spinner" /> : 'Create Trip'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompleteModal({ trip, onClose, onSave }: any) {
  const [form, setForm] = useState({ endOdometer: '', fuelConsumed: '', actualDistance: '', revenue: trip.revenue || '' });
  const [loading, setLoading] = useState(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    await fetch(`/api/trips/${trip._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete', ...form }) });
    setLoading(false); onSave();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><div className="modal-title">Complete Trip — {trip.tripNumber}</div><button className="modal-close" onClick={onClose}><X size={18} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">END ODOMETER (km)</label><input className="form-input" type="number" value={form.endOdometer} onChange={e => f('endOdometer', e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">FUEL CONSUMED (L)</label><input className="form-input" type="number" value={form.fuelConsumed} onChange={e => f('fuelConsumed', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">ACTUAL DISTANCE (km)</label><input className="form-input" type="number" value={form.actualDistance} onChange={e => f('actualDistance', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">REVENUE (₹)</label><input className="form-input" type="number" value={form.revenue} onChange={e => f('revenue', e.target.value)} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : 'Mark Completed'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TripsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [completing, setCompleting] = useState<any>(null);
  const [error, setError] = useState('');
  const role = (session?.user as any)?.role;

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);

  async function load() {
    const params = new URLSearchParams();
    if (statusFilter !== 'All') params.set('status', statusFilter);
    const res = await fetch(`/api/trips?${params}`);
    setTrips(await res.json());
  }

  useEffect(() => { if (status === 'authenticated') load(); }, [status, statusFilter]);

  async function action(id: string, act: string) {
    setError('');
    const res = await fetch(`/api/trips/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: act }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    load();
  }

  const liveTrips = trips.filter(t => ['Dispatched', 'Draft'].includes(t.status));

  return (
    <>
      <Head><title>Trips — TransitOps</title></Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div className="page">
            <div className="page-header">
              <h2 className="page-title">Trip Dispatcher</h2>
              {['fleet_manager', 'dispatcher'].includes(role) && (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} />New Trip</button>
              )}
            </div>
            {error && <div className="error-box"><AlertCircle size={14} />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>✕</button></div>}

            <div className="split-layout">
              <div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-title">TRIP LIFECYCLE</div>
                  <LifecycleStepper status={statusFilter === 'All' ? 'Draft' : statusFilter} />
                </div>

                <div className="filters-row">
                  {['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} className="btn btn-sm" style={{ background: statusFilter === s ? 'var(--accent)' : 'var(--bg-card)', color: statusFilter === s ? '#000' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>{s}</button>
                  ))}
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>TRIP</th><th>ROUTE</th><th>VEHICLE</th><th>DRIVER</th><th>STATUS</th><th>ACTIONS</th></tr>
                    </thead>
                    <tbody>
                      {trips.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No trips</td></tr>}
                      {trips.map((t: any) => (
                        <tr key={t._id}>
                          <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{t.tripNumber}</td>
                          <td style={{ fontSize: 12 }}>{t.source} → {t.destination}</td>
                          <td>{t.vehicleId?.name || '—'}</td>
                          <td>{t.driverId?.name || '—'}</td>
                          <td><span className={`badge ${getBadgeClass(t.status)}`}>{t.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {t.status === 'Draft' && role !== 'safety_officer' && <button className="btn btn-sm btn-primary" onClick={() => action(t._id, 'dispatch')}>Dispatch</button>}
                              {t.status === 'Dispatched' && role !== 'safety_officer' && <button className="btn btn-sm" style={{ background: 'var(--green)', color: '#fff' }} onClick={() => setCompleting(t)}>Complete</button>}
                              {['Draft', 'Dispatched'].includes(t.status) && role !== 'safety_officer' && <button className="btn btn-sm btn-ghost" onClick={() => action(t._id, 'cancel')}>Cancel</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-title">LIVE BOARD</div>
                <div className="trip-live-board">
                  {liveTrips.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>No active trips</div>}
                  {liveTrips.map((t: any) => (
                    <div key={t._id} className="live-board-item">
                      <div className="live-board-header">
                        <span className="live-board-trip-id">{t.tripNumber}</span>
                        <span className="live-board-vehicle">{t.vehicleId?.name} / {t.driverId?.name}</span>
                      </div>
                      <div className="live-board-route">{t.source} → {t.destination}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={`badge ${getBadgeClass(t.status)}`}>{t.status}</span>
                        <span className="live-board-eta">{t.status === 'Draft' ? 'Awaiting dispatch' : '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  On Complete: odometer → fuel log → expenses → Vehicle &amp; Driver Available
                </p>
              </div>
            </div>

            {showCreate && <CreateTripModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load(); }} />}
            {completing && <CompleteModal trip={completing} onClose={() => setCompleting(null)} onSave={() => { setCompleting(null); load(); }} />}
          </div>
        </div>
      </div>
    </>
  );
}
