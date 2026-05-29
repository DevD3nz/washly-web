export type PaymentInstructions = {
  gcash_number: string;
  gcash_name: string;
  bank_name: string;
  bank_account: string;
  bank_account_name: string;
};

export type SubscriptionOverview = {
  status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  grace_ends_at: string | null;
  plan: {
    slug: string;
    name: string;
    price_label: string;
    sms_credits_included: number;
  } | null;
  payment_instructions: PaymentInstructions;
  proofs: Array<{
    id: number;
    status: string;
    amount_cents: number;
    payment_reference: string;
    attachment_path: string | null;
    created_at: string | null;
  }>;
};
