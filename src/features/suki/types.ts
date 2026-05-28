export type CustomerType = 'guest' | 'suki';

export type Customer = {
  id: number;
  type: CustomerType;
  phone: string;
  name: string | null;
  points_balance: number;
  created_at: string | null;
};

export type CustomerLookupResponse = {
  customer: Customer | null;
};
