import { useEffect, useState } from 'react';
import { lookupCustomerByPhone } from '../api/sukiApi';
import type { Customer } from '../types';

type UseCustomerLookupOptions = {
  phone: string;
  asStaff?: boolean;
  debounceMs?: number;
};

export function useCustomerLookup({
  phone,
  asStaff = false,
  debounceMs = 400,
}: UseCustomerLookupOptions) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const trimmed = phone.trim();
    if (trimmed.length < 7) {
      setCustomer(null);
      setError('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    const timer = window.setTimeout(() => {
      void lookupCustomerByPhone(trimmed, asStaff)
        .then((res) => {
          if (!cancelled) {
            setCustomer(res.customer);
          }
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setCustomer(null);
            setError(e instanceof Error ? e.message : 'Lookup failed');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phone, asStaff, debounceMs]);

  return { customer, loading, error };
}
