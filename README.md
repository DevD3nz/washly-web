# WashLy Web

PWA screens for **WashLy** — the laundry shop runs on business rules in [washly-api](https://github.com/DevD3nz/washly-api); this repo is how **owner, manager, and staff** interact with that logic on phone or desktop.

---

## Business model (same system)

| Concept | Meaning |
|---------|---------|
| **Account** | One laundry company |
| **Branch** | One shop — staff only work their branch |
| **Owner / manager** | Branches, employees, order oversight |
| **Staff** | PIN login, clock, move orders on the floor board |

---

## Order lifecycle (what the UI reflects)

**Pickup at shop:** Received → Washing → Drying → Ready → Claimed  

**Delivery:** For delivery → Out → Delivered  

Staff and managers move cards on the **board** as laundry progresses. Receipts can be shared when an order is ready.

---

## Typical day (on screen)

```text
/staff/login → clock in
    → board: accept drop-offs, advance statuses
    → receipt for customer
    → claimed or delivered
→ clock out

Owner/manager: /login → branches, employees, orders across the business
```

One-time **company setup** (`/setup`) registers the business before anyone logs in.

---

## Developer setup

Requires API on http://localhost:8000 — see [washly-api](https://github.com/DevD3nz/washly-api).

```powershell
cd web
copy .env.example .env
npm install
npm run dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:5173/setup | First business registration |
| http://localhost:5173/login | Owner / manager |
| http://localhost:5173/staff/login | Branch staff (PIN) |

`VITE_API_URL` — leave empty in dev (Vite proxies `/api` to the API). Set for production if the API is on another host.

```powershell
npm run build    # production → dist/
npm run preview
```
