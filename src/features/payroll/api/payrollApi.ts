import {
  createPayrollRun,
  fetchPayrollRun,
  fetchPayrollRuns,
  postPayrollRun,
} from '../../../lib/api';
import type { PayrollRun, PayrollRunCreatePayload } from '../types';

export async function listPayrollRuns(params?: {
  branch_id?: number;
  status?: 'draft' | 'posted';
}): Promise<PayrollRun[]> {
  return fetchPayrollRuns(params);
}

export async function getPayrollRun(id: number): Promise<PayrollRun> {
  return fetchPayrollRun(id);
}

export async function createRun(payload: PayrollRunCreatePayload): Promise<PayrollRun> {
  return createPayrollRun(payload);
}

export async function postRun(id: number): Promise<PayrollRun> {
  return postPayrollRun(id);
}
