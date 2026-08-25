# Plan — Jacerock / AfrikBerry Staff Dashboard

**Version:** 1.0  
**Date:** 22 August 2026  
**Delivery Date:** 22 October 2026

---

## Overview

The staff dashboard is a React PWA built to give the Jacerock / AfrikBerry operations team full control over their WhatsApp transaction platform. It covers two roles (Admin and Staff), real-time alerts, human takeover, receipt viewing, and full activity logging.

---

## Timeline

```
Week 1  (22 Aug — 29 Aug)   Foundation, Auth, Layouts
Week 2  (29 Aug — 05 Sep)   Transaction Queue and Detail
Week 3  (05 Sep — 12 Sep)   Chat, Templates, Human Takeover
Week 4  (12 Sep — 19 Sep)   Admin Pages
Week 5  (19 Sep — 26 Sep)   Analytics, PWA, Polish
Week 6  (26 Sep — 03 Oct)   Buffer and Refinement
Week 7  (03 Oct — 10 Oct)   Testing Phase 1
Week 8  (10 Oct — 17 Oct)   Testing Phase 2 and Fixes
Week 9  (17 Oct — 22 Oct)   Deployment and Handover
```

---

## Week 1 — Foundation, Auth, Layouts

### Goals
Set up the full project structure, authentication, and role-based routing. By end of week both admin and staff can log in and see their respective layouts.

### Tasks

- [ ] Initialise Vite + React + TypeScript project
- [ ] Install and configure Tailwind CSS
- [ ] Install dependencies: Supabase JS, Zustand, TanStack Query, Recharts, Axios, Lucide React, react-hot-toast
- [ ] Set up Supabase client with environment variables
- [ ] Build login page with email and password form
- [ ] Implement Supabase Auth login and logout
- [ ] Create auth store with Zustand
- [ ] Implement role-based routing (Admin vs Staff)
- [ ] Build Admin layout with sidebar and header
- [ ] Build Staff layout with sidebar and header
- [ ] Add bottom navigation for mobile
- [ ] Set up protected route wrapper
- [ ] Deploy skeleton to Vercel

### Deliverables
- Working login/logout
- Admin and staff see different layouts
- Deployed to Vercel

---

## Week 2 — Transaction Queue and Detail

### Goals
Staff can see the transaction queue, view individual transactions, view receipts, and take action.

### Tasks

- [ ] Build transaction queue page with table
- [ ] Fetch pending transactions from Supabase
- [ ] Add real-time subscription for new transactions
- [ ] Build hot alert component with sound and popup
- [ ] Add pending badge count to sidebar
- [ ] Build transaction detail page
- [ ] Display full customer and transaction info
- [ ] Build receipt viewer with zoom and download
- [ ] Add KYC name vs receipt name comparison
- [ ] Build action buttons: Approve, Reject, Hold, Request Info
- [ ] Wire actions to webhook server API endpoints
- [ ] Update transaction status in Supabase after action
- [ ] Log every action to audit_logs table
- [ ] Add confirmation modal before irreversible actions

### Deliverables
- Staff can process transactions end to end
- Receipts viewable in dashboard
- All actions logged

---

## Week 3 — Chat, Templates, Human Takeover

### Goals
Staff can take over any WhatsApp conversation, send messages directly, send templates, and resume the bot.

### Tasks

- [ ] Build chat window component
- [ ] Fetch conversation history from Supabase
- [ ] Real-time subscription for new messages in a conversation
- [ ] Build chat message bubbles (customer vs staff)
- [ ] Build chat input with send button
- [ ] Wire take over button to POST /staff/pause-bot
- [ ] Wire resume AI button to POST /staff/resume-bot
- [ ] Wire send message to POST /staff/send-message
- [ ] Build send template dropdown with all 7 approved templates
- [ ] Wire send template to POST /send-template
- [ ] Show paused status clearly in chat header
- [ ] Log takeover and resume actions to audit_logs

### Deliverables
- Human takeover fully working
- Staff can message customers directly from dashboard
- Templates sendable from dashboard

---

## Week 4 — Admin Pages

### Goals
Admin has full control over staff, rates, bank accounts, and can see all activity logs.

### Tasks

- [ ] Build staff management page
- [ ] Fetch all staff from staff_users table
- [ ] Create new staff account form
- [ ] Deactivate staff account with one click
- [ ] Show last login and activity per staff
- [ ] Build exchange rate management page
- [ ] Fetch all rates from exchange_rates table
- [ ] Edit rate inline with save button
- [ ] Rate change logged to audit_logs
- [ ] Build bank account management page
- [ ] Fetch all bank accounts
- [ ] Add new bank account form
- [ ] Activate and deactivate bank accounts
- [ ] Build activity logs page
- [ ] Fetch all audit logs with pagination
- [ ] Filter by staff, action type, date range
- [ ] Export logs as CSV

### Deliverables
- Admin can manage all staff accounts
- Exchange rates editable from dashboard
- Bank accounts manageable from dashboard
- Full activity log visible to admin

---

## Week 5 — Analytics, PWA, Polish

### Goals
Add analytics overview, PWA features, and polish the full UI for mobile and desktop.

### Tasks

- [ ] Build admin overview page with stats cards
- [ ] Total transactions today, week, month
- [ ] Total volume in NGN
- [ ] Pending count with link to queue
- [ ] Build transaction status breakdown chart (Recharts)
- [ ] Build top currency pairs bar chart (Recharts)
- [ ] Build average processing time chart
- [ ] Install and configure vite-plugin-pwa
- [ ] Create PWA manifest with app name, icons, colors
- [ ] Set up service worker for offline caching
- [ ] Implement push notification subscription
- [ ] Test PWA install on iOS and Android
- [ ] Full mobile responsive review of all pages
- [ ] Loading skeleton states on all data tables
- [ ] Empty states on all pages
- [ ] Error boundaries and fallback UI

### Deliverables
- Analytics dashboard working
- Dashboard installable as PWA on mobile
- Push notifications working
- Full mobile responsive

---

## Week 6 — Buffer and Refinement

### Goals
Catch up on anything delayed, refine UI based on self-review, fix edge cases.

### Tasks

- [ ] Review all pages on mobile screen
- [ ] Fix any layout issues
- [ ] Review all API error handling
- [ ] Add retry logic for failed API calls
- [ ] Test session timeout behavior
- [ ] Test admin deactivating a logged-in staff account
- [ ] Test rate updates reflecting in WhatsApp bot
- [ ] Test bank account changes in WhatsApp bot
- [ ] Code cleanup and unused import removal
- [ ] Environment variable audit

---

## Weeks 7 and 8 — Testing

### Testing Checklist

**Authentication**
- [ ] Admin can log in and see admin layout
- [ ] Staff can log in and see staff layout only
- [ ] Staff cannot access admin URLs directly
- [ ] Session expires after 30 minutes of inactivity
- [ ] Deactivated staff cannot log in

**Transaction Queue**
- [ ] New transaction triggers hot alert in real time
- [ ] Badge count increments and decrements correctly
- [ ] Sound alert plays on new transaction
- [ ] Transactions filter correctly by status and date

**Transaction Detail**
- [ ] Receipt image loads and is zoomable
- [ ] KYC name vs receipt comparison shows correctly
- [ ] Approve action updates Supabase and sends template to customer
- [ ] Reject action updates Supabase and sends template to customer
- [ ] Hold action updates Supabase correctly
- [ ] All actions appear in audit log

**Human Takeover**
- [ ] Bot stops responding after Take Over
- [ ] Staff message arrives on customer WhatsApp
- [ ] Bot resumes after Resume AI clicked
- [ ] Takeover and resume both logged correctly

**Admin**
- [ ] New staff account can be created and log in
- [ ] Deactivated staff cannot log in
- [ ] Rate change reflects in WhatsApp bot immediately
- [ ] Bank account change reflects in WhatsApp bot immediately
- [ ] Activity logs show all actions with correct staff names

**PWA**
- [ ] Dashboard installable on Android Chrome
- [ ] Dashboard installable on iOS Safari
- [ ] Push notification arrives on new transaction
- [ ] App works on slow 3G connection

---

## Week 9 — Deployment and Handover

### Tasks

- [ ] Set all production environment variables in Vercel
- [ ] Enable Supabase Row Level Security for production
- [ ] Create admin account for buyer
- [ ] Create test staff account for buyer team to test
- [ ] Record walkthrough video of full dashboard
- [ ] Update final documentation
- [ ] Deploy final version to Vercel
- [ ] Point custom domain: dashboard.jacerockcapital.com
- [ ] Final end-to-end test on production
- [ ] Handover call with buyer team

---

## Dependencies

| Dependency | Version |
|---|---|
| react | 18.x |
| typescript | 5.x |
| vite | 5.x |
| tailwindcss | 3.x |
| @supabase/supabase-js | 2.x |
| zustand | 4.x |
| @tanstack/react-query | 5.x |
| recharts | 2.x |
| axios | 1.x |
| lucide-react | latest |
| react-hot-toast | 2.x |
| vite-plugin-pwa | latest |

---

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WEBHOOK_URL=https://jacerock-webhook.onrender.com
VITE_INTERNAL_API_KEY=
```

---

## Risks

| Risk | Mitigation |
|---|---|
| Supabase Realtime latency | Test on slow connections, add fallback polling |
| PWA push notifications on iOS | Test early, document known limitations |
| Receipt images loading slowly | Add lazy loading and image compression |
| Staff using on very old phones | Test on Android 8+ and iOS 14+ |
