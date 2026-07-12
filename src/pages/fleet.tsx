import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Plus, X, AlertCircle } from 'lucide-react';

const STATUSES = ['All', 'Available', 'On Trip', 'In Shop', 'Retired'];
const TYPES = ['All', 'Truck', 'Van', 'Mini', 'Car', 'Bike', 'Other'];

function getBadgeClass(status: string) {
  const map: Record<string, string> = { 'Available': 'badge-available', 'On Trip': 'badge-on-trip', 'In Shop': 'badge-in-shop', 'Retired': 'badge-retired' };
  return map[status] || 'badge-draft';
}

function VehicleModal({ onClose, onSave, editing }: any) {
  const [form, setForm] = useState(editing || { registrationNumber: '', name: '', model: '', type: 'Van', maxLoadCapacity: '', odometer: 0, acquisitionCost: '', status: 'Available' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/vehicles/${editing._id}` : '/api/vehicles';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Error saving vehicle'); return; }
    onSave();
  }

  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{editing ? 'Edit Vehicle' : 'Add Vehicle'}</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="error-box"><AlertCircle size={14} />{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">REG. NUMBER *</label>
              <input className="form-input" value={form.registrationNumber} onChange={e => f('registrationNumber', e.target.value)} placeholder="GJ01AB452" required />
            </div>
            <div className="form-group">
              <label className="form-label">TYPE *</label>
              <select className="form-select" value={form.type} onChange={e => f('type', e.target.value)}>
                {['Truck','Van','Mini','Car','Bike','Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">VEHICLE NAME *</label>
              <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="VAN-05" required />
            </div>
            <div className="form-group">
              <label className="form-label">MODEL *</label>
              <input className="form-input" value={form.vehicleModel} onChange={e => f('vehicleModel', e.target.value)} placeholder="Eeco" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">MAX LOAD (kg) *</label>
              <input className="form-input" type="number" value={form.maxLoadCapacity} onChange={e => f('maxLoadCapacity', e.target.value)} placeholder="500" required />
            </div>
            <div className="form-group">
              <label className="form-label">ODOMETER (km)</label>
              <input className="form-input" type="number" value={form.odometer} onChange={e => f('odometer', e.target.value)} placeholder="74000" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ACQ. COST (₹) *</label>
              <input className="form-input" type="number" value={form.acquisitionCost} onChange={e => f('acquisitionCost', e.target.value)} placeholder="620000" required />
            </div>
            {editing && (
              <div className="form-group">
                <label className="form-label">STATUS</label>
                <select className="form-select" value={form.status} onChange={e => f('status', e.target.value)}>
                  {['Available','On Trip','In Shop','Retired'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : (editing ? 'Save Changes' : 'Add Vehicle')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FleetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const role = (session?.user as any)?.role;

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);

  async function load() {
    const params = new URLSearchParams();
    if (typeFilter !== 'All') params.set('type', typeFilter);
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/vehicles?${params}`);
    setVehicles(await res.json());
  }

  useEffect(() => { if (status === 'authenticated') load(); }, [status, typeFilter, statusFilter, search]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this vehicle?')) return;
    await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <Head><title>Fleet — TransitOps</title></Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div className="page">
            <div className="page-header">
              <h2 className="page-title">Vehicle Registry</h2>
              {['fleet_manager'].includes(role) && (
                <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
                  <Plus size={14} /> Add Vehicle
                </button>
              )}
            </div>

            <div className="filters-row">
              <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                {TYPES.map(t => <option key={t}>Type: {t}</option>)}
              </select>
              <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {STATUSES.map(s => <option key={s}>Status: {s}</option>)}
              </select>
              <input className="filter-input" placeholder="Search reg. no..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>REG. NO. (UNIQUE)</th>
                    <th>NAME/MODEL</th>
                    <th>TYPE</th>
                    <th>CAPACITY</th>
                    <th>ODOMETER</th>
                    <th>ACQ. COST</th>
                    <th>STATUS</th>
                    {role === 'fleet_manager' && <th>ACTIONS</th>}
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No vehicles found</td></tr>}
                  {vehicles.map((v: any) => (
                    <tr key={v._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>{v.registrationNumber}</td>
                      <td>{v.name}</td>
                      <td>{v.type}</td>
                      <td>{v.type === 'Truck' ? `${v.maxLoadCapacity/1000} Ton` : `${v.maxLoadCapacity} kg`}</td>
                      <td>{v.odometer?.toLocaleString()}</td>
                      <td>₹{v.acquisitionCost?.toLocaleString()}</td>
                      <td><span className={`badge ${getBadgeClass(v.status)}`}>{v.status}</span></td>
                      {role === 'fleet_manager' && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(v); setShowModal(true); }}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v._id)}>Del</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="rule-note">Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher</p>

            {showModal && <VehicleModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} editing={editing} />}
          </div>
        </div>
      </div>
    </>
  );
}
