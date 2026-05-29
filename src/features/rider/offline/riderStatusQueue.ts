const DB_NAME = 'washly-rider-v1';
const STORE = 'pending-status';
const DB_VERSION = 1;

export type PendingRiderStatusUpdate = {
  id: string;
  orderId: number;
  status: string;
  createdAt: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
  });
}

export async function listPendingRiderUpdates(): Promise<PendingRiderStatusUpdate[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve((request.result as PendingRiderStatusUpdate[]) ?? []);
    };
  });
}

export async function enqueueRiderStatusUpdate(
  orderId: number,
  status: string,
): Promise<PendingRiderStatusUpdate> {
  const entry: PendingRiderStatusUpdate = {
    id: crypto.randomUUID(),
    orderId,
    status,
    createdAt: new Date().toISOString(),
  };
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const request = store.add(entry);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(entry);
  });
}

export async function removePendingRiderUpdate(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
