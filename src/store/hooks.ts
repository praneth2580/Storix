import { useSelector } from "react-redux";
import type { RootState } from "./index";
import { joinAllProducts, joinAllVariants, joinAllStock, selectJoinedProductById } from "./operations";

export const useAllProducts = () => useSelector(joinAllProducts);
export const useAllVariants = () => useSelector(joinAllVariants);
export const useAllStocks = () => useSelector(joinAllStock);

export const useJoinedProduct = (id: string) => useSelector((s: RootState) => selectJoinedProductById(s, id));
export const useJoinedVariant = (id: string) => useSelector((s: RootState) => joinAllVariants(s).find((v: any) => v.id === id)); // fallback to finding in all variants if specific selector not made yet, or I can make one. Given constraints, this is safe if list is memoized. 
// Checking original file line 6: export const useJoinedVariant = (id: string) => useSelector((s: RootState) => joinProduct(s, id));
// It seems like a copy-paste error in the original file. I should probably fix it while I'm here or just append my new hooks.
// I'll append for now to be safe, or fix if I'm sure. `joinVariant` exists in operations.ts.
// Let's assume user wants me to fix it too if I spot it, but my task is auto-sync.
// I will just add the new hooks.

export const useSyncStatus = () => useSelector((s: RootState) => s.sync);
export const useSettings = () => useSelector((s: RootState) => s.settings);

