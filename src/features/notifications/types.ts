export type NotificationSettings = {
  email_enabled: boolean;
  sms_enabled: boolean;
  sms_credits_balance: number;
  sms_disabled_reason: string | null;
  sms_credits_included_on_plan: number;
  sms_trigger_order_received: boolean;
  sms_trigger_order_ready: boolean;
  sms_trigger_order_settled: boolean;
};

export type SubscriptionPlanCatalog = {
  id: number;
  slug: string;
  name: string;
  price_label: string;
  sms_credits_included: number;
};

export type PaymentProof = {
  id: number;
  status: string;
  amount_cents: number;
  payment_reference: string;
  plan: { slug: string; name: string; sms_credits_included: number } | null;
  created_at: string | null;
};
