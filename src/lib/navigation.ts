import {
  Activity,
  Building2,
  HandCoins,
  Home,
  Package,
  Boxes,
  Users,
  Wallet,
  Bike,
  Bell,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export const ownerNav: NavItem[] = [
  { to: '/', label: 'Command Center', icon: Home, end: true },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/branches', label: 'Branches', icon: Building2 },
  { to: '/employees', label: 'Staff', icon: Users },
  { to: '/payroll', label: 'Payroll', icon: Wallet },
  { to: '/expenses', label: 'Expenses', icon: HandCoins },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/notifications', label: 'SMS', icon: Bell },
  { to: '/subscription', label: 'Plan', icon: CreditCard },
];

export const staffNav: NavItem[] = [
  { to: '/staff', label: 'Home', icon: Home, end: true },
  { to: '/staff/orders', label: 'Orders', icon: Package },
  { to: '/staff/inventory', label: 'Inventory', icon: Boxes },
  { to: '/staff/expenses', label: 'Expenses', icon: HandCoins },
];

export const riderNav: NavItem[] = [
  { to: '/staff', label: 'Home', icon: Home, end: true },
  { to: '/staff/rider/deliveries', label: 'Deliveries', icon: Bike },
];

export const STAFF_ATTENDANT_PATHS = [
  '/staff/orders',
  '/staff/inventory',
  '/staff/expenses',
] as const;
