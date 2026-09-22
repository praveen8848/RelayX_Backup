import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  Inbox,
  Radio,
  RefreshCcw,
  Server,
  ShieldAlert,
  Wifi,
  XCircle,
  Zap,
} from 'lucide-react';

type PipelineEvent = {
  id: number | string;
  eventId?: string;
  eventType?: string;
  aggregateType?: string;
  aggregateId?: number | string;
  status?: string;
  retryCount?: number;
  createdAt?: string;
  nextRetryAt?: string;
  lastError?: string;
};

type PipelineVisualizationProps = {
  health?: any;
  outbox?: any;
  relay?: any;
  events?: PipelineEvent[];
};

type StageState = 'complete' | 'active' | 'waiting' | 'failed';

type Stage = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  state: StageState;
};

export default function PipelineVisualization({
  health,
  outbox,
  relay,
  events = [],
}: PipelineVisualizationProps) {
  const dbUp =
    health?.components?.db?.status === 'UP' ||
    health?.components?.database?.status === 'UP';

  const kafkaUp =
    health?.components?.kafka?.status === 'UP';

  const relayActive =
    typeof relay?.secondsSinceLastPoll === 'number'
      ? relay.secondsSinceLastPoll < 15
      : false;

  const pendingCount = outbox?.pending ?? 0;

  /*
   * The API returns the most recent events.
   * We use the newest backend event as the event currently being observed.
   */
  const currentEvent = events.length > 0 ? events[0] : undefined;

  const normalizedStatus = String(
    currentEvent?.status ?? ''
  ).toUpperCase();

  /*
   * Important:
   *
   * RelayX currently exposes event status rather than individual
   * timestamps for every delivery hop.
   *
   * Therefore the animation represents the event's delivery path,
   * while the status itself comes from the real backend.
   */
  const isPublished = normalizedStatus === 'PUBLISHED';
  const isPending =
    normalizedStatus === 'PENDING' ||
    normalizedStatus === 'RETRYING' ||
    normalizedStatus === 'PROCESSING';

  const isDead =
    normalizedStatus === 'DEAD' ||
    normalizedStatus === 'FAILED';

  const getStageState = (stage: number): StageState => {
    /*
     * 0 = Application
     * 1 = PostgreSQL
     * 2 = Outbox
     * 3 = Relay
     * 4 = Kafka
     * 5 = Consumer
     */

    if (isDead) {
      if (stage <= 2) return 'complete';
      if (stage === 3) return 'failed';
      return 'waiting';
    }

    if (isPublished) {
      return 'complete';
    }

    if (isPending) {
      if (stage < 2) return 'complete';
      if (stage === 2) return 'active';

      if (stage === 3 && relayActive) {
        return 'active';
      }

      return 'waiting';
    }

    if (!currentEvent) {
      return stage === 0 ? 'waiting' : 'waiting';
    }

    return 'waiting';
  };

  const stages: Stage[] = [
    {
      id: 'application',
      label: 'Application',
      description: 'Creates event',
      icon: Zap,
      state: getStageState(0),
    },
    {
      id: 'database',
      label: 'PostgreSQL',
      description: 'Transaction commits',
      icon: Database,
      state: dbUp ? getStageState(1) : 'failed',
    },
    {
      id: 'outbox',
      label: 'Outbox',
      description:
        pendingCount > 0
          ? `${pendingCount} pending`
          : 'Durable event store',
      icon: Inbox,
      state: getStageState(2),
    },
    {
      id: 'relay',
      label: 'Relay Worker',
      description: relayActive
        ? 'Polling database'
        : 'No recent poll',
      icon: RefreshCcw,
      state: relayActive
        ? getStageState(3)
        : isDead
          ? 'failed'
          : 'waiting',
    },
    {
      id: 'kafka',
      label: 'Kafka',
      description: kafkaUp ? 'Broker available' : 'Broker unavailable',
      icon: Server,
      state: kafkaUp
        ? getStageState(4)
        : isPending
          ? 'waiting'
          : 'failed',
    },
    {
      id: 'consumer',
      label: 'Consumer',
      description: isPublished ? 'Event delivered' : 'Waiting',
      icon: Radio,
      state: isPublished ? 'complete' : 'waiting',
    },
  ];

  const getNodeClass = (state: StageState) => {
    switch (state) {
      case 'complete':
        return 'border-success/50 bg-success/5 text-success';

      case 'active':
        return 'border-primary bg-primary/10 text-primary shadow-[0_0_25px_rgba(59,130,246,0.18)]';

      case 'failed':
        return 'border-danger/60 bg-danger/10 text-danger';

      default:
        return 'border-border bg-surfaceHover/40 text-muted';
    }
  };

  const getConnectorClass = (
    current: StageState,
    next: StageState
  ) => {
    if (
      current === 'complete' &&
      (next === 'complete' || next === 'active')
    ) {
      return 'bg-success/40';
    }

    if (current === 'active') {
      return 'bg-primary/40';
    }

    if (current === 'failed') {
      return 'bg-danger/30';
    }

    return 'bg-border';
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface">
      {/* =====================================================
          HEADER
          ===================================================== */}
      <div className="flex flex-col gap-4 border-b border-border p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Activity className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Live Event Delivery
              </h2>

              <p className="mt-0.5 text-xs text-muted">
                Real backend state • continuously refreshed
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Relay heartbeat */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
            <span
              className={`h-2 w-2 rounded-full ${
                relayActive
                  ? 'bg-success shadow-[0_0_8px_#10B981]'
                  : 'bg-danger shadow-[0_0_8px_#EF4444]'
              }`}
            />

            <span className="text-xs font-medium text-muted">
              Relay
            </span>

            <span
              className={`text-xs font-semibold ${
                relayActive ? 'text-success' : 'text-danger'
              }`}
            >
              {relayActive ? 'ACTIVE' : 'STALE'}
            </span>
          </div>

          {/* Kafka */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
            <Wifi
              className={`h-3.5 w-3.5 ${
                kafkaUp ? 'text-success' : 'text-danger'
              }`}
            />

            <span className="text-xs text-muted">Kafka</span>

            <span
              className={`text-xs font-semibold ${
                kafkaUp ? 'text-success' : 'text-danger'
              }`}
            >
              {kafkaUp ? 'ONLINE' : 'DOWN'}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          CURRENT EVENT
          ===================================================== */}
      <div className="border-b border-border bg-background/30 px-6 py-5">
        {currentEvent ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Tracking event
                </span>

                <span className="h-1 w-1 rounded-full bg-border" />

                <span className="font-mono text-[10px] text-muted">
                  #{currentEvent.id}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-mono text-sm font-semibold text-white">
                  {currentEvent.eventType ?? 'UnknownEvent'}
                </h3>

                <span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1 font-mono text-[10px] text-primary">
                  {currentEvent.aggregateType ?? 'Aggregate'}-
                  {currentEvent.aggregateId ?? '—'}
                </span>

                {currentEvent.eventId && (
                  <span className="max-w-[260px] truncate font-mono text-[10px] text-muted">
                    {currentEvent.eventId}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                  isPublished
                    ? 'border-success/30 bg-success/10 text-success'
                    : isDead
                      ? 'border-danger/30 bg-danger/10 text-danger'
                      : 'border-warning/30 bg-warning/10 text-warning'
                }`}
              >
                {normalizedStatus || 'OBSERVING'}
              </div>

              <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
                Retries:{' '}
                <span className="font-semibold text-white">
                  {currentEvent.retryCount ?? 0}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-muted">
            <Inbox className="h-4 w-4" />
            Waiting for events from the backend...
          </div>
        )}
      </div>

      {/* =====================================================
          PIPELINE
          ===================================================== */}
      <div className="overflow-x-auto p-6 lg:p-8">
        <div className="min-w-[1050px]">
          <div className="relative flex items-start">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const nextStage = stages[index + 1];

              return (
                <div
                  key={stage.id}
                  className="flex flex-1 items-start last:flex-none"
                >
                  {/* NODE */}
                  <div className="relative z-10 w-[130px] shrink-0">
                    <div
                      className={`
                        relative
                        mx-auto
                        flex
                        h-[72px]
                        w-[72px]
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        transition-all
                        duration-500
                        ${getNodeClass(stage.state)}
                      `}
                    >
                      {/* Active outer ring */}
                      {stage.state === 'active' && (
                        <>
                          <div className="absolute inset-[-7px] rounded-[21px] border border-primary/20 animate-ping" />

                          <div className="absolute inset-[-3px] rounded-[19px] border border-primary/20" />
                        </>
                      )}

                      <Icon
                        className={`
                          relative
                          z-10
                          h-7
                          w-7
                          ${
                            stage.state === 'active'
                              ? 'animate-pulse'
                              : ''
                          }
                        `}
                      />

                      {/* Complete check */}
                      {stage.state === 'complete' && (
                        <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-success/40 bg-background">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        </div>
                      )}

                      {/* Failure */}
                      {stage.state === 'failed' && (
                        <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-danger/40 bg-background">
                          <XCircle className="h-3.5 w-3.5 text-danger" />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-center">
                      <p
                        className={`text-xs font-semibold ${
                          stage.state === 'active'
                            ? 'text-primary'
                            : stage.state === 'failed'
                              ? 'text-danger'
                              : 'text-white'
                        }`}
                      >
                        {stage.label}
                      </p>

                      <p className="mt-1 text-[10px] leading-relaxed text-muted">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  {/* CONNECTOR */}
                  {nextStage && (
                    <div className="relative mt-[35px] h-1 flex-1 overflow-visible">
                      <div
                        className={`
                          absolute
                          left-0
                          right-0
                          top-0
                          h-[2px]
                          rounded-full
                          transition-all
                          duration-700
                          ${getConnectorClass(
                            stage.state,
                            nextStage.state
                          )}
                        `}
                      />

                      {/* Moving event packet */}
                      {(stage.state === 'active' ||
                        (stage.state === 'complete' &&
                          nextStage.state === 'active')) && (
                        <div className="absolute inset-0">
                          <div
                            className="
                              absolute
                              top-1/2
                              h-2
                              w-2
                              -translate-y-1/2
                              rounded-full
                              bg-primary
                              shadow-[0_0_12px_#3B82F6]
                              animate-[pipelineMove_1.8s_linear_infinite]
                            "
                          />
                        </div>
                      )}

                      {/* Arrow */}
                      <ArrowRight
                        className={`
                          absolute
                          -right-2
                          -top-[7px]
                          h-4
                          w-4
                          ${
                            nextStage.state === 'waiting'
                              ? 'text-border'
                              : 'text-muted'
                          }
                        `}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================
          DELIVERY STATE
          ===================================================== */}
      <div className="grid border-t border-border sm:grid-cols-3">
        <DeliveryState
          label="Persistence"
          value={
            dbUp
              ? 'Database available'
              : 'Database unavailable'
          }
          icon={Database}
          positive={dbUp}
        />

        <DeliveryState
          label="Durability"
          value={
            pendingCount > 0
              ? `${pendingCount} event${pendingCount > 1 ? 's' : ''} waiting`
              : 'Outbox clear'
          }
          icon={Inbox}
          positive={pendingCount === 0}
        />

        <DeliveryState
          label="Delivery"
          value={
            isPublished
              ? 'Successfully published'
              : isDead
                ? 'Moved to failure state'
                : 'Delivery in progress'
          }
          icon={isDead ? ShieldAlert : Radio}
          positive={isPublished}
          danger={isDead}
        />
      </div>

      {/* =====================================================
          FAILURE INFORMATION
          ===================================================== */}
      {isDead && currentEvent?.lastError && (
        <div className="border-t border-danger/20 bg-danger/5 px-6 py-4">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />

            <div>
              <p className="text-xs font-semibold text-danger">
                Delivery failure
              </p>

              <p className="mt-1 font-mono text-xs text-muted">
                {currentEvent.lastError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          LEGEND
          ===================================================== */}
      <div className="flex flex-wrap items-center gap-5 border-t border-border px-6 py-4 text-[10px] text-muted">
        <LegendDot type="complete" label="Completed" />
        <LegendDot type="active" label="Currently processing" />
        <LegendDot type="waiting" label="Waiting" />
        <LegendDot type="failed" label="Failure" />

        <span className="ml-auto">
          Event state is read from the RelayX backend.
        </span>
      </div>
    </section>
  );
}

function DeliveryState({
  label,
  value,
  icon: Icon,
  positive,
  danger = false,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  positive: boolean;
  danger?: boolean;
}) {
  return (
    <div className="border-r border-border p-5 last:border-r-0">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${
            danger
              ? 'text-danger'
              : positive
                ? 'text-success'
                : 'text-warning'
          }`}
        />

        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}

function LegendDot({
  type,
  label,
}: {
  type: 'complete' | 'active' | 'waiting' | 'failed';
  label: string;
}) {
  const classes = {
    complete: 'bg-success',
    active: 'bg-primary shadow-[0_0_8px_#3B82F6]',
    waiting: 'bg-gray-600',
    failed: 'bg-danger',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${classes[type]}`} />
      {label}
    </div>
  );
}