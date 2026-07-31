import { ReactNode } from 'react';
import {
  Home, Users, BarChart3, FileText, Database,
  Link2, CalendarDays, Settings2, ChevronRight,
  Activity
} from 'lucide-react';
import type { Page, ManageTab } from './mockData';

type NavItem = {
  id: Page;
  label: string;
  icon: ReactNode;
  tab?: ManageTab;
};

const insightItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home size={16} /> },
  { id: 'staff-availability', label: 'Staff Availability', icon: <Users size={16} /> },
  { id: 'capacity', label: 'Capacity by Pod', icon: <BarChart3 size={16} /> },
  { id: 'reports', label: 'Reports', icon: <FileText size={16} /> },
];

const manageItems = [
  { id: 'manage-data' as Page, tab: 'jira' as ManageTab, label: 'JIRA', icon: <Link2 size={16} /> },
  { id: 'manage-data' as Page, tab: 'holidays' as ManageTab, label: 'Holidays', icon: <CalendarDays size={16} /> },
  { id: 'manage-data' as Page, tab: 'allocation' as ManageTab, label: 'Allocation & Home Pod', icon: <Settings2 size={16} /> },
];

type Props = {
  page: Page;
  manageTab: ManageTab;
  onNavigate: (page: Page, tab?: ManageTab) => void;
  children: ReactNode;
};

export function Layout({ page, manageTab, onNavigate, children }: Props) {
  const isManageData = page === 'manage-data';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Activity size={14} className="text-white" />
            </div>
            <div className="text-white text-sm" style={{ fontWeight: 600 }}>Resource Tracker</div>
          </div>
        </div>

        {/* Zone 1: Insights */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="text-slate-500 text-xs px-2 mb-1.5 uppercase tracking-wider" style={{ fontSize: '10px' }}>Insights</p>
          <nav className="space-y-0.5">
            {insightItems.map(item => {
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="my-3 border-t border-slate-700" />

          {/* Zone 2: Manage Data */}
          <div>
            <button
              onClick={() => onNavigate('manage-data', 'jira')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left mb-0.5 ${
                isManageData
                  ? 'text-slate-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Database size={16} className={isManageData ? 'text-slate-400' : 'text-slate-600'} />
              <span className="uppercase tracking-wider" style={{ fontSize: '10px' }}>Manage Data</span>
              <ChevronRight size={12} className={`ml-auto transition-transform ${isManageData ? 'rotate-90' : ''}`} />
            </button>

            {isManageData && (
              <div className="ml-3 border-l border-slate-700 pl-3 space-y-0.5">
                {manageItems.map(item => {
                  const active = isManageData && manageTab === item.tab;
                  return (
                    <button
                      key={item.tab}
                      onClick={() => onNavigate(item.id, item.tab)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                        active
                          ? 'bg-slate-700 text-slate-200'
                          : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 text-xs">DL</div>
            <div>
              <div className="text-slate-300 text-xs">Delivery Lead</div>
              <div className="text-slate-500 text-xs">v2.1.0</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
