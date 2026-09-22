import { useQuery } from '@tanstack/react-query';
import { getEvents } from '../api/endpoints';
import { RefreshCcw, Info } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';

export default function Retries() {
  const { data, isLoading } = useQuery({
    queryKey: ['events', 'PENDING'],
    queryFn: () => getEvents({ status: 'PENDING' }),
    refetchInterval: 5000,
  });

  // Filter only pending events that have actually failed at least once
  // Check multiple common backend naming conventions for retries
  const retryingEvents = data?.content?.filter((e: any) => {
    const attempts = e.retryCount || e.retries || e.retryAttempts || e.attempt || 0;
    return attempts > 0;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-20 pb-20">
      <header className="border-b border-border pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <RefreshCcw className="w-8 h-8 text-warning" />
            Retry Queue
          </h1>
          <p className="text-muted mt-2">Events currently scheduled for retry using exponential backoff.</p>
        </div>
      </header>

      {/* Visual Explanation of Backoff */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">How Exponential Backoff Works</h3>
            <p className="text-sm text-muted">Retries are delayed exponentially to avoid overwhelming failing downstream systems.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <BackoffStep attempt={1} time="1s" />
          <div className="flex-1 h-px bg-primary/20"></div>
          <BackoffStep attempt={2} time="2s" />
          <div className="flex-1 h-px bg-primary/20"></div>
          <BackoffStep attempt={3} time="4s" />
          <div className="flex-1 h-px bg-primary/20"></div>
          <BackoffStep attempt={4} time="8s" />
          <div className="flex-1 h-px bg-primary/20"></div>
          <BackoffStep attempt={5} time="16s" isLast />
        </div>
      </div>

      {/* Active Retries Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-surfaceHover/50 border-b border-border">
              <tr>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Current Attempt</th>
                <th className="px-6 py-4">Last Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted animate-pulse">Loading active retries...</td></tr>
              ) : retryingEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                     <p className="text-white font-medium">No pending retries</p>
                     <p className="text-muted text-sm mt-1">The delivery pipeline is operating normally.</p>
                  </td>
                </tr>
              ) : (
                retryingEvents.map((event: any) => (
                  <tr key={event.id} className="hover:bg-surfaceHover/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{event.eventType}</p>
                      <p className="text-xs font-mono text-muted">{event.eventId.substring(0, 12)}</p>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={event.status} retryCount={event.retryCount} /></td>
                    <td className="px-6 py-4 text-white">Attempt {event.retryCount} of 5</td>
                    <td className="px-6 py-4 text-danger text-xs font-mono bg-danger/5 rounded p-2">
                      {event.lastError || 'Connection refused'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BackoffStep({ attempt, time, isLast }: { attempt: number, time: string, isLast?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`px-2 py-1 rounded ${isLast ? 'bg-danger/20 text-danger' : 'bg-surfaceHover text-muted'}`}>
        Attempt {attempt}
      </div>
      <span className="text-primary font-bold">{time}</span>
      {isLast && <span className="text-[10px] text-danger mt-1">DEAD LETTER</span>}
    </div>
  );
}