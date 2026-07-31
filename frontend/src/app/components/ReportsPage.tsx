import { useState, useRef } from 'react';
import {
  FileText, Download, Clock, CheckCircle2, BarChart3,
  AlertTriangle, ChevronRight, ArrowLeft, Printer
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  STAFF, SPRINTS, PODS, getPodColor, getEffectiveCapacity, getNetAvailable, getStatus, getSprintsInRange
} from './mockData';
import type { AppContext, Sprint } from './mockData';
import { ContextSelector } from './ContextSelector';
import { SprintScrollNav } from './SprintScrollNav';

type ReportId = 'capacity' | 'utilization' | 'overallocation';

const REPORTS = [
  {
    id: 'capacity' as ReportId,
    title: 'Sprint Capacity Report',
    description: 'Jira epics & stories vs capacity delta, pod resource allocation distribution',
    icon: <BarChart3 size={20} className="text-blue-600" />,
    generated: 'Today 09:14',
    badge: 'Ready',
    badgeColor: 'emerald',
  },
  {
    id: 'utilization' as ReportId,
    title: 'Pod Utilization Trend',
    description: 'Cross-sprint capacity vs demand per pod and platform — reflects selected sprint range',
    icon: <BarChart3 size={20} className="text-violet-600" />,
    generated: 'Today 09:14',
    badge: 'Ready',
    badgeColor: 'emerald',
  },
  {
    id: 'overallocation' as ReportId,
    title: 'Over-allocation Risk List',
    description: 'Staff over-committed this sprint with root cause breakdown',
    icon: <AlertTriangle size={20} className="text-amber-600" />,
    generated: 'Today 09:14',
    badge: 'Ready',
    badgeColor: 'emerald',
  },
];


type Props = {
  context: AppContext;
  onContextChange: (ctx: AppContext) => void;
};

export function ReportsPage({ context, onContextChange }: Props) {
  const [activeReport, setActiveReport] = useState<ReportId | null>(null);
  const sprint = context.sprint;
  const currentSprint = SPRINTS.find(s => s.id === sprint);
  const sprintsInRange = getSprintsInRange(context.sprintRange.from, context.sprintRange.to);

  if (activeReport) {
    return (
      <div className="flex flex-col h-full">
        <ContextSelector context={context} onChange={onContextChange} />
        <div className="flex-1 overflow-y-auto p-6">
          <button
            onClick={() => setActiveReport(null)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Reports
          </button>
          {activeReport === 'capacity' && <CapacityReport sprint={sprint} currentSprint={currentSprint} />}
          {activeReport === 'utilization' && <UtilizationReport sprintsInRange={sprintsInRange} />}
          {activeReport === 'overallocation' && <OverallocationReport sprint={sprint} currentSprint={currentSprint} />}
        </div>
      </div>
    );
  }

  const rangeLabel = sprintsInRange.length === 1
    ? sprintsInRange[0].name
    : `${sprintsInRange[0].name}–${sprintsInRange[sprintsInRange.length - 1].name}`;

  return (
    <div className="flex flex-col h-full">
      <ContextSelector context={context} onChange={onContextChange} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Exportable reports for delivery leads · Active sprint: <span className="text-slate-700">{currentSprint?.name}</span>
            {sprintsInRange.length > 1 && <span className="ml-1">· Range: <span className="text-slate-700">{rangeLabel}</span></span>}
          </p>
        </div>

        {/* Report cards */}
        <div className="space-y-4">
          {REPORTS.map(r => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-50 rounded-lg flex-shrink-0">{r.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-slate-900">{r.title}</h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                      {r.badge}
                    </span>
                    {r.id === 'utilization' && sprintsInRange.length > 1 && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                        {rangeLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{r.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={11} />
                    Last generated: {r.generated}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setActiveReport(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View <ChevronRight size={13} />
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
                    <Download size={13} /> CSV
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
                    <Printer size={13} /> PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Report guide */}
        <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-5">
          <h3 className="text-slate-700 mb-2">About Reports</h3>
          <p className="text-sm text-slate-500 mb-3">
            Reports are generated views over the unified staff-sprint data model. The Sprint Capacity and Over-allocation reports use the <strong>active sprint</strong>. The Utilization Trend report reflects the <strong>selected sprint range</strong>.
          </p>
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-500">
            <div className="flex items-start gap-2">
              <FileText size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span>Saved filter combinations + fixed layout</span>
            </div>
            <div className="flex items-start gap-2">
              <Download size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span>Export as PDF or CSV for sharing</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Auto-generated on JIRA sync or manual trigger</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CapacityReport({ sprint, currentSprint }: { sprint: string; currentSprint: Sprint | undefined }) {
  const allStories = STAFF.flatMap(m =>
    m.jiraStories.filter(j => j.sprintId === sprint).map(j => ({
      ...j,
      staffName: m.name,
      pod: m.pod,
      platforms: m.platforms,
      platform: m.platform,
    }))
  );

  const epicGroups = allStories.reduce<Record<string, typeof allStories>>((acc, s) => {
    acc[s.epic] = acc[s.epic] ?? [];
    acc[s.epic].push(s);
    return acc;
  }, {});

  const podDistrib = PODS.map(pod => {
    const members = STAFF.filter(m => m.pod === pod);
    const totalDemand = members.reduce((s, m) => s + (m.sprintData[sprint]?.demand ?? 0), 0);
    const effCap = members.reduce((s, m) => s + getEffectiveCapacity(m, sprint), 0);
    return { name: pod, demand: totalDemand, capacity: effCap };
  });

  const staffDelta = STAFF.map(m => ({
    name: m.name,
    pod: m.pod,
    effCap: getEffectiveCapacity(m, sprint),
    demand: m.sprintData[sprint]?.demand ?? 0,
    net: getNetAvailable(m, sprint),
  })).sort((a, b) => a.net - b.net);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-900">Sprint Capacity Report</h1>
          <p className="text-slate-500 text-sm">{currentSprint?.name} · {currentSprint?.startDate} to {currentSprint?.endDate}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">
            <Download size={13} /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">
            <Printer size={13} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Staff', value: STAFF.length },
          { label: 'Total Capacity (SP)', value: STAFF.reduce((s, m) => s + getEffectiveCapacity(m, sprint), 0) },
          { label: 'Total Demand (SP)', value: STAFF.reduce((s, m) => s + (m.sprintData[sprint]?.demand ?? 0), 0) },
          {
            label: 'Delta (Spare)',
            value: STAFF.reduce((s, m) => s + getEffectiveCapacity(m, sprint), 0) - STAFF.reduce((s, m) => s + (m.sprintData[sprint]?.demand ?? 0), 0),
            color: true
          },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
            <div className={`text-2xl ${stat.color ? (stat.value >= 0 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
              {stat.value > 0 && stat.color ? '+' : ''}{stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-slate-700 mb-4">Pod Resource Allocation Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={podDistrib} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="demand" nameKey="name">
                  {podDistrib.map((entry) => (
                    <Cell key={entry.name} fill={getPodColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {podDistrib.map(p => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getPodColor(p.name) }} />
                    <span className="text-slate-700">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{p.demand}/{p.capacity} SP</span>
                    <span className={`${p.demand > p.capacity ? 'text-red-600' : 'text-emerald-600'}`} style={{ fontWeight: 600 }}>
                      {p.capacity > 0 ? Math.round(p.demand / p.capacity * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-slate-700 mb-4">Capacity vs Demand by Pod</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={podDistrib} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Bar key="capacity" dataKey="capacity" name="Capacity" fill="#e2e8f0" radius={[3,3,0,0]} />
              <Bar key="demand" dataKey="demand" name="Demand" fill="#3b82f6" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Epic / Story table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-slate-700">Jira Epic & Story Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          {Object.entries(epicGroups).map(([epic, stories]) => (
            <div key={epic}>
              <div className="px-5 py-2 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-700" style={{ fontWeight: 600 }}>{epic}</span>
                <span className="text-xs text-slate-500">{stories.reduce((s, j) => s + j.storyPoints, 0)} SP total</span>
              </div>
              {stories.map(story => (
                <div key={story.key} className="flex items-center gap-4 px-5 py-2 border-b border-slate-100 text-sm hover:bg-slate-50">
                  <span className="text-blue-600 w-24 flex-shrink-0" style={{ fontWeight: 500 }}>{story.key}</span>
                  <span className="flex-1 text-slate-700">{story.summary}</span>
                  <span className="text-slate-500 text-xs w-28">{story.staffName}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded w-20 text-center">{story.pod}</span>
                  <span className={`text-xs w-20 text-center px-2 py-0.5 rounded ${
                    story.status === 'Done' ? 'bg-emerald-100 text-emerald-700'
                    : story.status === 'In Progress' ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                  }`}>{story.status}</span>
                  <span className="text-slate-700 w-10 text-right" style={{ fontWeight: 600 }}>{story.storyPoints} SP</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Delta table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-slate-700">Staff Capacity Delta</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-2 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>Name</th>
              <th className="px-4 py-2 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>Pod</th>
              <th className="px-4 py-2 text-right text-xs text-slate-600" style={{ fontWeight: 600 }}>Eff. Capacity</th>
              <th className="px-4 py-2 text-right text-xs text-slate-600" style={{ fontWeight: 600 }}>Demand</th>
              <th className="px-4 py-2 text-right text-xs text-slate-600" style={{ fontWeight: 600 }}>Delta</th>
            </tr>
          </thead>
          <tbody>
            {staffDelta.map(row => (
              <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-2 text-slate-700">{row.name}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{row.pod}</span>
                </td>
                <td className="px-4 py-2 text-right text-slate-600">{row.effCap} SP</td>
                <td className="px-4 py-2 text-right text-slate-600">{row.demand} SP</td>
                <td className={`px-4 py-2 text-right ${row.net < 0 ? 'text-red-600' : row.net === 0 ? 'text-amber-600' : 'text-emerald-600'}`} style={{ fontWeight: 600 }}>
                  {row.net > 0 ? '+' : ''}{row.net} SP
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UtilizationReport({ sprintsInRange }: { sprintsInRange: Sprint[] }) {
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const over10 = sprintsInRange.length > 10;
  const sprintColStyle = over10 ? { fontWeight: 600 as const, width: '110px', minWidth: '110px' } : { fontWeight: 600 as const };

  const trendData = sprintsInRange.map(s => {
    const obj: Record<string, string | number> = { sprint: s.name };
    PODS.forEach(pod => {
      const members = STAFF.filter(m => m.pod === pod);
      const effCap = members.reduce((sum, m) => sum + getEffectiveCapacity(m, s.id), 0);
      const demand = members.reduce((sum, m) => sum + (m.sprintData[s.id]?.demand ?? 0), 0);
      obj[pod] = effCap > 0 ? Math.round(demand / effCap * 100) : 0;
    });
    return obj;
  });

  const rangeLabel = sprintsInRange.length === 1
    ? sprintsInRange[0].name
    : `${sprintsInRange[0].name} → ${sprintsInRange[sprintsInRange.length - 1].name}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-900">Pod Utilization Trend</h1>
          <p className="text-slate-500 text-sm">{rangeLabel} · {sprintsInRange.length} sprint{sprintsInRange.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-slate-700 mb-4">Utilization % by Pod per Sprint</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trendData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 130]} />
            <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 11 }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            {PODS.map(pod => (
              <Bar key={pod} dataKey={pod} fill={getPodColor(pod)} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SprintScrollNav sprintsInRange={sprintsInRange} scrollRef={tableScrollRef} />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-slate-700">Pod Utilization Table — {rangeLabel}</h3>
        </div>
        <div className="overflow-x-auto" ref={tableScrollRef}>
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-2 text-left text-xs text-slate-600 sticky left-0 z-10 bg-slate-50 border-r border-slate-200" style={{ fontWeight: 600 }}>Pod</th>
              {sprintsInRange.map(s => (
                <th key={s.id} className="px-4 py-2 text-center text-xs text-slate-600" style={sprintColStyle}>
                  {s.name} {s.isCurrent ? '(Current)' : ''}
                </th>
              ))}
              {sprintsInRange.length > 1 && (
                <th className="px-4 py-2 text-center text-xs text-slate-500" style={{ fontWeight: 600 }}>Avg</th>
              )}
            </tr>
          </thead>
          <tbody>
            {PODS.map(pod => {
              const utils = sprintsInRange.map(s => {
                const members = STAFF.filter(m => m.pod === pod);
                const effCap = members.reduce((sum, m) => sum + getEffectiveCapacity(m, s.id), 0);
                const demand = members.reduce((sum, m) => sum + (m.sprintData[s.id]?.demand ?? 0), 0);
                return { sprintId: s.id, pct: effCap > 0 ? Math.round(demand / effCap * 100) : 0 };
              });
              const avg = Math.round(utils.reduce((sum, u) => sum + u.pct, 0) / utils.length);
              return (
                <tr key={pod} className="border-b border-slate-100">
                  <td className="px-5 py-3 sticky left-0 z-10 bg-white border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getPodColor(pod) }} />
                      <span className="text-slate-700" style={{ fontWeight: 500 }}>{pod}</span>
                    </div>
                  </td>
                  {utils.map(u => {
                    const color = u.pct > 100 ? 'text-red-600' : u.pct > 90 ? 'text-amber-600' : 'text-emerald-600';
                    return (
                      <td key={u.sprintId} className={`px-4 py-3 text-center ${color}`} style={{ fontWeight: 600 }}>
                        {u.pct}%
                      </td>
                    );
                  })}
                  {sprintsInRange.length > 1 && (
                    <td className={`px-4 py-3 text-center ${avg > 100 ? 'text-red-600' : avg > 90 ? 'text-amber-600' : 'text-emerald-600'}`} style={{ fontWeight: 700 }}>
                      {avg}%
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function OverallocationReport({ sprint, currentSprint }: { sprint: string; currentSprint: Sprint | undefined }) {
  const overAllocated = STAFF
    .map(m => ({ ...m, net: getNetAvailable(m, sprint), effCap: getEffectiveCapacity(m, sprint) }))
    .filter(m => m.net < 0)
    .sort((a, b) => a.net - b.net);

  const atRisk = STAFF
    .map(m => ({ ...m, net: getNetAvailable(m, sprint), effCap: getEffectiveCapacity(m, sprint) }))
    .filter(m => m.net >= 0 && m.net <= 1)
    .sort((a, b) => a.net - b.net);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-900">Over-allocation Risk List</h1>
          <p className="text-slate-500 text-sm">{currentSprint?.name} · {overAllocated.length} over-allocated, {atRisk.length} at risk</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500" />
          <div>
            <div className="text-red-700 text-lg" style={{ fontWeight: 700 }}>{overAllocated.length}</div>
            <div className="text-xs text-red-600">Over-allocated</div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-500" />
          <div>
            <div className="text-amber-700 text-lg" style={{ fontWeight: 700 }}>{atRisk.length}</div>
            <div className="text-xs text-amber-600">At risk (≤1 SP)</div>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <div>
            <div className="text-emerald-700 text-lg" style={{ fontWeight: 700 }}>{STAFF.length - overAllocated.length - atRisk.length}</div>
            <div className="text-xs text-emerald-600">Healthy</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-red-100 bg-red-50">
          <h3 className="text-red-700">Over-allocated Staff</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-2 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>Staff</th>
              <th className="px-4 py-2 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>Pod</th>
              <th className="px-4 py-2 text-right text-xs text-slate-600" style={{ fontWeight: 600 }}>Eff. Cap</th>
              <th className="px-4 py-2 text-right text-xs text-slate-600" style={{ fontWeight: 600 }}>Demand</th>
              <th className="px-4 py-2 text-right text-xs text-slate-600" style={{ fontWeight: 600 }}>Over by</th>
              <th className="px-5 py-2 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>Top stories</th>
            </tr>
          </thead>
          <tbody>
            {overAllocated.map(m => {
              const topStories = m.jiraStories.filter(j => j.sprintId === sprint).slice(0, 2);
              return (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-red-50/30">
                  <td className="px-5 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: m.avatarColor }}>
                        {m.initials}
                      </div>
                      <div>
                        <div className="text-slate-800" style={{ fontWeight: 500 }}>{m.name}</div>
                        <div className="text-xs text-slate-400">{m.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{m.pod}</span>
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600">{m.effCap} SP</td>
                  <td className="px-4 py-2 text-right text-slate-600">{m.sprintData[sprint]?.demand ?? 0} SP</td>
                  <td className="px-4 py-2 text-right text-red-600" style={{ fontWeight: 700 }}>{Math.abs(m.net)} SP</td>
                  <td className="px-5 py-2">
                    <div className="text-xs text-slate-500 space-y-0.5">
                      {topStories.map(s => <div key={s.key}>{s.key}: {s.summary.substring(0, 35)}{s.summary.length > 35 ? '…' : ''}</div>)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-amber-100 bg-amber-50">
          <h3 className="text-amber-700">At-risk Staff (≤1 SP available)</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-2 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>Staff</th>
              <th className="px-4 py-2 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>Pod</th>
              <th className="px-4 py-2 text-right text-xs text-slate-600" style={{ fontWeight: 600 }}>Eff. Cap</th>
              <th className="px-4 py-2 text-right text-xs text-slate-600" style={{ fontWeight: 600 }}>Demand</th>
              <th className="px-4 py-2 text-right text-xs text-slate-600" style={{ fontWeight: 600 }}>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {atRisk.map(m => (
              <tr key={m.id} className="border-b border-slate-100 hover:bg-amber-50/30">
                <td className="px-5 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: m.avatarColor }}>
                      {m.initials}
                    </div>
                    <span className="text-slate-800" style={{ fontWeight: 500 }}>{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{m.pod}</span>
                </td>
                <td className="px-4 py-2 text-right text-slate-600">{m.effCap} SP</td>
                <td className="px-4 py-2 text-right text-slate-600">{m.sprintData[sprint]?.demand ?? 0} SP</td>
                <td className="px-4 py-2 text-right text-amber-600" style={{ fontWeight: 700 }}>{m.net} SP</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
