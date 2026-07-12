import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { X, AlertCircle } from 'lucide-react';

function FuelModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({ vehicleId: '', liters: '', costPerLiter: '', date: new Date().toISOString().slice(0, 10), odometer: '' });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  useEffect(() => { fetch('/api/vehicles').then(r => r.json()).then(setVehicles); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const res = await fetch('/api/fuel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Error'); return; }
    onSave();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><div className="modal-title">Log Fuel</div><button className="modal-close" onClick={onClose}><X size={18} /></button></div>
        {error && <div className="error-box"><AlertCircle size={14} />{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">VEHICLE</label>
            <select className="form-select" value={form.vehicleId} onChange={e => f('vehicleId', e.target.value)} required>
              <option value="">— Select —</option>
              {vehicles.map((v: any) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">LITERS</label><input className="form-input" type="number" value={form.liters} onChange={e => f('liters', e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">COST/LITER (₹)</label><input className="form-input" type="number" step="0.01" value={form.costPerLiter} onChange={e => f('costPerLiter', e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">DATE</label><input className="form-input" type="date" value={form.date} onChange={e => f('date', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">ODOMETER</label><input className="form-input" type="number" value={form.odometer} onChange={e => f('odometer', e.target.value)} /></div>
          </div>
          {form.liters && form.costPerLiter && <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 8 }}>Total: ₹{(Number(form.liters) * Number(form.costPerLiter)).toLocaleString()}</p>}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : 'Log Fuel'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExpenseModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({ vehicleId: '', tripId: '', category: 'Toll', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch('/api/vehicles').then(r => r.json()).then(setVehicles);
    fetch('/api/trips').then(r => r.json()).then(setTrips);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Error'); return; }
    onSave();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><div className="modal-title">Add Expense</div><button className="modal-close" onClick={onClose}><X size={18} /></button></div>
        {error && <div className="error-box"><AlertCircle size={14} />{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CATEGORY</label>
              <select className="form-select" value={form.category} onChange={e => f('category', e.target.value)}>
                {['Toll', 'Maintenance', 'Fuel', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">AMOUNT (₹)</label><input className="form-input" type="number" value={form.amount} onChange={e => f('amount', e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">VEHICLE</label>
              <select className="form-select" value={form.vehicleId} onChange={e => f('vehicleId', e.target.value)}>
                <option value="">— Optional —</option>
                {vehicles.map((v: any) => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">TRIP</label>
              <select className="form-select" value={form.tripId} onChange={e => f('tripId', e.target.value)}>
                <option value="">— Optional —</option>
                {trips.map((t: any) => <option key={t._id} value={t._id}>{t.tripNumber}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">DESCRIPTION</label><input className="form-input" value={form.description} onChange={e => f('description', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">DATE</label><input className="form-input" type="date" value={form.date} onChange={e => f('date', e.target.value)} /></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : 'Add Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FuelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [showFuel, setShowFuel] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [expandedFuel, setExpandedFuel] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState(false);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);

  async function load() {
    const [f, e, m] = await Promise.all([
      fetch('/api/fuel').then(r => r.json()), 
      fetch('/api/expenses').then(r => r.json()),
      fetch('/api/maintenance').then(r => r.json())
    ]);
    setFuelLogs(f); setExpenses(e); setMaintenance(m);
  }

  useEffect(() => { if (status === 'authenticated') load(); }, [status]);

  const totalFuel = fuelLogs.reduce((s: number, f: any) => s + f.totalCost, 0);
  const totalExpense = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const totalMaint = maintenance.reduce((s: number, m: any) => s + m.cost, 0);
  const totalOpCost = totalFuel + totalExpense + totalMaint;

  return (
    <>
      <Head><title>Fuel &amp; Expenses — TransitOps</title></Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div className="page">
            <div className="page-header"><h2 className="page-title">Fuel &amp; Expense Management</h2></div>
            <div className="fuel-page-grid">
              <div>
                <div className="fuel-section-header">
                  <div className="section-title">FUEL LOGS</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowFuel(true)}>+ Log Fuel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowExpense(true)}>+ Add Expense</button>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>VEHICLE</th><th>DATE</th><th>LITERS</th><th>FUEL COST</th></tr></thead>
                    <tbody>
                      {fuelLogs.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No fuel logs</td></tr>}
                      {(expandedFuel ? fuelLogs : fuelLogs.slice(0, 5)).map((f: any) => (
                        <tr key={f._id}>
                          <td style={{ fontWeight: 600 }}>{f.vehicleId?.name || '—'}</td>
                          <td>{new Date(f.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td>{f.liters} L</td>
                          <td>₹{f.totalCost?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {fuelLogs.length > 5 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedFuel(!expandedFuel)} style={{ width: '100%', marginTop: 8, padding: '8px' }}>
                    {expandedFuel ? 'See Less' : `See More (${fuelLogs.length - 5} more)`}
                  </button>
                )}
              </div>

              <div>
                <div className="section-title" style={{ marginBottom: 10 }}>OTHER EXPENSES (TOLL / MISC)</div>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>TRIP</th><th>VEHICLE</th><th>CATEGORY</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
                    <tbody>
                      {expenses.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No expenses</td></tr>}
                      {(expandedExpense ? expenses : expenses.slice(0, 5)).map((e: any) => (
                        <tr key={e._id}>
                          <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{e.tripId?.tripNumber || '—'}</td>
                          <td>{e.vehicleId?.name || '—'}</td>
                          <td>{e.category}</td>
                          <td>₹{e.amount?.toLocaleString()}</td>
                          <td><span className="badge badge-completed">Logged</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {expenses.length > 5 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedExpense(!expandedExpense)} style={{ width: '100%', marginTop: 8, padding: '8px' }}>
                    {expandedExpense ? 'See Less' : `See More (${expenses.length - 5} more)`}
                  </button>
                )}
                <div className="total-cost-bar">
                  <span className="total-cost-label">TOTAL OPERATIONAL COST = FUEL + MISC + MAINT</span>
                  <span className="total-cost-value">₹{totalOpCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {showFuel && <FuelModal onClose={() => setShowFuel(false)} onSave={() => { setShowFuel(false); load(); }} />}
            {showExpense && <ExpenseModal onClose={() => setShowExpense(false)} onSave={() => { setShowExpense(false); load(); }} />}
          </div>
        </div>
      </div>
    </>
  );
}
