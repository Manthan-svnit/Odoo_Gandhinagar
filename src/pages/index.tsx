import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import Head from 'next/head';
import Link from 'next/link';
import { Truck, Shield, BarChart2, Navigation, Users, Wrench, Fuel, ArrowRight, CheckCircle } from 'lucide-react';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) return { redirect: { destination: '/dashboard', permanent: false } };
  return { props: {} };
};

export default function HomePage() {
  return (
    <>
      <Head>
        <title>TransitOps — Smart Transport Operations Platform</title>
        <meta name="description" content="TransitOps is a role-based smart transport management platform for fleet operations, driver safety, trip dispatch, and financial analytics." />
      </Head>

      <div className="home-page">
        {/* ─── NAV ─── */}
        <nav className="home-nav">
          <div className="home-nav-inner">
            <div className="home-nav-brand">
              <div className="logo-icon">TO</div>
              <span className="home-nav-name">TransitOps</span>
            </div>
            <Link href="/login" className="btn btn-primary" style={{ padding: '10px 28px' }}>
              Sign In <ArrowRight size={14} />
            </Link>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section className="home-hero">
          <div className="home-hero-glow" />
          <div className="home-hero-content">
            <div className="home-hero-badge">RBAC-POWERED · HACKATHON 2026</div>
            <h1 className="home-hero-title">
              Smart Transport<br />
              <span className="home-hero-accent">Operations Platform</span>
            </h1>
            <p className="home-hero-sub">
              Manage your entire fleet lifecycle — from vehicle acquisition to trip dispatch,
              driver safety, maintenance, and financial reporting — all from one unified dashboard
              with strict role-based access control.
            </p>
            <div className="home-hero-actions">
              <Link href="/login" className="btn btn-primary btn-lg">
                Get Started <ArrowRight size={16} />
              </Link>
              <a href="#features" className="btn btn-secondary btn-lg">
                Explore Features
              </a>
            </div>

            {/* Stats strip */}
            <div className="home-stats-strip">
              {[
                { value: '4', label: 'User Roles' },
                { value: '8+', label: 'Modules' },
                { value: '100%', label: 'Role-Gated' },
                { value: 'Real-time', label: 'Dashboards' },
              ].map(({ value, label }) => (
                <div key={label} className="home-stat">
                  <div className="home-stat-value">{value}</div>
                  <div className="home-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── ROLES ─── */}
        <section className="home-section" id="roles">
          <div className="home-section-inner">
            <div className="home-section-label">ROLE-BASED ACCESS</div>
            <h2 className="home-section-title">Four Roles, One Platform</h2>
            <p className="home-section-sub">Every user sees only what they need. Access is scoped by role at login — no exceptions.</p>

            <div className="home-roles-grid">
              {[
                {
                  role: 'Fleet Manager',
                  color: '#f59e0b',
                  icon: Truck,
                  desc: 'Oversees fleet assets, maintenance schedules, vehicle lifecycle, and operational efficiency.',
                  access: ['Dashboard', 'Fleet', 'Maintenance', 'Settings'],
                },
                {
                  role: 'Dispatcher',
                  color: '#3b82f6',
                  icon: Navigation,
                  desc: 'Creates trips, assigns vehicles and drivers, monitors active deliveries in real-time.',
                  access: ['Dashboard', 'Fleet', 'Trips'],
                },
                {
                  role: 'Safety Officer',
                  color: '#22c55e',
                  icon: Shield,
                  desc: 'Monitors driver compliance, license expiry, safety scores, and performs audits.',
                  access: ['Safety Dashboard', 'Drivers', 'Trips'],
                },
                {
                  role: 'Financial Analyst',
                  color: '#a855f7',
                  icon: BarChart2,
                  desc: 'Tracks fuel costs, maintenance spend, expense reports, and generates financial analytics.',
                  access: ['Finance Dashboard', 'Fleet', 'Fuel & Expenses', 'Analytics'],
                },
              ].map(({ role, color, icon: Icon, desc, access }) => (
                <div key={role} className="home-role-card" style={{ '--role-color': color } as any}>
                  <div className="home-role-icon" style={{ background: color }}>
                    <Icon size={22} color="#000" />
                  </div>
                  <h3 className="home-role-name">{role}</h3>
                  <p className="home-role-desc">{desc}</p>
                  <div className="home-role-access">
                    {access.map(a => (
                      <span key={a} className="home-role-tag"><CheckCircle size={10} /> {a}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section className="home-section home-section-alt" id="features">
          <div className="home-section-inner">
            <div className="home-section-label">PLATFORM MODULES</div>
            <h2 className="home-section-title">Everything You Need</h2>
            <p className="home-section-sub">A comprehensive suite of tools for modern transport operations.</p>

            <div className="home-features-grid">
              {[
                { icon: Truck, title: 'Fleet Management', desc: 'Track every vehicle — status, type, region, and real-time utilization rates.' },
                { icon: Navigation, title: 'Trip Dispatch', desc: 'Create, assign, and monitor trips through a full lifecycle from draft to completion.' },
                { icon: Users, title: 'Driver Profiles', desc: 'Manage driver data, license expiry tracking, auto-suspension, and safety scores.' },
                { icon: Wrench, title: 'Maintenance', desc: 'Log maintenance events, track costs, and schedule preventive service for each vehicle.' },
                { icon: Fuel, title: 'Fuel & Expenses', desc: 'Record fuel logs and expenses with cost analytics and vehicle-wise breakdowns.' },
                { icon: BarChart2, title: 'Analytics', desc: 'Visual dashboards with charts for trips, fuel efficiency, and fleet performance.' },
                { icon: Shield, title: 'Safety & Compliance', desc: 'Monitor safety scores, license compliance, and automated expiry email warnings.' },
                { icon: CheckCircle, title: 'RBAC Security', desc: 'Strict role-based access — every API endpoint and UI route is gated by user role.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="home-feature-card">
                  <div className="home-feature-icon"><Icon size={20} /></div>
                  <h4 className="home-feature-title">{title}</h4>
                  <p className="home-feature-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="home-cta">
          <div className="home-cta-inner">
            <h2 className="home-cta-title">Ready to streamline your fleet?</h2>
            <p className="home-cta-sub">Sign in with your role-specific credentials to access your personalized dashboard.</p>
            <Link href="/login" className="btn btn-primary btn-lg">
              Sign In Now <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="home-footer">
          <div className="home-footer-inner">
            <div className="home-nav-brand">
              <div className="logo-icon" style={{ width: 28, height: 28, fontSize: 12 }}>TO</div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>TransitOps</span>
            </div>
            <div className="home-footer-text">
              © 2026 TransitOps · Built for Hackathon · RBAC Enabled
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
