import { ChevronDown, SlidersHorizontal, CalendarDays } from 'lucide-react';
import { SPRINTS, PODS, ALL_PLATFORMS, getSprintsInRange } from './mockData';
import type { AppContext, Platform } from './mockData';

type Props = {
  context: AppContext;
  onChange: (ctx: AppContext) => void;
};

export function ContextSelector({ context, onChange }: Props) {
  const currentSprintObj = SPRINTS.find(s => s.isCurrent);
  const currentIdx = SPRINTS.findIndex(s => s.isCurrent);

  const fromIdx = SPRINTS.findIndex(s => s.id === context.sprintRange.from);
  const toIdx = SPRINTS.findIndex(s => s.id === context.sprintRange.to);
  const rangeCount = Math.abs(toIdx - fromIdx) + 1;

  const fromSprint = SPRINTS[Math.min(fromIdx, toIdx)];
  const toSprint = SPRINTS[Math.max(fromIdx, toIdx)];

  const isCurrentPreset =
    context.sprintRange.from === context.sprintRange.to &&
    context.sprintRange.from === currentSprintObj?.id;
  const isAllPreset =
    context.sprintRange.from === SPRINTS[0].id &&
    context.sprintRange.to === SPRINTS[SPRINTS.length - 1].id;

  const sprintsInRange = getSprintsInRange(context.sprintRange.from, context.sprintRange.to);

  function setFrom(id: string) {
    onChange({ ...context, sprintRange: { ...context.sprintRange, from: id } });
  }
  function setTo(id: string) {
    onChange({ ...context, sprintRange: { ...context.sprintRange, to: id } });
  }
  function setPreset(preset: 'current' | 'last2' | 'all') {
    if (preset === 'current' && currentSprintObj) {
      onChange({ ...context, sprint: currentSprintObj.id, sprintRange: { from: currentSprintObj.id, to: currentSprintObj.id } });
    } else if (preset === 'last2') {
      const from = SPRINTS[Math.max(0, currentIdx - 1)].id;
      onChange({ ...context, sprintRange: { from, to: SPRINTS[currentIdx].id } });
    } else if (preset === 'all') {
      onChange({ ...context, sprintRange: { from: SPRINTS[0].id, to: SPRINTS[SPRINTS.length - 1].id } });
    }
  }
  function togglePod(pod: string) {
    const pods = context.pods.includes(pod)
      ? context.pods.filter(p => p !== pod)
      : [...context.pods, pod];
    onChange({ ...context, pods });
  }

  return (
    <div className="bg-white border-b border-slate-200">
      {/* Row 1: Sprint Range */}
      <div className="flex items-center gap-3 px-6 py-2 border-b border-slate-100 flex-wrap">
        <CalendarDays size={13} className="text-slate-400 flex-shrink-0" />
        <span className="text-xs text-slate-500 flex-shrink-0">Sprint range:</span>

        <div className="relative">
          <select
            value={context.sprintRange.from}
            onChange={e => setFrom(e.target.value)}
            className="appearance-none pl-3 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SPRINTS.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' ●' : ''}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <span className="text-xs text-slate-400">→</span>

        <div className="relative">
          <select
            value={context.sprintRange.to}
            onChange={e => setTo(e.target.value)}
            className="appearance-none pl-3 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SPRINTS.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' ●' : ''}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Preset chips */}
        <div className="flex items-center gap-1">
          {([
            { key: 'current', label: 'Current only', active: isCurrentPreset },
            { key: 'last2',   label: 'Last 2',       active: !isCurrentPreset && !isAllPreset && rangeCount === 2 },
            { key: 'all',     label: 'All sprints',  active: isAllPreset },
          ] as const).map(p => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                p.active
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Compact sprint range indicator */}
        <div className="flex items-center gap-1.5 ml-1">
          <span className="text-xs text-slate-500">{fromSprint?.name} → {toSprint?.name}</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-xs">{rangeCount}</span>
          {sprintsInRange.some(s => s.isCurrent) && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-xs">incl. current</span>
          )}
        </div>

        <div className="ml-auto text-xs text-slate-400 flex-shrink-0 hidden xl:block">
          {fromSprint?.startDate} — {toSprint?.endDate}
        </div>
      </div>

      {/* Row 2: Active Sprint + Pod + Platform */}
      <div className="flex items-center gap-3 px-6 py-2 flex-wrap">
        <SlidersHorizontal size={13} className="text-slate-400 flex-shrink-0" />
        <span className="text-xs text-slate-500 flex-shrink-0">Active sprint:</span>

        <div className="relative">
          <select
            value={context.sprint}
            onChange={e => onChange({ ...context, sprint: e.target.value })}
            className="appearance-none pl-3 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SPRINTS.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (Current)' : ''}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <span className="text-xs text-slate-400 italic">for detail views</span>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        {/* Pod filter — scrollable compact buttons */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs text-slate-500 flex-shrink-0">Pods:</span>
          <button
            onClick={() => onChange({ ...context, pods: [] })}
            className={`px-2 py-0.5 rounded text-xs transition-colors flex-shrink-0 ${
              context.pods.length === 0
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 pb-1 pr-1" style={{ scrollbarWidth: 'thin' }}>
            {PODS.map(pod => (
              <button
                key={pod}
                onClick={() => togglePod(pod)}
                className={`px-2 py-0.5 rounded text-xs transition-colors flex-shrink-0 ${
                  context.pods.includes(pod)
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pod}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        {/* Platform filter — select dropdown */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-slate-500">Platform:</span>
          <div className="relative">
            <select
              value={context.platform}
              onChange={e => onChange({ ...context, platform: e.target.value as 'All' | Platform })}
              className="appearance-none pl-3 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Platforms</option>
              {ALL_PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
