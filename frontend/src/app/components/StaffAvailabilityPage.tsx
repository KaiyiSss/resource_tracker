import { useState, useMemo, useRef } from 'react';
import {
  ChevronUp, ChevronDown, X, ExternalLink, Edit3,
  CalendarDays, BarChart3, ArrowUpDown, SlidersHorizontal,
  CheckCircle2, AlertTriangle, MinusCircle, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  STAFF, SPRINTS, filterStaff, PLATFORM_BG, getEffectiveCapacity,
  getNetAvailable, getStatus, getSprintsInRange
} from './mockData';
import type { AppContext, StaffMember, ManageTab, Page, Platform } from './mockData';
import { ContextSelector } from './ContextSelector';
import { SprintScrollNav } from './SprintScrollNav';

type SortKey = 'name' | 'pod' | 'platform' | 'capacity' | 'demand' | 'holidays' | 'net';
type SortDir = 'asc' | 'desc';

const STATUS_CONFIG = {
  available: { label: 'Available', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', row: 'bg-emerald-50/40', icon: <CheckCircle2 size={12} /> },
  tight:     { label: 'Tight',     bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   row: 'bg-amber-50/30',   icon: <MinusCircle size={12} /> },
  over:      { label: 'Over',      bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     row: 'bg-red-50/40',     icon: <AlertTriangle size={12} /> },
};

type Props = {
  context: AppContext;
  onContextChange: (ctx: AppContext) => void;
  onNavigate: (page: Page, tab?: ManageTab) => void;
  initialStaffId?: string | null;
};

function netColor(net: number) {
  if (net >= 2) return { bg: 'bg-emerald-500', text: 'text-white' };
  if (net >= 0) return { bg: 'bg-amber-400', text: 'text-white' };
  return { bg: 'bg-red-500', text: 'text-white' };
}

export function StaffAvailabilityPage({ context, onContextChange, onNavigate, initialStaffId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('net');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialStaffId ?? null);
  const [crossSprintView, setCrossSprintView] = useState(false);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const sprint = context.sprint;

  const sprintsInRange = getSprintsInRange(context.sprintRange.from, context.sprintRange.to);
  const over10 = sprintsInRange.length > 10;
  const heatColStyle = over10 ? { fontWeight: 600 as const, width: '100px', minWidth: '100px' } : { fontWeight: 600 as const };

  const rows = useMemo(() => {
    let list = filterStaff(context).map(s => ({
      ...s,
      effCap: getEffectiveCapacity(s, sprint),
      demand: s.sprintData[sprint]?.demand ?? 0,
      holidays: s.sprintData[sprint]?.holidays ?? 0,
      net: getNetAvailable(s, sprint),
      status: getStatus(getNetAvailable(s, sprint)),
    }));

    if (availableOnly) list = list.filter(r => r.status === 'available');

    list.sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0;
      if (sortKey === 'name')     { av = a.name;     bv = b.name; }
      if (sortKey === 'pod')      { av = a.pod;      bv = b.pod; }
      if (sortKey === 'platform') { av = a.platform; bv = b.platform; }
      if (sortKey === 'capacity') { av = a.effCap;   bv = b.effCap; }
      if (sortKey === 'demand')   { av = a.demand;   bv = b.demand; }
      if (sortKey === 'holidays') { av = a.holidays; bv = b.holidays; }
      if (sortKey === 'net')      { av = a.net;      bv = b.net; }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [context, sprint, sortKey, sortDir, availableOnly]);

  const selectedMember = selectedId ? STAFF.find(s => s.id === selectedId) ?? null : null;

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const counts = {
    available: rows.filter(r => r.status === 'available').length,
    tight: rows.filter(r => r.status === 'tight').length,
    over: rows.filter(r => r.status === 'over').length,
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={11} className="text-slate-300" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />;
  };

  return (
    <div className="flex flex-col h-full">
      <ContextSelector context={context} onChange={onContextChange} />

      <div className="flex-1 overflow-hidden flex">
        {/* Table area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-slate-900">Staff Availability Finder</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  {crossSprintView
                    ? `${sprintsInRange.length} sprints · ${sprintsInRange[0].name} → ${sprintsInRange[sprintsInRange.length - 1].name}`
                    : `${SPRINTS.find(s => s.id === sprint)?.name} · Click a row to drill down`
                  }
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Status chips — show for single-sprint mode */}
                {!crossSprintView && (Object.entries(counts) as [string, number][]).map(([k, n]) => {
                  const cfg = STATUS_CONFIG[k as keyof typeof STATUS_CONFIG];
                  return (
                    <span key={k} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.icon} {n} {cfg.label}
                    </span>
                  );
                })}

                {/* Cross-sprint view toggle */}
                <button
                  onClick={() => setCrossSprintView(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    crossSprintView
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Layers size={13} /> Cross-sprint
                </button>

                {/* Available-only toggle (single-sprint only) */}
                {!crossSprintView && (
                  <button
                    onClick={() => setAvailableOnly(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      availableOnly
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <SlidersHorizontal size={13} /> Available only
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <SprintScrollNav sprintsInRange={sprintsInRange} scrollRef={tableScrollRef} colMinPx={70} />
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto" ref={tableScrollRef}>
              <table className="w-full text-sm min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {/* Common columns */}
                    {[
                      { key: 'name' as SortKey, label: 'Name' },
                      { key: 'pod' as SortKey, label: 'Pod' },
                      { key: 'platform' as SortKey, label: 'Platform' },
                    ].map(col => (
                      <th key={col.key} className="px-4 py-3 text-left">
                        <button
                          onClick={() => handleSort(col.key)}
                          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors text-xs"
                          style={{ fontWeight: 600 }}
                        >
                          {col.label} <SortIcon col={col.key} />
                        </button>
                      </th>
                    ))}

                    {crossSprintView ? (
                      /* Cross-sprint columns: one per sprint in range */
                      <>
                        {sprintsInRange.map(s => (
                          <th key={s.id} className={`px-3 py-3 text-center text-xs ${s.id === sprint ? 'text-blue-600' : 'text-slate-600'}`} style={heatColStyle}>
                            {s.name.replace('Sprint ', 'S')}
                            {s.id === sprint ? ' ▶' : s.isCurrent ? ' ●' : ''}
                          </th>
                        ))}
                        {sprintsInRange.length > 1 && (
                          <th className="px-3 py-3 text-center text-xs text-slate-500" style={{ fontWeight: 600 }}>Worst</th>
                        )}
                      </>
                    ) : (
                      /* Single-sprint columns */
                      <>
                        {[
                          { key: 'capacity' as SortKey, label: 'Eff. Capacity' },
                          { key: 'demand' as SortKey, label: 'Demand (Jira)' },
                          { key: 'holidays' as SortKey, label: 'Holidays' },
                          { key: 'net' as SortKey, label: 'Net Available' },
                        ].map(col => (
                          <th key={col.key} className="px-4 py-3 text-left">
                            <button
                              onClick={() => handleSort(col.key)}
                              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors text-xs"
                              style={{ fontWeight: 600 }}
                            >
                              {col.label} <SortIcon col={col.key} />
                            </button>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left">
                          <span className="text-slate-600 text-xs" style={{ fontWeight: 600 }}>Status</span>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const cfg = STATUS_CONFIG[row.status];
                    const isSelected = selectedId === row.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => !crossSprintView && setSelectedId(isSelected ? null : row.id)}
                        className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                          crossSprintView ? 'cursor-default' : 'cursor-pointer'
                        } ${isSelected && !crossSprintView ? 'bg-blue-50 border-l-2 border-l-blue-500' : crossSprintView ? '' : cfg.row}`}
                      >
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                              style={{ backgroundColor: row.avatarColor, fontWeight: 600 }}
                            >
                              {row.initials}
                            </div>
                            <div>
                              <div className="text-slate-900 text-sm" style={{ fontWeight: 500 }}>{row.name}</div>
                              <div className="text-slate-500 text-xs">{row.role}</div>
                            </div>
                          </div>
                        </td>
                        {/* Pod */}
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{row.pod}</span>
                        </td>
                        {/* Platform */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {row.platforms.map(p => (
                              <span key={p} className={`px-2 py-0.5 rounded text-xs ${PLATFORM_BG[p as Platform]}`}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>

                        {crossSprintView ? (
                          /* Heat cells per sprint */
                          <>
                            {sprintsInRange.map(s => {
                              const net = getNetAvailable(row, s.id);
                              const status = getStatus(net);
                              const nc = netColor(net);
                              const effCap = getEffectiveCapacity(row, s.id);
                              const demand = row.sprintData[s.id]?.demand ?? 0;
                              const utilPct = effCap > 0 ? Math.round(demand / effCap * 100) : 0;
                              const isActiveSprint = s.id === sprint;
                              return (
                                <td key={s.id} className={`px-3 py-3 text-center ${isActiveSprint ? 'bg-blue-50/40' : ''}`}>
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span
                                      className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs ${nc.bg} ${nc.text}`}
                                      style={{ fontWeight: 700 }}
                                      title={`${s.name}: ${effCap} cap, ${demand} demand, ${net > 0 ? '+' : ''}${net} net`}
                                    >
                                      {net > 0 ? '+' : ''}{net}
                                    </span>
                                    <span className="text-xs text-slate-400">{utilPct}%</span>
                                  </div>
                                </td>
                              );
                            })}
                            {/* Worst sprint across range */}
                            {sprintsInRange.length > 1 && (() => {
                              const worstNet = Math.min(...sprintsInRange.map(s => getNetAvailable(row, s.id)));
                              const worstSprint = sprintsInRange.find(s => getNetAvailable(row, s.id) === worstNet);
                              const nc = netColor(worstNet);
                              return (
                                <td key="worst" className="px-3 py-3 text-center">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs ${nc.bg} ${nc.text}`} style={{ fontWeight: 700 }}>
                                      {worstNet > 0 ? '+' : ''}{worstNet}
                                    </span>
                                    <span className="text-xs text-slate-400">{worstSprint?.name.replace('Sprint ', 'S')}</span>
                                  </div>
                                </td>
                              );
                            })()}
                          </>
                        ) : (
                          /* Single-sprint detail columns */
                          <>
                            <td className="px-4 py-3 text-slate-700 text-sm">{row.effCap} SP</td>
                            <td className="px-4 py-3 text-slate-700 text-sm">{row.demand} SP</td>
                            <td className="px-4 py-3">
                              {row.holidays > 0
                                ? <span className="text-amber-600 text-sm">{row.holidays}d</span>
                                : <span className="text-slate-400 text-sm">—</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm ${row.net < 0 ? 'text-red-600' : row.net === 0 ? 'text-amber-600' : 'text-emerald-600'}`} style={{ fontWeight: 600 }}>
                                {row.net > 0 ? '+' : ''}{row.net} SP
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border w-fit ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              {rows.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">No staff match the current filters</div>
              )}

              {/* Cross-sprint legend */}
              {crossSprintView && (
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center gap-4 text-xs text-slate-500">
                  <span>Cells show net SP available. ▶ = active sprint.</span>
                  <div className="flex items-center gap-2 ml-2">
                    {[
                      { label: '≥+2 Available', color: 'bg-emerald-500' },
                      { label: '0–1 Tight', color: 'bg-amber-400' },
                      { label: 'Negative Over', color: 'bg-red-500' },
                    ].map(l => (
                      <span key={l.label} className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 rounded ${l.color} inline-block`} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slide-over drawer — single sprint mode only */}
        {!crossSprintView && (
          <div
            className={`flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto transition-all duration-300 ${
              selectedMember ? 'w-96' : 'w-0 overflow-hidden'
            }`}
          >
            {selectedMember && (
              <StaffDrawer
                member={selectedMember}
                sprint={sprint}
                sprintsInRange={sprintsInRange}
                onClose={() => setSelectedId(null)}
                onNavigate={onNavigate}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StaffDrawer({
  member, sprint, sprintsInRange, onClose, onNavigate
}: {
  member: StaffMember;
  sprint: string;
  sprintsInRange: typeof SPRINTS;
  onClose: () => void;
  onNavigate: (page: Page, tab?: ManageTab) => void;
}) {
  const sprintData = member.sprintData[sprint];
  const effCap = getEffectiveCapacity(member, sprint);
  const net = getNetAvailable(member, sprint);
  const status = getStatus(net);
  const cfg = STATUS_CONFIG[status];

  const sprintStories = member.jiraStories.filter(s => s.sprintId === sprint);
  const epicGroups = sprintStories.reduce<Record<string, typeof sprintStories>>((acc, s) => {
    acc[s.epic] = acc[s.epic] ?? [];
    acc[s.epic].push(s);
    return acc;
  }, {});

  const currentSprintObj = SPRINTS.find(s => s.id === sprint);

  // Trend data for mini chart — use sprintsInRange
  const trendData = sprintsInRange.map(s => ({
    name: s.name.replace('Sprint ', 'S'),
    Capacity: getEffectiveCapacity(member, s.id),
    Demand: member.sprintData[s.id]?.demand ?? 0,
  }));

  const statusColors = { available: '#10b981', tight: '#f59e0b', over: '#ef4444' };

  return (
    <div className="p-5 min-w-96">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: member.avatarColor, fontWeight: 600 }}
          >
            {member.initials}
          </div>
          <div>
            <h3 className="text-slate-900">{member.name}</h3>
            <p className="text-xs text-slate-500">{member.role}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{member.pod} Pod</span>
        {member.platforms.map(p => (
          <span key={p} className={`px-2 py-0.5 rounded text-xs ${PLATFORM_BG[p as Platform]}`}>
            {p}
          </span>
        ))}
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Capacity', value: `${sprintData?.capacity ?? 0} SP`, sub: 'raw' },
          { label: 'Holidays', value: `${sprintData?.holidays ?? 0}d`, sub: sprintData?.holidays ? `-${sprintData.holidays} SP` : 'none' },
          { label: 'Demand', value: `${sprintData?.demand ?? 0} SP`, sub: 'from Jira' },
          { label: 'Available', value: `${net > 0 ? '+' : ''}${net} SP`, sub: cfg.label, color: statusColors[status] },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-50 rounded-lg p-2.5 text-center">
            <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
            <div className="text-sm" style={{ fontWeight: 700, color: stat.color ?? '#1e293b' }}>{stat.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Cross-sprint summary strip */}
      {sprintsInRange.length > 1 && (
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Layers size={13} className="text-slate-500" />
            <span className="text-xs text-slate-600" style={{ fontWeight: 600 }}>Cross-sprint availability</span>
            <span className="text-[11px] text-slate-400">{sprintsInRange.length} sprints · scroll ►</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
            {sprintsInRange.map(s => {
              const n = getNetAvailable(member, s.id);
              const nc = netColor(n);
              const isActive = s.id === sprint;
              return (
                <div
                  key={s.id}
                  className={`flex-shrink-0 w-[72px] rounded-lg p-2 text-center ${nc.bg} ${isActive ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                >
                  <div className="text-xs text-white/80 mb-0.5">{s.name.replace('Sprint ', 'S')}</div>
                  <div className="text-sm text-white" style={{ fontWeight: 700 }}>{n > 0 ? '+' : ''}{n}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Holiday strip */}
      {sprintData && sprintData.holidays > 0 && currentSprintObj && (
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <CalendarDays size={13} className="text-slate-500" />
            <span className="text-xs text-slate-600" style={{ fontWeight: 600 }}>Sprint Calendar — {currentSprintObj.name}</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {currentSprintObj.workingDays.map(day => {
              const isHoliday = sprintData.holidayDates.includes(day);
              return (
                <div
                  key={day}
                  className={`px-2 py-1 rounded text-xs text-center ${
                    isHoliday ? 'bg-amber-200 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-amber-600 mt-1.5">
            {sprintData.holidayDates.join(', ')} — off
          </p>
        </div>
      )}

      {/* Jira demand breakdown */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <BarChart3 size={13} className="text-slate-500" />
            <span className="text-xs text-slate-600" style={{ fontWeight: 600 }}>Demand Breakdown</span>
          </div>
          <button
            onClick={() => onNavigate('manage-data', 'jira')}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <Edit3 size={10} /> Edit demand
          </button>
        </div>
        {Object.entries(epicGroups).map(([epic, stories]) => (
          <div key={epic} className="mb-2">
            <div className="text-xs text-slate-500 mb-1 pl-1" style={{ fontWeight: 500 }}>{epic}</div>
            {stories.map(story => (
              <div key={story.key} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg mb-1 text-xs">
                <span className="text-blue-600" style={{ fontWeight: 500 }}>{story.key}</span>
                <span className="text-slate-600 flex-1 truncate">{story.summary}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${
                    story.status === 'Done' ? 'bg-emerald-100 text-emerald-700'
                    : story.status === 'In Progress' ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {story.status}
                </span>
                <span className="text-slate-700 flex-shrink-0" style={{ fontWeight: 600 }}>{story.storyPoints}SP</span>
              </div>
            ))}
          </div>
        ))}
        {sprintStories.length === 0 && (
          <p className="text-xs text-slate-400 py-2 text-center">No Jira stories for this sprint</p>
        )}
        <div className="flex justify-end text-xs text-slate-600 px-2 pt-1 border-t border-slate-100 mt-1">
          <span style={{ fontWeight: 600 }}>Total: {sprintStories.reduce((s, j) => s + j.storyPoints, 0)} SP</span>
        </div>
      </div>

      {/* Trend chart */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 size={13} className="text-slate-500" />
          <span className="text-xs text-slate-600" style={{ fontWeight: 600 }}>Capacity vs Demand Trend</span>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={trendData} barGap={2} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar key="capacity" dataKey="Capacity" fill="#e2e8f0" radius={[2, 2, 0, 0]} />
            <Bar key="demand" dataKey="Demand" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Actions */}
      <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
        <button
          onClick={() => onNavigate('manage-data', 'holidays')}
          className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors py-1"
        >
          <CalendarDays size={12} /> Edit holidays for {member.name.split(' ')[0]}
          <ExternalLink size={10} className="ml-auto" />
        </button>
        <button
          onClick={() => onNavigate('manage-data', 'jira')}
          className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors py-1"
        >
          <Edit3 size={12} /> Edit Jira demand for {member.name.split(' ')[0]}
          <ExternalLink size={10} className="ml-auto" />
        </button>
        <button
          onClick={() => onNavigate('manage-data', 'allocation')}
          className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors py-1"
        >
          <BarChart3 size={12} /> Edit allocation / home pod
          <ExternalLink size={10} className="ml-auto" />
        </button>
      </div>
    </div>
  );
}
