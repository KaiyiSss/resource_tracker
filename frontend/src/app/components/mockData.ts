export type Platform = 'AWS' | 'Azure' | 'GCP' | 'On-Prem' | 'Hybrid' | 'Edge' | 'Multi-Cloud';
export const ALL_PLATFORMS: Platform[] = ['AWS', 'Azure', 'GCP', 'On-Prem', 'Hybrid', 'Edge', 'Multi-Cloud'];

export type StatusType = 'available' | 'tight' | 'over';
export type Page = 'home' | 'staff-availability' | 'capacity' | 'reports' | 'manage-data';
export type ManageTab = 'jira' | 'holidays' | 'allocation' | 'sprints' | 'pods';

export type AppContext = {
  sprint: string;
  sprintRange: { from: string; to: string };
  pods: string[];
  platform: 'All' | Platform;
};

export type Sprint = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  workingDays: string[];
};

export type JiraStory = {
  key: string;
  summary: string;
  epic: string;
  storyPoints: number;
  sprintId: string;
  status: 'Done' | 'In Progress' | 'To Do';
};

export type PodConfig = {
  id: string;
  name: string;
  platforms: Platform[];
  color: string;
};

export type StaffMember = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  pod: string;
  /** Platforms this staff member is skilled on; may differ from their pod's platforms */
  platforms: Platform[];
  /** Primary platform badge — used for legacy displays that expect one value */
  platform: Platform;
  sprintData: Record<string, {
    capacity: number;
    holidays: number;
    demand: number;
    holidayDates: string[];
  }>;
  jiraStories: JiraStory[];
};

// ── Platform config ────────────────────────────────────────────────────────

export const PLATFORM_COLORS: Record<Platform, string> = {
  'AWS':         '#FF9900',
  'Azure':       '#0078D4',
  'GCP':         '#4285F4',
  'On-Prem':     '#6B7280',
  'Hybrid':      '#8B5CF6',
  'Edge':        '#10B981',
  'Multi-Cloud': '#F59E0B',
};

export const PLATFORM_BG: Record<Platform, string> = {
  'AWS':         'bg-amber-100 text-amber-800',
  'Azure':       'bg-blue-100 text-blue-700',
  'GCP':         'bg-sky-100 text-sky-700',
  'On-Prem':     'bg-slate-100 text-slate-700',
  'Hybrid':      'bg-violet-100 text-violet-700',
  'Edge':        'bg-emerald-100 text-emerald-700',
  'Multi-Cloud': 'bg-yellow-100 text-yellow-700',
};

// ── Pod config (10 pods, no platform limit) ───────────────────────────────

export const POD_CONFIGS: PodConfig[] = [
  { id: 'pod-griffin',  name: 'Griffin',  platforms: ['AWS', 'Azure'],                                   color: '#6366f1' },
  { id: 'pod-phoenix',  name: 'Phoenix',  platforms: ['GCP', 'AWS'],                                     color: '#f97316' },
  { id: 'pod-titan',    name: 'Titan',    platforms: ['Azure', 'On-Prem'],                               color: '#10b981' },
  { id: 'pod-vanguard', name: 'Vanguard', platforms: ['Multi-Cloud', 'GCP'],                             color: '#3b82f6' },
  { id: 'pod-nexus',    name: 'Nexus',    platforms: ['AWS'],                                             color: '#ec4899' },
  { id: 'pod-orion',    name: 'Orion',    platforms: ['Azure', 'Edge'],                                  color: '#8b5cf6' },
  { id: 'pod-apex',     name: 'Apex',     platforms: ['Hybrid', 'On-Prem'],                              color: '#14b8a6' },
  { id: 'pod-horizon',  name: 'Horizon',  platforms: ['GCP', 'Azure', 'AWS', 'On-Prem', 'Hybrid'],       color: '#f59e0b' },
  { id: 'pod-zenith',   name: 'Zenith',   platforms: ['Edge', 'Multi-Cloud', 'AWS', 'Azure', 'GCP'],       color: '#ef4444' },
  { id: 'pod-catalyst', name: 'Catalyst', platforms: ['On-Prem', 'Hybrid'],                              color: '#22c55e' },
];

export const PODS = POD_CONFIGS.map(p => p.name);

export function getPodColor(podName: string): string {
  return POD_CONFIGS.find(p => p.name === podName)?.color ?? '#94a3b8';
}

export function getPodPlatforms(podName: string): Platform[] {
  return POD_CONFIGS.find(p => p.name === podName)?.platforms ?? [];
}

// ── Sprint generation ──────────────────────────────────────────────────────

export const SPRINT_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BASE_MS = new Date('2026-06-15').getTime(); // Sprint A: Mon Jun 15 2026

function sprintStartMs(idx: number): number {
  return BASE_MS + idx * 14 * 24 * 60 * 60 * 1000;
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function workingDays(idx: number): string[] {
  const start = sprintStartMs(idx);
  const days: string[] = [];
  for (let d = 0; d < 14; d++) {
    const dt = new Date(start + d * 24 * 60 * 60 * 1000);
    if (dt.getDay() !== 0 && dt.getDay() !== 6) {
      days.push(`${MONTHS_SHORT[dt.getMonth()]} ${dt.getDate()}`);
    }
  }
  return days;
}

type SprintEntry = { capacity: number; holidays: number; demand: number; holidayDates: string[] };

function gen(staffSeed: number, sprintIdx: number): SprintEntry {
  const s = (staffSeed * 37 + sprintIdx * 13 + 7) % 97;
  const holidays = s < 7 ? 2 : s < 18 ? 1 : 0;
  const demand = 6 + (s % 7);
  return { capacity: 10, holidays, demand, holidayDates: [] };
}

// E–Z generated data for existing staff (manual A–D provided separately)
function genRange(staffSeed: number): Record<string, SprintEntry> {
  const out: Record<string, SprintEntry> = {};
  SPRINT_LETTERS.slice(4).forEach((letter, i) => {
    out[`sprint-${letter.toLowerCase()}`] = gen(staffSeed, i + 4);
  });
  return out;
}

// All 26 sprints generated (for new staff with no manual data)
function allSprints(staffSeed: number): Record<string, SprintEntry> {
  const out: Record<string, SprintEntry> = {};
  SPRINT_LETTERS.forEach((letter, i) => {
    out[`sprint-${letter.toLowerCase()}`] = gen(staffSeed, i);
  });
  return out;
}

// ── SPRINTS (A–Z) ──────────────────────────────────────────────────────────

export const SPRINTS: Sprint[] = SPRINT_LETTERS.map((letter, i) => ({
  id: `sprint-${letter.toLowerCase()}`,
  name: `Sprint ${letter}`,
  startDate: isoDate(sprintStartMs(i)),
  endDate: isoDate(sprintStartMs(i) + 13 * 24 * 60 * 60 * 1000),
  isCurrent: letter === 'B',
  workingDays: workingDays(i),
}));

// ── Avatar colours (24 slots) ──────────────────────────────────────────────

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#ef4444','#06b6d4','#84cc16','#f97316',
  '#a855f7','#14b8a6','#f43f5e','#0ea5e9','#22c55e',
  '#eab308','#d946ef','#0891b2','#65a30d','#b45309',
  '#7c3aed','#dc2626','#059669','#9333ea',
];

// ── STAFF (24 members across 10 pods) ─────────────────────────────────────

export const STAFF: StaffMember[] = [
  // ── Griffin (AWS, Azure) ────────────────────────────────────────────────
  {
    id: 's1', name: 'Alice Chen', initials: 'AC', avatarColor: AVATAR_COLORS[0],
    role: 'Senior Developer', pod: 'Griffin', platforms: ['AWS', 'Azure'], platform: 'AWS',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 9,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      ...genRange(1),
    },
    jiraStories: [
      { key: 'PROJ-101', summary: 'Implement OAuth2 login flow',     epic: 'Auth Revamp',       storyPoints: 3, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-102', summary: 'API rate limiting middleware',     epic: 'Platform Stability', storyPoints: 3, sprintId: 'sprint-b', status: 'To Do' },
      { key: 'PROJ-103', summary: 'Unit tests for auth module',       epic: 'Auth Revamp',       storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
      { key: 'PROJ-099', summary: 'Session management refactor',      epic: 'Auth Revamp',       storyPoints: 5, sprintId: 'sprint-a', status: 'Done' },
    ],
  },
  {
    id: 's2', name: 'Bob Kumar', initials: 'BK', avatarColor: AVATAR_COLORS[1],
    role: 'Developer', pod: 'Griffin', platforms: ['Azure'], platform: 'Azure',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 9,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 11, holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 10, holidayDates: [] },
      ...genRange(2),
    },
    jiraStories: [
      { key: 'PROJ-201', summary: 'Database migration script v3',     epic: 'Data Migration',    storyPoints: 5, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-202', summary: 'Fix slow query on reports',        epic: 'Platform Stability', storyPoints: 3, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-203', summary: 'Deploy staging environment',       epic: 'DevOps',            storyPoints: 3, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  {
    id: 's3', name: 'Carol Smith', initials: 'CS', avatarColor: AVATAR_COLORS[2],
    role: 'Lead Developer', pod: 'Griffin', platforms: ['AWS', 'GCP'], platform: 'AWS',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 9,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 1, demand: 8,  holidayDates: ['Jul 3'] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 2, demand: 8,  holidayDates: [] },
      ...genRange(3),
    },
    jiraStories: [
      { key: 'PROJ-301', summary: 'Architecture review — new service', epic: 'Platform Stability', storyPoints: 3, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-302', summary: 'AWS pipeline CI/CD setup',          epic: 'DevOps',            storyPoints: 5, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  // ── Phoenix (GCP, AWS) ──────────────────────────────────────────────────
  {
    id: 's4', name: 'David Lee', initials: 'DL', avatarColor: AVATAR_COLORS[3],
    role: 'Developer', pod: 'Phoenix', platforms: ['GCP', 'AWS'], platform: 'GCP',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 6,  holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 9,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      ...genRange(4),
    },
    jiraStories: [
      { key: 'PROJ-401', summary: 'Integrate GCP Storage SDK',        epic: 'Cloud Integration', storyPoints: 3, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-402', summary: 'Update API documentation',         epic: 'Documentation',     storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
      { key: 'PROJ-403', summary: 'Fix edge case in file upload',     epic: 'Cloud Integration', storyPoints: 1, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  {
    id: 's5', name: 'Emma Wang', initials: 'EW', avatarColor: AVATAR_COLORS[4],
    role: 'Senior Developer', pod: 'Phoenix', platforms: ['AWS', 'GCP'], platform: 'AWS',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 5,  holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 9,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 6,  holidayDates: [] },
      ...genRange(5),
    },
    jiraStories: [
      { key: 'PROJ-501', summary: 'Real-time notifications system',   epic: 'User Engagement',   storyPoints: 3, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-502', summary: 'WebSocket connection handler',     epic: 'User Engagement',   storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  // ── Titan (Azure, On-Prem) ──────────────────────────────────────────────
  {
    id: 's6', name: 'Frank Davis', initials: 'FD', avatarColor: AVATAR_COLORS[5],
    role: 'Developer', pod: 'Titan', platforms: ['Azure', 'On-Prem'], platform: 'Azure',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 9,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 12, holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 11, holidayDates: [] },
      ...genRange(6),
    },
    jiraStories: [
      { key: 'PROJ-601', summary: 'Dashboard widget framework',       epic: 'Dashboard V2',      storyPoints: 5, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-602', summary: 'Migrate chart library',            epic: 'Dashboard V2',      storyPoints: 3, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-603', summary: 'Performance profiling',            epic: 'Platform Stability', storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
      { key: 'PROJ-604', summary: 'Dashboard state persistence',      epic: 'Dashboard V2',      storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  {
    id: 's7', name: 'Grace Kim', initials: 'GK', avatarColor: AVATAR_COLORS[6],
    role: 'Lead Developer', pod: 'Titan', platforms: ['On-Prem', 'Azure'], platform: 'On-Prem',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 11, holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 15, holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 10, holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 13, holidayDates: [] },
      ...genRange(7),
    },
    jiraStories: [
      { key: 'PROJ-701', summary: 'On-prem identity integration',     epic: 'Enterprise SSO',    storyPoints: 5, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-702', summary: 'Multi-tenant data isolation',      epic: 'Enterprise SSO',    storyPoints: 5, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-703', summary: 'Security audit remediation',       epic: 'Platform Stability', storyPoints: 3, sprintId: 'sprint-b', status: 'To Do' },
      { key: 'PROJ-704', summary: 'Policy enforcement engine',        epic: 'Enterprise SSO',    storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  {
    id: 's8', name: 'Henry Brown', initials: 'HB', avatarColor: AVATAR_COLORS[7],
    role: 'Developer', pod: 'Titan', platforms: ['Azure'], platform: 'Azure',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 2, demand: 8,  holidayDates: ['Jul 1', 'Jul 2'] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      ...genRange(8),
    },
    jiraStories: [
      { key: 'PROJ-801', summary: 'Azure Key Vault integration',      epic: 'Cloud Integration', storyPoints: 3, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-802', summary: 'Update SSL certificates',          epic: 'DevOps',            storyPoints: 2, sprintId: 'sprint-b', status: 'Done' },
      { key: 'PROJ-803', summary: 'E2E tests for auth flow',          epic: 'Auth Revamp',       storyPoints: 1, sprintId: 'sprint-b', status: 'To Do' },
      { key: 'PROJ-804', summary: 'Container registry cleanup',       epic: 'DevOps',            storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  // ── Vanguard (Multi-Cloud, GCP) ─────────────────────────────────────────
  {
    id: 's9', name: 'Iris Taylor', initials: 'IT', avatarColor: AVATAR_COLORS[8],
    role: 'Senior Developer', pod: 'Vanguard', platforms: ['Multi-Cloud', 'GCP'], platform: 'Multi-Cloud',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 1, demand: 9,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      ...genRange(9),
    },
    jiraStories: [
      { key: 'PROJ-901', summary: 'GraphQL schema redesign',          epic: 'API Modernisation', storyPoints: 3, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-902', summary: 'Apollo client migration',          epic: 'API Modernisation', storyPoints: 3, sprintId: 'sprint-b', status: 'To Do' },
      { key: 'PROJ-903', summary: 'Write integration tests',          epic: 'API Modernisation', storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  {
    id: 's10', name: 'James Wilson', initials: 'JW', avatarColor: AVATAR_COLORS[9],
    role: 'Developer', pod: 'Vanguard', platforms: ['GCP', 'Multi-Cloud'], platform: 'GCP',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 10, holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 11, holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 9,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 12, holidayDates: [] },
      ...genRange(10),
    },
    jiraStories: [
      { key: 'PROJ-1001', summary: 'Event streaming pipeline',        epic: 'Data Pipeline',     storyPoints: 5, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-1002', summary: 'Kafka consumer setup',            epic: 'Data Pipeline',     storyPoints: 4, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-1003', summary: 'Monitoring dashboards',           epic: 'Platform Stability', storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  // ── Nexus (AWS) ─────────────────────────────────────────────────────────
  {
    id: 's11', name: 'Kate Martinez', initials: 'KM', avatarColor: AVATAR_COLORS[10],
    role: 'Lead Developer', pod: 'Nexus', platforms: ['AWS', 'Azure'], platform: 'AWS',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 9,  holidayDates: [] },
      ...genRange(11),
    },
    jiraStories: [
      { key: 'PROJ-1101', summary: 'Infrastructure as Code (IaC)',     epic: 'DevOps',            storyPoints: 5, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-1102', summary: 'Cost optimisation review',         epic: 'Platform Stability', storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  {
    id: 's12', name: 'Liam Johnson', initials: 'LJ', avatarColor: AVATAR_COLORS[11],
    role: 'Developer', pod: 'Nexus', platforms: ['AWS'], platform: 'AWS',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 1, demand: 9,  holidayDates: ['Jul 7'] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 10, holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      ...genRange(12),
    },
    jiraStories: [
      { key: 'PROJ-1201', summary: 'Lambda function deployment',       epic: 'DevOps',            storyPoints: 4, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-1202', summary: 'Load testing framework',          epic: 'Platform Stability', storyPoints: 3, sprintId: 'sprint-b', status: 'To Do' },
      { key: 'PROJ-1203', summary: 'Update logging configuration',    epic: 'Platform Stability', storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  // ── Orion (Azure, Edge) ─────────────────────────────────────────────────
  {
    id: 's13', name: 'Mia Anderson', initials: 'MA', avatarColor: AVATAR_COLORS[12],
    role: 'Senior Developer', pod: 'Orion', platforms: ['Azure', 'Edge'], platform: 'Azure',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 6,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 4,  holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 5,  holidayDates: [] },
      ...genRange(13),
    },
    jiraStories: [
      { key: 'PROJ-1301', summary: 'Edge-to-cloud sync service',      epic: 'Edge Platform',     storyPoints: 3, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-1302', summary: 'Low-latency data processor',      epic: 'Edge Platform',     storyPoints: 1, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  {
    id: 's14', name: 'Noah Thomas', initials: 'NT', avatarColor: AVATAR_COLORS[13],
    role: 'Developer', pod: 'Orion', platforms: ['Edge', 'Azure'], platform: 'Edge',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 9,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      ...genRange(14),
    },
    jiraStories: [
      { key: 'PROJ-1401', summary: 'Edge node firmware update',       epic: 'Edge Platform',     storyPoints: 4, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-1402', summary: 'Telemetry ingestion service',     epic: 'Data Pipeline',     storyPoints: 3, sprintId: 'sprint-b', status: 'To Do' },
      { key: 'PROJ-1403', summary: 'Document edge schemas',           epic: 'Documentation',     storyPoints: 1, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  // ── Apex (Hybrid, On-Prem) ──────────────────────────────────────────────
  {
    id: 's15', name: 'Olivia White', initials: 'OW', avatarColor: AVATAR_COLORS[14],
    role: 'Lead Developer', pod: 'Apex', platforms: ['Hybrid', 'On-Prem'], platform: 'Hybrid',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 10, holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 0, demand: 11, holidayDates: [] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 10, holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 12, holidayDates: [] },
      ...genRange(15),
    },
    jiraStories: [
      { key: 'PROJ-1501', summary: 'Hybrid cloud routing layer',      epic: 'Hybrid Integration', storyPoints: 5, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-1502', summary: 'Sync protocol design',            epic: 'Hybrid Integration', storyPoints: 4, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-1503', summary: 'Data governance policy review',   epic: 'Documentation',      storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  {
    id: 's16', name: 'Paul Harris', initials: 'PH', avatarColor: AVATAR_COLORS[15],
    role: 'Developer', pod: 'Apex', platforms: ['On-Prem', 'Hybrid'], platform: 'On-Prem',
    sprintData: {
      'sprint-a': { capacity: 10, holidays: 0, demand: 5,  holidayDates: [] },
      'sprint-b': { capacity: 10, holidays: 2, demand: 6,  holidayDates: ['Jul 8', 'Jul 9'] },
      'sprint-c': { capacity: 10, holidays: 0, demand: 8,  holidayDates: [] },
      'sprint-d': { capacity: 10, holidays: 0, demand: 7,  holidayDates: [] },
      ...genRange(16),
    },
    jiraStories: [
      { key: 'PROJ-1601', summary: 'On-prem backup automation',       epic: 'Hybrid Integration', storyPoints: 3, sprintId: 'sprint-b', status: 'In Progress' },
      { key: 'PROJ-1602', summary: 'Disaster recovery runbook',       epic: 'Hybrid Integration', storyPoints: 2, sprintId: 'sprint-b', status: 'To Do' },
      { key: 'PROJ-1603', summary: 'Server capacity audit',           epic: 'Platform Stability', storyPoints: 1, sprintId: 'sprint-b', status: 'To Do' },
    ],
  },
  // ── Horizon (GCP, Azure, AWS) ───────────────────────────────────────────
  {
    id: 's17', name: 'Quinn Reed', initials: 'QR', avatarColor: AVATAR_COLORS[16],
    role: 'Senior Developer', pod: 'Horizon', platforms: ['GCP', 'Azure', 'AWS'], platform: 'GCP',
    sprintData: allSprints(17),
    jiraStories: [],
  },
  {
    id: 's18', name: 'Rachel Scott', initials: 'RS', avatarColor: AVATAR_COLORS[17],
    role: 'Developer', pod: 'Horizon', platforms: ['Azure', 'GCP', 'AWS'], platform: 'Azure',
    sprintData: allSprints(18),
    jiraStories: [],
  },
  {
    id: 's19', name: 'Sam Torres', initials: 'ST', avatarColor: AVATAR_COLORS[18],
    role: 'Developer', pod: 'Horizon', platforms: ['AWS', 'GCP', 'Azure'], platform: 'AWS',
    sprintData: allSprints(19),
    jiraStories: [],
  },
  // ── Zenith (Edge, Multi-Cloud) ──────────────────────────────────────────
  {
    id: 's20', name: 'Tara Mitchell', initials: 'TM', avatarColor: AVATAR_COLORS[19],
    role: 'Lead Developer', pod: 'Zenith', platforms: ['Edge', 'Multi-Cloud'], platform: 'Edge',
    sprintData: allSprints(20),
    jiraStories: [],
  },
  {
    id: 's21', name: 'Uma Patel', initials: 'UP', avatarColor: AVATAR_COLORS[20],
    role: 'Developer', pod: 'Zenith', platforms: ['Multi-Cloud', 'Edge'], platform: 'Multi-Cloud',
    sprintData: allSprints(21),
    jiraStories: [],
  },
  // ── Catalyst (On-Prem, Hybrid) ──────────────────────────────────────────
  {
    id: 's22', name: 'Victor Nguyen', initials: 'VN', avatarColor: AVATAR_COLORS[21],
    role: 'Developer', pod: 'Catalyst', platforms: ['On-Prem', 'Hybrid'], platform: 'On-Prem',
    sprintData: allSprints(22),
    jiraStories: [],
  },
  {
    id: 's23', name: 'Wendy Choi', initials: 'WC', avatarColor: AVATAR_COLORS[22],
    role: 'Senior Developer', pod: 'Catalyst', platforms: ['Hybrid', 'On-Prem'], platform: 'Hybrid',
    sprintData: allSprints(23),
    jiraStories: [],
  },
  {
    id: 's24', name: 'Xavier Banks', initials: 'XB', avatarColor: AVATAR_COLORS[23],
    role: 'Developer', pod: 'Catalyst', platforms: ['On-Prem'], platform: 'On-Prem',
    sprintData: allSprints(24),
    jiraStories: [],
  },
];

// ── Utility functions ──────────────────────────────────────────────────────

export function getEffectiveCapacity(member: StaffMember, sprintId: string): number {
  const d = member.sprintData[sprintId];
  if (!d) return 0;
  return d.capacity - d.holidays;
}

export function getNetAvailable(member: StaffMember, sprintId: string): number {
  return getEffectiveCapacity(member, sprintId) - (member.sprintData[sprintId]?.demand ?? 0);
}

export function getStatus(net: number): StatusType {
  if (net >= 2) return 'available';
  if (net >= 0) return 'tight';
  return 'over';
}

export function getPodAggregates(sprintId: string) {
  return PODS.map(pod => {
    const members = STAFF.filter(s => s.pod === pod);
    const effCap = members.reduce((sum, m) => sum + getEffectiveCapacity(m, sprintId), 0);
    const demand = members.reduce((sum, m) => sum + (m.sprintData[sprintId]?.demand ?? 0), 0);
    const net = effCap - demand;
    const utilPct = effCap > 0 ? Math.round((demand / effCap) * 100) : 0;
    return { pod, effCap, demand, net, utilPct };
  });
}

export function getSprintsInRange(from: string, to: string): Sprint[] {
  const fromIdx = SPRINTS.findIndex(s => s.id === from);
  const toIdx = SPRINTS.findIndex(s => s.id === to);
  if (fromIdx === -1 || toIdx === -1) return SPRINTS;
  const start = Math.min(fromIdx, toIdx);
  const end = Math.max(fromIdx, toIdx);
  return SPRINTS.slice(start, end + 1);
}

export function filterStaff(ctx: AppContext): StaffMember[] {
  return STAFF.filter(s => {
    if (ctx.pods.length > 0 && !ctx.pods.includes(s.pod)) return false;
    if (ctx.platform !== 'All' && !s.platforms.includes(ctx.platform)) return false;
    return true;
  });
}
