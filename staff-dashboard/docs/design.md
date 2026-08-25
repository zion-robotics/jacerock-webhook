# Design — Jacerock / AfrikBerry Staff Dashboard

**Version:** 1.0  
**Date:** 22 August 2026  

---

## 1. Design Philosophy

The dashboard is a professional internal tool used by a financial services team. The design prioritises:

- **Clarity** — information is easy to scan at a glance
- **Speed** — staff can act on a transaction in seconds
- **Trust** — the design feels secure, stable, and professional
- **Mobile first** — works perfectly on a phone held in one hand

---

## 2. Color Palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#0f172a` | Sidebar, headings, primary text |
| Accent | `#4f46e5` | Buttons, links, active states, badges |
| Success | `#16a34a` | Approved status, success alerts |
| Warning | `#d97706` | On hold status, warnings |
| Danger | `#dc2626` | Rejected status, error states, hot alerts |
| Neutral 50 | `#f8fafc` | Page background |
| Neutral 100 | `#f1f5f9` | Card background |
| Neutral 200 | `#e2e8f0` | Borders, dividers |
| Neutral 500 | `#64748b` | Secondary text, labels |
| Neutral 900 | `#0f172a` | Primary text |
| White | `#ffffff` | Sidebar text, card surfaces |

---

## 3. Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| App name | Inter | 20px | 700 |
| Page heading | Inter | 24px | 700 |
| Section heading | Inter | 18px | 600 |
| Body text | Inter | 14px | 400 |
| Small label | Inter | 12px | 500 |
| Table data | Inter | 13px | 400 |
| Button | Inter | 14px | 600 |

Font loaded from Google Fonts: `Inter` weights 400, 500, 600, 700.

---

## 4. Layout

### Desktop (1024px and above)
```
┌─────────────────────────────────────────────┐
│  HEADER  — Logo | Alerts bell | Staff name  │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ SIDEBAR  │         MAIN CONTENT             │
│          │                                  │
│ Nav      │                                  │
│ links    │                                  │
│          │                                  │
│ Role     │                                  │
│ badge    │                                  │
│          │                                  │
│ Logout   │                                  │
└──────────┴──────────────────────────────────┘
```

### Mobile (below 768px)
```
┌────────────────────────┐
│ HEADER                 │
│ Logo | Bell | Menu ☰   │
├────────────────────────┤
│                        │
│    MAIN CONTENT        │
│                        │
│                        │
├────────────────────────┤
│  BOTTOM NAV            │
│ Queue | Chat | Profile │
└────────────────────────┘
```

---

## 5. Component Styles

### Buttons

```
Primary:   bg-indigo-600  text-white  hover:bg-indigo-700
Success:   bg-green-600   text-white  hover:bg-green-700
Danger:    bg-red-600     text-white  hover:bg-red-700
Warning:   bg-amber-500   text-white  hover:bg-amber-600
Ghost:     bg-transparent border border-neutral-200 hover:bg-neutral-100
```

All buttons: `rounded-lg px-4 py-2 font-semibold text-sm transition-colors`

### Status Badges

```
AWAITING_STAFF_APPROVAL:  bg-amber-100  text-amber-800
PAYMENT_VERIFIED:         bg-blue-100   text-blue-800
SETTLEMENT_COMPLETED:     bg-green-100  text-green-800
CLOSED:                   bg-neutral-100 text-neutral-600
REJECTED:                 bg-red-100    text-red-800
UNDER_REVIEW:             bg-purple-100 text-purple-800
CANCELLED:                bg-neutral-100 text-neutral-500
```

All badges: `rounded-full px-3 py-1 text-xs font-semibold`

### Cards

```
bg-white rounded-xl shadow-sm border border-neutral-200 p-6
```

### Table rows

```
Hover:     bg-neutral-50
Selected:  bg-indigo-50 border-l-2 border-indigo-600
Header:    bg-neutral-50 text-neutral-500 text-xs uppercase font-semibold
```

### Hot Alert

```
bg-red-600 text-white rounded-xl shadow-xl p-4
Fixed position: bottom-right on desktop, top on mobile
Animated: slide-in from right with shake animation
```

---

## 6. Page Designs

### Login Page

```
┌──────────────────────────────┐
│                              │
│     Jacerock / AfrikBerry    │
│      Staff Dashboard         │
│                              │
│  ┌────────────────────────┐  │
│  │  Email                 │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  Password              │  │
│  └────────────────────────┘  │
│                              │
│  [    Sign In    ]           │
│                              │
│   │
└──────────────────────────────┘
```

### Transaction Queue Page

```
┌──────────────────────────────────────────────┐
│  Transaction Queue          🔔 3 pending      │
│  [Filter ▾] [Date ▾] [Status ▾]             │
├──────────────────────────────────────────────┤
│ REF          CUSTOMER    PAIR    AMOUNT  TIME │
├──────────────────────────────────────────────┤
│ JAC-001  🔴  James M.   GMD→NGN  500    2m  │
│ JAC-002  🟡  Sarah K.   USD→GMD  200    5m  │
│ JAC-003  🟡  Ahmed B.   GBP→GMD  150   12m  │
└──────────────────────────────────────────────┘
```

🔴 = Hot (awaiting approval)
🟡 = In progress

### Transaction Detail Page

```
┌──────────────────────────────────────────────┐
│  ← Back    JAC-20260822-000001    [PENDING]  │
├─────────────────────┬────────────────────────┤
│ CUSTOMER INFO       │ TRANSACTION INFO        │
│ Name: James Mensah  │ Pair: GMD → NGN         │
│ WhatsApp: 220XXXXX  │ Amount: 500 GMD         │
│ KYC: James Mensah   │ Rate: 18.40             │
│ KYC Match: ✅ Yes   │ Settlement: ₦9,200      │
├─────────────────────┴────────────────────────┤
│ PAYMENT RECEIPT                              │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ │         [Receipt Image]                  │ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│ [Zoom In] [Download]                         │
├──────────────────────────────────────────────┤
│ SETTLEMENT ACCOUNT                           │
│ Account Name: James Mensah                   │
│ Bank: Access Bank                            │
│ Account Number: 0123456789                   │
├──────────────────────────────────────────────┤
│ ACTIONS                                      │
│ [✅ Approve] [❌ Reject] [⏸ Hold] [📋 More] │
├──────────────────────────────────────────────┤
│ SEND TEMPLATE                                │
│ [payment_verified ▾]  [Send to Customer]    │
├──────────────────────────────────────────────┤
│ [👤 Take Over Conversation]                  │
└──────────────────────────────────────────────┘
```

### Chat / Human Takeover Page

```
┌──────────────────────────────────────────────┐
│  Chat with James Mensah (+220XXXXXXXX)       │
│  [⏸ Bot Paused by: You] [▶ Resume AI]       │
├──────────────────────────────────────────────┤
│                                              │
│  Customer: Hello I want to exchange         │
│                                             │
│            You: Hi James, how can I help?   │
│                                             │
│  Customer: I sent the receipt already       │
│                                             │
│            You: Let me check that for you   │
│                                             │
├──────────────────────────────────────────────┤
│  [Type a message...]              [Send →]  │
│  [payment_verified ▾] [Send Template]       │
└──────────────────────────────────────────────┘
```

### Exchange Rates Page (Admin)

```
┌──────────────────────────────────────────────┐
│  Exchange Rates              [+ Add Rate]    │
├──────────────────────────────────────────────┤
│ PAIR        RATE    LAST UPDATED    ACTION   │
├──────────────────────────────────────────────┤
│ GMD → NGN   18.40   2 hours ago    [Edit]   │
│ NGN → GMD   18.80   2 hours ago    [Edit]   │
│ USD → GMD   75.50   2 hours ago    [Edit]   │
└──────────────────────────────────────────────┘
```

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 768px | Bottom navigation, stacked cards |
| Tablet | 768px — 1024px | Collapsible sidebar |
| Desktop | > 1024px | Full sidebar, multi-column |

---

## 8. Animations

| Element | Animation |
|---|---|
| Hot alert | Slide in from right + shake |
| Page transition | Fade in 150ms |
| Modal open | Scale up from 95% + fade |
| Toast notification | Slide up from bottom |
| Sidebar on mobile | Slide in from left |
| Badge count | Pop scale on increment |

---

## 9. PWA Design

- **App icon:** Dark navy background with white JR monogram
- **Splash screen:** Dark navy with centered logo and tagline
- **Theme color:** `#0f172a`
- **Background color:** `#f8fafc`
- **Display mode:** standalone
- **Orientation:** any

---

## 10. Accessibility

- All interactive elements have focus styles
- Color contrast ratio minimum 4.5:1 for text
- All icons have aria-labels
- Form fields have associated labels
- Error messages are descriptive
- Loading states are announced to screen readers
