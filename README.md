# WashLy Web

PWA for owners, managers, and branch staff. Business rules: [washly-api](https://github.com/DevD3nz/washly-api).

Monorepo: `docs/SYSTEM-OVERVIEW.md` (full system in business terms).

---

## System overview

Multi-branch laundry — **orders** sa floor, **people** on shift, **money** ug **customers** para sa owner.

### Order cycle

**Pickup:** Received → Washing → Drying → Ready → Claimed  

**Delivery:** For delivery → Out → Delivered  

Kanban board + receipt.

### People cycle

Staff PIN login → clock in → board → clock out.

### Money & oversight

Command Center, expenses, cash, inventory, payroll, subscription — owner/staff screens for the same business logic as the API.

### Customers

**Suki** by phone across branches.

---

## Entry points

| URL | Who |
|-----|-----|
| `/setup` | One-time company registration |
| `/login` | Owner / manager |
| `/staff/login` | Branch staff (PIN) |

---

## Developer setup

API on http://localhost:8000 first.

```powershell
cd web
copy .env.example .env
npm install
npm run dev
```

`VITE_API_URL` — empty in dev (proxy). Set in production if API is elsewhere.

```powershell
npm run build
npm run preview
```
