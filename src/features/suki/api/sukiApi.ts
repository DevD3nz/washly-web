import { api, staffApi } from '../../../lib/api';
import type { CustomerLookupResponse } from '../types';

export async function lookupCustomerByPhone(
  phone: string,
  asStaff = false,
): Promise<CustomerLookupResponse> {
  const root = asStaff ? '/staff/customers/lookup' : '/customers/lookup';
  const path = `${root}?phone=${encodeURIComponent(phone.trim())}`;
  return asStaff
    ? staffApi<CustomerLookupResponse>(path)
    : api<CustomerLookupResponse>(path);
}
