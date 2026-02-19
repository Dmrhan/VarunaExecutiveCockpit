
import { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { Shell } from './components/layout/Shell';
import { ExecutiveSummaryDashboard } from './features/dashboard/ExecutiveSummaryDashboard';
import { OpportunitiesDashboard } from './features/dashboard/OpportunitiesDashboard';
import { ActivitiesDashboard } from './features/dashboard/ActivitiesDashboard';
import { QuotesDashboard } from './features/dashboard/QuotesDashboard';
import { OrdersDashboard } from './features/dashboard/OrdersDashboard';
import { ContractsDashboard } from './features/dashboard/ContractsDashboard';
import { RunaAIBot } from './components/RunaAIBot';

import { OpportunityForm } from './features/dashboard/OpportunityForm';

function App() {
  // Store key instead of translated label to persist view across language changes
  const [activeView, setActiveView] = useState('executive');

  const renderContent = () => {
    switch (activeView) {
      case 'executive': return <ExecutiveSummaryDashboard />;
      case 'opportunities': return <OpportunitiesDashboard onAddOpportunity={() => setActiveView('opportunity-new')} />;
      case 'opportunity-new': return <OpportunityForm onClose={() => setActiveView('opportunities')} />;
      case 'activities': return <ActivitiesDashboard />;
      case 'quotes': return <QuotesDashboard />;
      case 'orders': return <OrdersDashboard />;
      case 'contracts': return <ContractsDashboard />;
      default: return <ExecutiveSummaryDashboard />;
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
