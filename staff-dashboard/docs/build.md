# Build — Jacerock / AfrikBerry Staff Dashboard

**Version:** 1.0  
**Date:** 22 August 2026  

---

## Prerequisites

Before starting make sure you have:

- Node.js 18+ installed
- npm or yarn installed
- Git installed
- A Vercel account (linked to GitHub)
- Access to the Supabase project
- Access to the jacerock-webhook Render server

---

## Step 1 — Create the Project

```bash
npm create vite@latest jacerock-dashboard -- --template react-ts
cd jacerock-dashboard
```

---

## Step 2 — Install Dependencies

```bash
npm install \
  @supabase/supabase-js \
  zustand \
  @tanstack/react-query \
  axios \
  recharts \
  lucide-react \
  react-hot-toast \
  react-router-dom \
  vite-plugin-pwa \
  workbox-window

npm install -D \
  tailwindcss \
  postcss \
  autoprefixer \
  @types/node
```

---

## Step 3 — Configure Tailwind

```bash
npx tailwindcss init -p
```

Update `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        accent: '#4f46e5',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

Add to `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  font-family: 'Inter', sans-serif;
}
```

---

## Step 4 — Configure Vite with PWA

Update `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Jacerock Staff Dashboard',
        short_name: 'Jacerock',
        description: 'Jacerock Capital / AfrikBerry Staff Operations Dashboard',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache' },
          },
        ],
      },
    }),
  ],
});
```

---

## Step 5 — Environment Variables

Create `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WEBHOOK_URL=https://jacerock-webhook.onrender.com
VITE_INTERNAL_API_KEY=your_internal_api_key
```

Create `.env.example` (safe to commit):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WEBHOOK_URL=
VITE_INTERNAL_API_KEY=
```

Add `.env.local` to `.gitignore`. Never commit real credentials.

---

## Step 6 — Supabase Client

Create `src/services/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Step 7 — TypeScript Types

Create `src/types/index.ts`:

```ts
export type UserRole = 'ADMIN' | 'STAFF';

export interface StaffUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  whatsapp_number: string;
  full_name: string;
  kyc_name: string;
  kyc_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  is_blacklisted: boolean;
  created_at: string;
}

export type TransactionStatus =
  | 'NEW'
  | 'KYC_PENDING'
  | 'KYC_COMPLETED'
  | 'RATE_SELECTED'
  | 'PAYMENT_METHOD_SELECTED'
  | 'PAYMENT_INSTRUCTIONS_ISSUED'
  | 'AWAITING_PAYMENT'
  | 'RECEIPT_UPLOADED'
  | 'PENDING_PAYMENT_VERIFICATION'
  | 'PAYMENT_VERIFIED'
  | 'SETTLEMENT_DETAILS_PENDING'
  | 'SETTLEMENT_DETAILS_CONFIRMED'
  | 'AWAITING_STAFF_APPROVAL'
  | 'SETTLEMENT_PROCESSING'
  | 'SETTLEMENT_COMPLETED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_MISMATCH'
  | 'KYC_MISMATCH'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'REJECTED';

export interface Transaction {
  id: string;
  reference: string;
  customer_id: string;
  whatsapp_number: string;
  kyc_name: string;
  currency_pair: string;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  amount: number;
  settlement_amount_ngn: number;
  payment_method: 'BANK_TRANSFER' | 'CASH_DEPOSIT' | 'MOBILE_WALLET';
  selected_bank_id: string;
  receipt_url: string;
  receipt_uploaded_at: string;
  settlement_account_name: string;
  settlement_bank_name: string;
  settlement_account_number: string;
  status: TransactionStatus;
  staff_reviewer: string;
  staff_notes: string;
  rejection_reason: string;
  created_at: string;
  verified_at: string;
  completed_at: string;
  updated_at: string;
}

export interface ExchangeRate {
  id: string;
  currency_pair: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  is_active: boolean;
  updated_by: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  country: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  transaction_id: string;
  customer_id: string;
  action: string;
  old_status: string;
  new_status: string;
  performed_by: string;
  notes: string;
  created_at: string;
}

export interface ConversationSession {
  id: string;
  whatsapp_number: string;
  customer_id: string;
  current_step: string;
  transaction_id: string;
  session_data: Record<string, unknown>;
  bot_paused: boolean;
  paused_by: string;
  paused_at: string;
  last_activity: string;
}
```

---

## Step 8 — Auth Store

Create `src/store/authStore.ts`:

```ts
import { create } from 'zustand';
import { StaffUser } from '../types';

interface AuthState {
  user: StaffUser | null;
  session: unknown | null;
  setUser: (user: StaffUser | null) => void;
  setSession: (session: unknown) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  logout: () => set({ user: null, session: null }),
}));
```

---

## Step 9 — Webhook API Service

Create `src/services/api.ts`:

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_WEBHOOK_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_INTERNAL_API_KEY,
  },
});

export async function sendTemplate(to: string, templateName: string, variables: string[] = []) {
  const { data } = await api.post('/send-template', { to, templateName, variables });
  return data;
}

export async function sendDirectMessage(to: string, message: string, staffName: string) {
  const { data } = await api.post('/staff/send-message', { to, message, staffName });
  return data;
}

export async function pauseBot(whatsappNumber: string, staffName: string) {
  const { data } = await api.post('/staff/pause-bot', { whatsappNumber, staffName });
  return data;
}

export async function resumeBot(whatsappNumber: string, staffName: string) {
  const { data } = await api.post('/staff/resume-bot', { whatsappNumber, staffName });
  return data;
}
```

---

## Step 10 — Router Setup

Create `src/router.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import StaffLayout from './components/layout/StaffLayout';
import OverviewPage from './pages/admin/OverviewPage';
import AllTransactionsPage from './pages/admin/AllTransactionsPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import ActivityLogsPage from './pages/admin/ActivityLogsPage';
import ExchangeRatesPage from './pages/admin/ExchangeRatesPage';
import BankAccountsPage from './pages/admin/BankAccountsPage';
import QueuePage from './pages/staff/QueuePage';
import TransactionDetailPage from './pages/staff/TransactionDetailPage';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function Router() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          user?.role === 'ADMIN'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/queue" replace />
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<OverviewPage />} />
          <Route path="transactions" element={<AllTransactionsPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="logs" element={<ActivityLogsPage />} />
          <Route path="rates" element={<ExchangeRatesPage />} />
          <Route path="banks" element={<BankAccountsPage />} />
        </Route>

        {/* Staff Routes */}
        <Route path="/queue" element={<ProtectedRoute><StaffLayout /></ProtectedRoute>}>
          <Route index element={<QueuePage />} />
          <Route path="transaction/:id" element={<TransactionDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Step 11 — GitHub Repository

```bash
git init
git add .
git commit -m "feat: initial dashboard setup"
git branch -M main
git remote add origin https://github.com/zion-robotics/jacerock-dashboard.git
git push -u origin main
```

Keep this repo **private**.

---

## Step 12 — Deploy to Vercel

1. Go to vercel.com
2. Click New Project
3. Import the `jacerock-dashboard` GitHub repo
4. Add all environment variables from `.env.local`
5. Click Deploy

Vercel auto-deploys on every push to main.

---

## Step 13 — Custom Domain

Once deployed:

1. Go to Vercel project → Settings → Domains
2. Add `dashboard.jacerockcapital.com`
3. Go to GoDaddy DNS for `jacerockcapital.com`
4. Add a CNAME record:
   - Name: `dashboard`
   - Value: `cname.vercel-dns.com`
5. Wait 10 to 30 minutes for DNS to propagate

---

## Development Commands

```bash
npm run dev        # Start local dev server
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
```

---

## File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `TransactionQueue.tsx` |
| Hooks | camelCase with use prefix | `useTransactions.ts` |
| Services | camelCase | `supabase.ts` |
| Types | PascalCase | `Transaction` |
| Constants | UPPER_SNAKE_CASE | `TRANSACTION_STATUSES` |
| Pages | PascalCase with Page suffix | `QueuePage.tsx` |

---

## Git Commit Convention

```
feat:     New feature
fix:      Bug fix
ui:       UI change or improvement
refactor: Code restructure
docs:     Documentation
chore:    Config, deps, tooling
```

Examples:
```
feat: add real-time transaction alerts
fix: receipt image not loading on mobile
ui: improve transaction queue table spacing
```
