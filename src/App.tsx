
import { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { Shell } from './components/layout/Shell';
import { ExecutiveSummaryDashboard } from './features/dashboard/ExecutiveSummaryDashboard';
import { OpportunitiesDashboard } from './features/dashboard/OpportunitiesDashboard';
import { OpportunityManagementPage } from './features/opportunities/OpportunityManagementPage';
import { ActivitiesDashboard } from './features/dashboard/ActivitiesDashboard';
import { QuotesDashboard } from './features/dashboard/QuotesDashboard';
import { OrdersDashboard } from './features/dashboard/OrdersDashboard';
import { ContractsDashboard } from './features/dashboard/ContractsDashboard';
import { ExecutiveDashboardPageV2 } from './features/dashboard/ExecutiveDashboardPageV2';
import { PerformanceCockpit } from './features/dashboard/PerformanceCockpit';
import { PersonScorecardPage } from './features/scorecard/PersonScorecardPage';
import { RunaAIBot } from './components/RunaAIBot';

import { OpportunityForm } from './features/dashboard/OpportunityForm';

function App() {
  // Store key instead of translated label to persist view across language changes
  const [activeView, setActiveView] = useState('executivev2');

  const renderContent = () => {
    switch (activeView) {
      case 'executive': return <ExecutiveSummaryDashboard />;
      case 'executivev2': return <ExecutiveDashboardPageV2 />;
      case 'performance': return <PerformanceCockpit />;
      case 'opportunities': return <OpportunitiesDashboard />;
      case 'management': return <OpportunityManagementPage onAddOpportunity={() => setActiveView('opportunity-new')} />;
      case 'opportunity-new': return <OpportunityForm onClose={() => setActiveView('management')} />;
      case 'activities': return <ActivitiesDashboard />;
      case 'quotes': return <QuotesDashboard />;
      case 'orders': return <OrdersDashboard />;
      case 'contracts': return <ContractsDashboard />;
      case 'scorecard': return <PersonScorecardPage />;
      default: return <ExecutiveDashboardPageV2 />;
    }
  };

  return (
    <DataProvider>
      <Shell activeView={activeView} onViewChange={setActiveView}>
        {renderContent()}
      </Shell>
      <RunaAIBot />
    </DataProvider>
  );
}

export default App;
