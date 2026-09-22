import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getProjects, publishTenantEvent } from '../../api/endpoints';
import { Send, CheckCircle2, AlertTriangle, Code, Eye } from 'lucide-react';

export default function TenantEventForm() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Form State with Defaults
  const [apiKey, setApiKey] = useState('');
  const [aggregateType, setAggregateType] = useState('Order');
  const [aggregateId, setAggregateId] = useState(Math.floor(Math.random() * 10000).toString());
  const [eventType, setEventType] = useState('OrderCreated');
  const [topic, setTopic] = useState('order-events');
  const [payload, setPayload] = useState('{\n  "orderId": 42,\n  "amount": 100.00\n}');

  // Fetch projects to populate the API Key dropdown
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const publishMut = useMutation({
    mutationFn: (data: any) => publishTenantEvent(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['outboxStats'] });
      setFeedback({ type: 'success', msg: `Event accepted · ID: ${res.eventId || 'Unknown'}` });
      // Generate a new random ID for the next test
      setAggregateId(Math.floor(Math.random() * 10000).toString());
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', msg: err?.response?.data?.message || err.message || 'Failed to publish event' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!apiKey) {
      setFeedback({ type: 'error', msg: 'Please select a Project API Key.' });
      return;
    }

    // Validate JSON payload
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Invalid JSON payload. Please check your syntax.' });
      return;
    }

    // Set the API key in localStorage temporarily so our axios interceptor picks it up
    localStorage.setItem("relayx_active_project_key", apiKey);

    publishMut.mutate({
      aggregateType,
      aggregateId,
      eventType,
      topic,
      payload: JSON.stringify(parsedPayload)
    });
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border bg-surfaceHover/20 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Publish Manual Event
          </h2>
          <p className="text-sm text-muted mt-1">Construct and inject a custom event into the pipeline.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {feedback && (
          <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            {feedback.msg}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* API Key Selection */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-semibold text-white">Project / API Key</label>
            <select 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-surfaceHover border border-border rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
            >
              <option value="">-- Select a Project to act as Tenant --</option>
              {projectsLoading ? (
                <option value="" disabled>Loading projects...</option>
              ) : (
                projects?.map((p: any) => (
                  <option key={p.id} value={p.apiKey}>
                    {p.name} ({p.apiKey.substring(0, 15)}...)
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-muted">Example: Select a project to authenticate the request (Authorization: Bearer &lt;apiKey&gt;).</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-white">Aggregate Type</label>
            <input type="text" value={aggregateType} onChange={e => setAggregateType(e.target.value)} required className="w-full bg-surfaceHover border border-border rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none" />
            <p className="text-xs text-muted">Example: <code>Order</code>, <code>Payment</code>, <code>Inventory</code></p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-white">Aggregate ID</label>
            <input type="text" value={aggregateId} onChange={e => setAggregateId(e.target.value)} required className="w-full bg-surfaceHover border border-border rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none" />
            <p className="text-xs text-muted">Example: <code>1024</code>, <code>ORD-555</code></p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-white">Event Type</label>
            <input type="text" value={eventType} onChange={e => setEventType(e.target.value)} required className="w-full bg-surfaceHover border border-border rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none" />
            <p className="text-xs text-muted">Example: <code>OrderCreated</code>, <code>PaymentFailed</code></p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-white">Topic</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required className="w-full bg-surfaceHover border border-border rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none" />
            <p className="text-xs text-muted">Example: <code>order-events</code>, <code>notifications</code></p>
          </div>

          {/* JSON Payload */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-semibold text-white">JSON Payload</label>
            <textarea 
              value={payload} 
              onChange={e => setPayload(e.target.value)} 
              required 
              rows={4}
              className="w-full bg-surfaceHover border border-border rounded-lg px-4 py-3 text-sm text-green-400 font-mono focus:border-primary focus:outline-none resize-none" 
            />
            <p className="text-xs text-muted">Example: <code>{`{"customerId": "cust-102", "amount": 499.99}`}</code> (Must be valid JSON)</p>
          </div>
        </div>

        {/* Action Bar & Explanation */}
        <div className="pt-6 border-t border-border flex flex-col-reverse md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-sm text-muted bg-surfaceHover/40 p-3 rounded-lg flex-1">
             <Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" />
             <div>
               <strong className="text-white">What happens next?</strong> 
               <p className="mt-0.5">The backend saves this payload into the Outbox table. The Relay Worker instantly discovers it and publishes it to Kafka.</p>
               <p className="mt-1">
                 <Link to="/events" className="text-primary hover:text-blue-400 font-medium hover:underline transition-colors">See it in the Event Explorer</Link> or check the <Link to="/dashboard" className="text-primary hover:text-blue-400 font-medium hover:underline transition-colors">Dashboard metrics</Link>.
               </p>
             </div>
          </div>

          <button 
            type="submit" 
            disabled={publishMut.isPending || projectsLoading}
            className="px-6 py-3 md:py-2.5 h-fit bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {publishMut.isPending ? 'Publishing...' : <><Send className="w-4 h-4" /> Publish Event</>}
          </button>
        </div>
      </form>
    </div>
  );
}