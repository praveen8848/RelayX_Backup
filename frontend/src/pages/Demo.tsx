import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  FileWarning,
  GitBranch,
  Inbox,
  Layers3,
  Play,
  Radio,
  RefreshCcw,
  RotateCcw,
  Server,
  ShieldCheck,
  SkipForward,
  TriangleAlert,
  X,
  Zap,
} from 'lucide-react';

type DemoStep =
  | 'INTRO'
  | 'NAIVE_WRITE'
  | 'NAIVE_FAILURE'
  | 'NAIVE_LOST'
  | 'RELAYX_TRANSACTION'
  | 'OUTBOX_STORED'
  | 'KAFKA_FAILURE'
  | 'RETRYING'
  | 'DELIVERED'
  | 'DUPLICATE'
  | 'IDEMPOTENT'
  | 'ORDERING'
  | 'DLQ'
  | 'FINAL';

type StepDefinition = {
  id: DemoStep;
  title: string;
  subtitle: string;
};

const steps: StepDefinition[] = [
  {
    id: 'INTRO',
    title: 'The Event Delivery Problem',
    subtitle: 'Why saving data and publishing an event are not the same operation.',
  },
  {
    id: 'NAIVE_WRITE',
    title: 'The Naive Approach',
    subtitle: 'The application writes to PostgreSQL and Kafka separately.',
  },
  {
    id: 'NAIVE_FAILURE',
    title: 'The Failure Window',
    subtitle: 'The database succeeds while Kafka is unavailable.',
  },
  {
    id: 'NAIVE_LOST',
    title: 'The Event Is Lost',
    subtitle: 'The order exists, but downstream services never receive the event.',
  },
  {
    id: 'RELAYX_TRANSACTION',
    title: 'The RelayX Approach',
    subtitle: 'Store the business data and event together in one database transaction.',
  },
  {
    id: 'OUTBOX_STORED',
    title: 'The Event Becomes Durable',
    subtitle: 'Kafka can fail without losing the event.',
  },
  {
    id: 'KAFKA_FAILURE',
    title: 'Kafka Goes Down',
    subtitle: 'The relay cannot publish, but the outbox event remains safe.',
  },
  {
    id: 'RETRYING',
    title: 'RelayX Retries',
    subtitle: 'Failed delivery is retried using backoff instead of losing the event.',
  },
  {
    id: 'DELIVERED',
    title: 'Delivery Recovers',
    subtitle: 'Kafka returns and the pending event is published.',
  },
  {
    id: 'DUPLICATE',
    title: 'But What About Duplicates?',
    subtitle: 'At-least-once delivery means a consumer may see an event more than once.',
  },
  {
    id: 'IDEMPOTENT',
    title: 'Idempotent Consumers',
    subtitle: 'Consumers can safely ignore an event they have already processed.',
  },
  {
    id: 'ORDERING',
    title: 'Per-Aggregate Ordering',
    subtitle: 'Related events can be processed in their intended order.',
  },
  {
    id: 'DLQ',
    title: 'When Retries Are Exhausted',
    subtitle: 'Permanently failing events can be moved to a Dead Letter Queue.',
  },
  {
    id: 'FINAL',
    title: 'RelayX: Reliable Event Delivery',
    subtitle: 'Durable events, retries, recovery, idempotency and failure handling.',
  },
];

const AUTO_PLAY_MS = 5000;

function NodeCard({
  icon: Icon,
  title,
  subtitle,
  status,
  active = false,
  danger = false,
  success = false,
  warning = false,
}: {
  icon: typeof Database;
  title: string;
  subtitle?: string;
  status?: string;
  active?: boolean;
  danger?: boolean;
  success?: boolean;
  warning?: boolean;
}) {
  const stateClass = danger
    ? 'border-danger/60 bg-danger/10'
    : success
      ? 'border-success/60 bg-success/10'
      : warning
        ? 'border-warning/60 bg-warning/10'
        : active
          ? 'border-primary/70 bg-primary/10'
          : 'border-border bg-surface';

  const iconClass = danger
    ? 'text-danger'
    : success
      ? 'text-success'
      : warning
        ? 'text-warning'
        : active
          ? 'text-primary'
          : 'text-muted';

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-500 ${stateClass}`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-lg bg-surfaceHover p-2 ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="font-semibold text-main">{title}</div>
          {subtitle && (
            <div className="mt-1 text-xs text-muted">{subtitle}</div>
          )}
        </div>
      </div>

      {status && (
        <div className="mt-3 text-xs font-semibold uppercase tracking-wide">
          {status}
        </div>
      )}
    </div>
  );
}

function FlowArrow({
  label,
  danger = false,
  success = false,
  animated = false,
}: {
  label?: string;
  danger?: boolean;
  success?: boolean;
  animated?: boolean;
}) {
  return (
    <div className="flex min-w-[70px] flex-col items-center justify-center gap-1 px-2">
      <div
        className={`h-px w-full ${
          danger
            ? 'bg-danger'
            : success
              ? 'bg-success'
              : animated
                ? 'bg-primary'
                : 'bg-border'
        }`}
      />
      <ArrowRight
        className={`-mt-3 h-4 w-4 self-end ${
          danger
            ? 'text-danger'
            : success
              ? 'text-success'
              : animated
                ? 'text-primary animate-pulse'
                : 'text-muted'
        }`}
      />
      {label && (
        <span
          className={`text-[10px] font-medium uppercase tracking-wide ${
            danger
              ? 'text-danger'
              : success
                ? 'text-success'
                : 'text-muted'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function EventChip({
  label = 'OrderCreated',
  state = 'normal',
}: {
  label?: string;
  state?: 'normal' | 'danger' | 'success' | 'warning';
}) {
  const classes =
    state === 'danger'
      ? 'border-danger/50 bg-danger/10 text-danger'
      : state === 'success'
        ? 'border-success/50 bg-success/10 text-success'
        : state === 'warning'
          ? 'border-warning/50 bg-warning/10 text-warning'
          : 'border-primary/40 bg-primary/10 text-primary';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs font-medium ${classes}`}
    >
      <Activity className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-main md:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted md:text-base">
        {description}
      </p>
    </div>
  );
}

export default function Demo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentStep = steps[currentIndex];

  const progress = useMemo(
    () => ((currentIndex + 1) / steps.length) * 100,
    [currentIndex],
  );

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setTimeout(() => {
      if (currentIndex >= steps.length - 1) {
        setIsPlaying(false);
        return;
      }

      setCurrentIndex((value) => value + 1);
    }, AUTO_PLAY_MS);

    return () => window.clearTimeout(timer);
  }, [isPlaying, currentIndex]);

  const next = () => {
    setCurrentIndex((value) => Math.min(value + 1, steps.length - 1));
  };

  const previous = () => {
    setCurrentIndex((value) => Math.max(value - 1, 0));
  };

  const restart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (currentIndex >= steps.length - 1) {
      setCurrentIndex(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((value) => !value);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Header */}
      <header className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <Zap className="h-4 w-4" />
              RelayX Architecture Simulation
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-main md:text-4xl">
              See the Failure. Understand the Fix.
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted md:text-base">
              Follow one event from creation to delivery and see why a
              transactional outbox makes event delivery more reliable.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted">
              Current step
            </div>
            <div className="mt-1 font-semibold text-main">
              {currentIndex + 1} / {steps.length}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>{currentStep.title}</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-surfaceHover">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main simulation */}
      <main className="min-h-[600px] rounded-2xl border border-border bg-surface/40 p-5 md:p-8">
        {currentStep.id === 'INTRO' && <IntroScene />}
        {currentStep.id === 'NAIVE_WRITE' && <NaiveWriteScene />}
        {currentStep.id === 'NAIVE_FAILURE' && <NaiveFailureScene />}
        {currentStep.id === 'NAIVE_LOST' && <NaiveLostScene />}
        {currentStep.id === 'RELAYX_TRANSACTION' && <RelayXTransactionScene />}
        {currentStep.id === 'OUTBOX_STORED' && <OutboxStoredScene />}
        {currentStep.id === 'KAFKA_FAILURE' && <KafkaFailureScene />}
        {currentStep.id === 'RETRYING' && <RetryScene />}
        {currentStep.id === 'DELIVERED' && <DeliveredScene />}
        {currentStep.id === 'DUPLICATE' && <DuplicateScene />}
        {currentStep.id === 'IDEMPOTENT' && <IdempotentScene />}
        {currentStep.id === 'ORDERING' && <OrderingScene />}
        {currentStep.id === 'DLQ' && <DlqScene />}
        {currentStep.id === 'FINAL' && <FinalScene />}
      </main>

      {/* Controls */}
      <div className="sticky bottom-4 z-10 rounded-xl border border-border bg-surface/95 p-3 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="hidden text-xs text-muted md:block">
            {isPlaying
              ? 'Playing automatically...'
              : 'Use the controls to explore the architecture.'}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={previous}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-main transition hover:bg-surfaceHover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Previous
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {isPlaying ? (
                <>
                  <span className="flex gap-0.5">
                    <span className="h-3 w-1 rounded bg-white" />
                    <span className="h-3 w-1 rounded bg-white" />
                  </span>
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Play
                </>
              )}
            </button>

            <button
              type="button"
              onClick={next}
              disabled={currentIndex === steps.length - 1}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-main transition hover:bg-surfaceHover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <SkipForward className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surfaceHover hover:text-main"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Restart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SCENES                                                                     */
/* -------------------------------------------------------------------------- */

function IntroScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 1 · The Problem"
        title="One action can involve two different systems"
        description="When an order is created, the application may need to save the order in PostgreSQL and publish an event to Kafka. Those operations are not automatically one atomic transaction."
      />

      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center justify-center gap-5 md:flex-row">
          <NodeCard
            icon={Server}
            title="Application"
            subtitle="Create Order #1042"
            active
          />

          <FlowArrow label="save" animated />

          <NodeCard
            icon={Database}
            title="PostgreSQL"
            subtitle="Business data"
            success
            status="Order stored"
          />

          <FlowArrow label="publish" animated />

          <NodeCard
            icon={Radio}
            title="Kafka"
            subtitle="Event stream"
            warning
            status="Event delivery"
          />
        </div>

        <div className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

            <div>
              <div className="font-semibold text-main">
                The dangerous part is the gap between these operations.
              </div>

              <p className="mt-2 text-sm leading-6 text-muted">
                The database can commit successfully while the event
                publication fails. That creates a consistency problem between
                the source of truth and downstream systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NaiveWriteScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 2 · Naive Dual Write"
        title="The application performs two independent writes"
        description="This looks simple, but there is no single transaction covering both PostgreSQL and Kafka."
      />

      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-main">
                Request: Create Order #1042
              </div>
              <div className="mt-1 text-xs text-muted">
                customerId: demo-customer-1 · amount: ₹100
              </div>
            </div>

            <EventChip />
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <NodeCard
              icon={Server}
              title="Application"
              subtitle="Create order"
              active
              status="Request received"
            />

            <div className="hidden md:block">
              <div className="space-y-5">
                <FlowArrow label="write" animated />
                <FlowArrow label="publish" animated />
              </div>
            </div>

            <div className="space-y-4">
              <NodeCard
                icon={Database}
                title="PostgreSQL"
                subtitle="Save Order"
                success
                status="✓ Independent operation"
              />

              <NodeCard
                icon={Radio}
                title="Kafka"
                subtitle="Publish OrderCreated"
                active
                status="✓ Independent operation"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard
            icon={Database}
            title="Database transaction"
            text="The order can be committed successfully."
          />

          <InfoCard
            icon={Radio}
            title="Message publication"
            text="Kafka is a separate system and can fail independently."
          />
        </div>
      </div>
    </div>
  );
}

function NaiveFailureScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 3 · Failure Window"
        title="What if Kafka fails after the database commits?"
        description="This is the critical failure window that the transactional outbox pattern is designed to address."
      />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <NodeCard
            icon={Database}
            title="PostgreSQL"
            subtitle="Order #1042"
            success
            status="✓ COMMITTED"
          />

          <FlowArrow label="committed" success animated />

          <NodeCard
            icon={Radio}
            title="Kafka"
            subtitle="OrderCreated"
            danger
            status="✕ UNAVAILABLE"
          />
        </div>

        <div className="my-8 flex justify-center">
          <div className="rounded-full border border-danger/50 bg-danger/10 px-5 py-2 text-sm font-semibold text-danger">
            FAILURE HAPPENS HERE
          </div>
        </div>

        <div className="rounded-xl border border-danger/40 bg-danger/10 p-6">
          <div className="flex gap-4">
            <TriangleAlert className="h-6 w-6 shrink-0 text-danger" />

            <div>
              <h3 className="font-bold text-main">
                The operations are no longer consistent
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted">
                PostgreSQL has already committed the order. The application
                cannot roll that transaction back simply because Kafka failed
                afterward.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NaiveLostScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 4 · The Consequence"
        title="The order exists. The event does not."
        description="Without another recovery mechanism, downstream services have no event to consume."
      />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-5 md:grid-cols-[1fr_80px_1fr] md:items-center">
          <div className="rounded-xl border border-success/50 bg-success/10 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div>
                <div className="font-bold text-main">PostgreSQL</div>
                <div className="text-sm text-muted">Order #1042 exists</div>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-surface p-4 font-mono text-xs">
              <div>order_id: 1042</div>
              <div>customer: demo-customer-1</div>
              <div>amount: 100.00</div>
              <div>status: CREATED</div>
            </div>
          </div>

          <div className="flex justify-center">
            <X className="h-10 w-10 text-danger" />
          </div>

          <div className="rounded-xl border border-danger/50 bg-danger/10 p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-danger" />
              <div>
                <div className="font-bold text-main">Kafka</div>
                <div className="text-sm text-muted">OrderCreated missing</div>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-surface p-4 font-mono text-xs text-danger">
              EVENT NOT PUBLISHED
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 text-center text-sm font-semibold text-main">
            Downstream services never receive the event
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <DownstreamCard title="Notification Service" />
            <DownstreamCard title="Inventory Service" />
            <DownstreamCard title="Analytics Service" />
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-surface p-5 text-center">
          <div className="text-sm font-semibold text-main">
            This is the dual-write consistency problem.
          </div>

          <div className="mt-2 text-sm text-muted">
            We need a way to make the event durable without requiring Kafka to
            be available during the database transaction.
          </div>
        </div>
      </div>
    </div>
  );
}

function RelayXTransactionScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 5 · RelayX"
        title="Store the event beside the business data"
        description="RelayX uses the transactional outbox pattern: the order and its event are written to PostgreSQL in the same database transaction."
      />

      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-5">
          <NodeCard
            icon={Server}
            title="Application"
            subtitle="Create Order #1042"
            active
            status="Create business data + event"
          />

          <ArrowDown className="h-6 w-6 text-primary animate-pulse" />

          <div className="w-full rounded-2xl border border-primary/50 bg-primary/5 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="font-bold text-main">ONE PostgreSQL Transaction</div>
                <div className="mt-1 text-xs text-muted">
                  Both records commit or both roll back.
                </div>
              </div>

              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <NodeCard
                icon={Database}
                title="Order"
                subtitle="order_id = 1042"
                success
                status="Included"
              />

              <NodeCard
                icon={Inbox}
                title="Outbox Event"
                subtitle="OrderCreated"
                success
                status="Included"
              />
            </div>

            <div className="mt-5 rounded-lg border border-success/40 bg-success/10 p-3 text-center text-sm font-semibold text-success">
              ✓ DATABASE TRANSACTION COMMITTED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutboxStoredScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 6 · Durability"
        title="Kafka can fail without deleting the event"
        description="The event is already persisted in the outbox. RelayX can deliver it later."
      />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-5 md:grid-cols-[1fr_100px_1fr] md:items-center">
          <div className="rounded-xl border border-primary/50 bg-primary/5 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              <div>
                <div className="font-bold text-main">PostgreSQL Outbox</div>
                <div className="text-xs text-muted">
                  Durable event record
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-surface p-4 font-mono text-xs">
              <div>event_id: 8e91...c42</div>
              <div>type: OrderCreated</div>
              <div>aggregate: Order #1042</div>
              <div className="mt-2 font-bold text-warning">
                status: PENDING
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <RefreshCcw className="h-8 w-8 text-primary animate-spin" />
          </div>

          <NodeCard
            icon={Radio}
            title="Kafka"
            subtitle="Temporarily unavailable"
            danger
            status="✕ Delivery failed"
          />
        </div>

        <div className="mt-8 rounded-xl border border-success/40 bg-success/10 p-5">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />

            <div>
              <div className="font-semibold text-main">
                The important difference
              </div>

              <p className="mt-1 text-sm leading-6 text-muted">
                The event is not sitting only in application memory. It is
                durable in PostgreSQL and can be retried after the failure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KafkaFailureScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 7 · Failure Recovery"
        title="Kafka goes down. The event stays alive."
        description="The relay worker attempts delivery, detects the failure and leaves the outbox event available for another attempt."
      />

      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-5 md:flex-row md:justify-center">
          <NodeCard
            icon={Database}
            title="Outbox"
            subtitle="OrderCreated"
            warning
            status="PENDING"
          />

          <FlowArrow label="poll" animated />

          <NodeCard
            icon={RefreshCcw}
            title="Relay Worker"
            subtitle="Delivery attempt"
            active
            status="TRYING"
          />

          <FlowArrow label="publish" danger />

          <NodeCard
            icon={Radio}
            title="Kafka"
            subtitle="Broker unavailable"
            danger
            status="OFFLINE"
          />
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <MiniMetric
            icon={Database}
            label="Event"
            value="Still stored"
          />

          <MiniMetric
            icon={Clock3}
            label="Next action"
            value="Retry later"
          />

          <MiniMetric
            icon={ShieldCheck}
            label="Data loss"
            value="Avoided"
          />
        </div>
      </div>
    </div>
  );
}

function RetryScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 8 · Retry"
        title="RelayX does not give up after one failure"
        description="The worker can retry failed events. Delays can increase between attempts using exponential backoff."
      />

      <div className="mx-auto max-w-4xl">
        <div className="space-y-4">
          <RetryRow attempt="Attempt 1" delay="Initial attempt" success={false} />

          <div className="flex justify-center">
            <ArrowDown className="h-5 w-5 text-muted" />
          </div>

          <RetryRow attempt="Attempt 2" delay="Backoff delay" success={false} />

          <div className="flex justify-center">
            <ArrowDown className="h-5 w-5 text-muted" />
          </div>

          <RetryRow attempt="Attempt 3" delay="Longer backoff" success />
        </div>

        <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 text-primary" />

            <div>
              <div className="font-semibold text-main">
                Exponential backoff
              </div>

              <p className="mt-1 text-sm leading-6 text-muted">
                Instead of hammering an unavailable broker continuously,
                retries can wait progressively longer before trying again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveredScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 9 · Recovery"
        title="Kafka comes back. RelayX finishes the job."
        description="The pending event is picked up again and successfully published."
      />

      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-5 md:flex-row md:justify-center">
          <NodeCard
            icon={Database}
            title="Outbox"
            subtitle="OrderCreated"
            success
            status="✓ Pending event"
          />

          <FlowArrow label="retry" success animated />

          <NodeCard
            icon={RefreshCcw}
            title="Relay Worker"
            subtitle="Retry succeeded"
            success
            status="✓ PUBLISHED"
          />

          <FlowArrow label="deliver" success animated />

          <NodeCard
            icon={Radio}
            title="Kafka"
            subtitle="Broker recovered"
            success
            status="✓ ONLINE"
          />
        </div>

        <div className="mt-8 rounded-xl border border-success/50 bg-success/10 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />

          <h3 className="mt-3 text-xl font-bold text-main">
            The event was not lost.
          </h3>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted">
            It remained durable in the outbox until the delivery path became
            available again.
          </p>
        </div>
      </div>
    </div>
  );
}

function DuplicateScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 10 · Another Reality"
        title="Reliable delivery can still produce duplicates"
        description="RelayX should not promise exactly-once delivery. A retry can cause the same event to reach a consumer more than once."
      />

      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-5 md:flex-row md:justify-center">
          <NodeCard
            icon={RefreshCcw}
            title="Relay Worker"
            subtitle="Retry / redelivery"
            active
          />

          <FlowArrow label="delivery" animated />

          <div className="space-y-3">
            <EventChip label="eventId: abc-123" state="success" />
            <EventChip label="eventId: abc-123" state="warning" />
          </div>

          <FlowArrow label="same ID"/>

          <NodeCard
            icon={Server}
            title="Consumer"
            subtitle="Receives event"
            warning
            status="May see duplicate"
          />
        </div>

        <div className="mt-8 rounded-xl border border-warning/40 bg-warning/10 p-5">
          <div className="flex gap-3">
            <TriangleAlert className="h-5 w-5 shrink-0 text-warning" />

            <div>
              <div className="font-semibold text-main">
                This is why idempotency matters.
              </div>

              <p className="mt-1 text-sm leading-6 text-muted">
                At-least-once delivery prioritizes not losing events, but it
                means consumers must be prepared to handle duplicates safely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IdempotentScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 11 · Idempotency"
        title="Process once. Ignore the duplicate."
        description="A consumer can track processed event IDs so receiving the same event again does not repeat the business operation."
      />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="mb-5 flex items-center gap-3">
              <Inbox className="h-6 w-6 text-primary" />
              <div>
                <div className="font-bold text-main">Incoming Event</div>
                <div className="text-xs text-muted">
                  eventId = abc-123
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-surfaceHover p-4 font-mono text-xs">
              <div>eventId: abc-123</div>
              <div>type: OrderCreated</div>
              <div>aggregateId: 1042</div>
            </div>
          </div>

          <div className="rounded-xl border border-success/50 bg-success/10 p-6">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-success" />
              <div>
                <div className="font-bold text-main">Idempotency Check</div>
                <div className="text-xs text-muted">
                  Has abc-123 already been processed?
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-surface p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Already processed</span>
                <span className="font-bold text-success">YES</span>
              </div>

              <div className="mt-3 border-t border-border pt-3 font-semibold text-success">
                → Ignore duplicate
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <EventChip label="At-least-once delivery + Idempotent consumer" />
        </div>
      </div>
    </div>
  );
}

function OrderingScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 12 · Ordering"
        title="Related events should preserve their order"
        description="For an aggregate such as an order, consumers often need events to be processed in sequence."
      />

      <div className="mx-auto max-w-5xl">
        <div className="mb-6 text-center">
          <EventChip label="Customer / Order #1042" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SequenceCard
            number="01"
            title="OrderCreated"
            description="The order is created."
          />

          <SequenceCard
            number="02"
            title="PaymentCompleted"
            description="Payment is completed."
          />

          <SequenceCard
            number="03"
            title="OrderShipped"
            description="The order is shipped."
          />
        </div>

        <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex gap-3">
            <GitBranch className="h-5 w-5 shrink-0 text-primary" />

            <div>
              <div className="font-semibold text-main">
                Per-aggregate ordering
              </div>

              <p className="mt-1 text-sm leading-6 text-muted">
                The important guarantee here is ordering for related events
                belonging to the same aggregate. This is not a claim that every
                event in the entire system has one global order.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DlqScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Step 13 · Dead Letter Queue"
        title="Some events may keep failing"
        description="Retries are useful, but a permanently failing event should not block normal processing forever."
      />

      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-4">
          <EventChip label="OrderCreated" state="danger" />

          <ArrowDown className="h-5 w-5 text-danger" />

          <div className="grid w-full max-w-3xl gap-3 md:grid-cols-3">
            <RetryBox attempt="Retry 1" />
            <RetryBox attempt="Retry 2" />
            <RetryBox attempt="Retry 3" />
          </div>

          <ArrowDown className="h-5 w-5 text-danger" />

          <div className="w-full max-w-3xl rounded-xl border border-danger/50 bg-danger/10 p-6">
            <div className="flex items-center gap-3">
              <FileWarning className="h-6 w-6 text-danger" />

              <div>
                <div className="font-bold text-main">
                  Dead Letter Queue
                </div>

                <div className="text-sm text-muted">
                  Event isolated after retry exhaustion
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-xs md:grid-cols-4">
              <DlqField label="Event ID" value="abc-123" />
              <DlqField label="Retries" value="3" />
              <DlqField label="Status" value="DEAD" />
              <DlqField label="Error" value="Broker unavailable" />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-surface px-5 py-3 text-sm">
            <RotateCcw className="h-4 w-4 text-primary" />
            <span className="text-muted">
              Operators can inspect and retry the event later.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinalScene() {
  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Final · RelayX"
        title="Reliable Event Delivery"
        description="RelayX separates database durability from message delivery so temporary messaging failures do not automatically become lost events."
      />

      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 md:p-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1.4fr_auto_1fr] md:items-center">
            <NodeCard
              icon={Server}
              title="Application"
              subtitle="Business operation"
              active
            />

            <FlowArrow label="transaction" animated />

            <div className="rounded-xl border border-primary/50 bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <span className="font-bold text-main">PostgreSQL</span>
              </div>

              <div className="space-y-2">
                <div className="rounded-lg bg-surfaceHover p-3 text-xs">
                  <div className="font-semibold text-main">Order</div>
                  <div className="mt-1 text-muted">Business data</div>
                </div>

                <div className="rounded-lg bg-surfaceHover p-3 text-xs">
                  <div className="font-semibold text-main">Outbox Event</div>
                  <div className="mt-1 text-muted">Durable event</div>
                </div>
              </div>
            </div>

            <FlowArrow label="poll + retry" animated />

            <NodeCard
              icon={RefreshCcw}
              title="RelayX"
              subtitle="Relay worker"
              success
              status="Retries delivery"
            />
          </div>

          <div className="my-7 flex justify-center">
            <ArrowDown className="h-6 w-6 text-primary" />
          </div>

          <div className="flex flex-col items-center justify-center gap-5 md:flex-row">
            <NodeCard
              icon={Radio}
              title="Kafka"
              subtitle="Event broker"
              success
              status="Event delivered"
            />

            <FlowArrow label="consume" success animated />

            <div className="grid gap-3 md:grid-cols-3">
              <DownstreamCard title="Notifications" />
              <DownstreamCard title="Inventory" />
              <DownstreamCard title="Analytics" />
            </div>
          </div>
        </div>

        {/* Guarantees */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GuaranteeCard
            icon={Database}
            title="Durable"
            text="Events survive temporary broker failures."
          />

          <GuaranteeCard
            icon={RefreshCcw}
            title="Retryable"
            text="Failed delivery can be retried with backoff."
          />

          <GuaranteeCard
            icon={ShieldCheck}
            title="Idempotent"
            text="Consumers can safely handle duplicates."
          />

          <GuaranteeCard
            icon={FileWarning}
            title="Recoverable"
            text="Repeated failures can move to a DLQ."
          />
        </div>

        <div className="mt-8 rounded-2xl border border-success/40 bg-success/10 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />

          <h3 className="mt-4 text-2xl font-bold text-main">
            RelayX
          </h3>

          <p className="mt-2 text-lg text-muted">
            Reliable Event Delivery Infrastructure
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted">
            The database transaction protects the event. The relay handles
            delivery. Retries handle temporary failures. Idempotency handles
            duplicates. The DLQ handles events that cannot be delivered
            normally.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SMALL COMPONENTS                                                           */
/* -------------------------------------------------------------------------- */

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Database;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <div className="font-semibold text-main">{title}</div>
      </div>

      <p className="mt-2 text-sm leading-5 text-muted">{text}</p>
    </div>
  );
}

function DownstreamCard({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-center">
      <Server className="mx-auto h-5 w-5 text-muted" />
      <div className="mt-2 text-sm font-medium text-main">{title}</div>
      <div className="mt-1 text-xs text-muted">Event consumer</div>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
        <Icon className="h-4 w-4" />
        {label}
      </div>

      <div className="mt-2 font-semibold text-main">{value}</div>
    </div>
  );
}

function RetryRow({
  attempt,
  delay,
  success,
}: {
  attempt: string;
  delay: string;
  success: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-5 ${
        success
          ? 'border-success/50 bg-success/10'
          : 'border-danger/40 bg-danger/10'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`rounded-lg p-2 ${
            success ? 'bg-success/10' : 'bg-danger/10'
          }`}
        >
          {success ? (
            <Check className="h-5 w-5 text-success" />
          ) : (
            <X className="h-5 w-5 text-danger" />
          )}
        </div>

        <div>
          <div className="font-semibold text-main">{attempt}</div>
          <div className="mt-1 text-xs text-muted">{delay}</div>
        </div>
      </div>

      <div
        className={`text-sm font-bold ${
          success ? 'text-success' : 'text-danger'
        }`}
      >
        {success ? '✓ SUCCESS' : '✕ FAILED'}
      </div>
    </div>
  );
}

function SequenceCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-surface p-5">
      <div className="text-xs font-bold tracking-widest text-primary">
        {number}
      </div>

      <div className="mt-3 font-semibold text-main">{title}</div>

      <div className="mt-2 text-sm leading-5 text-muted">{description}</div>
    </div>
  );
}

function RetryBox({ attempt }: { attempt: string }) {
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-center">
      <RefreshCcw className="mx-auto h-5 w-5 text-danger" />
      <div className="mt-2 text-sm font-semibold text-main">{attempt}</div>
      <div className="mt-1 text-xs text-danger">FAILED</div>
    </div>
  );
}

function DlqField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="text-muted">{label}</div>
      <div className="mt-1 font-mono text-main">{value}</div>
    </div>
  );
}

function GuaranteeCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Database;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <Icon className="h-5 w-5 text-primary" />

      <div className="mt-3 font-semibold text-main">{title}</div>

      <p className="mt-1 text-sm leading-5 text-muted">{text}</p>
    </div>
  );
}