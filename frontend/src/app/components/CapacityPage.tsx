import { useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { ArrowRight, TrendingUp, BarChart3 } from 'lucide-react';
import { STAFF, SPRINTS, PODS, ALL_PLATFORMS, PLATFORM_COLORS, PLATFORM_BG, getPodColor, getEffectiveCapacity, getNetAvailable, getStatus, getSprintsInRange } from './mockData';
import type { AppContext, Page, Platform } from './mockData';
import { ContextSelector } from './ContextSelector';
import { SprintScrollNav } from './SprintScrollNav';

type Props = {
  context: AppContext;
  onContextChange: (ctx: AppContext) => void;
  onNavigate: (page: Page, pod?: string) => void;
};

type ViewMode = 'pod' | 'platform';

function getPodSprintData(pod: string, sprintId: string) {
  const members = STAFF.filter(s => s.pod === pod);
  const effCap = members.reduce((sum, m) => sum + getEffectiveCapacity(m, sprintId), 0);
  const demand = members.reduce((sum, m) => sum + (m.sprintData[sprintId]?.demand ?? 0), 0);
  const net = effCap - demand;
  const utilPct = effCap > 0 ? Math.round((demand / effCap) * 100) : 0;
  const avail = members.filter(m => getStatus(getNetAvailable(m, sprintId)) === 'available').length;
  const over = members.filter(m => getStatus(getNetAvailable(m, sprintId)) === 'over').length;
  return { effCap, demand, net, utilPct, avail, over, members: members.length };
}

function getPlatformSprintData(platform: Platform, sprintId: string) {
  const members = STAFF.filter(s => s.platforms.includes(platform));
  const effCap = members.reduce((sum, m) => sum + getEffectiveCapacity(m, sprintId), 0);
  const demand = members.reduce((sum, m) => sum + (m.sprintData[sprintId]?.demand ?? 0), 0);
  const net = effCap - demand;
  const utilPct = effCap > 0 ? Math.round((demand / effCap) * 100) : 0;
  return { effCap, demand, net, utilPct };
}

function utilColor(pct: number) {
  if (pct > 100) return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-700 border-red-200', bar: '#ef4444' };
  if (pct > 90)  return { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700 border-amber-200', bar: '#f59e0b' };
  if (pct > 70)  return { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700 border-blue-200', bar: '#3b82f6' };
  return { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: '#10b981' };
}


export function CapacityPage({ context, onContextChange, onNavigate }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('pod');
  const podScrollRef = useRef<HTMLDivElement>(null);
  const platformScrollRef = useRef<HTMLDivElement>(null);

  const sprintsInRange = getSprintsInRange(context.sprintRange.from, context.sprintRange.to);
  const activeSprint = SPRINTS.find(s => s.id === context.sprint);
  const over10 = sprintsInRange.length > 10;
  const sprintColStyle = over10
    ? { fontWeight: 600 as const, width: '180px', minWidth: '180px', maxWidth: '180px' }
    : { fontWeight: 600 as const, width: '180px', minWidth: '180px', maxWidth: '180px' };

  // Pivot data keyed over all sprints (lookup table); columns driven by sprintsInRange
  const podPivot = PODS.map(pod => ({
    pod,
    sprints: SPRINTS.reduce<Record<string, ReturnType<typeof getPodSprintData>>>((acc, s) => {
      acc[s.id] = getPodSprintData(pod, s.id);
      return acc;
    }, {}),
  }));

  const platformData = ALL_PLATFORMS.map(p => ({
    platform: p,
    sprints: SPRINTS.reduce<Record<string, ReturnType<typeof getPlatformSprintData>>>((acc, s) => {
      acc[s.id] = getPlatformSprintData(p, s.id);
      return acc;
    }, {}),
  }));

  // Chart data derived from sprintsInRange
  const trendData = sprintsInRange.map(s => {
    const obj: Record<string, string | number> = { sprint: s.name.replace('Sprint ', 'S') };
    PODS.forEach(pod => { obj[pod] = getPodSprintData(pod, s.id).utilPct; });
    return obj;
  });

  const barChartData = sprintsInRange.map(s => ({
    sprint: s.name.replace('Sprint ', 'S'),
    'Total Capacity': STAFF.reduce((sum, m) => sum + getEffectiveCapacity(m, s.id), 0),
    'Total Demand': STAFF.reduce((sum, m) => sum + (m.sprintData[s.id]?.demand ?? 0), 0),
  }));

  const platformChartData = sprintsInRange.map(s => {
    const obj: Record<string, string | number> = { sprint: s.name.replace('Sprint ', 'S') };
    ALL_PLATFORMS.forEach(p => { obj[p] = getPlatformSprintData(p, s.id).utilPct; });
    return obj;
  });

  const rangeLabel = sprintsInRange.length === 1
    ? sprintsInRange[0].name
    : `${sprintsInRange[0].name} → ${sprintsInRange[sprintsInRange.length - 1].name}`;

  return (
    <div className="flex flex-col h-full">
      <ContextSelector context={context} onChange={onContextChange} />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-slate-900">Capacity by Pod / Platform</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Showing {rangeLabel} · {sprintsInRange.length} sprint{sprintsInRange.length !== 1 ? 's' : ''}
              {activeSprint && <span className="ml-2 text-blue-600">· Active: {activeSprint.name}</span>}
            </p>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(['pod', 'platform'] as ViewMode[]).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors capitalize ${
                  viewMode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                By {m}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'pod' ? (
          <>
            <SprintScrollNav sprintsInRange={sprintsInRange} scrollRef={podScrollRef} />
            {/* Pivot Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
              <div className="overflow-x-auto" ref={podScrollRef}>
              <table className="w-full text-sm min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs text-slate-600 sticky left-0 z-10 bg-slate-50 border-r border-slate-200" style={{ fontWeight: 600 }}>Pod</th>
                    {sprintsInRange.map(s => (
                      <th key={s.id} className="px-4 py-3 text-center text-xs" style={sprintColStyle}>
                        <span className={`${s.id === context.sprint ? 'text-blue-600' : s.isCurrent ? 'text-indigo-500' : 'text-slate-600'}`}>
                          {s.name} {s.id === context.sprint ? '▶' : s.isCurrent ? '●' : ''}
                        </span>
                      </th>
                    ))}
                    {sprintsInRange.length > 1 && (
                      <th className="px-4 py-3 text-center text-xs text-slate-500" style={{ fontWeight: 600 }}>Avg</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {podPivot.map(row => {
                    const avgUtil = Math.round(
                      sprintsInRange.reduce((sum, s) => sum + row.sprints[s.id].utilPct, 0) / sprintsInRange.length
                    );
                    return (
                      <tr key={row.pod} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPodColor(row.pod) }} />
                            <span className="text-slate-800" style={{ fontWeight: 500 }}>{row.pod}</span>
                            <span className="text-xs text-slate-400">({row.sprints[SPRINTS[1].id]?.members} staff)</span>
                          </div>
                        </td>
                        {sprintsInRange.map(s => {
                          const d = row.sprints[s.id];
                          const uc = utilColor(d.utilPct);
                          const isActive = s.id === context.sprint;
                          return (
                            <td key={s.id} className={`px-2 py-2 align-middle ${isActive ? 'ring-1 ring-inset ring-blue-300' : ''}`}>
                              <button
                                onClick={() => onNavigate('staff-availability')}
                                className={`flex min-h-[78px] w-full flex-col items-center justify-center rounded-lg px-2 py-2 text-center leading-none whitespace-nowrap transition-opacity hover:opacity-80 cursor-pointer border border-white/70 ${uc.bg}`}
                              >
                                <div className={`text-base ${uc.text}`} style={{ fontWeight: 700 }}>{d.utilPct}%</div>
                                <div className="mt-0.5 text-xs text-slate-500">{d.demand}/{d.effCap} SP</div>
                                <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/60">
                                  <div
                                    className="h-1.5 rounded-full transition-all"
                                    style={{ width: `${Math.min(d.utilPct, 100)}%`, backgroundColor: uc.bar }}
                                  />
                                </div>
                                <div className="mt-1.5 text-xs text-slate-500">{d.avail} free · {d.over} over</div>
                              </button>
                            </td>
                          );
                        })}
                        {sprintsInRange.length > 1 && (
                          <td className="px-4 py-3">
                            <div className={`rounded-lg p-2 text-center ${utilColor(avgUtil).bg}`}>
                              <div className={`text-sm ${utilColor(avgUtil).text}`} style={{ fontWeight: 700 }}>{avgUtil}%</div>
                              <div className="text-xs text-slate-400 mt-0.5">avg</div>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mb-6 text-xs">
              <span className="text-slate-500">Legend:</span>
              {[
                { label: '≤70% — Under', color: 'bg-emerald-100 text-emerald-700' },
                { label: '70-90% — Healthy', color: 'bg-blue-100 text-blue-700' },
                { label: '90-100% — Near limit', color: 'bg-amber-100 text-amber-700' },
                { label: '>100% — Over', color: 'bg-red-100 text-red-700' },
              ].map(l => (
                <span key={l.label} className={`px-2 py-0.5 rounded-full ${l.color}`}>{l.label}</span>
              ))}
              {sprintsInRange.length > 1 && (
                <span className="ml-auto text-slate-400">▶ = active sprint · ● = current sprint</span>
              )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-slate-500" />
                  <h3 className="text-slate-700">Utilization Trend (%)</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 120]} />
                    <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 11 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    {PODS.map(pod => (
                      <Line
                        key={pod}
                        type="monotone"
                        dataKey={pod}
                        stroke={getPodColor(pod)}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                    <Line key="limit-100" dataKey={() => 100} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} dot={false} name="100% limit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={14} className="text-slate-500" />
                  <h3 className="text-slate-700">Total Capacity vs Demand (SP)</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barChartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar key="total-capacity" dataKey="Total Capacity" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                    <Bar key="total-demand" dataKey="Total Demand" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          /* Platform view */
          <>
            <SprintScrollNav sprintsInRange={sprintsInRange} scrollRef={platformScrollRef} />
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
              <div className="overflow-x-auto" ref={platformScrollRef}>
              <table className="w-full text-sm min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs text-slate-600 sticky left-0 z-10 bg-slate-50 border-r border-slate-200" style={{ fontWeight: 600 }}>Platform</th>
                    {sprintsInRange.map(s => (
                      <th key={s.id} className="px-4 py-3 text-center text-xs" style={sprintColStyle}>
                        <span className={s.id === context.sprint ? 'text-blue-600' : s.isCurrent ? 'text-indigo-500' : 'text-slate-600'}>
                          {s.name} {s.id === context.sprint ? '▶' : s.isCurrent ? '●' : ''}
                        </span>
                      </th>
                    ))}
                    {sprintsInRange.length > 1 && (
                      <th className="px-4 py-3 text-center text-xs text-slate-500" style={{ fontWeight: 600 }}>Avg</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {platformData.map(row => {
                    const avgUtil = Math.round(
                      sprintsInRange.reduce((sum, s) => sum + row.sprints[s.id].utilPct, 0) / sprintsInRange.length
                    );
                    return (
                      <tr key={row.platform} className="border-b border-slate-100 hover:bg-slate-50 group">
                        <td className="px-4 py-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 transition-colors">
                          <span className={`px-2 py-1 rounded text-xs ${PLATFORM_BG[row.platform]}`} style={{ fontWeight: 500 }}>
                            {row.platform}
                          </span>
                        </td>
                        {sprintsInRange.map(s => {
                          const d = row.sprints[s.id];
                          const uc = utilColor(d.utilPct);
                          return (
                            <td key={s.id} className="px-4 py-3">
                              <div className={`rounded-lg p-2 text-center ${uc.bg}`}>
                                <div className={`text-base ${uc.text}`} style={{ fontWeight: 700 }}>{d.utilPct}%</div>
                                <div className="text-xs text-slate-500">{d.demand}/{d.effCap} SP</div>
                              </div>
                            </td>
                          );
                        })}
                        {sprintsInRange.length > 1 && (
                          <td className="px-4 py-3">
                            <div className={`rounded-lg p-2 text-center ${utilColor(avgUtil).bg}`}>
                              <div className={`text-sm ${utilColor(avgUtil).text}`} style={{ fontWeight: 700 }}>{avgUtil}%</div>
                              <div className="text-xs text-slate-400 mt-0.5">avg</div>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-slate-700 mb-4">Platform Utilization Trend — {rangeLabel}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={platformChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 120]} />
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 11 }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  {ALL_PLATFORMS.map(p => (
                    <Line
                      key={p}
                      type="monotone"
                      dataKey={p}
                      stroke={PLATFORM_COLORS[p]}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                  <Line key="limit-100" dataKey={() => 100} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} dot={false} name="100% limit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <ArrowRight size={11} />
          Click any cell to view staff filtered by pod in Staff Availability Finder
        </div>
      </div>
    </div>
  );
}
