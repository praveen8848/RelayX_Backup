import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, triggerDuplicate } from '../api/endpoints';
import StatusBadge from '../components/ui/StatusBadge';
import EventDetailDrawer from '../components/events/EventDetailDrawer';
import { Search, Filter, Copy } from 'lucide-react';

export default function Events() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // Filter States
  const [status, setStatus] = useState('ALL');
  const [aggregateType, setAggregateType] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', status, aggregateType, page],
    queryFn: () => getEvents({ 
      status: status !== 'ALL' ? status : undefined, 
      aggregateType: aggregateType || undefined, 
      page, 
      size: 15 
    }),
    refetchInterval: 10000
  });

  const duplicateMutation = useMutation({
    mutationFn: (eventId: string) => triggerDuplicate(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    }
  });

  const handleDuplicate = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    duplicateMutation.mutate(eventId);
  };

  const clearFilters = () => {
    setStatus('ALL');
    setAggregateType('');
    setPage(0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-20 pb-20">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Event Explorer</h1>
        <p className="text-muted mt-1">Inspect the complete lifecycle of every event.</p>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center gap-2 text-muted">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <select 
          className="bg-surfaceHover border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending / Retrying</option>
          <option value="PUBLISHED">Published</option>
          <option value="DEAD">Dead Letter</option>
        </select>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
          <input 
            type="text" 
            placeholder="Aggregate Type (e.g. Order)" 
            className="bg-surfaceHover border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary w-64"
            value={aggregateType}
            onChange={(e) => setAggregateType(e.target.value)}
          />
        </div>

        <button onClick={clearFilters} className="text-sm text-muted hover:text-white transition-colors">
          Clear Filters
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-surfaceHover/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Event ID</th>
                <th className="px-6 py-4 font-semibold">Event Type</th>
                <th className="px-6 py-4 font-semibold">Aggregate</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted animate-pulse">Loading events...</td></tr>
              ) : isError ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-danger">Failed to load events.</td></tr>
              ) : data?.content?.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted">No events found.</td></tr>
              ) : (
                data?.content?.map((event: any) => (
                  <tr 
                    key={event.id} 
                    onClick={() => setSelectedEvent(event)}
                    className="hover:bg-surfaceHover/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-muted">
                      {event.eventId.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{event.eventType}</td>
                    <td className="px-6 py-4 text-muted font-mono text-xs">{event.aggregateType}-{event.aggregateId}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={event.status} retryCount={event.retryCount} />
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {event.status === 'PUBLISHED' && (
                        <button 
                          onClick={(e) => handleDuplicate(e, event.eventId)}
                          disabled={duplicateMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surfaceHover border border-border rounded-lg text-xs font-medium text-white hover:bg-gray-700 hover:border-gray-500 transition-colors disabled:opacity-50"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Drawer */}
      {selectedEvent && (
        <EventDetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}