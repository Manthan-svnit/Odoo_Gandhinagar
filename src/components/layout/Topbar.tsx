import { useSession } from 'next-auth/react';
import { Search } from 'lucide-react';

const roleLabels: Record<string, string> = {
  fleet_manager: 'Fleet Manager',
  dispatcher: 'Dispatcher',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Fin. Analyst',
};

const roleColors: Record<string, string> = {
  fleet_manager: '#3b82f6',
  dispatcher: '#f59e0b',
  safety_officer: '#22c55e',
  financial_analyst: '#a855f7',
};

export default function Topbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || '';
  const name = session?.user?.name || '';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={14} />
        <input placeholder="Search..." />
      </div>
      <div className="topbar-right">
        <span className="topbar-user">{name}</span>
        <div className="role-badge" style={{ background: roleColors[role] || '#3b82f6' }}>
          {roleLabels[role] || role}
          <div className="role-avatar">{initials}</div>
        </div>
      </div>
    </header>
  );
}
