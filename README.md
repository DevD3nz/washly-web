# WashLy Web

React PWA for **WashLy** — owner, manager, and branch staff.  
API: [washly-api](https://github.com/DevD3nz/washly-api)

---

## System overview

Same business system as the API — kini ang screens sa shop.

### Purpose

WashLy para sa **Philippine laundry businesses** nga dunay **daghang branch**: usa ka company, daghang shop, staff sa counter, owner nga gusto makita ang operasyon without standing in every store.

Upat ka linya sa operasyon:

- **Production** — labada gikan drop-off hangtod ready o delivered  
- **People** — shifts, kinsa nag-handle sa orders  
- **Money** — kita, gasto, sweldo, ug bayad sa WashLy  
- **Customers** — repeat clients (Suki) across branches  

### Business structure

```text
WashLy account (one laundry company)
├── Subscription plan (Trial → Starter → Growth → Pro)
├── Owner (+ optional managers)
├── Branches (each = one physical shop)
│   ├── Staff / employees (PIN sa counter)
│   ├── Orders (per branch)
│   └── Timecards (shifts)
└── Audit history (who changed what)
```

| Role | Role sa shop |
|------|----------------|
| **Owner** | Setup, branches, people; Command Center, billing |
| **Manager** | Day-to-day sa branches ug orders |
| **Staff** | One branch: clock in, board, clock out |
| **Customer** | Counter + receipt link |

### Order cycle (sentro sa shop)

**Pickup:** `Received → Washing → Drying → Ready → Claimed`  

**Delivery:** `For delivery → Out → Delivered`  

Board (kanban) + receipt link/text para sa customer.

### People cycle

```text
/staff/login → Clock in → Board → Clock out
```

Timecards → payroll. PIN sa counter.

### Money cycle

Order payments → revenue. Expenses → gross profit. Payroll → net profit. Subscription sa WashLy (manual proof).

**Command Center** · cash shifts · inventory · reports — owner-facing screens.

### Customers: Suki

Repeat customer by **phone** across branches — one profile, faster intake.

### Subscription, notifications, trust

Trial → active → grace → suspended (manual GCash/bank). Email/SMS optional. Audit → owner timeline.

### Web vs API

| Part | Role |
|------|------|
| **Web** (this repo) | Owner, manager, staff UI |
| **API** | Business rules & data |

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

`VITE_API_URL` — leave empty in dev (Vite proxies `/api` to port 8000). Set in production if API is on another host.

```powershell
npm run build
npm run preview
```
