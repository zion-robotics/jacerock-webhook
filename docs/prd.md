# PRD — Jacerock / AfrikBerry Staff Dashboard
**Version:** 1.0  
**Date:** 22 August 2026  
**Author:** Zion Robotics  
**Status:** Approved

---

## 1. Overview

The Jacerock / AfrikBerry Staff Dashboard is a web-based Progressive Web App (PWA) built for the internal operations team. It enables staff to manage WhatsApp-initiated currency exchange transactions in real time, verify payment receipts, communicate directly with customers, and maintain full operational oversight.

The dashboard is the human layer of the semi-automated WhatsApp AI platform. The AI bot handles the customer conversation. The dashboard handles staff verification, approval, and control.

---

## 2. Goals

- Give staff a professional, fast, mobile-friendly workspace to process transactions
- Allow admins full visibility and control over staff activity
- Enable real-time transaction alerts so no transaction is missed
- Support human takeover of any WhatsApp conversation when needed
- Provide a secure, role-based environment that protects the business

---

## 3. User Roles

### Admin
- Full access to all features
- Can create, deactivate, and manage staff accounts
- Can view all staff activity logs
- Can update exchange rates and bank accounts
- Can see analytics and revenue data
- Can pause or resume any bot conversation
- Can send messages directly to any customer

### Staff / Agent
- Can view and process their assigned or unassigned transactions
- Can view payment receipts
- Can approve, reject, hold, or request more information
- Can send approved templates to customers
- Can take over and resume bot conversations
- Cannot see other staff activity logs
- Cannot access admin settings

---

## 4. Features

### 4.1 Authentication
- Email and password login via Supabase Auth
- JWT token with automatic expiry
- Session timeout after 30 minutes of inactivity
- Role assigned at account creation by admin
- Admin can deactivate any account instantly

### 4.2 Transaction Queue
- Real-time list of all transactions awaiting staff review
- Live badge count showing number of pending transactions
- Hot alert notification when new transaction arrives
- Sound alert on new transaction (toggleable)
- Filter by status, currency pair, date, staff member
- Each row shows: reference, customer name, currency pair, amount, time received

### 4.3 Transaction Detail
- Full customer information: name, WhatsApp number, KYC name
- Transaction details: currency pair, rate, amount, settlement amount in NGN
- Payment receipt viewer with zoom and download
- Settlement account details provided by customer
- KYC name vs receipt name comparison flag
- Action buttons: Approve, Reject, Hold, Request More Info
- Send template directly to customer from this page
- Audit trail showing every action taken on this transaction

### 4.4 Human Takeover
- Take Over button on any conversation
- When taken over: bot stops responding, staff types directly
- Live chat interface showing full conversation history
- Staff can send free text or approved templates
- Resume AI button hands control back to bot
- Takeover logged with staff name and timestamp

### 4.5 Exchange Rate Management (Admin)
- View all current exchange rates
- Update any rate with one click
- Rate change logged with admin name and timestamp
- Changes reflect immediately in the WhatsApp bot

### 4.6 Bank Account Management (Admin)
- View all registered bank accounts
- Add new bank accounts
- Activate or deactivate accounts
- Changes reflect immediately in the WhatsApp bot

### 4.7 Staff Management (Admin)
- View all staff accounts with status
- Create new staff accounts
- Deactivate staff instantly
- View last login and activity per staff member

### 4.8 Activity Logs (Admin)
- Full log of every action across the platform
- Filter by staff member, action type, date range
- Export logs as CSV
- Cannot be edited or deleted by anyone

### 4.9 Analytics (Admin)
- Total transactions today, this week, this month
- Total volume in NGN
- Transaction status breakdown chart
- Top currency pairs chart
- Average processing time per staff member

### 4.10 PWA Features
- Installable on iOS and Android as a native app
- Push notifications for new transactions
- Works on mobile and desktop
- Fast loading on slow connections
- App icon and splash screen

---

## 5. Non-functional Requirements

- Page load under 2 seconds on mobile
- Real-time updates via Supabase Realtime (no manual refresh)
- All data transmitted over HTTPS
- No sensitive data stored in browser localStorage
- Accessible on Chrome, Safari, Firefox
- Responsive from 320px to 1920px screen width

---

## 6. Out of Scope

- Customer-facing interface (handled by WhatsApp bot)
- Payment processing (handled by staff manually through banking apps)
- Automated fraud detection (Phase 4 of the project)
- Multi-language support

---

## 7. Success Metrics

- Staff can process a transaction from queue to approval in under 3 minutes
- Zero missed transactions due to real-time alerts
- Admin can pull any staff activity log in under 10 seconds
- Dashboard loads in under 2 seconds on 4G mobile connection
