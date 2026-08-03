import { browser } from "#imports";
import type { KdfParams } from "../crypto";
import type { UsageHistory } from "../types";
import type { SyncPreferences } from "./types";

const K_DEVICE_ID = "sync.deviceId";
const K_CURSOR = "sync.cursor";
const K_DEK = "sync.dek";
const K_VAULT = "sync.vaultMeta";
const K_REMOTE_USAGE = "sync.remoteUsage";
const K_REMOTE_USAGE_VIEW = "sync.remoteUsageView";
const K_PREFERENCES = "sync.preferences";
const K_FOCUS_GROUP_IDS = "sync.focusGroupIds";
const DEFAULT_PREFERENCES: SyncPreferences = { usageStats: true, reducerConfigs: true, usageDeviceIds: [] };

export interface VaultMeta {
  userId: string;
  saltB64: string;
  params: KdfParams;
  wrappedB64: string;
}

async function read<T>(key: string): Promise<T | null> {
  const res = await browser.storage.local.get(key);
  return (res[key] as T | undefined) ?? null;
}

async function write(key: string, value: unknown): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

export async function getDeviceId(): Promise<string> {
  let id = await read<string>(K_DEVICE_ID);
  if (!id) {
    id = crypto.randomUUID();
    await write(K_DEVICE_ID, id);
  }
  return id;
}

export interface SyncCursor {
  updatedAt: string;
  id: string;
}

export async function getCursor(): Promise<SyncCursor> {
  const stored = await read<string | SyncCursor>(K_CURSOR);
  if (typeof stored === "string") return { updatedAt: stored, id: "" };
  return stored ?? { updatedAt: "1970-01-01T00:00:00Z", id: "" };
}
export const setCursor = (cursor: SyncCursor | string) =>
  write(K_CURSOR, typeof cursor === "string" ? { updatedAt: cursor, id: "" } : cursor);

export const getStoredDek = () => read<string>(K_DEK);
export const setStoredDek = (dekB64: string) => write(K_DEK, dekB64);

export const getVaultMeta = () => read<VaultMeta>(K_VAULT);
export const setVaultMeta = (meta: VaultMeta) => write(K_VAULT, meta);

export const getRemoteUsage = async (): Promise<UsageHistory> => (await read<UsageHistory>(K_REMOTE_USAGE)) ?? {};
export const setRemoteUsage = (usage: UsageHistory) => write(K_REMOTE_USAGE, usage);
export const getSyncPreferences = async (): Promise<SyncPreferences> => ({
  ...DEFAULT_PREFERENCES,
  ...((await read<Partial<SyncPreferences>>(K_PREFERENCES)) ?? {}),
});
export const setSyncPreferences = (preferences: SyncPreferences) => write(K_PREFERENCES, preferences);
export const getKnownFocusGroupIds = async (): Promise<string[]> => (await read<string[]>(K_FOCUS_GROUP_IDS)) ?? [];
export const setKnownFocusGroupIds = (ids: Iterable<string>) => write(K_FOCUS_GROUP_IDS, [...new Set(ids)]);

export async function clearSyncState(): Promise<void> {
  const preferences = await getSyncPreferences();
  await browser.storage.local.remove([
    K_DEVICE_ID,
    K_CURSOR,
    K_DEK,
    K_VAULT,
    K_REMOTE_USAGE,
    K_REMOTE_USAGE_VIEW,
    K_FOCUS_GROUP_IDS,
  ]);
  await setSyncPreferences({ ...preferences, usageDeviceIds: [] });
}
