import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Plus, X, AlertCircle, Copy, CheckCircle } from 'lucide-react';

function getBadgeClass(status: string, pendingSuspension?: boolean) {
  if (pendingSuspension) return 'badge-suspended';
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

function DriverModal({ onClose, onSave, editing, onCredentials }: any) {
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
    // If creating (not editing) and API returned generated credentials, surface them
    if (!editing && data.generatedPassword && form.email) {
      onCredentials?.({ email: form.email, password: data.generatedPassword });
    }
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
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  
  const [scoreEditingDriver, setScoreEditingDriver] = useState<any>(null);
  const [newSafetyScore, setNewSafetyScore] = useState<number>(100);

  const [emailDriver, setEmailDriver] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState<string>('TransitOps Safety Notice');
  const [emailBody, setEmailBody] = useState<string>('');
  const [emailSending, setEmailSending] = useState<boolean>(false);

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

  async function triggerExpiryCheck() {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch('/api/drivers/check-expiry', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check expiries');
      setCheckResult(data);
      load();
    } catch (err: any) {
      alert(err.message || 'Error checking license expiries');
    } finally {
      setChecking(false);
    }
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
              <div style={{ display: 'flex', gap: 12 }}>
                {['fleet_manager', 'safety_officer'].includes(role) && (
                  <button className="btn btn-secondary" onClick={triggerExpiryCheck} disabled={checking}>
                    {checking ? 'Checking Expiries...' : 'Check Expiries & Email'}
                  </button>
                )}
                {role === 'fleet_manager' && (
                  <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
                    <Plus size={14} /> Add Driver
                  </button>
                )}
              </div>
            </div>

            {checkResult && (
              <div style={{ marginBottom: 20, borderLeft: '4px solid #f59e0b', background: '#161b22', padding: 16, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#f59e0b', fontSize: 15 }}>Expiry Check Completed:</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setCheckResult(null)}>Close</button>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>Processed: <strong>{checkResult.processed}</strong></span>
                  <span>Emails Sent: <strong>{checkResult.emailsSent}</strong></span>
                  <span>Drivers Suspended: <strong>{checkResult.suspended}</strong></span>
                </div>
                {checkResult.details && checkResult.details.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, borderTop: '1px solid #30363d', paddingTop: 8, maxHeight: 150, overflowY: 'auto' }}>
                    {checkResult.details.map((d: any, i: number) => {
                      let color = '#8b949e';
                      if (d.action.includes('Warning email sent')) color = '#f59e0b';
                      else if (d.action.includes('Suspended')) color = '#ef4444';
                      return (
                        <div key={i} style={{ color, padding: '2px 0' }}>
                          • <strong>{d.name}</strong> ({d.email}) — Expires in {d.daysLeft} days: <em>{d.action}</em>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
                      <td>
                        <span className={`badge ${getBadgeClass(d.status, d.pendingSuspension)}`}>
                          {d.pendingSuspension ? 'Suspension Pending' : d.status}
                        </span>
                      </td>
                      {['fleet_manager', 'safety_officer'].includes(role) && (
                        <td>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(d); setShowModal(true); }}>Edit</button>
                            {d.status === 'Suspended' || d.pendingSuspension ? (
                              <button className="btn btn-sm btn-secondary" style={{ borderColor: 'var(--green)', color: 'var(--green)', padding: '4px 8px' }} onClick={() => quickStatus(d._id, 'Available')}>
                                Unsuspend
                              </button>
                            ) : (
                              <button className="btn btn-sm btn-secondary" style={{ borderColor: 'var(--red)', color: 'var(--red)', padding: '4px 8px' }} onClick={() => quickStatus(d._id, 'Suspended')}>
                                Suspend
                              </button>
                            )}
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => {
                              setScoreEditingDriver(d);
                              setNewSafetyScore(d.safetyScore);
                            }}>
                              Score
                            </button>
                            {d.email && (
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }} onClick={() => {
                                setEmailDriver(d);
                                setEmailSubject(`TransitOps - Notice for ${d.name}`);
                                setEmailBody(`Dear ${d.name},\n\n`);
                              }}>
                                Email
                              </button>
                            )}
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
            {showModal && <DriverModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} editing={editing} onCredentials={(creds: any) => { setGeneratedCredentials(creds); setCopied(false); }} />}

            {generatedCredentials && (
              <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setGeneratedCredentials(null)}>
                <div className="modal" style={{ maxWidth: 440 }}>
                  <div className="modal-header">
                    <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={18} style={{ color: 'var(--green)' }} />
                      Driver Account Created
                    </div>
                    <button className="modal-close" onClick={() => setGeneratedCredentials(null)}><X size={18} /></button>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                      A login account has been created for this driver. Please copy and share these credentials securely — the password will <strong style={{ color: 'var(--text)' }}>not</strong> be shown again.
                    </p>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.05em' }}>Email</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--text)', wordBreak: 'break-all' }}>{generatedCredentials.email}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.05em' }}>Password</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.03em' }}>{generatedCredentials.password}</div>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Copy password"
                            onClick={() => { navigator.clipboard.writeText(generatedCredentials.password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                          >
                            {copied ? <><CheckCircle size={13} style={{ color: 'var(--green)' }} /> Copied</> : <><Copy size={13} /> Copy</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-primary" onClick={() => setGeneratedCredentials(null)}>Done</button>
                  </div>
                </div>
              </div>
            )}

            {scoreEditingDriver && (
              <div className="modal-overlay" onClick={() => setScoreEditingDriver(null)}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                  <div className="modal-header">
                    <div className="modal-title">Update Safety Score</div>
                    <button className="modal-close" onClick={() => setScoreEditingDriver(null)}><X size={18} /></button>
                  </div>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await fetch(`/api/drivers/${scoreEditingDriver._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...scoreEditingDriver,
                        safetyScore: newSafetyScore
                      })
                    });
                    if (res.ok) {
                      setScoreEditingDriver(null);
                      load();
                    } else {
                      const data = await res.json();
                      alert(data.error || "Failed to update safety score");
                    }
                  }}>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label className="form-label" style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                        SAFETY SCORE FOR {scoreEditingDriver.name.toUpperCase()} (0-100)
                      </label>
                      <input 
                        className="form-input" 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={newSafetyScore} 
                        onChange={e => setNewSafetyScore(Number(e.target.value))} 
                        required 
                        autoFocus
                      />
                    </div>
                    <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setScoreEditingDriver(null)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Update Score</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {emailDriver && (
              <div className="modal-overlay" onClick={() => setEmailDriver(null)}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                  <div className="modal-header">
                    <div className="modal-title">Send Email to {emailDriver.name}</div>
                    <button className="modal-close" onClick={() => setEmailDriver(null)}><X size={18} /></button>
                  </div>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setEmailSending(true);
                    try {
                      const res = await fetch('/api/drivers/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          driverId: emailDriver._id,
                          subject: emailSubject,
                          message: emailBody,
                        })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        alert("Email sent successfully!");
                        setEmailDriver(null);
                      } else {
                        alert(data.error || "Failed to send email");
                      }
                    } catch (err: any) {
                      alert("An error occurred while sending email");
                    } finally {
                      setEmailSending(false);
                    }
                  }}>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label" style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>SUBJECT</label>
                      <input 
                        className="form-input" 
                        value={emailSubject} 
                        onChange={e => setEmailSubject(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label className="form-label" style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>MESSAGE</label>
                      <textarea 
                        className="form-input" 
                        style={{ height: 180, resize: 'vertical', fontFamily: 'sans-serif', padding: 8 }}
                        value={emailBody} 
                        onChange={e => setEmailBody(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setEmailDriver(null)} disabled={emailSending}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={emailSending}>
                        {emailSending ? 'Sending...' : 'Send Email'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
