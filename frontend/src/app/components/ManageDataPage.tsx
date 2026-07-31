import React, { useState } from 'react';
import { Plus, RefreshCw, Search, Edit2, Trash2, Check, Link2, CalendarDays, Settings2, Save, X, Star, Layers, ChevronRight, ChevronLeft } from 'lucide-react';
import { STAFF, SPRINTS, PODS, POD_CONFIGS, ALL_PLATFORMS } from './mockData';
import type { ManageTab, Sprint, PodConfig, Platform } from './mockData';

type Props = {
  activeTab: ManageTab;
  onTabChange: (tab: ManageTab) => void;
};

const TABS = [
  { id: 'jira' as ManageTab, label: 'JIRA', icon: <Link2 size={14} /> },
  { id: 'holidays' as ManageTab, label: 'Holidays', icon: <CalendarDays size={14} /> },
  { id: 'allocation' as ManageTab, label: 'Allocation & Home Pod', icon: <Settings2 size={14} /> },
  { id: 'sprints' as ManageTab, label: 'Sprints',  icon: <CalendarDays size={14} /> },
  { id: 'pods'    as ManageTab, label: 'Pods',     icon: <Layers size={14} /> },
];

export function ManageDataPage({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="px-6 pt-5 pb-0 bg-white border-b border-slate-200">
        <div className="flex items-center gap-1 mb-4">
          <h1 className="text-slate-900 mr-4">Manage Data</h1>
          <span className="text-xs text-slate-500 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">2 flags</span>
        </div>
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'jira' && <JiraTab />}
        {activeTab === 'holidays' && <HolidaysTab />}
        {activeTab === 'allocation' && <AllocationTab />}
        {activeTab === 'sprints' && <SprintsTab />}
        {activeTab === 'pods'    && <PodsTab />}
      </div>
    </div>
  );
}

function JiraTab() {
  const [search, setSearch] = useState('');
  const [syncStatus] = useState('Synced 2h ago');

  const allStories = STAFF.flatMap(m =>
    m.jiraStories.map(j => ({
      ...j,
      staffId: m.id,
      staffName: m.name,
      pod: m.pod,
      platforms: m.platforms,
      platform: m.platform,
    }))
  );

  const filtered = allStories.filter(s =>
    !search || s.key.toLowerCase().includes(search.toLowerCase()) || s.summary.toLowerCase().includes(search.toLowerCase()) || s.staffName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stories..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {SPRINTS.map(s => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (Current)' : ''}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2">
            <Check size={12} className="text-emerald-500" /> {syncStatus}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw size={13} /> Sync JIRA
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={13} /> Add Story
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Story Key', 'Summary', 'Epic', 'Assignee', 'Pod', 'Sprint', 'SP', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 30).map(s => (
              <tr key={`${s.key}-${s.sprintId}`} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <span className="text-blue-600" style={{ fontWeight: 500 }}>{s.key}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-700 max-w-xs">
                  <span className="truncate block">{s.summary}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded">{s.epic}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">{s.staffName}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{s.pod}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{SPRINTS.find(sp => sp.id === s.sprintId)?.name}</td>
                <td className="px-4 py-2.5 text-slate-700 text-xs" style={{ fontWeight: 600 }}>{s.storyPoints}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    s.status === 'Done' ? 'bg-emerald-100 text-emerald-700'
                    : s.status === 'In Progress' ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                  }`}>{s.status}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Edit2 size={12} />
                    </button>
                    <button className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-sm">No stories match the search</div>
        )}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          Showing {Math.min(filtered.length, 30)} of {filtered.length} stories
        </div>
      </div>
    </div>
  );
}

type HolidayEntry = {
  id: string;
  staffId: string;
  staffName: string;
  pod: string;
  date: string;
  sprintId: string;
  reason: string;
};

function HolidaysTab() {
  const holidays: HolidayEntry[] = STAFF.flatMap(m =>
    Object.entries(m.sprintData).flatMap(([sprintId, data]) =>
      data.holidayDates.map((date, i) => ({
        id: `${m.id}-${sprintId}-${i}`,
        staffId: m.id,
        staffName: m.name,
        pod: m.pod,
        date,
        sprintId,
        reason: 'Annual leave',
      }))
    )
  );

  const missingStaff = ['Noah Thomas', 'Kate Martinez', 'Iris Taylor'];
  const [search, setSearch] = useState('');
  const filtered = holidays.filter(h =>
    !search || h.staffName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="text-sm text-amber-800" style={{ fontWeight: 600 }}>Missing holiday data for Sprint 26</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {missingStaff.map(name => (
            <span key={name} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">{name}</span>
          ))}
        </div>
        <p className="text-xs text-amber-700 mt-2">Add their holiday records for Sprint 26 to ensure accurate capacity calculations.</p>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={13} /> Add Holiday
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Staff', 'Pod', 'Date', 'Sprint', 'Reason', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(h => (
              <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ backgroundColor: STAFF.find(s => s.id === h.staffId)?.avatarColor ?? '#94a3b8' }}
                    >
                      {h.staffName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-slate-700" style={{ fontWeight: 500 }}>{h.staffName}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{h.pod}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-700 text-xs">{h.date}</td>
                <td className="px-4 py-2.5 text-xs">
                  <span className={`px-2 py-0.5 rounded ${SPRINTS.find(s => s.id === h.sprintId)?.isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {SPRINTS.find(s => s.id === h.sprintId)?.name}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{h.reason}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Edit2 size={12} />
                    </button>
                    <button className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-sm">No holiday records found</div>
        )}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          {filtered.length} holiday records
        </div>
      </div>
    </div>
  );
}

function AllocationTab() {
  const [search, setSearch] = useState('');

  const filtered = STAFF.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.pod.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Pods</option>
            {PODS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={13} /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {PODS.map(pod => {
          const podStaff = STAFF.filter(m => m.pod === pod);
          // Group by primary platform for the summary cards
          const byPlatform = podStaff.reduce<Record<string, number>>((acc, m) => {
            acc[m.platform] = (acc[m.platform] ?? 0) + 1;
            return acc;
          }, {});
          return (
            <div key={pod} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>{pod}</div>
              <div className="text-2xl text-slate-900 mb-1" style={{ fontWeight: 700 }}>{podStaff.length}</div>
              <div className="text-xs text-slate-500 space-y-0.5">
                {Object.entries(byPlatform).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{platform}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Name', 'Role', 'Home Pod', 'Platform', 'Sprint Capacity (SP)', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ backgroundColor: m.avatarColor, fontWeight: 600 }}
                    >
                      {m.initials}
                    </div>
                    <span className="text-slate-800" style={{ fontWeight: 500 }}>{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{m.role}</td>
                <td className="px-4 py-2.5">
                  <select
                    defaultValue={m.pod}
                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {PODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {ALL_PLATFORMS.map(p => (
                      <label
                        key={p}
                        className={`px-2 py-0.5 rounded border text-xs cursor-pointer transition-colors ${
                          m.platforms.includes(p)
                            ? PLATFORM_CHIP_COLORS[p]
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={m.platforms.includes(p)}
                          readOnly
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <input
                    defaultValue={10}
                    type="number"
                    min={1}
                    max={15}
                    className="w-16 px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                      Save
                    </button>
                    <button className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          {filtered.length} staff members
        </div>
      </div>
    </div>
  );
}

type SprintFormState = {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

function SprintsTab() {
  const [sprints, setSprints] = useState<Sprint[]>([...SPRINTS]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SprintFormState>({ name: '', startDate: '', endDate: '', isCurrent: false });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<SprintFormState>({ name: '', startDate: '', endDate: '', isCurrent: false });

  function startEdit(sprint: Sprint) {
    setEditingId(sprint.id);
    setEditForm({ name: sprint.name, startDate: sprint.startDate, endDate: sprint.endDate, isCurrent: sprint.isCurrent });
    setShowAdd(false);
  }

  function saveEdit(id: string) {
    setSprints(prev => prev.map(s => {
      if (s.id !== id) return editForm.isCurrent ? { ...s, isCurrent: false } : s;
      return { ...s, ...editForm };
    }));
    setEditingId(null);
  }

  function deleteSprint(id: string) {
    setSprints(prev => prev.filter(s => s.id !== id));
  }

  function markCurrent(id: string) {
    setSprints(prev => prev.map(s => ({ ...s, isCurrent: s.id === id })));
  }

  function addSprint() {
    if (!addForm.name || !addForm.startDate || !addForm.endDate) return;
    const newId = `sprint-${Date.now()}`;
    const newSprint: Sprint = {
      id: newId,
      name: addForm.name,
      startDate: addForm.startDate,
      endDate: addForm.endDate,
      isCurrent: addForm.isCurrent,
      workingDays: [],
    };
    setSprints(prev => [
      ...(addForm.isCurrent ? prev.map(s => ({ ...s, isCurrent: false })) : prev),
      newSprint,
    ]);
    setAddForm({ name: '', startDate: '', endDate: '', isCurrent: false });
    setShowAdd(false);
  }

  return (
    <div className="p-6">
      {/* Info banner */}
      <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <div style={{ fontWeight: 600 }} className="mb-1">Sprint Management</div>
        <p className="text-xs text-blue-700">Add, edit, or remove sprints. Only one sprint can be marked as current. Sprint IDs are used to link staff capacity data — editing dates does not affect existing sprint data.</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-slate-600">{sprints.length} sprints configured</div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={13} /> Add Sprint
        </button>
      </div>

      {/* Sprint list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Sprint Name', 'Start Date', 'End Date', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sprints.map(s => (
              <tr key={s.id} className={`border-b border-slate-100 hover:bg-slate-50 ${s.isCurrent ? 'bg-blue-50/30' : ''}`}>
                {editingId === s.id ? (
                  /* Inline edit row */
                  <>
                    <td className="px-5 py-2.5">
                      <input
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="px-2 py-1 text-xs border border-blue-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                      />
                    </td>
                    <td className="px-5 py-2.5">
                      <input
                        type="date"
                        value={editForm.startDate}
                        onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                        className="px-2 py-1 text-xs border border-blue-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-5 py-2.5">
                      <input
                        type="date"
                        value={editForm.endDate}
                        onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                        className="px-2 py-1 text-xs border border-blue-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-5 py-2.5">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.isCurrent}
                          onChange={e => setEditForm(f => ({ ...f, isCurrent: e.target.checked }))}
                          className="rounded"
                        />
                        Mark as current
                      </label>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveEdit(s.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          <Save size={11} /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  /* Normal row */
                  <>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800" style={{ fontWeight: 500 }}>{s.name}</span>
                        {s.isCurrent && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200">Current</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{s.startDate}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{s.endDate}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {s.isCurrent ? (
                          <span className="flex items-center gap-1 text-xs text-blue-600">
                            <Star size={11} fill="currentColor" /> Active sprint
                          </span>
                        ) : (
                          <button
                            onClick={() => markCurrent(s.id)}
                            className="text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                          >
                            <Star size={11} /> Set as current
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEdit(s)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => deleteSprint(s.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Add form row */}
            {showAdd && (
              <tr className="border-b border-blue-200 bg-blue-50/30">
                <td className="px-5 py-2.5">
                  <input
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Sprint E"
                    className="px-2 py-1 text-xs border border-blue-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                  />
                </td>
                <td className="px-5 py-2.5">
                  <input
                    type="date"
                    value={addForm.startDate}
                    onChange={e => setAddForm(f => ({ ...f, startDate: e.target.value }))}
                    className="px-2 py-1 text-xs border border-blue-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-5 py-2.5">
                  <input
                    type="date"
                    value={addForm.endDate}
                    onChange={e => setAddForm(f => ({ ...f, endDate: e.target.value }))}
                    className="px-2 py-1 text-xs border border-blue-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-5 py-2.5">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addForm.isCurrent}
                      onChange={e => setAddForm(f => ({ ...f, isCurrent: e.target.checked }))}
                      className="rounded"
                    />
                    Mark as current
                  </label>
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={addSprint}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={11} /> Add
                    </button>
                    <button
                      onClick={() => setShowAdd(false)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {sprints.length === 0 && !showAdd && (
          <div className="py-10 text-center text-slate-400 text-sm">No sprints configured. Add your first sprint.</div>
        )}

        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          {sprints.length} sprint{sprints.length !== 1 ? 's' : ''} · {sprints.filter(s => s.isCurrent).length === 1 ? `Current: ${sprints.find(s => s.isCurrent)?.name}` : 'No current sprint set'}
        </div>
      </div>
    </div>
  );
}

// ── Pods CRUD ──────────────────────────────────────────────────────────────

type PodFormState = { name: string; platforms: Platform[]; };
type StaffAssignment = Record<string, string>; // staffId → podName

const PLATFORM_CHIP_COLORS: Record<Platform, string> = {
  'AWS':         'bg-amber-100 text-amber-800 border-amber-200',
  'Azure':       'bg-blue-100 text-blue-700 border-blue-200',
  'GCP':         'bg-sky-100 text-sky-700 border-sky-200',
  'On-Prem':     'bg-slate-100 text-slate-700 border-slate-200',
  'Hybrid':      'bg-violet-100 text-violet-700 border-violet-200',
  'Edge':        'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Multi-Cloud': 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

function PodsTab() {
  const [pods, setPods] = useState<PodConfig[]>([...POD_CONFIGS]);
  // staffAssignments maps staffId → pod name (starts from STAFF)
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment>(
    () => Object.fromEntries(STAFF.map(m => [m.id, m.pod]))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PodFormState>({ name: '', platforms: [] });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Close assignment modal when the Pods tab is first mounted or remounted
  React.useEffect(() => { setExpandedId(null); }, []);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<PodFormState>({ name: '', platforms: [] });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState<Record<string, string>>({});

  function startEdit(pod: PodConfig) {
    setEditingId(pod.id);
    setEditForm({ name: pod.name, platforms: [...pod.platforms] });
    setExpandedId(null);
  }

  function saveEdit() {
    if (!editForm.name.trim() || editForm.platforms.length === 0) return;
    setPods(prev => prev.map(p =>
      p.id === editingId ? { ...p, name: editForm.name.trim(), platforms: editForm.platforms } : p
    ));
    setEditingId(null);
  }

  function deletePod(id: string) {
    setPods(prev => prev.filter(p => p.id !== id));
    // Unassign staff that were in this pod
    const podName = pods.find(p => p.id === id)?.name;
    if (podName) {
      setStaffAssignments(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(sid => { if (next[sid] === podName) next[sid] = ''; });
        return next;
      });
    }
    setDeleteConfirm(null);
  }

  function addPod() {
    if (!addForm.name.trim() || addForm.platforms.length === 0) return;
    const newPod: PodConfig = {
      id: `pod-${addForm.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: addForm.name.trim(),
      platforms: addForm.platforms,
      color: '#94a3b8',
    };
    setPods(prev => [...prev, newPod]);
    setAddForm({ name: '', platforms: [] });
    setShowAdd(false);
  }

  function togglePlatform(platform: Platform, form: PodFormState, setForm: (f: PodFormState) => void) {
    const next = form.platforms.includes(platform)
      ? form.platforms.filter(p => p !== platform)
      : [...form.platforms, platform];
    setForm({ ...form, platforms: next });
  }

  function assignStaff(staffId: string, podName: string) {
    setStaffAssignments(prev => ({ ...prev, [staffId]: podName }));
  }

  function assignMany(staffIds: string[], podName: string) {
    setStaffAssignments(prev => {
      const next = { ...prev };
      staffIds.forEach(id => { next[id] = podName; });
      return next;
    });
  }

  function unassignMany(staffIds: string[]) {
    setStaffAssignments(prev => {
      const next = { ...prev };
      staffIds.forEach(id => { next[id] = ''; });
      return next;
    });
  }

  const staffByPod = (podName: string) =>
    STAFF.filter(m => staffAssignments[m.id] === podName);

  return (
    <div className="p-6">
      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-5 text-xs text-blue-700">
        <Layers size={13} className="mt-0.5 flex-shrink-0" />
        <span>Changes here are local (no backend). Pods can be associated with any number of platforms. Staff can have multiple platform skills, but belong to exactly one pod.</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-slate-700">Pod Configuration</h3>
          {!showAdd && (
            <button
              onClick={() => { setShowAdd(true); setEditingId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={13} /> Add Pod
            </button>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-2 text-left text-xs text-slate-600 w-40" style={{ fontWeight: 600 }}>Pod Name</th>
              <th className="px-5 py-2 text-left text-xs text-slate-600" style={{ fontWeight: 600 }}>Platforms</th>
              <th className="px-5 py-2 text-left text-xs text-slate-600 w-24" style={{ fontWeight: 600 }}>Staff</th>
              <th className="px-5 py-2 text-left text-xs text-slate-600 w-28" style={{ fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pods.map(pod => (
              <React.Fragment key={pod.id}>
                {/* Main pod row */}
                <tr key={pod.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    {editingId === pod.id ? (
                      <input
                        className="border border-slate-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pod.color }} />
                        <span className="text-slate-800" style={{ fontWeight: 500 }}>{pod.name}</span>
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3">
                    {editingId === pod.id ? (
                      <div className="flex flex-wrap gap-1">
                        {ALL_PLATFORMS.map(p => (
                          <button
                            key={p}
                            onClick={() => togglePlatform(p, editForm, setEditForm)}
                            className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                              editForm.platforms.includes(p)
                                ? PLATFORM_CHIP_COLORS[p]
                                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                            } cursor-pointer`}
                          >
                            {p}
                          </button>
                        ))}
                        {editForm.platforms.length === 0 && (
                          <span className="text-xs text-red-500">Select at least 1</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {pod.platforms.map(p => (
                          <span key={p} className={`px-2 py-0.5 rounded border text-xs ${PLATFORM_CHIP_COLORS[p]}`}>{p}</span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3">
                    <button
                      onClick={() => setExpandedId(expandedId === pod.id ? null : pod.id)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span style={{ fontWeight: 500 }}>{staffByPod(pod.name).length} staff</span>
                      <span className="text-slate-400">{expandedId === pod.id ? '▲' : '▼'}</span>
                    </button>
                  </td>

                  <td className="px-5 py-3">
                    {editingId === pod.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={saveEdit}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          disabled={!editForm.name.trim() || editForm.platforms.length === 0}
                        >
                          <Save size={11} /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : deleteConfirm === pod.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deletePod(pod.id)}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(pod)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit pod"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(pod.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete pod"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>

              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Staff assignment modal — detached overlay so it never overlaps the pod list */}
        {expandedId && (
          <PodStaffAssignmentModal
            pod={pods.find(p => p.id === expandedId)!}
            staffAssignments={staffAssignments}
            onAssignOne={assignStaff}
            onAssignMany={assignMany}
            onUnassignMany={unassignMany}
            search={assignSearch[expandedId] ?? ''}
            onSearchChange={value => setAssignSearch(prev => ({ ...prev, [expandedId]: value }))}
            onClose={() => setExpandedId(null)}
          />
        )}

        <table className="w-full text-sm">
          <tbody>
            {/* Add form row */}
            {showAdd && (
              <tr className="border-b border-blue-200 bg-blue-50/30">
                <td className="px-5 py-2.5">
                  <input
                    className="border border-slate-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Pod name…"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addPod()}
                    autoFocus
                  />
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {ALL_PLATFORMS.map(p => (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p, addForm, setAddForm)}
                        className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                          addForm.platforms.includes(p)
                            ? PLATFORM_CHIP_COLORS[p]
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                        } cursor-pointer`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-400">—</td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={addPod}
                      disabled={!addForm.name.trim() || addForm.platforms.length === 0}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Plus size={11} /> Add
                    </button>
                    <button
                      onClick={() => setShowAdd(false)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {pods.length === 0 && !showAdd && (
          <div className="py-10 text-center text-slate-400 text-sm">No pods configured. Add your first pod.</div>
        )}

        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          {pods.length} pod{pods.length !== 1 ? 's' : ''} ·{' '}
          {ALL_PLATFORMS.filter(p => pods.some(pod => pod.platforms.includes(p))).join(', ')} in use
        </div>
      </div>
    </div>
  );
}

// ── Pod staff assignment panel ( redesigned for 100+ staff ) ───────────────

type PodStaffAssignmentModalProps = {
  pod: PodConfig;
  staffAssignments: StaffAssignment;
  onAssignOne: (staffId: string, podName: string) => void;
  onAssignMany: (staffIds: string[], podName: string) => void;
  onUnassignMany: (staffIds: string[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
};

function PodStaffAssignmentModal({
  pod,
  staffAssignments,
  onAssignOne,
  onAssignMany,
  onUnassignMany,
  search,
  onSearchChange,
  onClose,
}: PodStaffAssignmentModalProps) {
  const query = search.trim().toLowerCase();

  const inPod = STAFF.filter(m => staffAssignments[m.id] === pod.name);
  const available = STAFF.filter(m => staffAssignments[m.id] !== pod.name);

  const inPodFiltered = inPod.filter(m =>
    !query || m.name.toLowerCase().includes(query) || m.role.toLowerCase().includes(query)
  );
  const availableFiltered = available.filter(m =>
    !query || m.name.toLowerCase().includes(query) || m.role.toLowerCase().includes(query)
  );

  const [selectedInPod, setSelectedInPod] = useState<Set<string>>(new Set());
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set());

  function toggle(set: Set<string>, id: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  function moveToPod() {
    if (selectedAvailable.size === 0) return;
    onAssignMany(Array.from(selectedAvailable), pod.name);
    setSelectedAvailable(new Set());
  }

  function removeFromPod() {
    if (selectedInPod.size === 0) return;
    onUnassignMany(Array.from(selectedInPod));
    setSelectedInPod(new Set());
  }

  function skillMatchCount(m: typeof STAFF[0]) {
    return m.platforms.filter(p => pod.platforms.includes(p)).length;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[85vh] bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <div>
            <h3 className="text-slate-800" style={{ fontWeight: 600 }}>Assign staff to {pod.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{inPod.length} assigned · {available.length} unassigned</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search + selected counts */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search staff by name or role…"
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500">
            Selected: <span className="text-blue-600" style={{ fontWeight: 600 }}>{selectedAvailable.size}</span> to add · <span className="text-blue-600" style={{ fontWeight: 600 }}>{selectedInPod.size}</span> to remove
          </div>
        </div>

        {/* Transfer lists */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 p-4 min-h-0 flex-1">
          {/* Available staff list */}
          <div className="bg-white rounded-lg border border-slate-200 flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-600" style={{ fontWeight: 600 }}>Unassigned / Other pods</span>
              <span className="text-[11px] text-slate-400">{availableFiltered.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {availableFiltered.map(m => {
                const skillMatch = skillMatchCount(m);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs cursor-pointer transition-colors ${
                      selectedAvailable.has(m.id)
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={selectedAvailable.has(m.id)}
                      onChange={() => toggle(selectedAvailable, m.id, setSelectedAvailable)}
                    />
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: m.avatarColor, fontSize: 9, fontWeight: 700 }}
                    >
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ fontWeight: 500 }}>{m.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{m.role}</div>
                    </div>
                    {skillMatch > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px]" title={`${skillMatch} platform skill${skillMatch > 1 ? 's' : ''} match this pod`}>
                        {skillMatch} skill match
                      </span>
                    )}
                  </label>
                );
              })}
              {availableFiltered.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-8">No unassigned staff</div>
              )}
            </div>
          </div>

          {/* Transfer actions */}
          <div className="flex flex-col items-center justify-center gap-2">
            <button
              onClick={moveToPod}
              disabled={selectedAvailable.size === 0}
              className="p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
              title="Assign selected"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={removeFromPod}
              disabled={selectedInPod.size === 0}
              className="p-1.5 rounded-lg bg-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-300 transition-colors"
              title="Remove selected"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* Assigned staff list */}
          <div className="bg-white rounded-lg border border-slate-200 flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-slate-100 bg-blue-50/50 flex items-center justify-between">
              <span className="text-xs text-blue-900" style={{ fontWeight: 600 }}>Assigned to {pod.name}</span>
              <span className="text-[11px] text-slate-400">{inPodFiltered.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {inPodFiltered.map(m => (
                <label
                  key={m.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs cursor-pointer transition-colors ${
                    selectedInPod.has(m.id)
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    checked={selectedInPod.has(m.id)}
                    onChange={() => toggle(selectedInPod, m.id, setSelectedInPod)}
                  />
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: m.avatarColor, fontSize: 9, fontWeight: 700 }}
                  >
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ fontWeight: 500 }}>{m.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{m.role}</div>
                  </div>
                  <button
                    onClick={e => { e.preventDefault(); onAssignOne(m.id, ''); }}
                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove from pod"
                  >
                    <X size={11} />
                  </button>
                </label>
              ))}
              {inPodFiltered.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-8">No staff assigned yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={removeFromPod}
            disabled={selectedInPod.size === 0}
            className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 transition-colors"
          >
            Remove selected ({selectedInPod.size})
          </button>
          <button
            onClick={moveToPod}
            disabled={selectedAvailable.size === 0}
            className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Assign selected ({selectedAvailable.size})
          </button>
        </div>
      </div>
    </div>
  );
}
