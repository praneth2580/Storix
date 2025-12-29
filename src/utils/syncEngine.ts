import { jsonp } from "./index";
import { store } from "../store";
import {
  setLastSync,

  clearPending,
  setSyncing,
} from "../store/slices/syncSlice";

import {
  setTableData,
  mergeChanges,
} from "../store/slices/dataSlice";

import {
  setSettings
} from "../store/slices/settingsSlice";

// dynamic URL now
const getBaseUrl = () => {
  const state = store.getState() as any;
  return state.settings.scriptUrl;
};

// 1) Full sync
export async function syncAll() {
  store.dispatch(setSyncing(true));

  const url = getBaseUrl();
  if (!url) {
    console.warn("No scriptUrl in settings, skipping sync");
    store.dispatch(setSyncing(false));
    return;
  }

  const res = await jsonp(`${url}?action=syncAll`);

  Object.keys(res).forEach(key => {
    if (key === "__meta__" || key === "now") return;
    store.dispatch(setTableData({ table: key, rows: res[key] }));
  });

  store.dispatch(setLastSync(res.now));
  store.dispatch(setSyncing(false));
}

// 2) Settings sync
export async function syncSettings() {
  const url = getBaseUrl();
  if (!url) return;
  const res = await jsonp(`${url}?action=getSettings`);
  store.dispatch(setSettings(res.settings));
}

// 3) Delta sync
export async function syncChanges() {
  const state = store.getState().sync;
  if (!state.lastSync) return;

  const url = getBaseUrl();
  if (!url) return;

  store.dispatch(setSyncing(true));
  const res = await jsonp(`${url}?action=syncChanges&since=${state.lastSync}`);

  Object.entries(res.changes).forEach(([table, payload]: any) => {
    store.dispatch(mergeChanges({ table, payload }));
  });

  store.dispatch(setLastSync(res.now));
  store.dispatch(setSyncing(false));
}

// 4) Write queue processor
export async function processPending() {
  const url = getBaseUrl();
  if (!url) return; // cannot process without url

  const pendingQueue = store.getState().sync.pending;

  for (const task of pendingQueue) {
    const paramsObj: any = {
      action: task.action,
      sheet: task.sheet,
    };
    if (task.data) paramsObj.data = encodeURIComponent(JSON.stringify(task.data));
    if (task.id) paramsObj.id = task.id;

    const params = new URLSearchParams(paramsObj);

    const res = await jsonp(`${url}?${params.toString()}`);
    if (res.error) {
      console.warn("retry later", res.error);
      continue;
    }
  }

  store.dispatch(clearPending());
}

// 5) Start sync engine
export function startSyncEngine() {
  syncAll().then(syncSettings);

  // run every 20 seconds
  setInterval(() => {
    syncChanges();
    processPending();
  }, 20000);
}
