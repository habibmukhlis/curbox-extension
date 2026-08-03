import { useState } from "react";
import type { FocusGroup, WarningScreen } from "../../lib/types";
import { Segmented, Toggle, inputCls } from "../components";

export function WarningEditor({
  warning,
  onChange,
  onEachOpen,
  onChangeOnEachOpen,
  focusGroups,
}: {
  warning: WarningScreen;
  onChange: (warning: WarningScreen) => void;
  onEachOpen: boolean;
  onChangeOnEachOpen: (enabled: boolean) => void;
  focusGroups: FocusGroup[];
}) {
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const patch = (value: Partial<WarningScreen>) => onChange({ ...warning, ...value });

  const toggleOnEachOpen = (enabled: boolean) => {
    onChangeOnEachOpen(enabled);
    if (enabled && warning.challenge === "wait" && warning.waitType === "dynamic") patch({ waitType: "fixed" });
  };

  return (
    <div className="card flex flex-col gap-3 p-4">
      <button onClick={() => setOpen((value) => !value)} className="flex items-center justify-between text-left">
        <span className="text-sm">Warning screen</span>
        <span className="text-xs font-medium text-muted">{open ? "Hide" : "Configure"}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between text-sm">
            On each open
            <Toggle on={onEachOpen} onChange={toggleOnEachOpen} />
          </label>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted">When I try to get past this</p>
            <Segmented
              value={warning.challenge}
              options={[
                { value: "never", label: "Never unlock" },
                { value: "effort", label: "Require effort" },
                { value: "wait", label: "Wait" },
              ]}
              onChange={(challenge) => patch({ challenge })}
            />
          </div>

          {warning.challenge === "effort" && (
            <div className="flex flex-col gap-3">
              <Segmented
                value={warning.effortType}
                options={[
                  { value: "typing", label: "Typing" },
                  { value: "intent", label: "Write intent" },
                  { value: "math", label: "Adaptive math" },
                ]}
                onChange={(effortType) => patch({ effortType })}
              />
              {warning.effortType === "typing" && (
                <textarea
                  value={warning.sentence}
                  onChange={(event) => patch({ sentence: event.target.value })}
                  placeholder="Sentence I must type"
                  rows={3}
                  className={`${inputCls} resize-y`}
                />
              )}
              {warning.effortType === "intent" && (
                <NumberSetting
                  label="Minimum intent length"
                  value={warning.minIntentLength}
                  min={1}
                  onChange={(minIntentLength) => patch({ minIntentLength })}
                  suffix="characters"
                />
              )}
              {warning.effortType === "math" && (
                <>
                  <NumberSetting label="Questions" value={warning.mathQuestionCount} min={1} max={10} onChange={(mathQuestionCount) => patch({ mathQuestionCount })} />
                  <NumberSetting label="Starting level" value={warning.mathStartingLevel} min={1} max={10} onChange={(mathStartingLevel) => patch({ mathStartingLevel })} />
                </>
              )}
            </div>
          )}

          {warning.challenge === "wait" && (
            <div className="flex flex-col gap-2">
              <Segmented
                value={onEachOpen ? "fixed" : warning.waitType}
                options={onEachOpen
                  ? [{ value: "fixed", label: "Fixed time" }]
                  : [{ value: "fixed", label: "Fixed time" }, { value: "dynamic", label: "Choose each time" }]}
                onChange={(waitType) => patch({ waitType })}
              />
              {(onEachOpen || warning.waitType === "fixed") && (
                <NumberSetting label="Unlock for" value={warning.unlockMinutes} min={1} onChange={(unlockMinutes) => patch({ unlockMinutes })} suffix="minutes" />
              )}
            </div>
          )}

          {warning.challenge !== "never" && (
            <NumberSetting label="Brief pause" value={warning.delaySeconds} min={0} onChange={(delaySeconds) => patch({ delaySeconds })} suffix="seconds first" />
          )}

          <div className="flex flex-col gap-4 border-t border-line/70 pt-3">
            <button onClick={() => setAdvanced((value) => !value)} className="flex items-center justify-between text-left">
              <span className="text-xs font-medium text-muted">Advanced</span>
              <span className="text-xs font-medium text-muted">{advanced ? "Hide" : "Show"}</span>
            </button>

            {advanced && (
              <>
                <textarea
                  value={warning.customMessage}
                  onChange={(event) => patch({ customMessage: event.target.value })}
                  placeholder="A message to myself (optional)"
                  rows={2}
                  className={`${inputCls} resize-y`}
                />

                {warning.challenge !== "never" && (
                  <>
                    <label className="flex items-center justify-between text-sm">
                      Require a focus goal first
                      <Toggle on={warning.focusGoalEnabled} onChange={(focusGoalEnabled) => patch({ focusGoalEnabled })} />
                    </label>
                    {warning.focusGoalEnabled && (
                      <div className="flex flex-col gap-2">
                        <select
                          value={warning.focusGoalGroupId}
                          onChange={(event) => patch({ focusGoalGroupId: event.target.value })}
                          className={inputCls}
                        >
                          <option value="">Select a focus group</option>
                          {focusGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                        </select>
                        <NumberSetting label="Focus required today" value={warning.focusGoalRequiredMinutes} min={15} max={1440} onChange={(focusGoalRequiredMinutes) => patch({ focusGoalRequiredMinutes })} suffix="minutes" />
                      </div>
                    )}

                    <label className="flex flex-wrap items-center gap-2 text-sm">
                      Let me through
                      <NumberInput value={warning.proceedLimit} min={0} onChange={(proceedLimit) => patch({ proceedLimit })} />
                      times every
                      <NumberInput value={warning.proceedWindowMinutes} min={1} onChange={(proceedWindowMinutes) => patch({ proceedWindowMinutes })} />
                      minutes
                    </label>
                    <p className="text-xs text-muted">Set passes to 0 for no limit.</p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NumberSetting({ label, value, min, max, onChange, suffix }: { label: string; value: number; min: number; max?: number; onChange: (value: number) => void; suffix?: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      {label}
      <NumberInput value={value} min={min} max={max} onChange={onChange} />
      {suffix}
    </label>
  );
}

function NumberInput({ value, min, max, onChange }: { value: number; min: number; max?: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(event) => {
        const parsed = Math.floor(Number(event.target.value));
        onChange(Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, Number.isFinite(parsed) ? parsed : min)));
      }}
      className={`${inputCls} w-20`}
    />
  );
}
