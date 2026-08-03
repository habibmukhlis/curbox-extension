import type { DaySchedule, TimeRange } from "../../lib/types";
import { clockToMinutes, minutesToClock } from "../../lib/time";
import { DayChips, Segmented, Toggle, inputCls } from "../components";
import { DAY_NAMES } from "./constants";

type ScheduleMode = "all-day" | "daily" | "custom";

export function ScheduleEditor({ schedule, onChange }: { schedule: DaySchedule; onChange: (schedule: DaySchedule) => void }) {
  const mode = scheduleMode(schedule);
  const first = schedule.days.find((day) => day.active) ?? schedule.days[0];
  const active = schedule.days.map((day) => day.active);

  const setMode = (next: ScheduleMode) => {
    if (next === "all-day") {
      onChange({ ...schedule, scheduleUniform: true, days: schedule.days.map((day) => ({ ...day, active: true, ranges: [{ start: 0, end: 1440 }] })) });
      return;
    }
    if (next === "daily") {
      const ranges = isAllDay(first.ranges) ? [{ start: 9 * 60, end: 17 * 60 }] : first.ranges;
      onChange({ ...schedule, scheduleUniform: true, days: schedule.days.map((day) => ({ ...day, active: true, ranges })) });
      return;
    }
    onChange({ ...schedule, scheduleUniform: false });
  };

  const setAllRanges = (ranges: TimeRange[]) =>
    onChange({ ...schedule, days: schedule.days.map((day) => ({ ...day, active: true, ranges })) });
  const setDayRanges = (index: number, ranges: TimeRange[]) =>
    onChange({ ...schedule, days: schedule.days.map((day, i) => (i === index ? { ...day, ranges } : day)) });
  const setAllLimits = (limitMinutes: number) =>
    onChange({ ...schedule, days: schedule.days.map((day) => ({ ...day, limitMinutes })) });
  const setDayLimit = (index: number, limitMinutes: number) =>
    onChange({ ...schedule, days: schedule.days.map((day, i) => (i === index ? { ...day, limitMinutes } : day)) });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="label">Active hours</p>
        <Segmented
          value={mode}
          options={[
            { value: "all-day", label: "All day" },
            { value: "daily", label: "Daily" },
            { value: "custom", label: "Custom" },
          ]}
          onChange={setMode}
        />
        {mode === "daily" && <RangeEditor ranges={first.ranges} onChange={setAllRanges} />}
        {mode === "custom" && (
          <>
            <DayChips
              active={active}
              onToggle={(index) =>
                onChange({
                  ...schedule,
                  days: schedule.days.map((day, i) => (i === index ? { ...day, active: !day.active } : day)),
                })
              }
            />
            <div className="flex flex-col gap-3">
              {schedule.days.map((day, index) =>
                day.active ? (
                  <div key={index} className="flex flex-col gap-1">
                    <span className="text-xs text-muted">{DAY_NAMES[index]}</span>
                    <RangeEditor ranges={day.ranges} onChange={(ranges) => setDayRanges(index, ranges)} />
                  </div>
                ) : null,
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="label">Usage limit during active hours</p>
        <label className="flex items-center justify-between text-xs text-muted">
          Different limit each day
          <Toggle
            on={!schedule.usageUniform}
            onChange={(different) =>
              onChange({
                ...schedule,
                usageUniform: !different,
                days: different
                  ? schedule.days
                  : schedule.days.map((day) => ({ ...day, limitMinutes: first.limitMinutes })),
              })
            }
          />
        </label>
        {schedule.usageUniform ? (
          <LimitInput value={first.limitMinutes} onChange={setAllLimits} />
        ) : (
          <div className="flex flex-col gap-1">
            {schedule.days.map((day, index) =>
              day.active ? (
                <label key={index} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-muted">{DAY_NAMES[index]}</span>
                  <LimitInput value={day.limitMinutes} onChange={(minutes) => setDayLimit(index, minutes)} />
                </label>
              ) : null,
            )}
          </div>
        )}
        <p className="text-xs text-muted">Set the limit to 0 to block for all active hours.</p>
      </div>
    </div>
  );
}

function LimitInput({ value, onChange }: { value: number; onChange: (minutes: number) => void }) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Math.max(0, Math.floor(Number(event.target.value)) || 0))}
        className={`${inputCls} w-20`}
      />
      minutes
    </span>
  );
}

function RangeEditor({ ranges, onChange }: { ranges: TimeRange[]; onChange: (ranges: TimeRange[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {ranges.map((range, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <input
            type="time"
            value={minutesToClock(range.start % 1440)}
            onChange={(event) =>
              onChange(ranges.map((item, i) => (i === index ? { ...item, start: clockToMinutes(event.target.value) } : item)))
            }
            className={inputCls}
          />
          to
          <input
            type="time"
            value={minutesToClock(range.end % 1440)}
            onChange={(event) => {
              const end = clockToMinutes(event.target.value);
              onChange(ranges.map((item, i) => (i === index ? { ...item, end: end === 0 && item.start === 0 ? 1440 : end } : item)));
            }}
            className={inputCls}
          />
          <button onClick={() => onChange(ranges.filter((_, i) => i !== index))} className="text-xs text-muted">✕</button>
        </div>
      ))}
      <button onClick={() => onChange([...ranges, { start: 9 * 60, end: 17 * 60 }])} className="self-start text-xs text-muted">
        + Add time range
      </button>
    </div>
  );
}

function scheduleMode(schedule: DaySchedule): ScheduleMode {
  if (schedule.days.every((day) => day.active && isAllDay(day.ranges))) return "all-day";
  return schedule.scheduleUniform ? "daily" : "custom";
}

function isAllDay(ranges: TimeRange[]): boolean {
  return ranges.length === 1 && ranges[0].start === 0 && ranges[0].end === 1440;
}
