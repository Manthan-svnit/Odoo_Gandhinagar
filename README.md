# 🚚 TransitOps — Intelligent Fleet Management System

> **A full-stack, production-grade fleet management platform built for the Odoo Hackathon 2026 by Team Gandhinagar.**

---

## 📸 Overview

**TransitOps** is a modern, real-time Fleet Management System designed to give transport companies complete visibility and control over their operations. Built with a dark, premium UI and role-based access control, it helps Dispatchers, Safety Officers, Finance Managers, and Fleet Managers work independently without stepping on each other's data.

---

## ✨ Key Features

### 🔐 Role-Based Access Control (RBAC)
Every user logs in with a distinct role, and the entire UI — sidebar navigation, buttons, and API endpoints — adapts accordingly.

| Role | Access |
|------|--------|
| **Super Admin** | Full access to all modules |
| **Fleet Manager** | Fleet, Drivers, Trips, Maintenance, Fuel |
| **Dispatcher** | Trips, Drivers |
| **Safety Officer** | Safety Dashboard, Drivers, Maintenance |
| **Financial Analyst** | Finance Dashboard, Fuel & Expenses, Analytics |

### 🚗 Fleet Management
- Add, edit, and archive vehicles with full metadata (registration, type, acquisition cost, fuel type, capacity)
- Track real-time vehicle status: `Active`, `In Transit`, `Maintenance`, `Retired`
- Vehicle profiles with license/insurance expiry tracking

### 👨‍✈️ Driver Management
- Complete driver profiles with license class, expiry dates, and contact details
- Status tracking: `Available`, `On Trip`, `Off Duty`
- License expiry alerts

### 🗺️ Trip Management
- End-to-end trip lifecycle: `Planned → In Transit → Completed / Cancelled`
- Assign vehicles and drivers per trip
- Record revenue per trip for ROI calculations

### 🔧 Maintenance Logs
- Log scheduled and unscheduled maintenance with cost tracking
- Status flow: `Scheduled → In Progress → Completed`
- Costs are automatically reflected in the Financial Dashboard

### ⛽ Fuel & Expenses
- Log fuel consumption per vehicle with cost-per-litre pricing
- Track miscellaneous expenses (Toll, Misc, etc.)
- Tables capped at 5 rows with a "See More" button to keep the UI clean
- **Total Operational Cost** = Fuel + Misc Expenses + Maintenance (100% accurate)

### 📊 Analytics & Reports
- Fleet Utilization rate
- Fuel Efficiency (km/L) averages
- Monthly Revenue bar chart (Recharts)
- Top 5 Costliest Vehicles with animated progress bars
- Full Vehicle ROI Table with colour-coded profit/loss indicators
- **Export to CSV** and **Export to PDF** (with clean print stylesheet)

### 💹 Finance Dashboard
- Live KPI cards: Total Revenue, Operational Cost, Net Profit
- Revenue vs. Operational Cost per trip (bar chart)
- Per-vehicle ROI breakdown: `ROI = (Revenue − (Fuel + Maint)) / Acquisition Cost × 100`
- Summary footer with fleet-wide totals
- **Export to PDF** with high-contrast print-optimised styles

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 14](https://nextjs.org/) (Pages Router) |
| **Language** | TypeScript |
| **Database** | MongoDB with [Mongoose](https://mongoosejs.com/) ODM |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) with Credentials Provider |
| **Styling** | Vanilla CSS with CSS custom properties (dark theme) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Notifications** | [React Hot Toast](https://react-hot-toast.com/) |
| **CSV Export** | [PapaParse](https://www.papaparse.com/) |
| **PDF Export** | Browser Print API with custom `@media print` stylesheet |
| **Password Hashing** | bcryptjs |
| **Validation** | Zod |
| **Email** | Nodemailer |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)

### 1. Clone the repository

```bash
git clone https://github.com/Manthan-svnit/Odoo_Gandhinagar.git
cd Odoo_Gandhinagar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/transitops
NEXTAUTH_SECRET=your_super_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Seed the database

This will populate the database with sample vehicles, drivers, trips, fuel logs, and demo user accounts:

```bash
npm run seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `admin@transitops.in` | `admin123` |
| **Dispatcher** | `dispatcher@transitops.in` | `dispatch123` |
| **Safety Officer** | `safety@transitops.in` | `safety123` |
| **Financial Analyst** | `finance@transitops.in` | `finance123` |

---

## 📁 Project Structure

```
src/
├── components/
│   └── layout/
│       ├── Sidebar.tsx        # Role-aware dynamic navigation
│       └── Topbar.tsx         # User info & logout
├── models/                    # Mongoose schemas
│   ├── Vehicle.ts
│   ├── Driver.ts
│   ├── Trip.ts
│   ├── FuelLog.ts
│   ├── Expense.ts
│   ├── MaintenanceLog.ts
│   ├── User.ts
│   └── Settings.ts
├── pages/
│   ├── index.tsx              # Login redirect
│   ├── login.tsx              # Auth page
│   ├── dashboard.tsx          # Main admin dashboard
│   ├── fleet.tsx              # Vehicle management
│   ├── drivers.tsx            # Driver management
│   ├── trips.tsx              # Trip lifecycle management
│   ├── maintenance.tsx        # Maintenance logs
│   ├── fuel.tsx               # Fuel & expense tracker
│   ├── analytics.tsx          # Reports & charts
│   ├── settings.tsx           # System settings
│   ├── dashboard/
│   │   └── finance.tsx        # Financial Analyst dashboard
│   └── api/                   # REST API routes
│       ├── auth/
│       ├── vehicles/
│       ├── drivers/
│       ├── trips/
│       ├── fuel/
│       ├── expenses/
│       ├── maintenance/
│       ├── reports.ts
│       └── dashboard/
└── styles/
    └── globals.css            # Full design system + print styles
```

---

## 🎨 Design System

TransitOps uses a **premium dark theme** built entirely with CSS custom properties (variables):

- **Background**: Deep navy/charcoal layered cards
- **Accent**: Electric blue (`#3b82f6`)
- **Status colours**: Green (active), Orange (warning), Red (critical), Purple (maintenance)
- **Typography**: System font stack with monospace for registration numbers
- **Animations**: Smooth hover transitions, spinner loaders, modal fade-ins
- **Print**: Full `@media print` stylesheet that strips the sidebar, darkens all text, and renders crisp vector charts

---

## 👥 Team

Built with ❤️ by **Team Gandhinagar** for the **Odoo Hackathon 2026**.

---

## 📄 License

This project is built for hackathon purposes. All rights reserved by Team Gandhinagar.
