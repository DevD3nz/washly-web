import type { OrderReceipt } from './api';
import { formatPeso } from '../features/orders/orderBoardUi';

function appendText(parent: HTMLElement, tag: string, text: string, className?: string): void {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) {
    el.className = className;
  }
  parent.appendChild(el);
}

export function printOrderReceipt(receipt: OrderReceipt, companyName?: string): void {
  const existing = document.getElementById('washly-print-root');
  existing?.remove();

  const root = document.createElement('div');
  root.id = 'washly-print-root';
  root.className = 'washly-receipt-print';

  appendText(root, 'h1', companyName ?? 'WashLy');
  appendText(root, 'p', `${receipt.order_number} · ${receipt.status}`);

  if (receipt.customer_name) {
    appendText(root, 'p', receipt.customer_name);
  }
  if (receipt.customer_phone) {
    appendText(root, 'p', receipt.customer_phone);
  }
  if (receipt.branch) {
    appendText(root, 'p', receipt.branch.name);
  }

  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  for (const item of receipt.items) {
    const row = document.createElement('tr');
    const desc = document.createElement('td');
    desc.textContent = `${item.quantity}× ${item.description}`;
    const line = document.createElement('td');
    line.textContent =
      item.line_total_cents != null ? formatPeso(item.line_total_cents) : '—';
    row.append(desc, line);
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  root.appendChild(table);

  const total =
    receipt.total_cents != null ? formatPeso(receipt.total_cents) : '—';
  appendText(root, 'p', `Total: ${total}`, 'total');

  document.body.appendChild(root);
  window.print();
  root.remove();
}
