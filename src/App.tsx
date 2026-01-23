
import { DataProvider } from './context/DataContext';
import { Shell } from './components/layout/Shell';
import { InsightPanel } from './features/dashboard/InsightPanel';
import { ConfidenceWidget } from './features/dashboard/ConfidenceWidget';
import { FunnelChart } from './features/dashboard/FunnelChart';
import { ProductPerformance } from './features/dashboard/ProductPerformance';
import { VelocityMeter } from './features/dashboard/VelocityMeter';
import { Leaderboard } from './features/dashboard/Leaderboard';

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

        {/* Row 2 of Grid */}
        <div className="col-span-1 lg:col-span-2 h-full">
          <VelocityMeter />
        </div>
        <div className="col-span-1 lg:col-span-2 h-full">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <Shell>
        <Dashboard />
      </Shell>
    </DataProvider>
  );
}

export default App;
