import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Database,
  Eye,
  FileWarning,
  GitBranch,
  Inbox,
  KeyRound,
  Layers3,
  Lock,
  MessageSquare,
  Network,
  Play,
  Radio,
  RefreshCcw,
  RotateCcw,
  Server,
  ShieldCheck,
  Terminal,
  Timer,
  Workflow,
  X,
  Zap,
} from 'lucide-react';

type Layer =
  | 'api'
  | 'application'
  | 'database'
  | 'outbox'
  | 'relay'
  | 'kafka'
  | 'consumer';

type TraceStep = {
  id: number;
  layer: Layer;
  title: string;
  file: string;
  description: string;
  action: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
};

const traceSteps: TraceStep[] = [
  {
    id: 1,
    layer: 'api',
    title: 'Request enters RelayX',
    file: 'Event Ingestion',
    description:
      'An API client submits an event or creates a business operation through the HTTP API.',
    action: 'HTTP request → API layer',
    icon: Activity,
    color: 'blue',
  },
  {
    id: 2,
    layer: 'application',
    title: 'Application service handles the operation',
    file: 'OrderService.java',
    description:
      'The application layer coordinates the business operation and the data that must be persisted.',
    action: 'Application logic',
    icon: Workflow,
    color: 'blue',
  },
  {
    id: 3,
    layer: 'database',
    title: 'Business state is persisted',
    file: 'OrderRepository',
    description:
      'The business record is written to the relational database.',
    action: 'OrderRepository → database',
    icon: Database,
    color: 'purple',
  },
  {
    id: 4,
    layer: 'outbox',
    title: 'Event is persisted in the outbox',
    file: 'OutboxRepository',
    description:
      'The event is stored as durable database state instead of depending on Kafka being available during the request.',
    action: 'OutboxRepository → outbox_events',
    icon: Inbox,
    color: 'orange',
  },
  {
    id: 5,
    layer: 'relay',
    title: 'Relay finds work',
    file: 'OutboxService.java',
    description:
      'The outbox layer provides the relay with events that are eligible for delivery.',
    action: 'Outbox queries',
    icon: RefreshCcw,
    color: 'orange',
  },
  {
    id: 6,
    layer: 'relay',
    title: 'Relay attempts delivery',
    file: 'RelayService.java',
    description:
      'The relay service takes the stored event and sends it toward the Kafka producer.',
    action: 'RelayService → Kafka Producer',
    icon: Radio,
    color: 'blue',
  },
  {
    id: 7,
    layer: 'kafka',
    title: 'Kafka receives the event',
    file: 'Kafka Producer',
    description:
      'The event is published to the configured Kafka broker/topic.',
    action: 'Producer → Kafka Broker',
    icon: Zap,
    color: 'green',
  },
  {
    id: 8,
    layer: 'consumer',
    title: 'Consumer processes the event',
    file: 'Kafka Consumer',
    description:
      'A downstream consumer receives the event and records processing information.',
    action: 'Kafka Consumer → Processed Events',
    icon: CheckCircle2,
    color: 'green',
  },
];

export default function Architecture() {
  const [activeLayer, setActiveLayer] = useState<Layer | null>(null);
  const [traceStep, setTraceStep] = useState(1);
  const [expandedPackage, setExpandedPackage] = useState<string | null>(
    'outbox',
  );

  const currentTrace = traceSteps[traceStep - 1];

  return (
    <div className="max-w-7xl mx-auto space-y-20 pb-20">
    
      {/* ============================================================
          HEADER
      ============================================================ */}

      <header className="border-b border-border pb-10">

        <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-primary mb-5">
          <Code2 className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#3B82F6]" />
          RELAYX / BACKEND ARCHITECTURE
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-end">

          <div>
            <h1  className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Inside RelayX.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed">
              Follow an event from the API request to the database,
              outbox, relay, Kafka, and consumer.
            </p>

            <p className="text-muted mt-5 max-w-3xl leading-relaxed">
              This page explains the actual backend structure behind RelayX:
              which layer owns each responsibility, where persistence happens,
              where delivery happens, and how the system behaves when delivery
              fails.
            </p>
          </div>

          <div className="border border-primary/20 bg-primary/5 rounded-2xl p-5">

            <div className="flex items-center gap-3 mb-4">
              <Network className="w-5 h-5 text-primary" />

              <span className="text-xs font-mono text-primary">
                EVENT PATH
              </span>
            </div>

            <div className="font-mono text-xs leading-loose text-slate-300">
              API
              <span className="text-muted"> → </span>
              DATABASE
              <span className="text-muted"> → </span>
              OUTBOX
              <span className="text-muted"> → </span>
              RELAY
              <span className="text-muted"> → </span>
              KAFKA
              <span className="text-muted"> → </span>
              CONSUMER
            </div>

          </div>

        </div>

        <div className="flex flex-wrap gap-2 mt-8">
          <Tag icon={Server}>Spring Boot</Tag>
          <Tag icon={Database}>Relational Database</Tag>
          <Tag icon={Inbox}>Transactional Outbox</Tag>
          <Tag icon={RefreshCcw}>Relay Worker</Tag>
          <Tag icon={Radio}>Kafka</Tag>
          <Tag icon={ShieldCheck}>At-Least-Once</Tag>
        </div>
      </header>


      {/* ============================================================
          SECTION 01 — REAL BACKEND TOPOLOGY
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="01"
          eyebrow="REAL BACKEND TOPOLOGY"
          title="This is how RelayX is actually divided."
          description="The system is separated into API/application responsibilities, persistence, outbox querying, delivery, Kafka transport, and consumer processing."
        />

        <div className="bg-surface border border-border rounded-2xl p-5 md:p-8 overflow-x-auto">

          <div className="min-w-[1000px]">

            {/* API */}
            <ArchitectureGroup
              title="API & APPLICATION"
              color="blue"
            >
              <ArchitectureNode
                icon={Activity}
                title="Event Ingestion"
                subtitle="Accepts events"
                active={activeLayer === 'api'}
                onClick={() => setActiveLayer('api')}
              />

              <ArchitectureNode
                icon={Layers3}
                title="Order Service"
                subtitle="OrderService.java"
                active={activeLayer === 'application'}
                onClick={() => setActiveLayer('application')}
              />

              <ArchitectureNode
                icon={Play}
                title="Demo Service"
                subtitle="DemoService.java"
                active={activeLayer === 'application'}
                onClick={() => setActiveLayer('application')}
              />

              <ArchitectureNode
                icon={KeyRound}
                title="Project API"
                subtitle="Projects / API keys"
                active={activeLayer === 'api'}
                onClick={() => setActiveLayer('api')}
              />
            </ArchitectureGroup>

            <VerticalArrow />

            {/* DATABASE */}
            <ArchitectureGroup
              title="TRANSACTIONAL OUTBOX"
              color="orange"
            >

              <ArchitectureNode
                icon={Database}
                title="Order Repository"
                subtitle="Business state"
                active={activeLayer === 'database'}
                onClick={() => setActiveLayer('database')}
              />

              <ArchitectureNode
                icon={GitBranch}
                title="Sequence Repository"
                subtitle="Sequence allocation"
                active={activeLayer === 'database'}
                onClick={() => setActiveLayer('database')}
              />

              <ArchitectureNode
                icon={Inbox}
                title="Outbox Repository"
                subtitle="Event persistence"
                active={activeLayer === 'outbox'}
                onClick={() => setActiveLayer('outbox')}
              />

            </ArchitectureGroup>

            <VerticalArrow />

            {/* DATABASE */}
            <div className="flex justify-center">
              <div className="border border-orange-400/30 bg-orange-400/5 rounded-xl px-8 py-5 text-center min-w-[260px]">

                <Database className="w-7 h-7 mx-auto text-orange-300 mb-3" />

                <div className="font-semibold text-white">
                  Relational Database
                </div>

                <div className="text-xs text-muted mt-1">
                  Durable application state
                </div>

              </div>
            </div>

            <VerticalArrow />

            {/* OUTBOX QUERY */}
            <ArchitectureGroup
              title="OUTBOX QUERY / DELIVERY"
              color="orange"
            >

              <ArchitectureNode
                icon={Inbox}
                title="Outbox Queries"
                subtitle="OutboxService.java"
                active={activeLayer === 'outbox'}
                onClick={() => setActiveLayer('outbox')}
              />

              <ArchitectureNode
                icon={RefreshCcw}
                title="Relay Service"
                subtitle="RelayService.java"
                active={activeLayer === 'relay'}
                onClick={() => setActiveLayer('relay')}
              />

              <ArchitectureNode
                icon={Radio}
                title="Kafka Producer"
                subtitle="Publishes events"
                active={activeLayer === 'kafka'}
                onClick={() => setActiveLayer('kafka')}
              />

            </ArchitectureGroup>

            <VerticalArrow />

            {/* KAFKA */}
            <div className="flex justify-center">

              <div
                className={`
                  border rounded-xl px-10 py-5 text-center min-w-[260px]
                  transition-all
                  ${
                    activeLayer === 'kafka'
                      ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                      : 'border-border bg-surfaceHover'
                  }
                `}
              >

                <Radio className="w-7 h-7 mx-auto text-primary mb-3" />

                <div className="font-semibold text-white">
                  Kafka Broker
                </div>

                <div className="text-xs text-muted mt-1">
                  Event transport
                </div>

              </div>

            </div>

            <VerticalArrow />

            {/* CONSUMER */}
            <ArchitectureGroup
              title="CONSUMER SIDE"
              color="green"
            >

              <ArchitectureNode
                icon={MessageSquare}
                title="Kafka Consumer"
                subtitle="Consumes messages"
                active={activeLayer === 'consumer'}
                onClick={() => setActiveLayer('consumer')}
              />

              <ArchitectureNode
                icon={ShieldCheck}
                title="Processed Events"
                subtitle="Duplicate protection"
                active={activeLayer === 'consumer'}
                onClick={() => setActiveLayer('consumer')}
              />

            </ArchitectureGroup>

          </div>
        </div>

        {activeLayer && (
          <LayerInspector layer={activeLayer} />
        )}

      </section>


      {/* ============================================================
          SECTION 02 — TRACE AN EVENT
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="02"
          eyebrow="TRACE AN EVENT"
          title="Watch one event move through the backend."
          description="Select a stage to see which part of the backend owns it and what happens there."
        />

        <div className="grid lg:grid-cols-[280px_1fr] gap-5">

          <div className="bg-surface border border-border rounded-2xl p-3">

            {traceSteps.map((step) => {
              const Icon = step.icon;
              const selected = step.id === traceStep;

              return (
                <button
                  key={step.id}
                  onClick={() => setTraceStep(step.id)}
                  className={`
                    w-full text-left rounded-xl p-3 transition-all
                    flex items-center gap-3
                    ${
                      selected
                        ? 'bg-primary/10 border border-primary/30'
                        : 'border border-transparent hover:bg-surfaceHover'
                    }
                  `}
                >

                  <div
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${
                        selected
                          ? 'bg-primary/10 text-primary'
                          : 'bg-surfaceHover text-muted'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">

                    <div className="text-xs font-mono text-muted">
                      STEP {String(step.id).padStart(2, '0')}
                    </div>

                    <div
                      className={`
                        text-sm font-medium truncate
                        ${selected ? 'text-white' : 'text-slate-300'}
                      `}
                    >
                      {step.title}
                    </div>

                  </div>

                </button>
              );
            })}

          </div>


          <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">

            <div className="flex items-center justify-between mb-8">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <currentTrace.icon className="w-5 h-5 text-primary" />
                </div>

                <div>
                  <div className="text-xs font-mono text-primary">
                    STEP {String(currentTrace.id).padStart(2, '0')}
                  </div>

                  <h3 className="font-semibold text-white mt-1">
                    {currentTrace.title}
                  </h3>
                </div>

              </div>

              <span className="text-xs font-mono text-muted">
                {currentTrace.layer.toUpperCase()}
              </span>

            </div>


            <div className="grid md:grid-cols-2 gap-5">

              <div className="border border-border bg-surfaceHover rounded-xl p-5">

                <div className="text-xs text-muted mb-3">
                  CODE / COMPONENT
                </div>

                <div className="font-mono text-primary text-sm">
                  {currentTrace.file}
                </div>

                <div className="mt-5 pt-5 border-t border-border">

                  <div className="text-xs text-muted mb-2">
                    RESPONSIBILITY
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {currentTrace.description}
                  </p>

                </div>

              </div>


              <div className="border border-primary/20 bg-primary/5 rounded-xl p-5">

                <div className="flex items-center gap-2 text-xs text-primary mb-3">
                  <Terminal className="w-4 h-4" />
                  EXECUTION PATH
                </div>

                <div className="font-mono text-sm text-white leading-relaxed">
                  {currentTrace.action}
                </div>

                <div className="mt-5 flex gap-2">

                  {traceStep > 1 && (
                    <button
                      onClick={() =>
                        setTraceStep((value) => Math.max(1, value - 1))
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-surfaceHover text-xs text-muted hover:text-white"
                    >
                      Previous
                    </button>
                  )}

                  {traceStep < traceSteps.length && (
                    <button
                      onClick={() =>
                        setTraceStep((value) =>
                          Math.min(traceSteps.length, value + 1),
                        )
                      }
                      className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium flex items-center gap-2"
                    >
                      Next step
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ============================================================
          SECTION 03 — TRANSACTION BOUNDARY
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="03"
          eyebrow="THE CRITICAL BOUNDARY"
          title="Business state and event state are persisted together."
          description="This is the core of the transactional outbox design. Kafka is deliberately outside the database transaction."
        />

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">

          <div className="p-6 md:p-8">

            <div className="flex items-center gap-2 text-xs font-mono text-success mb-5">
              <Lock className="w-4 h-4" />
              DATABASE TRANSACTION
            </div>

            <div className="border border-success/30 bg-success/5 rounded-2xl p-6">

              <div className="grid md:grid-cols-3 gap-4 items-center">

                <TransactionBox
                  icon={Server}
                  title="OrderService.java"
                  text="Coordinates the operation"
                />

                <div className="hidden md:flex justify-center">
                  <ArrowRight className="text-success w-5 h-5" />
                </div>

                <div className="space-y-3">

                  <TransactionBox
                    icon={Database}
                    title="OrderRepository"
                    text="Persist business state"
                  />

                  <TransactionBox
                    icon={Inbox}
                    title="OutboxRepository"
                    text="Persist event state"
                    active
                  />

                </div>

              </div>

              <div className="mt-6 flex justify-center">

                <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-success/30 bg-success/10 text-success text-xs font-mono">
                  <Check className="w-4 h-4" />
                  COMMIT
                </div>

              </div>

            </div>


            <div className="grid md:grid-cols-2 gap-4 mt-5">

              <ResultCard
                icon={CheckCircle2}
                title="Commit succeeds"
                text="Both business state and the outbox event become durable."
                success
              />

              <ResultCard
                icon={RotateCcw}
                title="Transaction fails"
                text="The database transaction rolls back instead of leaving half-written state."
              />

            </div>

          </div>


          <div className="border-t border-border p-6 bg-surfaceHover">

            <div className="flex gap-4">

              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />

              <div>

                <h3 className="font-semibold text-white">
                  Kafka is not part of this transaction.
                </h3>

                <p className="text-sm text-muted mt-2 leading-relaxed">
                  RelayX does not attempt to make PostgreSQL and Kafka one
                  distributed transaction. The database first establishes
                  durable application state. The relay handles delivery
                  afterward.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ============================================================
          SECTION 04 — OUTBOX LIFECYCLE
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="04"
          eyebrow="OUTBOX LIFECYCLE"
          title="The outbox turns delivery into durable state."
          description="Instead of keeping an event only in memory while trying to reach Kafka, RelayX stores the delivery work in the database."
        />

        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">

          <div className="grid md:grid-cols-3 gap-5">

            <LifecycleCard
              status="PENDING"
              icon={Clock3}
              color="blue"
              title="Waiting"
              text="The event exists and is eligible for delivery."
            />

            <LifecycleCard
              status="PUBLISHED"
              icon={CheckCircle2}
              color="green"
              title="Delivered"
              text="The relay completed the publication path."
            />

            <LifecycleCard
              status="DEAD"
              icon={FileWarning}
              color="red"
              title="Exhausted"
              text="The event reached the configured retry boundary."
            />

          </div>


          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-3">

            <StatusPill label="PENDING" />

            <FlowArrow label="delivery succeeds" />

            <StatusPill label="PUBLISHED" success />

          </div>


          <div className="flex justify-center my-3">
            <ArrowDown className="w-4 h-4 text-muted" />
          </div>

          <div className="flex justify-center">

            <div className="text-xs font-mono text-danger border border-danger/20 bg-danger/5 px-4 py-2 rounded-lg">
              repeated failure → DEAD
            </div>

          </div>

        </div>

      </section>


      {/* ============================================================
          SECTION 05 — RELAY WORKER
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="05"
          eyebrow="RELAY DELIVERY"
          title="The relay owns the delivery problem."
          description="The request path stores durable work. The relay later turns that stored work into Kafka messages."
        />

        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">

          <div className="grid md:grid-cols-5 gap-3">

            <RelayStep
              number="01"
              icon={Inbox}
              title="Query"
              text="OutboxService queries events."
            />

            <RelayStep
              number="02"
              icon={Lock}
              title="Claim"
              text="Events are selected for processing."
            />

            <RelayStep
              number="03"
              icon={Radio}
              title="Publish"
              text="RelayService sends them toward Kafka."
            />

            <RelayStep
              number="04"
              icon={Check}
              title="Success"
              text="Delivery state becomes successful."
              success
            />

            <RelayStep
              number="05"
              icon={RotateCcw}
              title="Failure"
              text="Retry state is recorded."
              danger
            />

          </div>


          <div className="mt-8 border border-border rounded-xl overflow-hidden">

            <div className="px-5 py-4 border-b border-border flex items-center gap-3">

              <Timer className="w-5 h-5 text-warning" />

              <div>
                <div className="font-semibold text-white">
                  Retry scheduling
                </div>

                <div className="text-xs text-muted mt-1">
                  Failed delivery becomes future work.
                </div>
              </div>

            </div>

            <div className="p-5">

              <div className="font-mono text-sm text-primary bg-black/20 border border-border rounded-lg p-4 overflow-x-auto">
                retryCount → nextRetryAt → eligible again
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-4">

                <SmallInfo
                  label="retryCount"
                  text="How many delivery attempts have occurred."
                />

                <SmallInfo
                  label="nextRetryAt"
                  text="When the event becomes eligible again."
                />

                <SmallInfo
                  label="lastError"
                  text="The latest delivery failure information."
                />

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ============================================================
          SECTION 06 — FAILURE RECOVERY
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="06"
          eyebrow="FAILURE RECOVERY"
          title="What actually happens when Kafka goes down?"
          description="The important part is not that Kafka never fails. The important part is that a Kafka failure does not erase the durable event."
        />

        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">

          <FailureTimeline />

        </div>

      </section>


      {/* ============================================================
          SECTION 07 — DUPLICATES / IDEMPOTENCY
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="07"
          eyebrow="DELIVERY SEMANTICS"
          title="At-least-once means duplicates are possible."
          description="A network failure can occur after Kafka accepts an event but before the relay knows the result. A retry can therefore produce another delivery."
        />

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">

          <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">

            <div className="flex flex-col items-center gap-3">

              <EventNode
                icon={RefreshCcw}
                title="Relay Service"
              />

              <ArrowDown className="w-4 h-4 text-muted" />

              <EventNode
                icon={Radio}
                title="Kafka Producer"
              />

              <ArrowDown className="w-4 h-4 text-muted" />

              <EventNode
                icon={Radio}
                title="Kafka Broker"
                success
              />

              <div className="flex items-center gap-3 text-xs text-warning font-mono">
                <AlertTriangle className="w-4 h-4" />
                acknowledgement / network uncertainty
              </div>

              <ArrowDown className="w-4 h-4 text-muted" />

              <EventNode
                icon={RotateCcw}
                title="Relay retries"
              />

            </div>

          </div>


          <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">

            <div className="flex items-center gap-3 mb-6">

              <ShieldCheck className="w-5 h-5 text-success" />

              <div>
                <h3 className="font-semibold text-white">
                  Consumer protection
                </h3>

                <p className="text-xs text-muted mt-1">
                  Processed Events
                </p>
              </div>

            </div>

            <div className="space-y-3">

              <DuplicateStep
                number="01"
                text="Consumer receives event."
              />

              <DuplicateStep
                number="02"
                text="Consumer checks whether it was already processed."
              />

              <DuplicateStep
                number="03"
                text="New event → process and record."
              />

              <DuplicateStep
                number="04"
                text="Duplicate → safely ignore."
                success
              />

            </div>

          </div>

        </div>


        <div className="p-5 border border-warning/20 bg-warning/5 rounded-xl">

          <div className="flex gap-3">

            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />

            <p className="text-sm text-muted leading-relaxed">
              RelayX intentionally does not claim exactly-once delivery.
              The architecture instead combines durable outbox state,
              at-least-once delivery, and consumer-side idempotency.
            </p>

          </div>

        </div>

      </section>


      {/* ============================================================
          SECTION 08 — ORDERING
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="08"
          eyebrow="ORDERING"
          title="Related events carry sequence information."
          description="The architecture includes a Sequence Repository for allocating and locking sequence state. This allows the system to reason about event order for related entities."
        />

        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">

          <div className="bg-surface border border-border rounded-2xl p-6">

            <div className="flex items-center gap-3 mb-5">

              <GitBranch className="w-5 h-5 text-primary" />

              <div>
                <div className="font-semibold text-white">
                  Sequence Repository
                </div>

                <div className="text-xs text-muted mt-1">
                  Allocate / lock sequence
                </div>
              </div>

            </div>

            <div className="space-y-3">

              <SequenceEvent
                number="101"
                event="OrderCreated"
              />

              <SequenceEvent
                number="102"
                event="OrderPaid"
              />

              <SequenceEvent
                number="103"
                event="OrderShipped"
              />

            </div>

          </div>


          <div className="bg-surface border border-border rounded-2xl p-6">

            <div className="text-xs font-mono text-primary mb-4">
              ORDERING MODEL
            </div>

            <div className="font-mono text-sm text-white leading-loose">

              aggregate
              <span className="text-muted"> → </span>
              sequence
              <span className="text-muted"> → </span>
              event

            </div>

            <div className="mt-5 pt-5 border-t border-border">

              <p className="text-sm text-muted leading-relaxed">
                The sequence mechanism is scoped around related event state.
                It should not be interpreted as a promise of global ordering
                across every event in the system.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ============================================================
          SECTION 09 — PACKAGE MAP
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="09"
          eyebrow="SOURCE TREE"
          title="Where these responsibilities live in the backend."
          description="The package structure separates business operations, event ingestion, persistence, project management, and delivery."
        />

        <div className="grid lg:grid-cols-2 gap-4">

          <PackageCard
            name="common/"
            description="Shared backend components."
            expanded={expandedPackage === 'common'}
            onClick={() =>
              setExpandedPackage(
                expandedPackage === 'common' ? null : 'common',
              )
            }
            files={['Shared components / infrastructure']}
          />

          <PackageCard
            name="ingestion/"
            description="Entry point for incoming events."
            expanded={expandedPackage === 'ingestion'}
            onClick={() =>
              setExpandedPackage(
                expandedPackage === 'ingestion' ? null : 'ingestion',
              )
            }
            files={['Event Ingestion']}
          />

          <PackageCard
            name="order/"
            description="Business order workflow."
            expanded={expandedPackage === 'order'}
            onClick={() =>
              setExpandedPackage(
                expandedPackage === 'order' ? null : 'order',
              )
            }
            files={[
              'OrderService.java',
              'OrderRepository',
            ]}
          />

          <PackageCard
            name="outbox/"
            description="Durable event state and outbox queries."
            expanded={expandedPackage === 'outbox'}
            onClick={() =>
              setExpandedPackage(
                expandedPackage === 'outbox' ? null : 'outbox',
              )
            }
            files={[
              'OutboxService.java',
              'OutboxRepository',
              'Outbox Queries',
            ]}
          />

          <PackageCard
            name="project/"
            description="Project and API-key related operations."
            expanded={expandedPackage === 'project'}
            onClick={() =>
              setExpandedPackage(
                expandedPackage === 'project' ? null : 'project',
              )
            }
            files={['Project API', 'API key management']}
          />

          <PackageCard
            name="relay/"
            description="Event delivery and Kafka integration."
            expanded={expandedPackage === 'relay'}
            onClick={() =>
              setExpandedPackage(
                expandedPackage === 'relay' ? null : 'relay',
              )
            }
            files={[
              'RelayService.java',
              'Kafka Producer',
              'Kafka Consumer',
              'Processed Events',
            ]}
          />

        </div>

      </section>


      {/* ============================================================
          SECTION 10 — OPERATIONS PLANE
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="10"
          eyebrow="OPERATIONS PLANE"
          title="The management APIs are separate from the delivery path."
          description="RelayX has an operational layer for inspecting events, monitoring the relay, observing metrics, and deliberately triggering failure scenarios."
        />

        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

            <OperationsCard
              icon={Activity}
              title="Dashboard API"
              text="Aggregated system and delivery information."
            />

            <OperationsCard
              icon={Eye}
              title="Event Explorer API"
              text="Inspect event and outbox state."
            />

            <OperationsCard
              icon={AlertTriangle}
              title="Failure Simulation"
              text="Deliberately trigger failure scenarios."
              danger
            />

            <OperationsCard
              icon={RefreshCcw}
              title="Relay Status API"
              text="Inspect relay state and delivery activity."
            />

            <OperationsCard
              icon={Activity}
              title="Relay Metrics"
              text="Expose operational measurements."
            />

            <OperationsCard
              icon={KeyRound}
              title="API Key Filter"
              text="Authenticate incoming API requests."
            />

          </div>

        </div>


        <div className="border border-primary/20 bg-primary/5 rounded-2xl p-6">

          <div className="flex gap-4">

            <Eye className="w-5 h-5 text-primary shrink-0" />

            <div>

              <h3 className="font-semibold text-white">
                Control plane vs delivery path
              </h3>

              <p className="text-sm text-muted mt-2 leading-relaxed">
                These operational APIs observe and control the system.
                They are not the mechanism that makes the transactional
                outbox reliable. The core delivery path remains:
              </p>

              <div className="font-mono text-xs text-primary mt-4 overflow-x-auto">
                application → database → outbox → relay → Kafka → consumer
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ============================================================
          SECTION 11 — FAILURE MATRIX
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="11"
          eyebrow="FAILURE MODEL"
          title="Every major failure has a different recovery path."
          description="RelayX is designed around what happens when individual components fail, not only around the happy path."
        />

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">

          <div className="grid grid-cols-[1fr_1fr_1fr] px-5 py-4 border-b border-border text-xs font-mono text-muted">
            <span>FAILURE</span>
            <span>WHAT SURVIVES</span>
            <span>RECOVERY</span>
          </div>

          <FailureRow
            failure="Kafka unavailable"
            survives="Outbox event in database"
            recovery="Retry after backoff"
          />

          <FailureRow
            failure="Temporary delivery error"
            survives="Event + retry metadata"
            recovery="nextRetryAt"
          />

          <FailureRow
            failure="Repeated delivery"
            survives="Event identity"
            recovery="Consumer idempotency"
          />

          <FailureRow
            failure="Retry budget exhausted"
            survives="DEAD event + error"
            recovery="DLQ retry / discard"
          />

          <FailureRow
            failure="Need to investigate"
            survives="Event + delivery state"
            recovery="Explorer / metrics / status APIs"
          />

        </div>

      </section>


      {/* ============================================================
          SECTION 12 — COMPLETE FLOW
      ============================================================ */}

      <section className="space-y-7">

        <SectionHeading
          number="12"
          eyebrow="COMPLETE BACKEND FLOW"
          title="Now put the whole system together."
          description="This is the complete journey of an event through the RelayX backend."
        />

        <div className="bg-surface border border-border rounded-2xl p-6 md:p-10">

          <div className="space-y-2">

            <CompleteFlowRow
              number="01"
              icon={Activity}
              title="API Client"
              detail="Submits an order or event."
            />

            <FlowConnector />

            <CompleteFlowRow
              number="02"
              icon={KeyRound}
              title="API Key Filter"
              detail="Authenticates the incoming API request."
            />

            <FlowConnector />

            <CompleteFlowRow
              number="03"
              icon={Workflow}
              title="Application Service"
              detail="OrderService.java / Event Ingestion coordinates the operation."
              highlight
            />

            <FlowConnector />

            <CompleteFlowRow
              number="04"
              icon={Database}
              title="Transactional Persistence"
              detail="OrderRepository + SequenceRepository + OutboxRepository persist the required state."
              highlight
            />

            <FlowConnector />

            <CompleteFlowRow
              number="05"
              icon={Inbox}
              title="Relational Database"
              detail="The event becomes durable outbox state."
              highlight
            />

            <FlowConnector />

            <CompleteFlowRow
              number="06"
              icon={RefreshCcw}
              title="OutboxService.java"
              detail="Queries events that are eligible for delivery."
            />

            <FlowConnector />

            <CompleteFlowRow
              number="07"
              icon={Radio}
              title="RelayService.java"
              detail="Owns the delivery attempt toward Kafka."
            />

            <FlowConnector />

            <CompleteFlowRow
              number="08"
              icon={Zap}
              title="Kafka Producer → Kafka Broker"
              detail="The stored event is published to the messaging system."
              success
            />

            <FlowConnector />

            <CompleteFlowRow
              number="09"
              icon={MessageSquare}
              title="Kafka Consumer"
              detail="Downstream processing begins."
            />

            <FlowConnector />

            <CompleteFlowRow
              number="10"
              icon={ShieldCheck}
              title="Processed Events"
              detail="Consumer-side processing state supports duplicate-safe handling."
              success
            />

          </div>

        </div>

      </section>


      {/* ============================================================
          FINAL MESSAGE
      ============================================================ */}

      <section className="border border-primary/20 bg-primary/5 rounded-2xl p-8 md:p-10">

        <div className="flex flex-col md:flex-row gap-6">

          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>

          <div>

            <div className="text-xs font-mono text-primary mb-3">
              THE ARCHITECTURAL IDEA
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white">
              RelayX separates persistence from delivery.
            </h2>

            <p className="text-muted mt-4 max-w-4xl leading-relaxed">
              The application does not need Kafka to be available at the exact
              moment business state is committed. The event first becomes
              durable database state. The relay then owns the responsibility of
              delivering that state to Kafka, recovering from transient
              failures, and exposing the delivery lifecycle to operators.
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              <Tag icon={Database}>Durable state</Tag>
              <Tag icon={Inbox}>Outbox</Tag>
              <Tag icon={RefreshCcw}>Retry</Tag>
              <Tag icon={Radio}>Kafka</Tag>
              <Tag icon={ShieldCheck}>Idempotency</Tag>
              <Tag icon={Eye}>Observability</Tag>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}


/* =================================================================
   SECTION COMPONENTS
================================================================= */

function SectionHeading({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-4xl">

      <div className="flex items-center gap-3 mb-3">

        <span className="text-xs font-mono text-primary">
          {number}
        </span>

        <span className="text-xs font-semibold tracking-[0.18em] text-muted">
          {eyebrow}
        </span>

      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-white">
        {title}
      </h2>

      <p className="text-muted mt-3 leading-relaxed">
        {description}
      </p>

    </div>
  );
}


function ArchitectureGroup({
  title,
  color,
  children,
}: {
  title: string;
  color: 'blue' | 'orange' | 'green';
  children: React.ReactNode;
}) {
  const colorClass =
    color === 'blue'
      ? 'border-primary/20 bg-primary/[0.025]'
      : color === 'orange'
        ? 'border-orange-400/20 bg-orange-400/[0.025]'
        : 'border-success/20 bg-success/[0.025]';

  return (
    <div className={`border rounded-2xl p-5 ${colorClass}`}>

      <div className="text-[10px] font-mono tracking-[0.18em] text-muted mb-4">
        {title}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {children}
      </div>

    </div>
  );
}


function ArchitectureNode({
  icon: Icon,
  title,
  subtitle,
  active = false,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        text-left border rounded-xl p-4 min-w-[190px]
        transition-all duration-200
        ${
          active
            ? 'border-primary/50 bg-primary/10 shadow-[0_0_25px_rgba(59,130,246,0.1)]'
            : 'border-border bg-surfaceHover hover:border-primary/30'
        }
      `}
    >

      <Icon
        className={`
          w-5 h-5 mb-3
          ${active ? 'text-primary' : 'text-muted'}
        `}
      />

      <div className="font-semibold text-white text-sm">
        {title}
      </div>

      <div className="text-xs text-muted mt-1">
        {subtitle}
      </div>

    </button>
  );
}


function LayerInspector({ layer }: { layer: Layer }) {
  const data: Record<
    Layer,
    {
      title: string;
      icon: LucideIcon;
      text: string;
      files: string[];
    }
  > = {
    api: {
      title: 'API layer',
      icon: Activity,
      text: 'Receives requests, authenticates them, and routes them into the application/domain operations.',
      files: ['Event Ingestion', 'Project API', 'API Key Filter'],
    },

    application: {
      title: 'Application layer',
      icon: Workflow,
      text: 'Coordinates business operations such as order creation and the data that must be persisted.',
      files: ['OrderService.java', 'DemoService.java'],
    },

    database: {
      title: 'Persistence layer',
      icon: Database,
      text: 'Owns durable business and sequence state inside the relational database.',
      files: ['OrderRepository', 'SequenceRepository'],
    },

    outbox: {
      title: 'Outbox layer',
      icon: Inbox,
      text: 'Owns durable event state and exposes the event records required by the relay.',
      files: ['OutboxRepository', 'OutboxService.java', 'Outbox Queries'],
    },

    relay: {
      title: 'Relay layer',
      icon: RefreshCcw,
      text: 'Turns durable outbox state into delivery attempts and handles the delivery lifecycle.',
      files: ['RelayService.java'],
    },

    kafka: {
      title: 'Kafka transport',
      icon: Radio,
      text: 'Carries the event from the relay toward downstream consumers.',
      files: ['Kafka Producer', 'Kafka Broker'],
    },

    consumer: {
      title: 'Consumer layer',
      icon: ShieldCheck,
      text: 'Consumes published events and records processed-event information to support duplicate-safe processing.',
      files: ['Kafka Consumer', 'Processed Events'],
    },
  };

  const item = data[layer];
  const Icon = item.icon;

  return (
    <div className="border border-primary/20 bg-primary/5 rounded-xl p-5">

      <div className="flex items-start gap-4">

        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1">

          <h3 className="font-semibold text-white">
            {item.title}
          </h3>

          <p className="text-sm text-muted mt-2 leading-relaxed">
            {item.text}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">

            {item.files.map((file) => (
              <span
                key={file}
                className="font-mono text-xs text-primary border border-primary/20 bg-primary/5 rounded px-2 py-1"
              >
                {file}
              </span>
            ))}

          </div>

        </div>

      </div>

    </div>
  );
}


function VerticalArrow() {
  return (
    <div className="flex justify-center py-3">
      <ArrowDown className="w-5 h-5 text-muted" />
    </div>
  );
}


function TransactionBox({
  icon: Icon,
  title,
  text,
  active = false,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`
        border rounded-xl p-5
        ${
          active
            ? 'border-primary/30 bg-primary/5'
            : 'border-border bg-surfaceHover'
        }
      `}
    >

      <Icon
        className={`w-5 h-5 mb-3 ${
          active ? 'text-primary' : 'text-muted'
        }`}
      />

      <div className="font-mono text-sm text-white">
        {title}
      </div>

      <div className="text-xs text-muted mt-1">
        {text}
      </div>

    </div>
  );
}


function ResultCard({
  icon: Icon,
  title,
  text,
  success = false,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  success?: boolean;
}) {
  return (
    <div
      className={`
        border rounded-xl p-5
        ${
          success
            ? 'border-success/20 bg-success/5'
            : 'border-border bg-surfaceHover'
        }
      `}
    >

      <Icon
        className={`w-5 h-5 ${
          success ? 'text-success' : 'text-muted'
        }`}
      />

      <h3 className="font-semibold text-white mt-4">
        {title}
      </h3>

      <p className="text-sm text-muted leading-relaxed mt-2">
        {text}
      </p>

    </div>
  );
}


function LifecycleCard({
  status,
  icon: Icon,
  color,
  title,
  text,
}: {
  status: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red';
  title: string;
  text: string;
}) {
  const colorClasses = {
    blue: 'text-primary border-primary/20 bg-primary/5',
    green: 'text-success border-success/20 bg-success/5',
    red: 'text-danger border-danger/20 bg-danger/5',
  };

  return (
    <div className={`border rounded-xl p-5 ${colorClasses[color]}`}>

      <div className="flex items-center justify-between">

        <Icon className="w-5 h-5" />

        <span className="font-mono text-xs font-bold">
          {status}
        </span>

      </div>

      <h3 className="text-white font-semibold mt-5">
        {title}
      </h3>

      <p className="text-sm text-muted leading-relaxed mt-2">
        {text}
      </p>

    </div>
  );
}


function StatusPill({
  label,
  success = false,
}: {
  label: string;
  success?: boolean;
}) {
  return (
    <div
      className={`
        px-5 py-2.5 rounded-lg border
        text-xs font-mono font-bold
        ${
          success
            ? 'border-success/30 bg-success/5 text-success'
            : 'border-border bg-surfaceHover text-muted'
        }
      `}
    >
      {label}
    </div>
  );
}


function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">

      <ArrowRight className="w-4 h-4 text-muted" />

      <span className="text-[9px] font-mono text-muted whitespace-nowrap">
        {label}
      </span>

    </div>
  );
}


function RelayStep({
  number,
  icon: Icon,
  title,
  text,
  success = false,
  danger = false,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  text: string;
  success?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`
        border rounded-xl p-4
        ${
          danger
            ? 'border-danger/20 bg-danger/5'
            : success
              ? 'border-success/20 bg-success/5'
              : 'border-border bg-surfaceHover'
        }
      `}
    >

      <div className="flex justify-between items-center mb-4">

        <Icon
          className={`
            w-5 h-5
            ${
              danger
                ? 'text-danger'
                : success
                  ? 'text-success'
                  : 'text-primary'
            }
          `}
        />

        <span className="font-mono text-xs text-muted">
          {number}
        </span>

      </div>

      <h3 className="font-semibold text-white text-sm">
        {title}
      </h3>

      <p className="text-xs text-muted mt-2 leading-relaxed">
        {text}
      </p>

    </div>
  );
}


function SmallInfo({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="border border-border bg-surfaceHover rounded-lg p-4">

      <div className="font-mono text-xs text-primary">
        {label}
      </div>

      <p className="text-xs text-muted mt-2 leading-relaxed">
        {text}
      </p>

    </div>
  );
}


function FailureTimeline() {
  const steps = [
    {
      icon: CheckCircle2,
      title: '1. Transaction commits',
      text: 'Business state and outbox state become durable together.',
      color: 'success',
    },
    {
      icon: RefreshCcw,
      title: '2. Relay queries the outbox',
      text: 'OutboxService finds the event that needs delivery.',
      color: 'primary',
    },
    {
      icon: X,
      title: '3. Kafka delivery fails',
      text: 'The broker or network is unavailable.',
      color: 'danger',
    },
    {
      icon: Database,
      title: '4. Event remains in PostgreSQL',
      text: 'The durable outbox record is not dependent on Kafka availability.',
      color: 'primary',
    },
    {
      icon: Timer,
      title: '5. Retry becomes scheduled work',
      text: 'Retry state such as retry count, next retry time and error information is retained.',
      color: 'warning',
    },
    {
      icon: Zap,
      title: '6. Kafka becomes available',
      text: 'The event becomes eligible for another delivery attempt.',
      color: 'primary',
    },
    {
      icon: Check,
      title: '7. Delivery succeeds',
      text: 'The event reaches the successful delivery state.',
      color: 'success',
    },
  ];

  return (
    <div className="relative">

      <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border" />

      <div className="space-y-6">

        {steps.map((step) => {
          const Icon = step.icon;

          const color =
            step.color === 'success'
              ? 'text-success border-success/30'
              : step.color === 'danger'
                ? 'text-danger border-danger/30'
                : step.color === 'warning'
                  ? 'text-warning border-warning/30'
                  : 'text-primary border-primary/30';

          return (
            <div
              key={step.title}
              className="relative flex gap-5"
            >

              <div
                className={`
                  w-10 h-10 rounded-full border
                  bg-surface flex items-center justify-center
                  shrink-0 z-10 ${color}
                `}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="pt-1">

                <h3 className="font-semibold text-white">
                  {step.title}
                </h3>

                <p className="text-sm text-muted mt-1 leading-relaxed">
                  {step.text}
                </p>

              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
}


function EventNode({
  icon: Icon,
  title,
  success = false,
}: {
  icon: LucideIcon;
  title: string;
  success?: boolean;
}) {
  return (
    <div
      className={`
        border rounded-xl px-6 py-4 min-w-[210px]
        flex items-center gap-3
        ${
          success
            ? 'border-success/30 bg-success/5'
            : 'border-border bg-surfaceHover'
        }
      `}
    >

      <Icon
        className={`w-5 h-5 ${
          success ? 'text-success' : 'text-primary'
        }`}
      />

      <span className="text-sm font-medium text-white">
        {title}
      </span>

    </div>
  );
}


function DuplicateStep({
  number,
  text,
  success = false,
}: {
  number: string;
  text: string;
  success?: boolean;
}) {
  return (
    <div
      className={`
        flex gap-3 p-3 rounded-lg border
        ${
          success
            ? 'border-success/20 bg-success/5'
            : 'border-border bg-surfaceHover'
        }
      `}
    >

      <span className="font-mono text-xs text-muted">
        {number}
      </span>

      <span className="text-sm text-slate-300">
        {text}
      </span>

    </div>
  );
}


function SequenceEvent({
  number,
  event,
}: {
  number: string;
  event: string;
}) {
  return (
    <div className="flex items-center gap-3 border border-border bg-surfaceHover rounded-lg p-3">

      <span className="w-8 h-8 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center font-mono text-xs text-primary">
        {number}
      </span>

      <span className="font-mono text-sm text-white">
        {event}
      </span>

      <ArrowRight className="w-4 h-4 text-muted ml-auto" />

    </div>
  );
}


function PackageCard({
  name,
  description,
  files,
  expanded,
  onClick,
}: {
  name: string;
  description: string;
  files: string[];
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border border-border bg-surface rounded-xl overflow-hidden">

      <button
        onClick={onClick}
        className="w-full text-left p-5 hover:bg-surfaceHover transition-colors"
      >

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-lg bg-surfaceHover border border-border flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary" />
            </div>

            <div>

              <div className="font-mono text-sm text-white">
                {name}
              </div>

              <div className="text-xs text-muted mt-1">
                {description}
              </div>

            </div>

          </div>

          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted" />
          )}

        </div>

      </button>

      {expanded && (
        <div className="border-t border-border p-4 bg-surfaceHover">

          <div className="space-y-2">

            {files.map((file) => (
              <div
                key={file}
                className="flex items-center gap-3 font-mono text-xs text-slate-300"
              >
                <CircleDot className="w-3 h-3 text-primary" />
                {file}
              </div>
            ))}

          </div>

        </div>
      )}

    </div>
  );
}


function OperationsCard({
  icon: Icon,
  title,
  text,
  danger = false,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`
        border rounded-xl p-5
        ${
          danger
            ? 'border-danger/20 bg-danger/5'
            : 'border-border bg-surfaceHover'
        }
      `}
    >

      <Icon
        className={`w-5 h-5 ${
          danger ? 'text-danger' : 'text-primary'
        }`}
      />

      <h3 className="font-semibold text-white mt-4">
        {title}
      </h3>

      <p className="text-sm text-muted mt-2 leading-relaxed">
        {text}
      </p>

    </div>
  );
}


function FailureRow({
  failure,
  survives,
  recovery,
}: {
  failure: string;
  survives: string;
  recovery: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border last:border-b-0">

      <div className="p-4 text-sm text-white">
        {failure}
      </div>

      <div className="p-4 text-sm text-muted border-l border-border">
        {survives}
      </div>

      <div className="p-4 text-sm text-primary border-l border-border">
        {recovery}
      </div>

    </div>
  );
}


function CompleteFlowRow({
  number,
  icon: Icon,
  title,
  detail,
  highlight = false,
  success = false,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  highlight?: boolean;
  success?: boolean;
}) {
  return (
    <div
      className={`
        flex gap-4 p-4 rounded-xl border
        ${
          success
            ? 'border-success/20 bg-success/5'
            : highlight
              ? 'border-primary/20 bg-primary/5'
              : 'border-border bg-surfaceHover'
        }
      `}
    >

      <div className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center shrink-0">

        <Icon
          className={`w-4 h-4 ${
            success ? 'text-success' : 'text-primary'
          }`}
        />

      </div>

      <div className="flex-1">

        <div className="flex items-center gap-3">

          <span className="font-mono text-[10px] text-muted">
            {number}
          </span>

          <h3 className="font-semibold text-white text-sm">
            {title}
          </h3>

        </div>

        <p className="text-sm text-muted mt-1">
          {detail}
        </p>

      </div>

    </div>
  );
}


function FlowConnector() {
  return (
    <div className="flex justify-center h-3">
      <div className="w-px h-full bg-border" />
    </div>
  );
}


function Tag({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surfaceHover text-xs font-mono text-muted">
      <Icon className="w-3 h-3 text-primary" />
      {children}
    </span>
  );
}