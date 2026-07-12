import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, Truck, Users, Navigation, Wrench, Receipt, BarChart2, Settings, LogOut, ShieldCheck, DollarSign } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['fleet_manager', 'dispatcher', 'safety_officer'] },
  { href: '/dashboard/safety', label: 'Safety', icon: ShieldCheck, roles: ['fleet_manager'] },
  { href: '/dashboard/finance', label: 'Finance', icon: DollarSign, roles: ['fleet_manager', 'financial_analyst'] },
  { href: '/fleet', label: 'Fleet', icon: Truck, roles: ['fleet_manager', 'dispatcher', 'financial_analyst'] },
  { href: '/drivers', label: 'Drivers', icon: Users, roles: ['fleet_manager', 'safety_officer'] },
  { href: '/trips', label: 'Trips', icon: Navigation, roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'driver'] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['fleet_manager'] },
  { href: '/fuel', label: 'Fuel & Expenses', icon: Receipt, roles: ['fleet_manager', 'financial_analyst'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart2, roles: ['fleet_manager', 'financial_analyst'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['fleet_manager'] },
];

const roleLabels: Record<string, string> = {
  fleet_manager: 'Fleet Mgr',
  dispatcher: 'Dispatcher',
  driver: 'Driver',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Fin. Analyst',
};

export default function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">TO</div>
        <h1>TransitOps</h1>
        <p>Smart Transport Platform</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.filter(item => !item.roles || item.roles.includes(role)).map(({ href, label, icon: Icon }) => {
          const isActive = href === '/dashboard'
            ? router.pathname === '/dashboard'
            : router.pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button className="nav-item" style={{ width: '100%', background: 'none', border: 'none' }} onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
