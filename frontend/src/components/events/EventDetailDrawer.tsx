import { X, Clock, Database, Server, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getOrderDetails } from '../../api/endpoints';
import StatusBadge from '../ui/StatusBadge';

export default function EventDetailDrawer({ event, onClose }: { event: any, onClose: () => void }) {
  // Only fetch order details if the aggregate type is 'Order'
  const { data: orderDetail, isLoading } = useQuery({
    queryKey: ['order', event?.aggregateId],
    queryFn: () => getOrderDetails(event.aggregateId),
    enabled: !!event && event.aggregateType === 'Order',
  });

  if (!event) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-surface border-l border-border shadow-2xl z-50 overflow-y-auto flex flex-col transform transition-transform">
        <header className="flex items-center justify-between p-6 border-b border-border bg-surfaceHover/50">
          <div>
            <h2 className="text-lg font-bold text-white">Event Details</h2>
            <p className="text-sm font-mono text-muted mt-1">{event.eventId}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-white rounded-lg hover:bg-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-8 flex-1">
          {/* Status Section */}
          <section className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-muted uppercase mb-1">Status</span>
              <StatusBadge status={event.status} retryCount={event.retryCount} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-muted uppercase mb-1">Event Type</span>
              <span className="font-medium text-white">{event.eventType}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-muted uppercase mb-1">Aggregate</span>
              <span className="font-mono text-sm text-white">{event.aggregateType}-{event.aggregateId}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-muted uppercase mb-1">Retries</span>
              <span className="font-medium text-white">{event.retryCount} / 5</span>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-border pb-2">Delivery Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Database className="w-3 h-3" /></div>
                  <div className="w-0.5 h-6 bg-border my-1"></div>
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-medium text-white">Event Created in Outbox</p>
                  <p className="text-xs text-muted">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {(event.status === 'PUBLISHED' || event.retryCount > 0) && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Server className="w-3 h-3" /></div>
                    {event.status === 'PUBLISHED' && <div className="w-0.5 h-6 bg-border my-1"></div>}
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-medium text-white">Relay Picked Up Event</p>
                  </div>
                </div>
              )}

              {event.status === 'PUBLISHED' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-success"><CheckCircle2 className="w-3 h-3" /></div>
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-medium text-white">Successfully Published</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Business Context (E7 Integration) */}
          {event.aggregateType === 'Order' && (
            <section>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-border pb-2">Business Context (Order API)</h3>
              {isLoading ? (
                <p className="text-sm text-muted animate-pulse">Loading order details...</p>
              ) : orderDetail ? (
                <div className="bg-surfaceHover p-4 rounded-lg border border-border font-mono text-xs text-green-400 overflow-x-auto">
                  <pre>{JSON.stringify(orderDetail, null, 2)}</pre>
                </div>
              ) : (
                <p className="text-sm text-muted">Failed to load order details.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}