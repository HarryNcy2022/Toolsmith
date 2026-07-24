export interface ImageEntry {
  id: number;
  dataUrl: string;
  timestamp: number;
  sortOrder: number;
}

const DB_NAME = 'ImageClipboard';
const STORE_NAME = 'images';
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('sortOrder', 'sortOrder', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addImage(dataUrl: string): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const countReq = store.count();
    countReq.onsuccess = () => {
      const sortOrder = countReq.result;
      const entry: Omit<ImageEntry, 'id'> = { dataUrl, timestamp: Date.now(), sortOrder };
      const addReq = store.add(entry);
      addReq.onsuccess = () => resolve(addReq.result as number);
      addReq.onerror = () => reject(addReq.error);
    };
    countReq.onerror = () => reject(countReq.error);
  });
}

export async function getAllImages(): Promise<ImageEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('sortOrder');
    const req = index.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteImage(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAll(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updateOrder(ids: number[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    ids.forEach((id, index) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const entry = getReq.result as ImageEntry | undefined;
        if (entry) {
          entry.sortOrder = index;
          store.put(entry);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
