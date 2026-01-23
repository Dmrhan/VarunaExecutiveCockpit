
import { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { Shell } from './components/layout/Shell';
import { InsightPanel } from './features/dashboard/InsightPanel';
import { ConfidenceWidget } from './features/dashboard/ConfidenceWidget';
import { FunnelChart } from './features/dashboard/FunnelChart';
import { ProductPerformance } from './features/dashboard/ProductPerformance';
import { VelocityMeter } from './features/dashboard/VelocityMeter';
import { Leaderboard } from './features/dashboard/Leaderboard';
import { OpportunityDashboard } from './features/dashboard/OpportunityDashboard';
import { MarketIntelligence } from './features/dashboard/MarketIntelligence';

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Top Row: AI Narrative */}
      <div className="grid grid-cols-1">
        <InsightPanel />
      </div>

      {/* Product Strip */}
      <div className="grid grid-cols-1">
        <ProductPerformance />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

        {/* Row 1 of Grid */}
        <div className="col-span-1 lg:col-span-1 h-full">
          <ConfidenceWidget />
        </div>
        <div className="col-span-1 lg:col-span-3 h-full">
          <FunnelChart />
        </div>

        {/* Row 2 of Grid: Now split into Velocity, Leaderboard and Market Intelligence */}
        <div className="col-span-1 lg:col-span-1 h-full">
          <VelocityMeter />
        </div>
        <div className="col-span-1 lg:col-span-1 h-full">
          <Leaderboard />
        </div>
        <div className="col-span-1 lg:col-span-2 h-full">
          <MarketIntelligence />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeView, setActiveView] = useState('Cockpit');

  return (
    <DataProvider>
      <Shell activeView={activeView} onViewChange={setActiveView}>
        {activeView === 'Cockpit' ? <Dashboard /> : <OpportunityDashboard />}
      </Shell>
    </DataProvider>
  );
}

export default App;
