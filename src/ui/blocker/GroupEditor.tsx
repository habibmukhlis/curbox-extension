import { useState } from "react";
import type { BlockGroup, FocusGroup } from "../../lib/types";
import { btnPrimary, btnOutline, btnGhost, inputCls } from "../components";
import { useDraft } from "../useDraft";
import { ScheduleEditor } from "./ScheduleEditor";
import { WarningEditor } from "./WarningEditor";

export function GroupEditor({
  group,
  focusGroups,
  onSave,
  onCancel,
}: {
  group: BlockGroup;
  focusGroups: FocusGroup[];
  onSave: (group: BlockGroup) => void;
  onCancel: () => void;
}) {
  const [draft, patch] = useDraft<BlockGroup>(group);
  const [entry, setEntry] = useState("");

  const addMatcher = () => {
    const clean = entry.trim().toLowerCase();
    if (!clean || draft.matchers.includes(clean)) return setEntry("");
    patch({ matchers: [...draft.matchers, clean] });
    setEntry("");
  };

  return (
    <div className="flex flex-col gap-5">
      <input
        value={draft.name}
        onChange={(e) => patch({ name: e.target.value })}
        placeholder="Group name"
        className={`${inputCls} text-base`}
      />

      <div className="flex flex-col gap-2">
        <p className="label">Websites and keywords to block</p>
        <div className="flex gap-2">
          <input
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMatcher()}
            placeholder="youtube.com or youtube.com/shorts"
            className={`${inputCls} flex-1`}
          />
          <button onClick={addMatcher} className={btnOutline}>
            Add
          </button>
        </div>
        <div className="flex flex-col">
          {draft.matchers.map((m) => (
            <div key={m} className="flex items-center justify-between border-b border-line/70 py-2">
              <span className="font-mono text-sm">{m}</span>
              <button
                onClick={() => patch({ matchers: draft.matchers.filter((x) => x !== m) })}
                className="text-xs text-faint transition-colors hover:text-ink"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <ScheduleEditor schedule={draft.schedule} onChange={(schedule) => patch({ schedule })} />

      <WarningEditor
        warning={draft.warning}
        onChange={(warning) => patch({ warning })}
        onEachOpen={draft.onEachOpen}
        onChangeOnEachOpen={(onEachOpen) => patch({ onEachOpen, mode: onEachOpen ? "on-open" : "usage" })}
        focusGroups={focusGroups}
      />

      <div className="flex items-center gap-4">
        <button onClick={() => onSave({ ...draft, name: draft.name.trim() || "Untitled" })} className={btnPrimary}>
          Done
        </button>
        <button onClick={onCancel} className={btnGhost}>
          Cancel
        </button>
      </div>
    </div>
  );
}
