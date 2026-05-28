export type ReportPeriod = 'today' | '7d' | '30d';

export type CommandCenterPulse = {
  revenue_cents: number;
  expenses_cents: number;
  gross_profit_cents: number;
  orders_settled: number;
  orders_created: number;
  orders_in_progress: number;
  orders_ready: number;
};

export type CommandCenterCompareRow = {
  branch_id: number;
  branch_name: string;
  revenue_cents: number;
  expenses_cents: number;
  gross_profit_cents: number;
  orders_settled: number;
};

export type CommandCenterAlert = {
  type: string;
  message: string;
  count: number;
};

export type AccountFeatureToggles = {
  staff_inventory_editing: boolean;
  staff_expense_logging: boolean;
  payroll_modifications: boolean;
};

export type CommandCenterPayload = {
  period: ReportPeriod;
  branch_id: number | null;
  pulse: CommandCenterPulse;
  compare: CommandCenterCompareRow[];
  alerts: CommandCenterAlert[];
  settings: AccountFeatureToggles;
};
