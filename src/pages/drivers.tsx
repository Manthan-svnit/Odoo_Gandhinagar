import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Plus, X, AlertCircle } from 'lucide-react';

function getBadgeClass(status: string) {
  const map: Record<string, string> = { 'Available': 'badge-available', 'On Trip': 'badge-on-trip', 'Off Duty': 'badge-off-duty', 'Suspended': 'badge-suspended' };
  return map[status] || 'badge-draft';
}

function getExpiryClass(date: string) {
  const d = new Date(date); const now = new Date();
  if (d < now) return 'expiry-expired';
  const diff = (d.getTime() - now.getTime()) / 86400000;
  if (diff < 30) return 'expiry-warn';
  return '';
}

function formatExpiry(date: string) {
  const d = new Date(date); const now = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  if (d < now) return `${mm}/${yy} EXPIRED`;
  return `${mm}/${yy}`;
}

function DriverModal({ onClose, onSave, editing }: any) {
  const [form, setForm] = useState(editing ? { ...editing, licenseExpiryDate: editing.licenseExpiryDate?.slice(0, 10) } : { name: '', licenseNumber: '', licenseCategory: 'LMV', licenseExpiryDate: '', contactNumber: '', email: '', safetyScore: 100, status: 'Available' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/drivers/${editing._id}` : '/api/drivers';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Error saving driver'); return; }
    onSave();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{editing ? 'Edit Driver' : 'Add Driver'}</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="error-box"><AlertCircle size={14} />{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">NAME *</label>
              <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">LICENSE NO. *</label>
              <input className="form-input" value={form.licenseNumber} onChange={e => f('licenseNumber', e.target.value)} placeholder="DL-8813" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CATEGORY *</label>
              <select className="form-select" value={form.licenseCategory} onChange={e => f('licenseCategory', e.target.value)}>
                {['LMV', 'HMV', 'HGMV', 'TRANS'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">EXPIRY DATE *</label>
              <input className="form-input" type="date" value={form.licenseExpiryDate} onChange={e => f('licenseExpiryDate', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CONTACT *</label>
              <input className="form-input" value={form.contactNumber} onChange={e => f('contactNumber', e.target.value)} placeholder="98765xxxxx" required />
            </div>
            <div className="form-group">
              <label className="form-label">EMAIL</label>
              <input className="form-input" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SAFETY SCORE</label>
              <input className="form-input" type="number" min="0" max="100" value={form.safetyScore} onChange={e => f('safetyScore', e.target.value)} />
            </div>
            {editing && (
              <div className="form-group">
                <label className="form-label">STATUS</label>
                <select className="form-select" value={form.status} onChange={e => f('status', e.target.value)}>
                  {['Available', 'On Trip', 'Off Duty', 'Suspended'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : (editing ? 'Save' : 'Add Driver')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DriversPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const role = (session?.user as any)?.role;

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'All') params.set('status', statusFilter);
    const res = await fetch(`/api/drivers?${params}`);
    setDrivers(await res.json());
  }

  useEffect(() => { if (status === 'authenticated') load(); }, [status, search, statusFilter]);

  async function quickStatus(id: string, st: string) {
    await fetch(`/api/drivers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: st }) });
    load();
  }

  return (
    <>
      <Head><title>Drivers — TransitOps</title></Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div className="page">
            <div className="page-header">
              <h2 className="page-title">Drivers &amp; Safety Profiles</h2>
              {['fleet_manager', 'safety_officer'].includes(role) && (
                <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
                  <Plus size={14} /> Add Driver
                </button>
              )}
            </div>

            <div className="filters-row">
              <input className="filter-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {['All', 'Available', 'On Trip', 'Off Duty', 'Suspended'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>DRIVER</th>
                    <th>LICENSE NO.</th>
                    <th>CATEGORY</th>
                    <th>EXPIRY</th>
                    <th>CONTACT</th>
                    <th>TRIP COMPL.</th>
                    <th>SAFETY</th>
                    <th>STATUS</th>
                    {['fleet_manager', 'safety_officer'].includes(role) && <th>ACTIONS</th>}
                  </tr>
                </thead>
                <tbody>
                  {drivers.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No drivers found</td></tr>}
                  {drivers.map((d: any) => (
                    <tr key={d._id}>
                      <td style={{ fontWeight: 600 }}>{d.name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{d.licenseNumber}</td>
                      <td>{d.licenseCategory}</td>
                      <td className={getExpiryClass(d.licenseExpiryDate)}>{formatExpiry(d.licenseExpiryDate)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.contactNumber}</td>
                      <td>{d.tripsCompleted || 0}</td>
                      <td>
                        <div className="safety-score-bar">
                          <div className="safety-score-track">
                            <div className="safety-score-fill" style={{ width: `${d.safetyScore}%`, background: d.safetyScore >= 80 ? 'var(--green)' : d.safetyScore >= 60 ? 'var(--orange)' : 'var(--red)' }} />
                          </div>
                          <span style={{ fontSize: 12 }}>{d.safetyScore}%</span>
                        </div>
                      </td>
                      <td><span className={`badge ${getBadgeClass(d.status)}`}>{d.status}</span></td>
                      {['fleet_manager', 'safety_officer'].includes(role) && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(d); setShowModal(true); }}>Edit</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="section-title">TOGGLE STATUS</div>
              <div className="status-toggle-row">
                {['Available', 'On Trip', 'Off Duty', 'Suspended'].map(s => (
                  <button key={s} className={`toggle-btn toggle-${s.toLowerCase().replace(' ', '-')}`} style={{ opacity: 0.7 }}>{s}</button>
                ))}
              </div>
            </div>

            <p className="rule-note">Rule: Expired license or Suspended status → blocked from trip assignment</p>
            {showModal && <DriverModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} editing={editing} />}
          </div>
        </div>
      </div>
    </>
  );
}
