import { searchPexels } from "./pexels.ts";
import { searchPixabay } from "./pixabay.ts";
import type { SearchOpts, StockClip } from "./types.ts";

export function searchStock(o: SearchOpts): Promise<StockClip[]> {
  return o.provider === "pexels" ? searchPexels(o) : searchPixabay(o);
}
