import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock3,
  Database,
  FileWarning,
  GitBranch,
  Inbox,
  Play,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';

/* ========================================================================== */
/* PAGE                                                                      */
/* ========================================================================== */
// Testing Git change detection
export default function Landing() {
  return (
    <div className="min-h-full">
      <Hero />
      <Gap />
      <Mechanism />
      <Guarantees />
      <Failures />
      <Closing />
    </div>
  );
}

/* ========================================================================== */
/* HERO                                                                      */
/* ========================================================================== */

function Hero() {
  return (
    <section className="flex min-h-screen items-center border-b border-border">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Transactional Outbox · v1.0
            </div>

            <h1 className="text-[2.75rem] font-medium leading-[1.05] tracking-tight text-main md:text-[3.75rem]">
              Database commits.
              <br />
              Events follow.
            </h1>

            <p className="mt-8 max-w-md text-base leading-7 text-muted">
              RelayX writes the business record and the outbox event in one
              transaction, then publishes to Kafka asynchronously — with
              retries, backoff, idempotency, and a dead letter queue.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-main transition hover:border-primary/40 hover:bg-surfaceHover"
              >
                Run the simulation
                <Play className="h-3.5 w-3.5 " />
                
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-main transition hover:border-primary/40 hover:bg-surfaceHover"
              >
                View live system
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-14 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] text-muted">
              <span>Spring Boot</span>
              <span className="text-border">/</span>
              <span>PostgreSQL</span>
              <span className="text-border">/</span>
              <span>Kafka</span>
              <span className="text-border">/</span>
              <span>SKIP LOCKED</span>
            </div>
          </div>

          <RelayLog />
        </div>
      </div>
    </section>
  );
}

function RelayLog() {
  const lines = [
    { t: '14:02:11', s: 'poll ', m: '3 pending events', c: 'text-muted' },
    { t: '14:02:11', s: 'relay', m: 'published   evt_928374a', c: 'text-success' },
    { t: '14:02:13', s: 'relay', m: 'broker unreachable', c: 'text-danger' },
    { t: '14:02:14', s: 'retry', m: 'backoff 2s · attempt 2/5', c: 'text-warning' },
    { t: '14:02:16', s: 'relay', m: 'published   evt_837462b', c: 'text-success' },
    { t: '14:02:16', s: 'poll ', m: '0 pending events', c: 'text-muted' },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="font-mono text-[11px] text-muted">relay.log</span>
        </div>
        <span className="font-mono text-[11px] text-muted">live</span>
      </div>

      <div className="divide-y divide-border">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-2.5 font-mono text-[11px]">
            <span className="text-muted">{l.t}</span>
            <span className="text-muted">[{l.s}]</span>
            <span className={l.c}>{l.m}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="font-mono text-[11px] text-muted">
          <span className="text-success">✓</span> 0 events lost · 1 retry · 0 in DLQ
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* THE GAP                                                                   */
/* ========================================================================== */

function Gap() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              The gap
            </div>

            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-tight text-main md:text-4xl">
              Two writes.
              <br />
              No atomicity.
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-muted">
              The naïve approach saves the record, then publishes the event.
              They look like one operation. They are two systems. Nothing
              guarantees they both succeed.
            </p>

            <p className="mt-4 max-w-md text-base leading-7 text-muted">
              <span className="font-mono text-sm text-main">@Transactional</span>{' '}
              doesn't help — Kafka is not in the transaction. XA doesn't help
              — it's fragile, locks resources, and is rarely supported by
              modern brokers.
            </p>
          </div>

          <div className="space-y-4">
            <CodeCard
              label="Without RelayX"
              tone="danger"
              footnote="The event may never be published."
              code={`@Transactional
void createOrder(Order order) {
  orderRepo.save(order);           // commits
  kafka.send("orders", order);     // may fail after commit
}`}
            />

            <CodeCard
              label="With RelayX"
              tone="success"
              footnote="The relay publishes it later, with retries."
              code={`@Transactional
void createOrder(Order order) {
  orderRepo.save(order);
  outboxRepo.save(event(order));   // same tx
}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CodeCard({
  label,
  tone,
  code,
  footnote,
}: {
  label: string;
  tone: 'danger' | 'success';
  code: string;
  footnote: string;
}) {
  const accent = tone === 'danger' ? 'text-danger' : 'text-success';
  const dot = tone === 'danger' ? 'bg-danger' : 'bg-success';

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
            {label}
          </span>
        </div>
        <span className={`font-mono text-[11px] ${accent}`}>{tone}</span>
      </div>

      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-6 text-main">
        <code>{code}</code>
      </pre>

      <div className="border-t border-border px-4 py-2.5 font-mono text-[11px] text-muted">
        {footnote}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* MECHANISM                                                                 */
/* ========================================================================== */

function Mechanism() {
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            The mechanism
          </div>

          <h2 className="mt-4 text-3xl font-medium tracking-tight text-main md:text-4xl">
            Persist first. Deliver later.
          </h2>

          <p className="mt-6 text-base leading-7 text-muted">
            The outbox event commits atomically with the business data. A
            relay publishes it asynchronously and marks it delivered only
            after Kafka acknowledges it.
          </p>
        </div>

        <OutboxFlow />
      </div>
    </section>
  );
}

function OutboxFlow() {
  const stages = [
    { icon: Database, label: 'Commit', sub: 'order + event' },
    { icon: Inbox, label: 'Persist', sub: 'outbox row' },
    { icon: RefreshCcw, label: 'Relay', sub: 'poll + publish' },
    { icon: ShieldCheck, label: 'Confirm', sub: 'mark delivered' },
  ];

  return (
    <div className="mt-16 rounded-lg border border-border bg-base">
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
        {stages.map((s, i) => (
          <div key={s.label} className="relative p-6">
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <span className="font-mono text-[11px] text-muted">
                0{i + 1}
              </span>
            </div>

            <div className="mt-8 font-medium text-main">{s.label}</div>
            <div className="mt-1 font-mono text-[11px] text-muted">
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border px-6 py-4">
        <span className="font-mono text-[11px] text-muted">
          one transaction · durable before delivery
        </span>
        <span className="font-mono text-[11px] text-success">
          at-least-once
        </span>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* GUARANTEES                                                                */
/* ========================================================================== */

const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: 'Transactional outbox',
    text: 'Event and business row commit in one transaction.',
  },
  {
    icon: RefreshCcw,
    title: 'Exponential backoff',
    text: 'Failed publishes retry with jittered delay.',
  },
  {
    icon: Clock3,
    title: 'At-least-once delivery',
    text: 'Events are never silently dropped.',
  },
  {
    icon: GitBranch,
    title: 'Per-aggregate ordering',
    text: 'Sequence numbers preserve order within an entity.',
  },
  {
    icon: Inbox,
    title: 'Idempotent consumers',
    text: 'Duplicate deliveries are ignored by event ID.',
  },
  {
    icon: FileWarning,
    title: 'Dead letter queue',
    text: 'Exhausted events are isolated for recovery.',
  },
];

function Guarantees() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Guarantees
          </div>

          <h2 className="mt-4 text-3xl font-medium tracking-tight text-main md:text-4xl">
            Failure is the baseline.
          </h2>

          <p className="mt-6 text-base leading-7 text-muted">
            These aren't features. They're the assumptions RelayX is built
            on.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {GUARANTEES.map((g) => (
            <div key={g.title} className="bg-surface p-7">
              <g.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />

              <div className="mt-6 font-medium text-main">{g.title}</div>
              <p className="mt-2 text-sm leading-6 text-muted">{g.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* FAILURES                                                                  */
/* ========================================================================== */

const FAILURES = [
  ['Database commits, broker is down', 'Event stays PENDING and is retried automatically.'],
  ['Relay crashes mid-publish', 'Event is republished on restart.'],
  ['Same event delivered twice', 'Consumer ignores it via eventId.'],
  ['Retries exceed the limit', 'Event moves to the Dead Letter Queue.'],
  ['Events arrive out of order', 'Per-aggregate sequence is preserved.'],
];

function Failures() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Behavior
            </div>

            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-tight text-main md:text-4xl">
              What happens when things break.
            </h2>

            <p className="mt-6 max-w-sm text-base leading-7 text-muted">
              Every failure becomes an explicit state — visible in the
              dashboard, recoverable by an operator.
            </p>
          </div>

          <div className="divide-y divide-border border-y border-border">
            {FAILURES.map(([f, b]) => (
              <div
                key={f}
                className="grid grid-cols-1 gap-2 py-5 md:grid-cols-[1fr_1.2fr] md:gap-8"
              >
                <div className="text-sm font-medium text-main">{f}</div>
                <div className="text-sm leading-6 text-muted">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* CLOSING                                                                   */
/* ========================================================================== */

function Closing() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="flex flex-col items-start gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-medium leading-tight tracking-tight text-main md:text-4xl">
              See it fail.
              <br />
              Then see it recover.
            </h2>

            <p className="mt-6 max-w-lg text-base leading-7 text-muted">
              The interactive simulation walks through event loss, retry,
              recovery, duplicate delivery, and DLQ handling — all against
              the real system.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/demo"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-main transition hover:border-primary/40 hover:bg-surfaceHover"
            >
              Run the simulation
              <Play className="h-3.5 w-3.5 fill-current" />
              
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-main transition hover:border-primary/40 hover:bg-surfaceHover"
            >
              View live system
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 font-mono text-[11px] text-muted">
          <span>RelayX · Transactional Outbox</span>
          <span>Database commits. Events follow.</span>
        </div>
      </div>
    </section>
  );
}