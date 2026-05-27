# WashLy Web

React PWA for **WashLy** — owner, manager, and branch staff. Built for **Philippine** laundry shops.  
API: [washly-api](https://github.com/DevD3nz/washly-api)

---

## System overview

Same business system as the API — this repo is the shop-facing screens.

### Purpose

WashLy is for **Philippine laundry businesses with multiple branches**: one company, several shops, counter staff, and an owner who needs visibility without being at every location.

Four operational lines:

- **Production** — laundry from drop-off through ready or delivered  
- **People** — shifts and who handles each order  
- **Money** — revenue, expenses, wages, and payment to WashLy  
- **Customers** — repeat clients (**Suki**) across branches  

### Business structure

```text
WashLy account (one laundry company)
├── Subscription plan (Trial → Starter → Growth → Pro)
├── Owner (+ optional managers)
├── Branches (each = one physical shop)
│   ├── Staff / employees (PIN at the counter)
│   ├── Orders (per branch)
│   └── Timecards (shifts)
└── Audit history (who changed what)
```

| Role | Role in the shop |
|------|------------------|
| **Owner** | Setup, branches, people; Command Center, billing |
| **Manager** | Day-to-day on branches and orders |
| **Staff** | One branch: clock in, board, clock out |
| **Customer** | Counter + receipt link |

### Order cycle (heart of the shop)

**Pickup:** `Received → Washing → Drying → Ready → Claimed`  

**Delivery:** `For delivery → Out → Delivered`  

Kanban board + receipt link or text for the customer.

### People cycle

```text
/staff/login → Clock in → Board → Clock out
```

Timecards → payroll. PIN at the counter.

### Money cycle

Order payments → revenue. Expenses → gross profit. Payroll → net profit. Subscription to WashLy (manual GCash/bank proof).

**Command Center**, cash shifts, inventory, reports — owner-facing screens.

### Customers: Suki

Regular customer by **phone** across branches — one profile, faster intake.

### Subscription, notifications, trust

Trial → active → grace → suspended (manual GCash/bank). Optional email/SMS. Audit log → owner timeline.

### Web vs API

| Part | Role |
|------|------|
| **Web** (this repo) | Owner, manager, staff UI |
| **API** | Business rules and data |

---

## Screens

| URL | Who |
|-----|-----|
| `/setup` | One-time company registration |
| `/login` | Owner / manager |
| `/staff/login` | Branch staff (PIN) |

---

## Developer setup

API must run on http://localhost:8000 first ([washly-api](https://github.com/DevD3nz/washly-api)).

```powershell
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

`VITE_API_URL` — leave empty in dev (Vite proxies `/api` to port 8000). Set in production if the API is on another host.

```powershell
npm run build
npm run preview
```
