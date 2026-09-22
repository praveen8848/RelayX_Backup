import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Database,
  FileWarning,
  GitBranch,
  Inbox,
  Play,
  Radio,
  RefreshCcw,
  Server,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-full">
      {/* ================================================================ */}
      {/* HERO                                                             */}
      {/* ================================================================ */}

      <section className="relative overflow-hidden">
        {/* Background grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.035]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 md:pb-28 md:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            {/* Hero copy */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                EVENT DELIVERY INFRASTRUCTURE
              </div>

              <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-main md:text-6xl">
                Your database committed.
                <br />

                <span className="text-muted">
                  Your event didn't.
                </span>

                <br />

                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  Now what?
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-muted md:text-lg">
                RelayX makes database-backed event delivery durable,
                retryable and recoverable using the Transactional Outbox
                Pattern.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white shadow-lg shadow-primary/10 transition hover:-translate-y-0.5 hover:opacity-90"
                >
                  <Play className="h-4 w-4 fill-current" />
                  See the Failure
                </Link>

                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 font-semibold text-main transition hover:border-primary/40 hover:bg-surfaceHover"
                >
                  Explore Live System
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success" />
                  Spring Boot
                </span>

                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success" />
                  PostgreSQL
                </span>

                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success" />
                  Kafka
                </span>

                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success" />
                  Redis
                </span>
              </div>
            </div>

            {/* Hero architecture visual */}
            <HeroArchitecture />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PROBLEM STATEMENT                                                */}
      {/* ================================================================ */}

      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <SectionHeading
            eyebrow="THE REAL PROBLEM"
            title="Distributed systems fail in the gaps."
            description="Your application may be correct. Your database may be correct. Your message broker may be correct. The failure happens between them."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ProblemCard
              number="01"
              icon={TriangleAlert}
              title="Event Loss"
              text="The database commits. Kafka fails. The event disappears."
            />

            <ProblemCard
              number="02"
              icon={RefreshCcw}
              title="Transient Failures"
              text="A broker goes down for seconds. Your application shouldn't lose data."
            />

            <ProblemCard
              number="03"
              icon={Activity}
              title="Duplicate Delivery"
              text="Retries can deliver the same event more than once."
            />

            <ProblemCard
              number="04"
              icon={FileWarning}
              title="Permanent Failures"
              text="Some events keep failing and need isolation instead of infinite retries."
            />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* THE FAILURE VISUAL                                              */}
      {/* ================================================================ */}

      <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-danger">
              BEFORE RELAYX
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-main md:text-4xl">
              Two writes.
              <br />
              One dangerous gap.
            </h2>

            <p className="mt-5 text-sm leading-7 text-muted md:text-base">
              A common implementation saves the business record and then
              publishes an event. They look like one operation to the
              developer, but they are two different systems.
            </p>

            <div className="mt-7 space-y-4">
              <FailurePoint
                title="Database succeeds"
                text="Order #1042 is committed."
                success
              />

              <FailurePoint
                title="Kafka fails"
                text="OrderCreated is never published."
                success={false}
              />

              <FailurePoint
                title="Downstream state diverges"
                text="Consumers never learn that the order exists."
                success={false}
              />
            </div>
          </div>

          <DualWriteDiagram />
        </div>
      </section>

      {/* ================================================================ */}
      {/* SOLUTION                                                         */}
      {/* ================================================================ */}

      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <SectionHeading
            eyebrow="THE RELAYX APPROACH"
            title="Move reliability into the delivery path."
            description="The application no longer needs Kafka to be available when the database transaction commits."
          />

          <div className="mt-14">
            <OutboxDiagram />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CAPABILITIES                                                     */}
      {/* ================================================================ */}

      <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionHeading
          eyebrow="WHAT RELAYX HANDLES"
          title="Failure is part of the design."
          description="RelayX is built around what happens when distributed systems behave badly."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <CapabilityCard
            icon={ShieldCheck}
            title="Transactional Outbox"
            short="Persist first. Deliver later."
            description="Business data and the event are committed in the same PostgreSQL transaction."
          />

          <CapabilityCard
            icon={RefreshCcw}
            title="Automatic Retries"
            short="Failure doesn't mean loss."
            description="Failed deliveries remain available for retry with exponential backoff."
          />

          <CapabilityCard
            icon={Clock3}
            title="Backoff"
            short="Don't hammer a failing broker."
            description="Retry attempts can wait progressively longer before trying again."
          />

          <CapabilityCard
            icon={Zap}
            title="At-Least-Once Delivery"
            short="Prefer delivery over silent loss."
            description="Events remain recoverable until successful publication."
          />

          <CapabilityCard
            icon={ShieldCheck}
            title="Idempotency"
            short="Duplicates are expected."
            description="Consumers can use event IDs to safely ignore events they have already processed."
          />

          <CapabilityCard
            icon={GitBranch}
            title="Per-Aggregate Ordering"
            short="Related events stay ordered."
            description="Events belonging to the same aggregate can be processed in their intended sequence."
          />

          <CapabilityCard
            icon={FileWarning}
            title="Dead Letter Queue"
            short="Isolate the impossible."
            description="Events that exhaust their retries can be moved to a DLQ for inspection and recovery."
          />

          <CapabilityCard
            icon={Activity}
            title="Observability"
            short="Know what is happening."
            description="Track pending events, delivery state, retries, failures and relay health."
          />
        </div>
      </section>

      {/* ================================================================ */}
      {/* HOW IT WORKS                                                     */}
      {/* ================================================================ */}

      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <SectionHeading
            eyebrow="THE DELIVERY LIFECYCLE"
            title="From database commit to successful delivery."
            description="RelayX separates persistence from delivery without losing the connection between them."
          />

          <div className="mt-14 grid gap-4 md:grid-cols-5">
            <LifecycleStep
              number="01"
              icon={Database}
              title="Commit"
              text="Order + event"
            />

            <LifecycleStep
              number="02"
              icon={Inbox}
              title="Persist"
              text="Outbox event"
            />

            <LifecycleStep
              number="03"
              icon={RefreshCcw}
              title="Relay"
              text="Poll + publish"
            />

            <LifecycleStep
              number="04"
              icon={Radio}
              title="Deliver"
              text="Kafka + consumers"
            />

            <LifecycleStep
              number="05"
              icon={ShieldCheck}
              title="Recover"
              text="Retry + idempotency"
            />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FAILURE MATRIX                                                   */}
      {/* ================================================================ */}

      <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionHeading
          eyebrow="FAILURE HANDLING"
          title="What happens when things break?"
          description="RelayX turns common distributed-system failures into explicit states that can be recovered."
        />

        <div className="mt-12 overflow-hidden rounded-2xl border border-border">
          <div className="hidden grid-cols-[1.1fr_1fr_1fr] border-b border-border bg-surface p-4 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
            <div>Failure</div>
            <div>Without RelayX</div>
            <div>With RelayX</div>
          </div>

          <FailureRow
            failure="Kafka unavailable"
            without="Event may be lost"
            with="Event stays in outbox"
          />

          <FailureRow
            failure="Temporary network error"
            without="Manual recovery"
            with="Automatic retry"
          />

          <FailureRow
            failure="Repeated delivery"
            without="Duplicate side effects"
            with="Idempotent consumer"
          />

          <FailureRow
            failure="Permanent failure"
            without="Repeated failures"
            with="Dead Letter Queue"
          />

          <FailureRow
            failure="Need to investigate"
            without="Little visibility"
            with="Event + retry state"
          />
        </div>
      </section>

      {/* ================================================================ */}
      {/* VIDEO / DEMO CTA                                                 */}
      {/* ================================================================ */}

      <section className="px-4 pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-purple-500/5 p-8 md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                DON'T JUST READ ABOUT IT
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-main md:text-4xl">
                Watch the failure happen.
                <br />
                Then watch RelayX recover it.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted md:text-base">
                The interactive simulation walks through event loss, durable
                outbox storage, retries, recovery, duplicate delivery,
                idempotency, ordering and DLQ handling.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:opacity-90"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Run the Simulation
                </Link>

                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 font-semibold text-main transition hover:bg-surfaceHover"
                >
                  Explore the Real System
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-border bg-surface p-6 md:block">
              <div className="text-xs uppercase tracking-wide text-muted">
                RelayX
              </div>

              <div className="mt-3 text-2xl font-bold text-main">
                Reliable
                <br />
                Event Delivery
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <Tag text="Durable" />
                <Tag text="Retryable" />
                <Tag text="Recoverable" />
                <Tag text="Observable" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ========================================================================== */
/* HERO ARCHITECTURE                                                         */
/* ========================================================================== */

function HeroArchitecture() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-surface/80 p-5 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Event delivery
            </div>
            <div className="mt-1 text-sm font-semibold text-main">
              What RelayX protects
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            protected
          </div>
        </div>

        <div className="space-y-3">
          <ArchitectureNode
            icon={Server}
            title="Application"
            text="Create Order"
          />

          <div className="ml-6 h-5 border-l border-primary/50" />

          <ArchitectureNode
            icon={Database}
            title="PostgreSQL"
            text="Order + Outbox Event"
            highlight
          />

          <div className="ml-6 flex h-7 items-center border-l border-primary/50">
            <div className="ml-[-1px] h-px w-8 bg-primary/50" />
          </div>

          <ArchitectureNode
            icon={RefreshCcw}
            title="RelayX"
            text="Retry + Deliver"
          />

          <div className="ml-6 h-5 border-l border-primary/50" />

          <ArchitectureNode
            icon={Radio}
            title="Kafka"
            text="Event Stream"
            success
          />
        </div>

        <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-muted">
          <span className="font-semibold text-main">
            The key idea:
          </span>{' '}
          the event is durable before RelayX attempts delivery.
        </div>
      </div>

      {/* <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-danger/30 bg-surface p-4 shadow-xl md:block">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-danger/10 p-2">
            <TriangleAlert className="h-4 w-4 text-danger" />
          </div>

          <div>
            <div className="text-xs font-semibold text-main">
              Kafka unavailable?
            </div>
            <div className="text-xs text-muted">
              Event remains durable.
            </div> 
           </div>
        </div>
      </div> */}
    </div>
  );
}

/* ========================================================================== */
/* DUAL WRITE                                                                */
/* ========================================================================== */

function DualWriteDiagram() {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-danger">
            Failure scenario
          </div>
          <div className="mt-1 font-semibold text-main">
            Order #1042
          </div>
        </div>

        <div className="rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
          INCONSISTENT
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-center">
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <Server className="mx-auto h-6 w-6 text-primary" />
            <div className="mt-2 text-sm font-semibold text-main">
              Application
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-success/40 bg-success/5 p-5">
            <Database className="h-5 w-5 text-success" />

            <div className="mt-3 text-sm font-semibold text-main">
              PostgreSQL
            </div>

            <div className="mt-1 text-xs text-muted">
              Order committed
            </div>

            <div className="mt-4 text-sm font-bold text-success">
              ✓ SUCCESS
            </div>
          </div>

          <div className="rounded-xl border border-danger/50 bg-danger/10 p-5">
            <Radio className="h-5 w-5 text-danger" />

            <div className="mt-3 text-sm font-semibold text-main">
              Kafka
            </div>

            <div className="mt-1 text-xs text-muted">
              Broker unavailable
            </div>

            <div className="mt-4 text-sm font-bold text-danger">
              ✕ FAILED
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-danger/10 p-3 text-center text-xs font-bold uppercase tracking-wide text-danger">
          Order exists ≠ Event exists
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* OUTBOX DIAGRAM                                                            */
/* ========================================================================== */

function OutboxDiagram() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-8">
      <div className="grid items-center gap-5 md:grid-cols-[1fr_auto_1.5fr_auto_1fr]">
        <ArchitectureBlock
          icon={Server}
          title="Application"
          text="Create Order"
        />

        <ArrowConnector label="transaction" />

        <div className="rounded-xl border border-primary/40 bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <span className="font-semibold text-main">
              PostgreSQL
            </span>
          </div>

          <div className="space-y-2">
            <div className="rounded-lg bg-surfaceHover p-3">
              <div className="text-xs font-semibold text-main">
                Order
              </div>
              <div className="mt-1 text-[11px] text-muted">
                Business data
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="text-xs font-semibold text-primary">
                Outbox Event
              </div>
              <div className="mt-1 text-[11px] text-muted">
                Durable event
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-success/10 px-3 py-2 text-center text-[11px] font-semibold text-success">
            SAME TRANSACTION
          </div>
        </div>

        <ArrowConnector label="poll + retry" />

        <ArchitectureBlock
          icon={RefreshCcw}
          title="RelayX"
          text="Deliver reliably"
          highlight
        />
      </div>

      <div className="my-6 h-px bg-border" />

      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center">
        <div className="rounded-xl border border-success/40 bg-success/5 px-6 py-4 text-center">
          <Radio className="mx-auto h-5 w-5 text-success" />
          <div className="mt-2 text-sm font-semibold text-main">
            Kafka
          </div>
          <div className="mt-1 text-xs text-muted">
            Event broker
          </div>
        </div>

        <ChevronRight className="hidden h-5 w-5 text-success md:block" />

        <div className="flex flex-wrap justify-center gap-2">
          <SmallConsumer label="Notifications" />
          <SmallConsumer label="Inventory" />
          <SmallConsumer label="Analytics" />
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* GENERIC COMPONENTS                                                        */
/* ========================================================================== */

function SectionHeading({
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
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </div>

      <h2 className="mt-3 text-3xl font-bold tracking-tight text-main md:text-4xl">
        {title}
      </h2>

      <p className="mt-4 text-sm leading-7 text-muted md:text-base">
        {description}
      </p>
    </div>
  );
}

function ProblemCard({
  number,
  icon: Icon,
  title,
  text,
}: {
  number: string;
  icon: typeof Activity;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-1 hover:border-primary/30">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-danger/10 p-2">
          <Icon className="h-5 w-5 text-danger" />
        </div>

        <span className="font-mono text-xs text-muted">{number}</span>
      </div>

      <h3 className="mt-5 font-semibold text-main">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}

function FailurePoint({
  title,
  text,
  success,
}: {
  title: string;
  text: string;
  success: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 rounded-full p-1 ${
          success ? 'bg-success/10' : 'bg-danger/10'
        }`}
      >
        {success ? (
          <Check className="h-3.5 w-3.5 text-success" />
        ) : (
          <span className="block h-3.5 w-3.5 text-center text-xs font-bold text-danger">
            ×
          </span>
        )}
      </div>

      <div>
        <div className="text-sm font-semibold text-main">{title}</div>
        <div className="mt-0.5 text-xs leading-5 text-muted">{text}</div>
      </div>
    </div>
  );
}

function CapabilityCard({
  icon: Icon,
  title,
  short,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  short: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-6 transition hover:-translate-y-1 hover:border-primary/40">
      <div className="flex items-start justify-between">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>

        <ArrowRight className="h-4 w-4 text-muted opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-main">{title}</h3>

      <div className="mt-1 text-sm font-medium text-primary">{short}</div>

      <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

function LifecycleStep({
  number,
  icon: Icon,
  title,
  text,
}: {
  number: string;
  icon: typeof Database;
  title: string;
  text: string;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-mono text-xs text-muted">{number}</span>
      </div>

      <div className="mt-5 font-semibold text-main">{title}</div>

      <div className="mt-1 text-xs text-muted">{text}</div>
    </div>
  );
}

function FailureRow({
  failure,
  without,
  with: withRelayX,
}: {
  failure: string;
  without: string;
  with: string;
}) {
  return (
    <div className="grid gap-3 border-b border-border p-4 last:border-b-0 md:grid-cols-[1.1fr_1fr_1fr] md:items-center">
      <div className="font-medium text-main">{failure}</div>

      <div className="text-sm text-muted">
        <span className="mr-2 md:hidden">Without:</span>
        {without}
      </div>

      <div className="flex items-center gap-2 text-sm font-medium text-success">
        <Check className="h-4 w-4 shrink-0" />
        {withRelayX}
      </div>
    </div>
  );
}

function ArchitectureNode({
  icon: Icon,
  title,
  text,
  highlight = false,
  success = false,
}: {
  icon: typeof Server;
  title: string;
  text: string;
  highlight?: boolean;
  success?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        success
          ? 'border-success/30 bg-success/5'
          : highlight
            ? 'border-primary/30 bg-primary/5'
            : 'border-border bg-surfaceHover'
      }`}
    >
      <div
        className={`rounded-lg p-2 ${
          success
            ? 'bg-success/10'
            : highlight
              ? 'bg-primary/10'
              : 'bg-surface'
        }`}
      >
        <Icon
          className={`h-4 w-4 ${
            success
              ? 'text-success'
              : highlight
                ? 'text-primary'
                : 'text-muted'
          }`}
        />
      </div>

      <div>
        <div className="text-sm font-semibold text-main">{title}</div>
        <div className="text-xs text-muted">{text}</div>
      </div>
    </div>
  );
}

function ArchitectureBlock({
  icon: Icon,
  title,
  text,
  highlight = false,
}: {
  icon: typeof Server;
  title: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 text-center ${
        highlight
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-surface'
      }`}
    >
      <Icon
        className={`mx-auto h-6 w-6 ${
          highlight ? 'text-primary' : 'text-muted'
        }`}
      />

      <div className="mt-3 text-sm font-semibold text-main">{title}</div>

      <div className="mt-1 text-xs text-muted">{text}</div>
    </div>
  );
}

function ArrowConnector({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <ArrowRight className="hidden h-5 w-5 text-primary md:block" />
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
}

function SmallConsumer({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-2 text-xs text-muted">
      {label}
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="h-3.5 w-3.5 text-success" />
      <span className="text-muted">{text}</span>
    </div>
  );
}