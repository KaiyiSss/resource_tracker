import { Users, BarChart3, FileText, Database, AlertTriangle, CheckCircle2, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { STAFF, SPRINTS, PODS, getPodColor, getPodAggregates, filterStaff, getNetAvailable, getStatus, getSprintsInRange, getEffectiveCapacity } from './mockData';
import type { AppContext, Page, ManageTab } from './mockData';
import { ContextSelector } from './ContextSelector';

type Props = {
  context: AppContext;
  onContextChange: (ctx: AppContext) => void;
  onNavigate: (page: Page, tab?: ManageTab) => void;
};

export function HomePage({ context, onContextChange, onNavigate }: Props) {
  const sprint = context.sprint;
  const filtered = filterStaff(context);
  const sprintsInRange = getSprintsInRange(context.sprintRange.from, context.sprintRange.to);

  // Active sprint metrics
  const availableStaff = filtered.filter(s => getStatus(getNetAvailable(s, sprint)) === 'available');
  const overAllocated = filtered.filter(s => getStatus(getNetAvailable(s, sprint)) === 'over');
  const podAggregates = getPodAggregates(sprint);
  const maxUtilPod = podAggregates.reduce((a, b) => a.utilPct > b.utilPct ? a : b);
  const currentSprint = SPRINTS.find(s => s.id === sprint);

  const rangeLabel = sprintsInRange.length === 1
    ? sprintsInRange[0].name
    : `${sprintsInRange[0].name} → ${sprintsInRange[sprintsInRange.length - 1].name}`;

  const healthIssues = [
    { type: 'warning', msg: `3 staff missing holiday data for ${SPRINTS.find(s => s.id === 'sprint-c')?.name}`, action: 'Fix in Holidays', tab: 'holidays' as ManageTab },
    { type: 'info', msg: 'JIRA sync last ran 2 hours ago (Sprint B)', action: 'View JIRA', tab: 'jira' as ManageTab },
    { type: 'warning', msg: `${overAllocated.length} staff over-allocated in ${currentSprint?.name}`, action: 'View Staff', tab: undefined },
  ];

  const cards = [
    {
      id: 'staff-availability' as Page,
      title: 'Staff Availability Finder',
      description: 'Who can I staff this sprint?',
      icon: <Users size={24} className="text-blue-600" />,
      metric: `${availableStaff.length} of ${filtered.length}`,
      metricLabel: `staff available in ${currentSprint?.name}`,
      accent: 'blue',
      badge: availableStaff.length > 0 ? 'Capacity available' : 'No spare capacity',
      badgeColor: availableStaff.length > 0 ? 'green' : 'red',
    },
    {
      id: 'capacity' as Page,
      title: 'Capacity by Pod / Platform',
      description: 'Which pod is over- or under-committed?',
      icon: <BarChart3 size={24} className="text-violet-600" />,
      metric: `${maxUtilPod.utilPct}%`,
      metricLabel: `${maxUtilPod.pod} utilization · ${rangeLabel}`,
      accent: 'violet',
      badge: maxUtilPod.utilPct > 100 ? 'Over capacity' : maxUtilPod.utilPct > 90 ? 'Near limit' : 'On track',
      badgeColor: maxUtilPod.utilPct > 100 ? 'red' : maxUtilPod.utilPct > 90 ? 'amber' : 'green',
    },
    {
      id: 'reports' as Page,
      title: 'Reports',
      description: 'Give me something to share or export',
      icon: <FileText size={24} className="text-emerald-600" />,
      metric: '3',
      metricLabel: 'reports ready, last generated today',
      accent: 'emerald',
      badge: `${rangeLabel} ready`,
      badgeColor: 'green',
    },
  ];

  const badgeClasses: Record<string, string> = {
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  const accentBorder: Record<string, string> = {
    blue: 'border-t-blue-500',
    violet: 'border-t-violet-500',
    emerald: 'border-t-emerald-500',
  };

  return (
    <div className="flex flex-col h-full">
      <ContextSelector context={context} onChange={onContextChange} />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-slate-900">Sprint Cockpit</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Active: {currentSprint?.name} ({currentSprint?.startDate} to {currentSprint?.endDate})
            {sprintsInRange.length > 1 && (
              <span className="ml-2 text-slate-400">· Range: {rangeLabel} ({sprintsInRange.length} sprints)</span>
            )}
          </p>
        </div>

        {/* Data Health Banner */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-600" />
            <span className="text-sm text-amber-800" style={{ fontWeight: 600 }}>Data Health</span>
          </div>
          <div className="space-y-1.5">
            {healthIssues.map((issue, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {issue.type === 'warning'
                  ? <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                  : <Clock size={12} className="text-slate-400 flex-shrink-0" />
                }
                <span className="text-slate-700">{issue.msg}</span>
                <button
                  onClick={() => issue.tab
                    ? onNavigate('manage-data', issue.tab)
                    : onNavigate('staff-availability')
                  }
                  className="ml-auto text-xs text-blue-600 hover:underline flex-shrink-0 flex items-center gap-1"
                >
                  {issue.action} <ArrowRight size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Use-case cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className={`bg-white rounded-xl border border-slate-200 border-t-4 ${accentBorder[card.accent]} p-5 text-left hover:shadow-md transition-all group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-slate-50 rounded-lg">{card.icon}</div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-1" />
              </div>
              <h3 className="text-slate-900 mb-1">{card.title}</h3>
              <p className="text-xs text-slate-500 mb-4">{card.description}</p>
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-end gap-2">
                  <span className="text-2xl text-slate-900" style={{ fontWeight: 700, lineHeight: 1 }}>{card.metric}</span>
                  <span className="text-xs text-slate-500 pb-0.5">{card.metricLabel}</span>
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClasses[card.badgeColor]}`}>{card.badge}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Manage Data strip */}
        <button
          onClick={() => onNavigate('manage-data', 'jira')}
          className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-sm transition-all flex items-center gap-4 group"
        >
          <div className="p-2 bg-slate-50 rounded-lg">
            <Database size={18} className="text-slate-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-slate-700">Manage Data</h4>
            <p className="text-xs text-slate-500 mt-0.5">Fix or enter source data — JIRA sync, holiday entry, pod/allocation assignment, sprint management</p>
          </div>
          <div className="flex items-center gap-3 mr-2">
            <div className="text-right">
              <div className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle size={10} /> 2 flags need attention
              </div>
            </div>
          </div>
          <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        </button>

        {/* Pod overview — shows avg utilization across range */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-700">
              Pod Summary
              {sprintsInRange.length > 1
                ? <span className="text-sm text-slate-500 ml-2">— avg across {rangeLabel}</span>
                : <span className="text-sm text-slate-500 ml-2">— {currentSprint?.name}</span>
              }
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {PODS.map(pod => {
              const podStaff = STAFF.filter(s => s.pod === pod);
              // Average utilization across sprints in range
              const avgUtil = Math.round(
                sprintsInRange.reduce((sum, s) => {
                  const effCap = podStaff.reduce((c, m) => c + getEffectiveCapacity(m, s.id), 0);
                  const demand = podStaff.reduce((c, m) => c + (m.sprintData[s.id]?.demand ?? 0), 0);
                  return sum + (effCap > 0 ? demand / effCap * 100 : 0);
                }, 0) / sprintsInRange.length
              );
              // Active sprint for "free" count
              const podAvail = podStaff.filter(s => getStatus(getNetAvailable(s, sprint)) === 'available').length;
              const activeUtil = podAggregates.find(p => p.pod === pod);

              const color = avgUtil > 100 ? 'red' : avgUtil > 90 ? 'amber' : 'green';
              const barColor = color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-400' : 'bg-emerald-500';
              const textColor = color === 'red' ? 'text-red-600' : color === 'amber' ? 'text-amber-600' : 'text-emerald-600';

              return (
                <button
                  key={pod}
                  onClick={() => onNavigate('capacity')}
                  className="flex-shrink-0 w-[200px] bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getPodColor(pod) }} />
                      <span className="text-sm text-slate-700" style={{ fontWeight: 600 }}>{pod}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm ${textColor}`} style={{ fontWeight: 700 }}>{avgUtil}%</span>
                      {sprintsInRange.length > 1 && (
                        <div className="text-xs text-slate-400">avg</div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                    <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(avgUtil, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{activeUtil?.demand}/{activeUtil?.effCap} SP active</span>
                    <span className="text-emerald-600">{podAvail} free</span>
                  </div>
                  {/* Sprint mini-strip if range > 1 */}
                  {sprintsInRange.length > 1 && (
                    <div className="flex gap-0.5 mt-2">
                      {sprintsInRange.map(s => {
                        const effCap = podStaff.reduce((c, m) => c + getEffectiveCapacity(m, s.id), 0);
                        const demand = podStaff.reduce((c, m) => c + (m.sprintData[s.id]?.demand ?? 0), 0);
                        const u = effCap > 0 ? Math.round(demand / effCap * 100) : 0;
                        const bc = u > 100 ? 'bg-red-400' : u > 90 ? 'bg-amber-400' : 'bg-emerald-400';
                        return (
                          <div
                            key={s.id}
                            className={`flex-1 h-1 rounded-full ${bc} ${s.id === sprint ? 'opacity-100 ring-1 ring-slate-400' : 'opacity-60'}`}
                            title={`${s.name}: ${u}%`}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick metrics row — active sprint */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          {[
            { label: 'Total Staff', value: filtered.length.toString(), icon: <Users size={14} className="text-slate-400" /> },
            { label: `Available · ${currentSprint?.name}`, value: availableStaff.length.toString(), icon: <CheckCircle2 size={14} className="text-emerald-500" />, color: 'text-emerald-600' },
            { label: `Over-allocated · ${currentSprint?.name}`, value: overAllocated.length.toString(), icon: <AlertTriangle size={14} className="text-red-400" />, color: 'text-red-600' },
            {
              label: `Total Demand · ${rangeLabel}`,
              value: sprintsInRange.reduce((total, s) =>
                total + filtered.reduce((sum, m) => sum + (m.sprintData[s.id]?.demand ?? 0), 0), 0
              ).toString() + ' SP',
              icon: <TrendingUp size={14} className="text-blue-400" />,
              color: 'text-blue-600'
            },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                {m.icon}
                <span className="text-xs text-slate-500">{m.label}</span>
              </div>
              <div className={`text-2xl ${m.color ?? 'text-slate-800'}`} style={{ fontWeight: 700 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
