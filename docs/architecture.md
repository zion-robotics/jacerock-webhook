# Architecture — Jacerock / AfrikBerry Staff Dashboard

**Version:** 1.0  
**Date:** 22 August 2026  
**Author:** Zion Robotics

---

## 1. System Overview

```
CUSTOMER (WhatsApp)
        │
        ▼
META WHATSAPP CLOUD API
        │
        ▼
WEBHOOK SERVER (Node.js on Render)
        │
        ├──────────────► SUPABASE DATABASE (PostgreSQL)
        │                       │
        │                       ▼
        │               SUPABASE REALTIME
        │                       │
        │                       ▼
        └──────────────► STAFF DASHBOARD (React PWA on Vercel)
                                │
                                ▼
                        STAFF ACTIONS
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
           APPROVE           REJECT           HOLD
                │
                ▼
        WEBHOOK /send-template
                │
                ▼
        META WHATSAPP API
                │
                ▼
           CUSTOMER
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | React 18 + TypeScript | UI components and state |
| Build tool | Vite | Fast builds and PWA support |
| Styling | Tailwind CSS | Responsive utility-first design |
| PWA | vite-plugin-pwa | Service worker, manifest, push notifications |
| Authentication | Supabase Auth | Email/password login, JWT tokens |
| Database | Supabase (PostgreSQL) | All transaction and customer data |
| Realtime | Supabase Realtime | Live transaction alerts |
| State management | Zustand | Global app state |
| Data fetching | TanStack Query | Server state, caching, refetching |
| Charts | Recharts | Analytics and reporting |
| Notifications | react-hot-toast | In-app toast notifications |
| Icons | Lucide React | Consistent icon library |
| HTTP client | Axios | API calls to webhook server |
| Hosting | Vercel | Global CDN deployment |

---

## 3. Project Structure

```
jacerock-dashboard/
├── public/
│   ├── manifest.json          ← PWA manifest
│   ├── icon-192.png           ← App icon
│   └── icon-512.png           ← App icon large
├── src/
│   ├── components/
│   │   ├── ui/                ← Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Card.tsx
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── StaffLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionQueue.tsx
│   │   │   ├── TransactionDetail.tsx
│   │   │   ├── ReceiptViewer.tsx
│   │   │   ├── ActionButtons.tsx
│   │   │   └── AuditTrail.tsx
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── ChatInput.tsx
│   │   └── alerts/
│   │       ├── HotAlert.tsx
│   │       └── NotificationBell.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── admin/
│   │   │   ├── OverviewPage.tsx
│   │   │   ├── AllTransactionsPage.tsx
│   │   │   ├── StaffManagementPage.tsx
│   │   │   ├── ActivityLogsPage.tsx
│   │   │   ├── ExchangeRatesPage.tsx
│   │   │   └── BankAccountsPage.tsx
│   │   └── staff/
│   │       ├── QueuePage.tsx
│   │       └── TransactionDetailPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTransactions.ts
│   │   ├── useRealtime.ts
│   │   └── useNotifications.ts
│   ├── services/
│   │   ├── supabase.ts        ← Supabase client
│   │   ├── api.ts             ← Webhook server API calls
│   │   └── auth.ts            ← Auth helpers
│   ├── store/
│   │   ├── authStore.ts       ← Auth state
│   │   └── alertStore.ts      ← Notification state
│   ├── types/
│   │   └── index.ts           ← All TypeScript types
│   ├── utils/
│   │   ├── formatters.ts      ← Date, currency formatters
│   │   └── constants.ts       ← App constants
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Authentication Flow

```
User visits dashboard
        │
        ▼
Check Supabase session
        │
   ┌────┴────┐
   │         │
Valid      Not valid
   │         │
   ▼         ▼
Load role  Login page
   │
   ▼
Admin → Admin routes
Staff → Staff routes only
```

- JWT stored in memory only, not localStorage
- Supabase handles token refresh automatically
- Role stored in `staff_users` table, checked on every protected route

---

## 5. Realtime Alert Flow

```
Customer submits settlement details
        │
        ▼
Webhook updates transaction status
to AWAITING_STAFF_APPROVAL in Supabase
        │
        ▼
Supabase Realtime fires event
        │
        ▼
Dashboard receives event via subscription
        │
        ▼
┌───────────────────────────────┐
│ Hot alert popup appears       │
│ Badge count increments        │
│ Sound plays (if enabled)      │
│ Push notification sent (PWA)  │
└───────────────────────────────┘
        │
        ▼
Staff clicks alert → Transaction detail page
```

---

## 6. Human Takeover Flow

```
Staff clicks Take Over on a conversation
        │
        ▼
Dashboard calls POST /staff/pause-bot
        │
        ▼
Webhook sets bot_paused = true in Supabase
        │
        ▼
Bot ignores all future messages from this customer
        │
        ▼
Staff sees live chat interface in dashboard
        │
        ▼
Staff types message → Dashboard calls POST /staff/send-message
        │
        ▼
Message sent directly to customer via Meta API
        │
        ▼
Staff clicks Resume AI
        │
        ▼
Dashboard calls POST /staff/resume-bot
        │
        ▼
Bot resumes handling the customer
```

---

## 7. Security

- All API calls to webhook server require an internal API key in headers
- Supabase Row Level Security enabled for production
- Admin routes protected by role check on both frontend and backend
- Activity logs are insert-only — no update or delete permissions
- Staff tokens expire after 8 hours
- Admin can revoke any session by deactivating the account

---

## 8. Deployment

| Environment | URL | Provider |
|---|---|---|
| Production | dashboard.jacerockcapital.com | Vercel |
| Webhook server | jacerock-webhook.onrender.com | Render |
| Database | Supabase project | Supabase |

Environment variables stored in Vercel project settings. Never committed to GitHub.
