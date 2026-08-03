import { useCallback, useEffect, useState } from "react";
import { browser } from "#imports";
import { normalizeSyncStatus, type SyncRequest, type SyncResponse, type SyncStatus } from "../../lib/sync/types";

async function send(req: SyncRequest): Promise<SyncResponse> {
  return (await browser.runtime.sendMessage(req)) as SyncResponse;
}

export function useSync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await send({ type: "sync:status" });
      if (res.status) setStatus(normalizeSyncStatus(res.status));
    } catch (err) {
      setError(String((err as Error)?.message ?? err));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const run = useCallback(
    async (req: SyncRequest): Promise<SyncResponse> => {
      setBusy(true);
      setError(null);
      try {
        const res = await send(req);
        if (res.status) setStatus(normalizeSyncStatus(res.status));
        if (!res.ok) setError(res.error ?? "Something went wrong");
        return res;
      } catch (err) {
        const message = String((err as Error)?.message ?? err ?? "Something went wrong");
        setError(message);
        return { ok: false, error: message };
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { status, busy, error, refresh, run };
}
