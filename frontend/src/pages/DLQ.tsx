import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDLQEvents, retryDLQEvent, discardDLQEvent } from '../api/endpoints';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { ShieldAlert, RefreshCcw, Trash2 } from 'lucide-react';

export default function DLQ() {
  const queryClient = useQueryClient();
  const [dialogState, setDialogState] = useState<{ isOpen: boolean, type: 'RETRY' | 'DISCARD' | null, event: any }>({ isOpen: false, type: null, event: null });

  const { data: dlqEvents, isLoading } = useQuery({
    queryKey: ['dlqEvents'],
    queryFn: getDLQEvents,
    refetchInterval: 15000,
  });

  const retryMutation = useMutation({
    mutationFn: (id: number) => retryDLQEvent(id), // Uses numeric DB ID exactly as requested
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dlqEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      setDialogState({ isOpen: false, type: null, event: null });
    }
  });

  const discardMutation = useMutation({
    mutationFn: (id: number) => discardDLQEvent(id), // Uses numeric DB ID
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dlqEvents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      setDialogState({ isOpen: false, type: null, event: null });
    }
  });

  const handleConfirm = () => {
    if (dialogState.type === 'RETRY') retryMutation.mutate(dialogState.event.id);
    if (dialogState.type === 'DISCARD') discardMutation.mutate(dialogState.event.id);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-20 pb-20">
          <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#3B82F6]" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              RelayX Queue... 
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Dead Letter Queue
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
           Events that exceeded their retry limit and require attention.
          </p>
        </div>
   
      </header>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-surfaceHover/50 border-b border-border">
              <tr>
                <th className="px-6 py-4">Event ID</th>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">Aggregate</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted animate-pulse">Loading DLQ...</td></tr>
              ) : dlqEvents?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-success/10 rounded-full text-success"><ShieldAlert className="w-8 h-8" /></div>
                      <p className="text-white font-medium">No failed events</p>
                      <p className="text-muted text-sm">All events are currently being delivered successfully.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                dlqEvents?.map((event: any) => (
                  <tr key={event.id} className="hover:bg-surfaceHover/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted">{event.eventId.substring(0, 12)}...</td>
                    <td className="px-6 py-4 font-medium text-white">{event.eventType}</td>
                    <td className="px-6 py-4 text-muted font-mono text-xs">{event.aggregateType}-{event.aggregateId}</td>
                    <td className="px-6 py-4"><StatusBadge status={event.status} retryCount={event.retryCount} /></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => setDialogState({ isOpen: true, type: 'RETRY', event })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surfaceHover border border-border rounded-lg text-xs font-medium text-white hover:bg-gray-700 hover:border-gray-500 transition-colors"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" /> Retry
                      </button>
                      <button 
                        onClick={() => setDialogState({ isOpen: true, type: 'DISCARD', event })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 border border-danger/20 rounded-lg text-xs font-medium text-danger hover:bg-danger hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Discard
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={dialogState.isOpen}
        title={dialogState.type === 'RETRY' ? "Retry this event?" : "Discard this event?"}
        description={dialogState.type === 'RETRY' 
          ? "This event will be returned to the delivery pipeline, reset to PENDING, and processed again." 
          : "Are you sure? This event will be permanently deleted and cannot be recovered."}
        confirmLabel={dialogState.type === 'RETRY' ? (retryMutation.isPending ? 'Retrying...' : 'Retry Event') : (discardMutation.isPending ? 'Discarding...' : 'Discard Event')}
        isDestructive={dialogState.type === 'DISCARD'}
        onConfirm={handleConfirm}
        onCancel={() => setDialogState({ isOpen: false, type: null, event: null })}
      />
    </div>
  );
}