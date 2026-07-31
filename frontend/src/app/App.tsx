import { useState } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './components/HomePage';
import { StaffAvailabilityPage } from './components/StaffAvailabilityPage';
import { CapacityPage } from './components/CapacityPage';
import { ReportsPage } from './components/ReportsPage';
import { ManageDataPage } from './components/ManageDataPage';
import type { Page, ManageTab, AppContext } from './components/mockData';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [manageTab, setManageTab] = useState<ManageTab>('jira');
  const [context, setContext] = useState<AppContext>({
    sprint: 'sprint-b',
    sprintRange: { from: 'sprint-a', to: 'sprint-j' },
    pods: [],
    platform: 'All',
  });

  function navigate(targetPage: Page, tabOrPod?: ManageTab | string) {
    setPage(targetPage);
    if (targetPage === 'manage-data' && tabOrPod) {
      setManageTab(tabOrPod as ManageTab);
    }
  }

  return (
    <Layout page={page} manageTab={manageTab} onNavigate={navigate}>
      {page === 'home' && (
        <HomePage
          context={context}
          onContextChange={setContext}
          onNavigate={navigate}
        />
      )}
      {page === 'staff-availability' && (
        <StaffAvailabilityPage
          context={context}
          onContextChange={setContext}
          onNavigate={navigate}
        />
      )}
      {page === 'capacity' && (
        <CapacityPage
          context={context}
          onContextChange={setContext}
          onNavigate={navigate}
        />
      )}
      {page === 'reports' && (
        <ReportsPage
          context={context}
          onContextChange={setContext}
        />
      )}
      {page === 'manage-data' && (
        <ManageDataPage
          activeTab={manageTab}
          onTabChange={setManageTab}
        />
      )}
    </Layout>
  );
}
