import { ref, shallowRef } from 'vue';

export interface CatalogModelCost {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
}

export interface CatalogModel {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  family?: string;
  reasoning?: boolean;
  context?: number;
  outputLimit?: number;
  cost: CatalogModelCost;
  searchKey: string;
}

interface RawCost {
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
}

interface RawModel {
  id?: string;
  name?: string;
  family?: string;
  reasoning?: boolean;
  cost?: RawCost;
  limit?: { context?: number; output?: number };
}

interface RawProvider {
  id?: string;
  name?: string;
  models?: Record<string, RawModel>;
}

type RawCatalog = Record<string, RawProvider>;

interface CatalogDoc {
  _id: string;
  _rev?: string;
  fetchedAt: number;
  providers: RawCatalog;
}

const CATALOG_URL = 'https://models.dev/api.json';
const DOC_ID = 'model-catalog:v1';
const CACHE_TTL_MS = 60 * 60 * 1000;

const models = shallowRef<CatalogModel[]>([]);
const loading = ref(false);
const error = ref<Error | null>(null);
const lastFetchedAt = ref<number | null>(null);
let currentRev: string | undefined;
let inflight: Promise<void> | null = null;

function getStorage() {
  const db = (globalThis as any)?.window?.utools?.db?.promises;
  return db ?? null;
}

async function readCache(): Promise<CatalogDoc | null> {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const doc = (await storage.get(DOC_ID)) as CatalogDoc | null;
    return doc ?? null;
  } catch {
    return null;
  }
}

async function writeCache(providers: RawCatalog, fetchedAt: number) {
  const storage = getStorage();
  if (!storage) return;
  const doc: CatalogDoc = { _id: DOC_ID, fetchedAt, providers };
  if (currentRev) doc._rev = currentRev;
  try {
    const res = await storage.put(doc);
    if (res?.ok && res.rev) currentRev = res.rev;
  } catch (err) {
    console.warn('[useModelCatalog] failed to persist catalog:', err);
  }
}

function normalize(raw: RawCatalog): CatalogModel[] {
  const list: CatalogModel[] = [];
  for (const providerId of Object.keys(raw)) {
    const provider = raw[providerId];
    if (!provider?.models) continue;
    const providerName = provider.name ?? providerId;
    for (const modelId of Object.keys(provider.models)) {
      const m = provider.models[modelId];
      if (!m) continue;
      const cost = m.cost ?? {};
      if (cost.input == null && cost.output == null && cost.cache_read == null && cost.cache_write == null) {
        continue;
      }
      const modelName = m.name ?? modelId;
      list.push({
        providerId,
        providerName,
        modelId,
        modelName,
        family: m.family,
        reasoning: m.reasoning,
        context: m.limit?.context,
        outputLimit: m.limit?.output,
        cost: {
          input: cost.input,
          output: cost.output,
          cacheRead: cost.cache_read,
          cacheWrite: cost.cache_write
        },
        searchKey: `${providerName} ${providerId} ${modelName} ${modelId}`.toLowerCase()
      });
    }
  }
  list.sort((a, b) => {
    const p = a.providerName.localeCompare(b.providerName);
    return p !== 0 ? p : a.modelName.localeCompare(b.modelName);
  });
  return list;
}

async function fetchRaw(): Promise<RawCatalog> {
  const res = await fetch(CATALOG_URL, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`models.dev 请求失败 (${res.status})`);
  return (await res.json()) as RawCatalog;
}

async function run(force: boolean) {
  if (inflight) return inflight;
  loading.value = true;
  error.value = null;
  inflight = (async () => {
    try {
      if (!force) {
        const cached = await readCache();
        if (cached) {
          currentRev = cached._rev;
          if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            models.value = normalize(cached.providers);
            lastFetchedAt.value = cached.fetchedAt;
            return;
          }
        }
      }
      const providers = await fetchRaw();
      const fetchedAt = Date.now();
      models.value = normalize(providers);
      lastFetchedAt.value = fetchedAt;
      await writeCache(providers, fetchedAt);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      loading.value = false;
      inflight = null;
    }
  })();
  return inflight;
}

export function useModelCatalog() {
  return {
    models,
    loading,
    error,
    lastFetchedAt,
    load: () => run(false),
    refresh: () => run(true)
  };
}
