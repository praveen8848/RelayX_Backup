import { useDashboardData } from '../hooks/useDashboardData';
import PipelineVisualization from '../components/dashboard/PipelineVisualization';
import MetricCard from '../components/ui/MetricCard';
import StatusBadge from '../components/ui/StatusBadge';

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock3,
  Database,
  Radio,
  ShieldAlert,
  Zap,
  RefreshCcw
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

export default function Dashboard() {
  const {
    metrics,
    relayStatus,
    outboxStats,
    health,
    recentEvents,
  } = useDashboardData();

  const isError = metrics.isError || health.isError;

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-danger/30 bg-danger/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Dashboard unavailable
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-muted">
                RelayX could not retrieve the monitoring data.
                Check that the Spring Boot backend is running and
                accessible.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const data = metrics.data || {
    totalToday: 0,
    publishedToday: 0,
    retrying: 0,
    dead: 0,
  };

  const overallHealth = health.data?.status === 'UP';

  const events = recentEvents.data?.content ?? [];

  const latestEvent = events[0];

  const chartData = [
    {
      name: 'Published',
      value: data.publishedToday,
      color: '#10B981',
    },
    {
      name: 'Retrying',
      value: data.retrying,
      color: '#F59E0B',
    },
    {
      name: 'Dead Letter',
      value: data.dead,
      color: '#EF4444',
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-20 pb-20">
      {/* =====================================================
          HEADER
          ===================================================== */}
      <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#3B82F6]" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              RelayX Control Plane
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            Event Delivery Overview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Watch events move through persistence, the outbox,
            relay processing, Kafka and downstream consumption.
          </p>
        </div>

        {/* System health */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              overallHealth
                ? 'bg-success/10'
                : 'bg-danger/10'
            }`}
          >
            <Activity
              className={`h-4 w-4 ${
                overallHealth
                  ? 'text-success'
                  : 'text-danger'
              }`}
            />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">
              System
            </p>

            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  overallHealth
                    ? 'bg-success shadow-[0_0_8px_#10B981]'
                    : 'bg-danger shadow-[0_0_8px_#EF4444] animate-pulse'
                }`}
              />

              <span
                className={`text-xs font-bold ${
                  overallHealth
                    ? 'text-success'
                    : 'text-danger'
                }`}
              >
                {overallHealth ? 'HEALTHY' : 'DOWN'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          LIVE PIPELINE
          ===================================================== */}
      <PipelineVisualization
        health={health.data}
        outbox={outboxStats.data}
        relay={relayStatus.data}
        events={events}
      />

      {/* =====================================================
          METRICS
          ===================================================== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Delivery Metrics
            </h2>

            <p className="mt-1 text-xs text-muted">
              Current activity reported by RelayX
            </p>
          </div>

          {latestEvent && (
            <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
              <Radio className="h-3.5 w-3.5 text-primary" />
              Latest event:
              <span className="font-mono text-white">
                #{latestEvent.id}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Processed (24h)"
            value={data.totalToday}
            icon={Activity}
            colorClass="text-primary"
          />

          <MetricCard
            title="Published Today"
            value={data.publishedToday}
            icon={CheckCircle}
            colorClass="text-success"
          />

          <MetricCard
            title="Backoff Retries"
            value={data.retrying}
            icon={Clock3}
            colorClass="text-warning"
          />

          <MetricCard
            title="Dead Letter"
            value={data.dead}
            icon={ShieldAlert}
            colorClass="text-danger"
          />
        </div>
      </section>

      {/* =====================================================
          OPERATIONS
          ===================================================== */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Event distribution */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />

              <h2 className="font-semibold text-white">
                Delivery Distribution
              </h2>
            </div>

            <p className="mt-1 text-xs text-muted">
              Current event outcome breakdown
            </p>
          </div>

          <div className="h-[260px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={72}
                    outerRadius={96}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#1F2937',
                      borderRadius: '10px',
                    }}
                    itemStyle={{
                      color: '#fff',
                      fontWeight: 'bold',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted">
                No events processed today
              </div>
            )}
          </div>

          <div className="space-y-3">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />

                  <span className="text-xs text-muted">
                    {item.name}
                  </span>
                </div>

                <span className="font-mono text-xs font-semibold text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent events */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-6">
            <div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />

                <h2 className="font-semibold text-white">
                  Live Event Stream
                </h2>
              </div>

              <p className="mt-1 text-xs text-muted">
                Most recent events observed from the backend
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />

              <span className="text-[10px] font-semibold text-success">
                LIVE
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surfaceHover/30 text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    Event
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Aggregate
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Status
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Retries
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/50">
                {events.length > 0 ? (
                  events.map((event: any, index: number) => (
                    <tr
                      key={event.id}
                      className={`
                        transition-colors
                        hover:bg-surfaceHover/30
                        ${
                          index === 0
                            ? 'bg-primary/[0.025]'
                            : ''
                        }
                      `}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {index === 0 && (
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_7px_#3B82F6]" />
                          )}

                          <div>
                            <p className="font-medium text-white">
                              {event.eventType}
                            </p>

                            <p className="mt-0.5 font-mono text-[10px] text-muted">
                              #{event.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-muted">
                        {event.aggregateType}-
                        {event.aggregateId}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge
                          status={event.status}
                          retryCount={event.retryCount}
                        />
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-muted">
                        {event.retryCount ?? 0}
                      </td>

                      <td className="px-6 py-4 text-xs text-muted">
                        {event.createdAt
                          ? new Date(
                              event.createdAt
                            ).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-14 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surfaceHover">
                          <Radio className="h-4 w-4 text-muted" />
                        </div>

                        <p className="text-sm text-white">
                          Waiting for events
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          Create an order or publish an event to
                          see the delivery pipeline activate.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* =====================================================
          EXPLANATION STRIP
          ===================================================== */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoBlock
          icon={Database}
          title="Persist first"
          text="Business data and its event are written inside the same database transaction."
        />

        <InfoBlock
          icon={RefreshCcw}
          title="Relay later"
          text="The relay worker continuously discovers durable outbox events and attempts publication."
        />

        <InfoBlock
          icon={ShieldAlert}
          title="Recover failures"
          text="Retryable failures remain recoverable. Repeated failures can move into the dead-letter flow."
        />
      </section>
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>

      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted">
        {text}
      </p>
    </div>
  );
}