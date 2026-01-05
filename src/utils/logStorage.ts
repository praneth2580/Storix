import { LogEntry } from '../store/slices/logSlice';

const DB_NAME = 'StorixLogs';
const DB_VERSION = 1;
const STORE_NAME = 'logs';

let db: IDBDatabase | null = null;

export async function initLogDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { 
          keyPath: 'id',
          autoIncrement: false 
        });
        
        // Create indexes for efficient querying
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('level', 'level', { unique: false });
        objectStore.createIndex('source', 'source', { unique: false });
      }
    };
  });
}

export async function saveLog(entry: LogEntry): Promise<void> {
  const database = await initLogDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put(entry);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save log'));
  });
}

export async function saveLogs(entries: LogEntry[]): Promise<void> {
  const database = await initLogDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let completed = 0;
    let hasError = false;
    
    entries.forEach(entry => {
      const request = store.put(entry);
      
      request.onsuccess = () => {
        completed++;
        if (completed === entries.length && !hasError) {
          resolve();
        }
      };
      
      request.onerror = () => {
        if (!hasError) {
          hasError = true;
          reject(new Error('Failed to save logs'));
        }
      };
    });
  });
}

export async function getAllLogs(): Promise<LogEntry[]> {
  const database = await initLogDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    // Get all logs sorted by timestamp (newest first)
    const request = index.openCursor(null, 'prev');
    const logs: LogEntry[] = [];
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        logs.push(cursor.value);
        cursor.continue();
      } else {
        resolve(logs);
      }
    };
    
    request.onerror = () => reject(new Error('Failed to load logs'));
  });
}

export async function getLogsByDateRange(startDate: number, endDate: number): Promise<LogEntry[]> {
  const database = await initLogDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    const range = IDBKeyRange.bound(startDate, endDate);
    const request = index.openCursor(range, 'prev');
    const logs: LogEntry[] = [];
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        logs.push(cursor.value);
        cursor.continue();
      } else {
        resolve(logs);
      }
    };
    
    request.onerror = () => reject(new Error('Failed to load logs by date range'));
  });
}

export async function clearAllLogs(): Promise<void> {
  const database = await initLogDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear logs'));
  });
}

export async function deleteOldLogs(keepCount: number): Promise<void> {
  const database = await initLogDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    // Get all logs sorted by timestamp (oldest first)
    const request = index.openCursor(null, 'next');
    const logs: LogEntry[] = [];
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        logs.push(cursor.value);
        cursor.continue();
      } else {
        // Delete logs beyond keepCount
        if (logs.length > keepCount) {
          const logsToDelete = logs.slice(0, logs.length - keepCount);
          let deleted = 0;
          
          logsToDelete.forEach(log => {
            const deleteRequest = store.delete(log.id);
            deleteRequest.onsuccess = () => {
              deleted++;
              if (deleted === logsToDelete.length) {
                resolve();
              }
            };
            deleteRequest.onerror = () => {
              reject(new Error('Failed to delete old logs'));
            };
          });
        } else {
          resolve();
        }
      }
    };
    
    request.onerror = () => reject(new Error('Failed to load logs for cleanup'));
  });
}

