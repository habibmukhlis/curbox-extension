import { get, set, update } from "../lib/storage";
import { dateKey } from "../lib/time";
import type { FocusGroup, FocusSession } from "../lib/types";

let finalizeQueue: Promise<void> = Promise.resolve();

export async function startSession(group: FocusGroup, durationMin: number, exitable: boolean): Promise<FocusSession> {
  const now = Date.now();
  const safeMinutes = Math.max(1, Math.floor(durationMin));
  const plannedMs = Math.min(Number.MAX_SAFE_INTEGER - now, safeMinutes * 60_000);
  const session: FocusSession = {
    groupId: group.id,
    name: group.name,
    domains: group.domains,
    packages: group.packages ?? [],
    mode: group.mode,
    startedAt: now,
    endsAt: now + plannedMs,
    exitable,
    plannedMs,
  };
  await set("focus", session);
  return session;
}

async function logSession(focus: FocusSession, completed: boolean): Promise<void> {
  const now = Date.now();
  const actualMs = Math.max(0, Math.min(now, focus.endsAt) - focus.startedAt);
  await update("focusLog", (log) =>
    [
      {
        at: now,
        day: dateKey(new Date(focus.startedAt)),
        startedAt: focus.startedAt,
        endedAt: Math.min(now, focus.endsAt),
        groupId: focus.groupId,
        name: focus.name,
        plannedMs: focus.plannedMs,
        actualMs,
        completed,
      },
      ...log,
    ].slice(0, 500),
  );
}

async function finalizeSession(expected?: FocusSession): Promise<void> {
  const run = finalizeQueue.then(async () => {
    const focus = await get("focus");
    if (!focus || (expected && focus.startedAt !== expected.startedAt)) return;
    await logSession(focus, Date.now() >= focus.endsAt);
    await set("focus", null);
  });
  finalizeQueue = run.catch(() => undefined);
  await run;
}

export async function endSession(): Promise<void> {
  const focus = await get("focus");
  if (focus) await finalizeSession(focus);
}

export async function activeSession(): Promise<FocusSession | null> {
  const focus = await get("focus");
  if (!focus) return null;
  if (Date.now() >= focus.endsAt) {
    await finalizeSession(focus);
    return null;
  }
  return focus;
}
