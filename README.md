# WashLy Web

PWA for owners, managers, and branch staff. Business rules live in [washly-api](https://github.com/DevD3nz/washly-api).

> Full system picture (live + planned): **System overview** below. Monorepo: `docs/SYSTEM-OVERVIEW.md`.

---

## System overview

Same business as the API — screens for what happens sa shop.

### Purpose

Multi-branch laundry: **orders** on the floor, **people** on shift, later **money** and **customer** insight for the owner.

### Order cycle *(live on staff/owner screens)*

**Pickup:** Received → Washing → Drying → Ready → Claimed  

**Delivery:** For delivery → Out → Delivered  

Kanban board + receipt sharing.

### People cycle *(live)*

`/staff/login` → clock in → board → clock out.

### Money & insight *(planned UI)*

Command Center, expenses, cash, inventory, payroll, subscription billing — same roadmap as API; web is the owner/staff face.

### Customers *(planned)*

**Suki** network by phone across branches.

---

## Screens today

| URL | Who |
|-----|-----|
| `/setup` | One-time company registration |
| `/login` | Owner / manager |
| `/staff/login` | Branch staff (PIN) |

---

## Developer setup

API must run on http://localhost:8000 first.

```powershell
cd web
copy .env.example .env
npm install
npm run dev
```

`VITE_API_URL` — empty in dev (proxy to API). Set in production if API is elsewhere.

```powershell
npm run build
npm run preview
```
