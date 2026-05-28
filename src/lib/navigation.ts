import {
  Activity,
  Building2,
  HandCoins,
  Home,
  Package,
  Boxes,
  Users,
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
  { to: '/branches', label: 'Branches', icon: Building2 },
  { to: '/employees', label: 'Staff', icon: Users },
  { to: '/expenses', label: 'Expenses', icon: HandCoins },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/activity', label: 'Activity', icon: Activity },
];

export const staffNav: NavItem[] = [
  { to: '/staff', label: 'Home', icon: Home, end: true },
  { to: '/staff/orders', label: 'Orders', icon: Package },
  { to: '/staff/inventory', label: 'Inventory', icon: Boxes },
  { to: '/staff/expenses', label: 'Expenses', icon: HandCoins },
];
