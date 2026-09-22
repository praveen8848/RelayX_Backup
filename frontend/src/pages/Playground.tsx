import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  seedDemoData, 
  simulateKafkaDown, 
  recoverKafka, 
  getKafkaSimulationStatus, 
  simulateDbRollback, 
  generateBulkEvents, 
  createOrder 
} from '../api/endpoints';
import { PlayCircle, Database, Server, Zap, AlertTriangle, CheckCircle2, ArrowRight, Eye, Info, Code, ChevronDown, ChevronUp } from 'lucide-react';
import TenantEventForm from '../components/events/TenantEventForm';

export default function Playground() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [bulkCount, setBulkCount] = useState(100);
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  const wrapMutation = (mutationFn: any, onSuccessMsg?: string) => {
    return useMutation({
      mutationFn,
      onSuccess: (data: any) => {
        queryClient.invalidateQueries();
        showFeedback('success', data?.message || onSuccessMsg || 'Action completed successfully');
      },
      onError: (err: any) => {
        showFeedback('error', err?.response?.data?.message || err.message || 'Action failed');
      }
    });
  };

  // 1. Poller for Kafka Status
  const { data: kafkaStatus } = useQuery({
    queryKey: ['kafkaStatus'],
    queryFn: getKafkaSimulationStatus,
    refetchInterval: 3000,
  });

  const isKafkaDown = kafkaStatus?.kafkaDown === true;

  // 2. Mutations
  const seedMut = wrapMutation(seedDemoData);
  const kafkaDownMut = wrapMutation(simulateKafkaDown, "Kafka simulated offline. Next publish will fail.");
  const kafkaUpMut = wrapMutation(recoverKafka, "Kafka connection restored.");
  const rollbackMut = wrapMutation(simulateDbRollback);
  const bulkMut = wrapMutation(() => generateBulkEvents(bulkCount));
  const orderMut = wrapMutation(() => createOrder({ customerId: `demo-${Math.floor(Math.random() * 1000)}`, amount: 100.00 }), "Order and Outbox event created transactionally.");

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <PlayCircle className="w-8 h-8 text-purple-400" />
          Interactive Scenarios
        </h1>
        <p className="text-muted mt-2">Trigger specific backend behaviors and watch how the RelayX infrastructure responds in real-time.</p>
      </header>

      {feedback && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${feedback.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {feedback.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* Scenario 1: Bulk Traffic */}
        <ScenarioCard 
          title="Scenario 1: The Traffic Spike" 
          icon={Activity} 
          iconColor="text-primary"
          description="Simulate a sudden burst of database transactions to observe how the Relay Worker drains the Outbox Queue concurrently."
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex gap-2">
                <input type="number" min="1" max="1000" value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} className="w-24 bg-surfaceHover border border-border rounded px-3 text-sm text-white focus:border-primary focus:outline-none" />
                <button onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending} className="flex-1 py-2.5 bg-primary hover:bg-blue-600 text-white rounded font-medium transition disabled:opacity-50">
                  {bulkMut.isPending ? 'Generating...' : `Generate ${bulkCount} Events`}
                </button>
              </div>
              <p className="text-xs text-muted">Backend loop creates events in a single transaction batch.</p>
            </div>
            <div className="flex-1 bg-surfaceHover/50 border border-border rounded-lg p-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2"><Eye className="w-4 h-4"/> See the Effect</h4>
              <p className="text-xs text-muted mb-4">Jump to the Dashboard immediately after clicking. Watch the "Pending" count jump up, and observe the Relay Worker icon spin as it drains the queue.</p>
              <Link to="/dashboard" className="text-sm text-primary hover:text-blue-400 font-medium flex items-center gap-1 transition-colors">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </ScenarioCard>

        {/* Scenario 2: Kafka Outage (UPDATED UI) */}
        <ScenarioCard 
          title="Scenario 2: Broker Outage & Recovery" 
          icon={Server} 
          iconColor="text-warning"
          description="Test the core value of RelayX. We will break the connection to Kafka, create an order, and watch the event get safely stored and retried."
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              
              {/* Dynamic Status Badge */}
              <div className="flex items-center justify-between bg-surface p-3 rounded-lg border border-border">
                <span className="text-sm font-medium text-white">Kafka Connection Status:</span>
                {isKafkaDown ? (
                  <span className="px-2.5 py-1 bg-danger/10 text-danger border border-danger/20 rounded-full text-xs font-bold animate-pulse">
                    DOWN (Simulated)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-success/10 text-success border border-success/20 rounded-full text-xs font-bold">
                    CONNECTED
                  </span>
                )}
              </div>

              {/* Dynamic Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => kafkaDownMut.mutate()} 
                  disabled={isKafkaDown || kafkaDownMut.isPending} 
                  className="flex-1 py-2.5 bg-surfaceHover border border-warning/30 hover:bg-warning/10 text-white rounded font-medium transition disabled:opacity-50 text-sm"
                >
                  {kafkaDownMut.isPending ? 'Disconnecting...' : 'Break Connection'}
                </button>
                <button 
                  onClick={() => kafkaUpMut.mutate()} 
                  disabled={!isKafkaDown || kafkaUpMut.isPending} 
                  className="flex-1 py-2.5 bg-surfaceHover border border-success/30 hover:bg-success/10 text-white rounded font-medium transition disabled:opacity-50 text-sm"
                >
                  {kafkaUpMut.isPending ? 'Recovering...' : 'Recover Kafka'}
                </button>
              </div>
              
              <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-sm text-primary mb-2 mt-4 font-medium">
                Step 2: Create a dual-write transaction
              </div>
              <button onClick={() => orderMut.mutate()} disabled={orderMut.isPending} className="w-full py-2.5 bg-surfaceHover border border-border hover:bg-gray-700 text-white rounded font-medium transition disabled:opacity-50 text-sm">
                {orderMut.isPending ? 'Creating...' : 'Create Single Order'}
              </button>
            </div>
            <div className="flex-1 bg-surfaceHover/50 border border-border rounded-lg p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2"><Eye className="w-4 h-4"/> See the Effect</h4>
                <p className="text-xs text-muted mb-4">Because Kafka is down, the event fails to publish. However, RelayX trapped it safely in the Outbox. Go to the Retry Queue to watch Exponential Backoff in action.</p>
              </div>
              <div className="space-y-2 mt-4">
                <Link to="/retries" className="text-sm text-warning hover:text-yellow-400 font-medium flex items-center gap-1 transition-colors">
                  View Retry Queue <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/events" className="text-sm text-primary hover:text-blue-400 font-medium flex items-center gap-1 transition-colors">
                  Verify Event is "PENDING" <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </ScenarioCard>

        {/* Scenario 3: Database Rollback */}
        <ScenarioCard 
          title="Scenario 3: Atomic Transaction Rollback" 
          icon={Database} 
          iconColor="text-danger"
          description="Demonstrates the 'Atomic' part of the Outbox Pattern. If the database crashes mid-transaction, no 'ghost events' should leak to Kafka."
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <button onClick={() => rollbackMut.mutate()} disabled={rollbackMut.isPending} className="w-full py-2.5 bg-surfaceHover border border-danger/30 hover:bg-danger/10 text-white rounded font-medium transition disabled:opacity-50 text-sm">
                {rollbackMut.isPending ? 'Rolling back...' : 'Simulate DB Error Mid-Transaction'}
              </button>
              <div className="flex items-start gap-2 text-xs text-muted bg-surface p-3 rounded border border-border">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>The backend will attempt to save an Order, but intentionally throw a RuntimeException before committing the Outbox event.</p>
              </div>
            </div>
            <div className="flex-1 bg-surfaceHover/50 border border-border rounded-lg p-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2"><Eye className="w-4 h-4"/> See the Effect</h4>
              <p className="text-xs text-muted mb-4">Navigate to the Event Explorer. Because Spring's <code>@Transactional</code> rolled back the operation, you will <strong>not</strong> see a new event. Data consistency is maintained.</p>
              <Link to="/events" className="text-sm text-primary hover:text-blue-400 font-medium flex items-center gap-1 transition-colors">
                Check Event Explorer <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </ScenarioCard>

        {/* Environment Prep */}
        <ScenarioCard 
          title="Environment Prep" 
          icon={Zap} 
          iconColor="text-purple-400"
          description="Fill your local environment with a variety of test data to make the charts and tables look interesting."
        >
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
              <button onClick={() => seedMut.mutate()} disabled={seedMut.isPending} className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded font-medium transition disabled:opacity-50">
                {seedMut.isPending ? 'Seeding...' : 'Seed Mixed Demo Data'}
              </button>
            </div>
            <div className="flex-1 w-full flex items-center justify-between text-sm">
              <Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link>
              <span className="text-border">•</span>
              <Link to="/events" className="text-primary hover:underline">Events</Link>
              <span className="text-border">•</span>
              <Link to="/dlq" className="text-danger hover:underline">DLQ</Link>
            </div>
          </div>
        </ScenarioCard>
      </div>

      {/* Expandable Manual Event Form */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mt-8">
        <button 
          onClick={() => setIsFormExpanded(!isFormExpanded)}
          className="w-full flex items-center justify-between p-6 bg-surfaceHover/30 hover:bg-surfaceHover/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <Code className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-white">Advanced: Publish Manual Event</h2>
              <p className="text-sm text-muted mt-0.5">Construct and inject a custom JSON event directly into the pipeline as a specific tenant.</p>
            </div>
          </div>
          <div className="p-2 bg-surface rounded-lg border border-border">
            {isFormExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
          </div>
        </button>

        {isFormExpanded && (
          <div className="border-t border-border animate-in slide-in-from-top-2 duration-300">
            <div className="px-6 py-4 bg-primary/5 border-b border-primary/10 flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white mb-1">What happens when you publish?</h3>
                <ul className="text-sm text-muted list-disc list-inside space-y-1">
                  <li>Your payload is authenticated using the selected Project's API Key.</li>
                  <li>The backend directly inserts the event into the Outbox table (bypassing business layers like Order creation).</li>
                  <li>The Relay Worker immediately picks it up and publishes it to Kafka.</li>
                </ul>
              </div>
            </div>
            {/* The existing form component handles the rest! */}
            <TenantEventForm />
          </div>
        )}
      </div>

    </div>
  );
}

// Custom internal component for layout consistency
function ScenarioCard({ title, icon: Icon, iconColor, description, children }: any) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border bg-surfaceHover/20">
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// Quick helper icon for the Activity metric
function Activity(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}