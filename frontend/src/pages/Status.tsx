import { useDashboardData } from '../hooks/useDashboardData';
import { Server, Database, RefreshCcw, Archive, Activity, CheckCircle2, XCircle } from 'lucide-react';

export default function Status() {
  const { health, relayStatus, outboxStats } = useDashboardData();

  const isDbUp = health.data?.components?.db?.status === "UP" || health.data?.status === "UP";
  const isKafkaUp = health.data?.components?.kafka?.status === "UP" || health.data?.status === "UP";
  const isRelayActive = relayStatus.data?.secondsSinceLastPoll < 15;
  const pendingCount = outboxStats.data?.pending || 0;
  
  const overallUp = isDbUp && isKafkaUp && isRelayActive;

  return (
    <div className="max-w-7xl mx-auto space-y-20 pb-20">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">System Status</h1>
        <p className="text-muted mt-2">Real-time health of the event delivery infrastructure.</p>
      </header>

      {/* Main Status Header */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        overallUp ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20'
      }`}>
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${overallUp ? 'text-success' : 'text-danger'}`}>
            {overallUp ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            {overallUp ? 'All Systems Operational' : 'System Degradation Detected'}
          </h2>
          <p className="text-sm text-muted mt-1">Data is auto-refreshing every 5-15 seconds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatusCard 
          icon={Database} 
          title="PostgreSQL" 
          isUp={isDbUp} 
          metrics={[{ label: "Status", value: isDbUp ? "Operational" : "Disconnected" }]} 
        />
        
        <StatusCard 
          icon={Server} 
          title="Kafka Broker" 
          isUp={isKafkaUp} 
          metrics={[{ label: "Status", value: isKafkaUp ? "Connected" : "Disconnected" }]} 
        />
        
        <StatusCard 
          icon={RefreshCcw} 
          title="Relay Workers" 
          isUp={isRelayActive} 
          metrics={[
            { label: "Status", value: isRelayActive ? "Active" : "Inactive" },
            { label: "Last Poll", value: relayStatus.data?.secondsSinceLastPoll !== undefined ? `${relayStatus.data.secondsSinceLastPoll}s ago` : 'Unknown' }
          ]} 
        />
        
        <StatusCard 
          icon={Archive} 
          title="Outbox Queue" 
          isUp={true} // Queue itself is just a table, state depends on pending count
          metrics={[
            { label: "Pending Events", value: pendingCount.toString() },
            { label: "Processing Batch Size", value: relayStatus.data?.batchSize?.toString() || '10' }
          ]} 
        />
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, title, isUp, metrics }: any) {
  return (
    <div className="p-5 bg-surface border border-border rounded-xl">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surfaceHover rounded-lg text-muted">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
          isUp ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger animate-pulse'
        }`}>
          {isUp ? 'UP' : 'DOWN'}
        </div>
      </div>
      
      <div className="space-y-3">
        {metrics.map((m: any, idx: number) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="text-muted">{m.label}</span>
            <span className="text-white font-medium">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}