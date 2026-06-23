import { Link, Navigate, useParams } from "react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Sparkles } from "lucide-react";
import { PageHeader, Card } from "@/components/app/AppShell";
import { EditableText, EditableSelect, EditableNumber } from "@/components/app/EditableField";
import {
  useAccount,
  accountsStore,
  fmtMoney,
  CATEGORY_LABEL,
  type Account,
  type RiskItem,
  type Initiative,
  type Engagement,
  type StrategicObjective,
  type Capability,
  type ValueStream,
  type ApiEntry,
  type Metric,
  type Stakeholder,
  type SuccessPlan,
  type RenewalRisk,
} from "@/lib/accountsStore";

// Route definition removed for React Router

const TABS = [
  "Overview",
  "Success Plan",
  "Objectives",
  "Initiatives",
  "Risks",
  "Engagements",
  "Capabilities",
  "Value Streams",
  "APIs",
  "Metrics",
  "Stakeholders",
  "Context",
] as const;

type Tab = (typeof TABS)[number];

const RENEWAL_RISKS: readonly RenewalRisk[] = ["Low", "Medium", "High", "Critical"];
const TREND_OPTIONS = ["Improving", "Stable", "Declining"] as const;
const MATURITY_OPTIONS = ["Nascent", "Developing", "Advancing", "Leading"] as const;

function AccountDetail() {
  const { accountId } = useParams();
  const account = useAccount(accountId);
  const [tab, setTab] = useState<Tab>("Overview");

  if (!account) return <Navigate to="/accounts" />;
  const a = account;
  const upd = (patch: Partial<Account>) => accountsStore.update(a.id, patch);

  return (
    <>
      <Link
        to="/accounts"
        className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to accounts
      </Link>

      <PageHeader
        eyebrow={`${CATEGORY_LABEL[a.category]} · ${a.accountId}`}
        title={
          <EditableText value={a.name} onChange={(v) => upd({ name: v })} label="Account name" />
        }
        description={
          <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
            <span>CSM</span>
            <EditableText value={a.csm} onChange={(v) => upd({ csm: v })} label="CSM" />
            <span>·</span>
            <EditableText
              value={a.industry}
              onChange={(v) => upd({ industry: v })}
              label="Industry"
            />
            <span>·</span>
            <EditableText
              value={a.geography}
              onChange={(v) => upd({ geography: v })}
              label="Geography"
            />
            <span>·</span>
            <EditableText
              value={a.contractType}
              onChange={(v) => upd({ contractType: v })}
              label="Contract type"
            />
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="iw-pill iw-pill-neutral">ARR {fmtMoney(a.arr)}</span>
            <span className="iw-pill iw-pill-info">Health {a.health}</span>
            <span
              className={
                a.renewalRisk === "Critical" || a.renewalRisk === "High"
                  ? "iw-pill iw-pill-warn"
                  : "iw-pill iw-pill-ok"
              }
            >
              Renewal {a.daysToRenewal}d · {a.renewalRisk}
            </span>
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-0 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "border-b-2 border-brand px-3 py-2 text-[13px] font-semibold text-foreground"
                : "border-b-2 border-transparent px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab a={a} />}
      {tab === "Success Plan" && <SuccessPlanTab a={a} />}
      {tab === "Objectives" && <ObjectivesTab a={a} />}
      {tab === "Initiatives" && <InitiativesTab a={a} />}
      {tab === "Risks" && <RisksTab a={a} />}
      {tab === "Engagements" && <EngagementsTab a={a} />}
      {tab === "Capabilities" && <CapabilitiesTab a={a} />}
      {tab === "Value Streams" && <ValueStreamsTab a={a} />}
      {tab === "APIs" && <ApisTab a={a} />}
      {tab === "Metrics" && <MetricsTab a={a} />}
      {tab === "Stakeholders" && <StakeholdersTab a={a} />}
      {tab === "Context" && <ContextTab a={a} />}
    </>
  );
}

/* ----------------- Generic helpers ----------------- */
function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <span className="shrink-0 text-[12px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-right text-[13px] text-foreground">{children}</span>
    </div>
  );
}

function AddRow({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1 rounded-sm border border-dashed border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground hover:border-brand hover:text-brand"
    >
      <Plus className="size-3" /> {label}
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Remove"
      className="size-6 rounded-sm text-muted-foreground hover:bg-critical/10 hover:text-critical"
    >
      <Trash2 className="mx-auto size-3" />
    </button>
  );
}

/* ----------------- Overview ----------------- */
function OverviewTab({ a }: { a: Account }) {
  const upd = (patch: Partial<Account>) => accountsStore.update(a.id, patch);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <Card title="CSM narrative">
          <EditableText
            value={a.csmNarrative}
            onChange={(v) => upd({ csmNarrative: v })}
            multiline
            label="CSM narrative"
          />
        </Card>

        <Card title="Health summary">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Health">
              <EditableNumber
                value={a.health}
                onChange={(v) => upd({ health: v })}
                label="Health"
              />
            </Stat>
            <Stat label="Trend (3M)">
              <EditableSelect
                value={a.healthTrend}
                onChange={(v) => upd({ healthTrend: v as Account["healthTrend"] })}
                options={TREND_OPTIONS}
                label="Trend"
              />
            </Stat>
            <Stat label="Renewal risk">
              <EditableSelect
                value={a.renewalRisk}
                onChange={(v) => upd({ renewalRisk: v as RenewalRisk })}
                options={RENEWAL_RISKS}
                label="Renewal risk"
              />
            </Stat>
            <Stat label="Days to renewal">
              <EditableNumber
                value={a.daysToRenewal}
                onChange={(v) => upd({ daysToRenewal: v })}
                min={0}
                max={9999}
                suffix="d"
                label="Days"
              />
            </Stat>
          </div>
        </Card>

        <Card title="Contract">
          <KV label="Contract type">
            <EditableText value={a.contractType} onChange={(v) => upd({ contractType: v })} />
          </KV>
          <KV label="Start">
            <EditableText value={a.contractStart} onChange={(v) => upd({ contractStart: v })} />
          </KV>
          <KV label="End">
            <EditableText value={a.contractEnd} onChange={(v) => upd({ contractEnd: v })} />
          </KV>
          <KV label="ARR">
            <EditableNumber
              value={a.arr}
              onChange={(v) => upd({ arr: v })}
              min={0}
              max={100_000_000}
            />
          </KV>
          <KV label="ACV">
            <EditableNumber
              value={a.acv}
              onChange={(v) => upd({ acv: v })}
              min={0}
              max={100_000_000}
            />
          </KV>
        </Card>

        <Card
          title="Twin proposal"
          action={
            <span className="iw-pill iw-pill-info">
              <Sparkles className="size-3" /> Pending approval
            </span>
          }
        >
          <p className="text-[13px] text-foreground">
            Schedule an exec value-review with the COO. Champion has been silent for 14 days, and
            adoption of Module B trended -18%. Frame as ROI realisation against committed outcomes.
          </p>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Sources: CRM activity log · Email thread #4821 · Finance invoice #INV-9911
          </p>
          <div className="mt-3 flex gap-2">
            <button className="rounded-sm bg-trust px-3 py-1.5 text-[12px] font-semibold text-trust-foreground hover:bg-trust/90">
              Approve &amp; schedule
            </button>
            <button className="rounded-sm border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-accent">
              Edit
            </button>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Customer">
          <KV label="Account ID">{a.accountId}</KV>
          <KV label="Country">
            <EditableText value={a.country} onChange={(v) => upd({ country: v })} />
          </KV>
          <KV label="Geography">
            <EditableText value={a.geography} onChange={(v) => upd({ geography: v })} />
          </KV>
          <KV label="Industry">
            <EditableText value={a.industry} onChange={(v) => upd({ industry: v })} />
          </KV>
          <KV label="Employees">
            <EditableNumber
              value={a.employeeCount}
              onChange={(v) => upd({ employeeCount: v })}
              min={1}
              max={10_000_000}
            />
          </KV>
          <KV label="Annual revenue">
            <EditableNumber
              value={a.customerRevenue}
              onChange={(v) => upd({ customerRevenue: v })}
              min={0}
              max={1_000_000_000_000}
            />
          </KV>
          <KV label="S&amp;P rating">
            <EditableText value={a.spRating} onChange={(v) => upd({ spRating: v })} />
          </KV>
        </Card>

        <Card title="Team">
          <KV label="CSM">
            <EditableText value={a.csm} onChange={(v) => upd({ csm: v })} />
          </KV>
          <KV label="Account Executive">
            <EditableText value={a.ae} onChange={(v) => upd({ ae: v })} />
          </KV>
          <KV label="Solutions Architect">
            <EditableText value={a.sa} onChange={(v) => upd({ sa: v })} />
          </KV>
          <KV label="Exec Sponsor · Customer">
            <EditableText
              value={a.execSponsorCustomer}
              onChange={(v) => upd({ execSponsorCustomer: v })}
            />
          </KV>
          <KV label="Exec Sponsor · Platform">
            <EditableText
              value={a.execSponsorPlatform}
              onChange={(v) => upd({ execSponsorPlatform: v })}
            />
          </KV>
        </Card>

        <Card title="Engagement cadence">
          <KV label="Cadence">
            <EditableText value={a.cadence} onChange={(v) => upd({ cadence: v })} />
          </KV>
          <KV label="Last engagement">
            <EditableText value={a.lastEngagement} onChange={(v) => upd({ lastEngagement: v })} />
          </KV>
          <KV label="Next engagement">
            <EditableText value={a.nextEngagement} onChange={(v) => upd({ nextEngagement: v })} />
          </KV>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-border bg-cloud px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold text-foreground">{children}</p>
    </div>
  );
}

/* ----------------- Generic collection helpers ----------------- */
function useCollection<K extends keyof Account>(a: Account, key: K) {
  return {
    update: (id: string, patch: Partial<Account[K] extends (infer U)[] ? U : never>) =>
      accountsStore.updateCollection(a.id, key, (prev) =>
        // @ts-expect-error - generic narrow
        (prev as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x))
      ),
    remove: (id: string) =>
      accountsStore.updateCollection(a.id, key, (prev) =>
        // @ts-expect-error - generic narrow
        (prev as { id: string }[]).filter((x) => x.id !== id)
      ),
    add: (item: Account[K] extends (infer U)[] ? U : never) =>
      accountsStore.updateCollection(a.id, key, (prev) =>
        // @ts-expect-error - generic narrow
        [...(prev as unknown[]), item]
      ),
  };
}

/* ----------------- Success Plan ----------------- */
function SuccessPlanTab({ a }: { a: Account }) {
  const sp = a.successPlan;
  const updSp = (patch: Partial<SuccessPlan>) =>
    accountsStore.update(a.id, { successPlan: { ...sp, ...patch } });
  return (
    <div className="space-y-4">
      <Card title="Executive summary">
        <EditableText
          value={sp.executiveSummary}
          onChange={(v) => updSp({ executiveSummary: v })}
          multiline
          label="Executive summary"
        />
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Plan metadata">
          <KV label="Period">
            <EditableText value={sp.period} onChange={(v) => updSp({ period: v })} />
          </KV>
          <KV label="Status">
            <EditableSelect
              value={sp.status}
              onChange={(v) => updSp({ status: v as SuccessPlan["status"] })}
              options={["Active", "Draft", "Under Review", "Completed"]}
            />
          </KV>
          <KV label="Next QBR">
            <EditableText value={sp.nextQbr} onChange={(v) => updSp({ nextQbr: v })} />
          </KV>
          <KV label="Exec sponsor · Customer">
            <EditableText
              value={sp.execSponsorCustomer}
              onChange={(v) => updSp({ execSponsorCustomer: v })}
            />
          </KV>
          <KV label="Exec sponsor · Platform">
            <EditableText
              value={sp.execSponsorPlatform}
              onChange={(v) => updSp({ execSponsorPlatform: v })}
            />
          </KV>
        </Card>
        <Card title="Key initiatives">
          <StringList
            items={sp.keyInitiatives}
            onChange={(next) => updSp({ keyInitiatives: next })}
            placeholder="Add initiative"
          />
        </Card>
      </div>
      <Card title="Top risks">
        <StringList
          items={sp.topRisks}
          onChange={(next) => updSp({ topRisks: next })}
          placeholder="Add risk"
        />
      </Card>
    </div>
  );
}

function StringList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <>
      <ul className="space-y-1.5 text-[13px]">
        {items.map((it, i) => (
          <li key={i} className="group flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border bg-cloud text-[11px] font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <EditableText
                value={it}
                onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
                placeholder={placeholder}
              />
            </div>
            <RemoveBtn onClick={() => onChange(items.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <AddRow onClick={() => onChange([...items, ""])} label="Add" />
    </>
  );
}

/* ----------------- Risks ----------------- */
function RisksTab({ a }: { a: Account }) {
  const c = useCollection(a, "risks");
  return (
    <div className="space-y-3">
      {a.risks.map((r) => (
        <Card key={r.id}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-foreground">
                <EditableText
                  value={r.title}
                  onChange={(v) => c.update(r.id, { title: v })}
                  label="Title"
                />
              </div>
              <div className="text-[12px] text-muted-foreground">{r.id}</div>
            </div>
            <RemoveBtn onClick={() => c.remove(r.id)} />
          </div>
          <div className="grid gap-x-4 md:grid-cols-2">
            <KV label="Category">
              <EditableText value={r.category} onChange={(v) => c.update(r.id, { category: v })} />
            </KV>
            <KV label="Level">
              <EditableSelect
                value={r.level}
                onChange={(v) => c.update(r.id, { level: v as RiskItem["level"] })}
                options={["Critical", "High", "Medium", "Low"]}
              />
            </KV>
            <KV label="Score">
              <EditableNumber
                value={r.score}
                onChange={(v) => c.update(r.id, { score: v })}
                min={0}
                max={100}
              />
            </KV>
            <KV label="Impact">
              <EditableSelect
                value={r.impact}
                onChange={(v) => c.update(r.id, { impact: v as RiskItem["impact"] })}
                options={["Critical", "High", "Medium", "Low"]}
              />
            </KV>
            <KV label="Probability">
              <EditableSelect
                value={r.probability}
                onChange={(v) => c.update(r.id, { probability: v as RiskItem["probability"] })}
                options={["Very Likely", "Likely", "Possible", "Unlikely"]}
              />
            </KV>
            <KV label="Status">
              <EditableSelect
                value={r.status}
                onChange={(v) => c.update(r.id, { status: v as RiskItem["status"] })}
                options={["Open", "Mitigating", "Resolved", "Accepted"]}
              />
            </KV>
            <KV label="Owner">
              <EditableText value={r.owner} onChange={(v) => c.update(r.id, { owner: v })} />
            </KV>
            <KV label="Target date">
              <EditableText
                value={r.targetDate}
                onChange={(v) => c.update(r.id, { targetDate: v })}
              />
            </KV>
          </div>
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Description
            </p>
            <EditableText
              value={r.description}
              onChange={(v) => c.update(r.id, { description: v })}
              multiline
            />
          </div>
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Mitigation</p>
            <EditableText
              value={r.mitigation}
              onChange={(v) => c.update(r.id, { mitigation: v })}
              multiline
            />
          </div>
        </Card>
      ))}
      <AddRow
        onClick={() =>
          c.add({
            id: `r${Date.now()}`,
            title: "New risk",
            category: "Stakeholder",
            level: "Medium",
            score: 50,
            description: "",
            impact: "Medium",
            probability: "Possible",
            owner: a.csm,
            targetDate: "",
            status: "Open",
            mitigation: "",
          })
        }
        label="Add risk"
      />
    </div>
  );
}

/* ----------------- Initiatives ----------------- */
function InitiativesTab({ a }: { a: Account }) {
  const c = useCollection(a, "initiatives");
  return (
    <div className="space-y-3">
      {a.initiatives.map((i) => (
        <Card key={i.id}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="text-[14px] font-semibold text-foreground">
              <EditableText
                value={i.name}
                onChange={(v) => c.update(i.id, { name: v })}
                label="Name"
              />
            </div>
            <RemoveBtn onClick={() => c.remove(i.id)} />
          </div>
          <div className="grid gap-x-4 md:grid-cols-2">
            <KV label="Type">
              <EditableText value={i.type} onChange={(v) => c.update(i.id, { type: v })} />
            </KV>
            <KV label="Priority">
              <EditableSelect
                value={i.priority}
                onChange={(v) => c.update(i.id, { priority: v as Initiative["priority"] })}
                options={["P1", "P2", "P3", "P4"]}
              />
            </KV>
            <KV label="Phase">
              <EditableSelect
                value={i.phase}
                onChange={(v) => c.update(i.id, { phase: v as Initiative["phase"] })}
                options={[
                  "Ideation",
                  "Planning",
                  "Execution",
                  "Monitoring",
                  "Completed",
                  "Cancelled",
                ]}
              />
            </KV>
            <KV label="Status">
              <EditableSelect
                value={i.status}
                onChange={(v) => c.update(i.id, { status: v as Initiative["status"] })}
                options={["On Track", "At Risk", "Delayed", "Completed", "Blocked"]}
              />
            </KV>
            <KV label="Start">
              <EditableText
                value={i.startDate}
                onChange={(v) => c.update(i.id, { startDate: v })}
              />
            </KV>
            <KV label="Target">
              <EditableText
                value={i.targetDate}
                onChange={(v) => c.update(i.id, { targetDate: v })}
              />
            </KV>
            <KV label="Investment">
              <EditableNumber
                value={i.investment}
                onChange={(v) => c.update(i.id, { investment: v })}
                min={0}
                max={1_000_000_000}
              />
            </KV>
            <KV label="Expected benefit">
              <EditableNumber
                value={i.expectedBenefit}
                onChange={(v) => c.update(i.id, { expectedBenefit: v })}
                min={0}
                max={1_000_000_000}
              />
            </KV>
            <KV label="Realized benefit">
              <EditableNumber
                value={i.realizedBenefit}
                onChange={(v) => c.update(i.id, { realizedBenefit: v })}
                min={0}
                max={1_000_000_000}
              />
            </KV>
            <KV label="Payback (mo)">
              <EditableNumber
                value={i.paybackMonths}
                onChange={(v) => c.update(i.id, { paybackMonths: v })}
                min={0}
                max={120}
              />
            </KV>
            <KV label="Owner">
              <EditableText value={i.owner} onChange={(v) => c.update(i.id, { owner: v })} />
            </KV>
          </div>
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Success criteria
            </p>
            <EditableText
              value={i.successCriteria}
              onChange={(v) => c.update(i.id, { successCriteria: v })}
              multiline
            />
          </div>
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Blockers</p>
            <EditableText
              value={i.blockers}
              onChange={(v) => c.update(i.id, { blockers: v })}
              multiline
            />
          </div>
        </Card>
      ))}
      <AddRow
        onClick={() =>
          c.add({
            id: `i${Date.now()}`,
            name: "New initiative",
            type: "Integration",
            priority: "P2",
            phase: "Planning",
            status: "On Track",
            startDate: "",
            targetDate: "",
            investment: 0,
            expectedBenefit: 0,
            realizedBenefit: 0,
            paybackMonths: 0,
            owner: a.csm,
            successCriteria: "",
            blockers: "",
          })
        }
        label="Add initiative"
      />
    </div>
  );
}

/* ----------------- Engagements ----------------- */
function EngagementsTab({ a }: { a: Account }) {
  const c = useCollection(a, "engagements");
  return (
    <div className="space-y-3">
      {a.engagements.map((e) => (
        <Card key={e.id}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="text-[14px] font-semibold text-foreground">
              <EditableText
                value={e.type}
                onChange={(v) => c.update(e.id, { type: v })}
                label="Type"
              />
              <span className="ml-2 text-[12px] font-normal text-muted-foreground">
                <EditableText
                  value={e.date}
                  onChange={(v) => c.update(e.id, { date: v })}
                  label="Date"
                />
              </span>
            </div>
            <RemoveBtn onClick={() => c.remove(e.id)} />
          </div>
          <div className="grid gap-x-4 md:grid-cols-2">
            <KV label="Seniority">
              <EditableSelect
                value={e.seniority}
                onChange={(v) => c.update(e.id, { seniority: v as Engagement["seniority"] })}
                options={["C-Suite", "VP", "Director", "Manager", "Individual"]}
              />
            </KV>
            <KV label="Sentiment">
              <EditableSelect
                value={e.sentiment}
                onChange={(v) => c.update(e.id, { sentiment: v as Engagement["sentiment"] })}
                options={["Very Positive", "Positive", "Neutral", "Negative", "Concerning"]}
              />
            </KV>
            <KV label="Relationship depth">
              <EditableNumber
                value={e.relationshipDepth}
                onChange={(v) => c.update(e.id, { relationshipDepth: v })}
                min={0}
                max={10}
              />
            </KV>
            <KV label="Next date">
              <EditableText value={e.nextDate} onChange={(v) => c.update(e.id, { nextDate: v })} />
            </KV>
          </div>
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Attendees</p>
            <EditableText
              value={e.attendees}
              onChange={(v) => c.update(e.id, { attendees: v })}
              multiline
            />
          </div>
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Topics</p>
            <EditableText
              value={e.topics}
              onChange={(v) => c.update(e.id, { topics: v })}
              multiline
            />
          </div>
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Action items
            </p>
            <EditableText
              value={e.actionItems}
              onChange={(v) => c.update(e.id, { actionItems: v })}
              multiline
            />
          </div>
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Next steps</p>
            <EditableText
              value={e.nextSteps}
              onChange={(v) => c.update(e.id, { nextSteps: v })}
              multiline
            />
          </div>
        </Card>
      ))}
      <AddRow
        onClick={() =>
          c.add({
            id: `e${Date.now()}`,
            date: "",
            type: "Check-in",
            seniority: "Manager",
            attendees: "",
            topics: "",
            actionItems: "",
            sentiment: "Neutral",
            relationshipDepth: 5,
            nextSteps: "",
            nextDate: "",
          })
        }
        label="Log engagement"
      />
    </div>
  );
}

/* ----------------- Objectives ----------------- */
function ObjectivesTab({ a }: { a: Account }) {
  const c = useCollection(a, "objectives");
  return (
    <div className="space-y-3">
      {a.objectives.map((o) => (
        <Card key={o.id}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="text-[14px] font-semibold text-foreground">
              <EditableText value={o.name} onChange={(v) => c.update(o.id, { name: v })} />
            </div>
            <RemoveBtn onClick={() => c.remove(o.id)} />
          </div>
          <div className="grid gap-x-4 md:grid-cols-2">
            <KV label="Pillar">
              <EditableText value={o.pillar} onChange={(v) => c.update(o.id, { pillar: v })} />
            </KV>
            <KV label="Quantified goal">
              <EditableText
                value={o.quantifiedGoal}
                onChange={(v) => c.update(o.id, { quantifiedGoal: v })}
              />
            </KV>
            <KV label="Target date">
              <EditableText
                value={o.targetDate}
                onChange={(v) => c.update(o.id, { targetDate: v })}
              />
            </KV>
            <KV label="Owner">
              <EditableText value={o.owner} onChange={(v) => c.update(o.id, { owner: v })} />
            </KV>
            <KV label="Business value">
              <EditableNumber
                value={o.businessValue}
                onChange={(v) => c.update(o.id, { businessValue: v })}
                min={0}
                max={1_000_000_000}
              />
            </KV>
            <KV label="Status">
              <EditableSelect
                value={o.status}
                onChange={(v) => c.update(o.id, { status: v as StrategicObjective["status"] })}
                options={["Not Started", "In Progress", "On Track", "At Risk", "Completed"]}
              />
            </KV>
            <KV label="Progress %">
              <EditableNumber
                value={o.progress}
                onChange={(v) => c.update(o.id, { progress: v })}
                min={0}
                max={100}
              />
            </KV>
            <KV label="Health">
              <EditableSelect
                value={o.health}
                onChange={(v) => c.update(o.id, { health: v as StrategicObjective["health"] })}
                options={["Green", "Amber", "Red"]}
              />
            </KV>
          </div>
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Description
            </p>
            <EditableText
              value={o.description}
              onChange={(v) => c.update(o.id, { description: v })}
              multiline
            />
          </div>
        </Card>
      ))}
      <AddRow
        onClick={() =>
          c.add({
            id: `o${Date.now()}`,
            name: "New objective",
            pillar: "Growth",
            description: "",
            quantifiedGoal: "",
            targetDate: "",
            owner: a.csm,
            businessValue: 0,
            status: "Not Started",
            progress: 0,
            health: "Green",
          })
        }
        label="Add objective"
      />
    </div>
  );
}

/* ----------------- Capabilities ----------------- */
function CapabilitiesTab({ a }: { a: Account }) {
  const c = useCollection(a, "capabilities");
  return (
    <Card>
      <div className="-m-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-cloud text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Capability</th>
              <th className="px-3 py-2">Domain</th>
              <th className="px-3 py-2">Current</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Gap</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Investment</th>
              <th className="px-3 py-2">Owner</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {a.capabilities.map((cap) => (
              <tr key={cap.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <EditableText value={cap.name} onChange={(v) => c.update(cap.id, { name: v })} />
                </td>
                <td className="px-3 py-2">
                  <EditableText
                    value={cap.domain}
                    onChange={(v) => c.update(cap.id, { domain: v })}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNumber
                    value={cap.currentMaturity}
                    onChange={(v) => c.update(cap.id, { currentMaturity: v })}
                    min={0}
                    max={5}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNumber
                    value={cap.targetMaturity}
                    onChange={(v) => c.update(cap.id, { targetMaturity: v })}
                    min={0}
                    max={5}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={cap.gapStatus}
                    onChange={(v) => c.update(cap.id, { gapStatus: v as Capability["gapStatus"] })}
                    options={["Critical", "Significant", "Moderate", "Minor", "Closed"]}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={cap.priority}
                    onChange={(v) => c.update(cap.id, { priority: v as Capability["priority"] })}
                    options={["P1", "P2", "P3", "P4"]}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={cap.status}
                    onChange={(v) => c.update(cap.id, { status: v as Capability["status"] })}
                    options={["Not Started", "Planning", "In Progress", "Completed"]}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNumber
                    value={cap.investment}
                    onChange={(v) => c.update(cap.id, { investment: v })}
                    min={0}
                    max={1_000_000_000}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableText
                    value={cap.owner}
                    onChange={(v) => c.update(cap.id, { owner: v })}
                  />
                </td>
                <td className="px-3 py-2">
                  <RemoveBtn onClick={() => c.remove(cap.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddRow
        onClick={() =>
          c.add({
            id: `c${Date.now()}`,
            name: "New capability",
            domain: "Integration",
            currentMaturity: 1,
            targetMaturity: 3,
            gapStatus: "Moderate",
            priority: "P2",
            status: "Planning",
            investment: 0,
            owner: a.csm,
          })
        }
        label="Add capability"
      />
    </Card>
  );
}

/* ----------------- Value Streams ----------------- */
function ValueStreamsTab({ a }: { a: Account }) {
  const c = useCollection(a, "valueStreams");
  return (
    <div className="space-y-3">
      {a.valueStreams.map((v) => (
        <Card key={v.id}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="text-[14px] font-semibold text-foreground">
              <EditableText value={v.name} onChange={(nv) => c.update(v.id, { name: nv })} />
            </div>
            <RemoveBtn onClick={() => c.remove(v.id)} />
          </div>
          <div className="grid gap-x-4 md:grid-cols-2">
            <KV label="Process">
              <EditableText value={v.process} onChange={(nv) => c.update(v.id, { process: nv })} />
            </KV>
            <KV label="Owner">
              <EditableText value={v.owner} onChange={(nv) => c.update(v.id, { owner: nv })} />
            </KV>
            <KV label="APIs consumed">
              <EditableNumber
                value={v.apisConsumed}
                onChange={(nv) => c.update(v.id, { apisConsumed: nv })}
                min={0}
                max={10_000}
              />
            </KV>
            <KV label="Risk">
              <EditableSelect
                value={v.risk}
                onChange={(nv) => c.update(v.id, { risk: nv as ValueStream["risk"] })}
                options={["Low", "Medium", "High", "Critical"]}
              />
            </KV>
            <KV label="Cycle baseline (h)">
              <EditableNumber
                value={v.cycleBaseline}
                onChange={(nv) => c.update(v.id, { cycleBaseline: nv })}
                min={0}
                max={100_000}
              />
            </KV>
            <KV label="Cycle current (h)">
              <EditableNumber
                value={v.cycleCurrent}
                onChange={(nv) => c.update(v.id, { cycleCurrent: nv })}
                min={0}
                max={100_000}
              />
            </KV>
            <KV label="Cycle target (h)">
              <EditableNumber
                value={v.cycleTarget}
                onChange={(nv) => c.update(v.id, { cycleTarget: nv })}
                min={0}
                max={100_000}
              />
            </KV>
            <KV label="Business value">
              <EditableNumber
                value={v.businessValue}
                onChange={(nv) => c.update(v.id, { businessValue: nv })}
                min={0}
                max={1_000_000_000}
              />
            </KV>
          </div>
        </Card>
      ))}
      <AddRow
        onClick={() =>
          c.add({
            id: `v${Date.now()}`,
            name: "New value stream",
            process: "",
            owner: a.csm,
            apisConsumed: 0,
            cycleBaseline: 0,
            cycleCurrent: 0,
            cycleTarget: 0,
            businessValue: 0,
            risk: "Medium",
          })
        }
        label="Add value stream"
      />
    </div>
  );
}

/* ----------------- APIs ----------------- */
function ApisTab({ a }: { a: Account }) {
  const c = useCollection(a, "apis");
  return (
    <Card>
      <div className="-m-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-cloud text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">API</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Env</th>
              <th className="px-3 py-2">Monthly Tx</th>
              <th className="px-3 py-2">Resp (ms)</th>
              <th className="px-3 py-2">SLA %</th>
              <th className="px-3 py-2">Error %</th>
              <th className="px-3 py-2">Uptime %</th>
              <th className="px-3 py-2">Criticality</th>
              <th className="px-3 py-2">Health</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {a.apis.map((api) => (
              <tr key={api.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <EditableText value={api.name} onChange={(v) => c.update(api.id, { name: v })} />
                  <div className="text-[11px] text-muted-foreground">
                    <EditableText
                      value={api.version}
                      onChange={(v) => c.update(api.id, { version: v })}
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={api.type}
                    onChange={(v) => c.update(api.id, { type: v as ApiEntry["type"] })}
                    options={["System", "Process", "Experience"]}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={api.environment}
                    onChange={(v) =>
                      c.update(api.id, { environment: v as ApiEntry["environment"] })
                    }
                    options={["Production", "Staging", "Development"]}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNumber
                    value={api.monthlyTx}
                    onChange={(v) => c.update(api.id, { monthlyTx: v })}
                    min={0}
                    max={1_000_000_000}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNumber
                    value={api.responseMs}
                    onChange={(v) => c.update(api.id, { responseMs: v })}
                    min={0}
                    max={100_000}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNumber
                    value={api.slaCompliance}
                    onChange={(v) => c.update(api.id, { slaCompliance: v })}
                    min={0}
                    max={100}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNumber
                    value={api.errorRate}
                    onChange={(v) => c.update(api.id, { errorRate: v })}
                    min={0}
                    max={100}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNumber
                    value={api.uptime}
                    onChange={(v) => c.update(api.id, { uptime: v })}
                    min={0}
                    max={100}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={api.criticality}
                    onChange={(v) =>
                      c.update(api.id, { criticality: v as ApiEntry["criticality"] })
                    }
                    options={["Critical", "High", "Medium", "Low"]}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={api.health}
                    onChange={(v) => c.update(api.id, { health: v as ApiEntry["health"] })}
                    options={["Healthy", "Warning", "Critical", "Offline"]}
                  />
                </td>
                <td className="px-3 py-2">
                  <RemoveBtn onClick={() => c.remove(api.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddRow
        onClick={() =>
          c.add({
            id: `api${Date.now()}`,
            name: "new-api",
            type: "System",
            version: "v1.0",
            environment: "Development",
            monthlyTx: 0,
            responseMs: 0,
            slaTarget: 200,
            slaCompliance: 100,
            errorRate: 0,
            uptime: 100,
            criticality: "Medium",
            health: "Healthy",
            owner: a.csm,
          })
        }
        label="Add API"
      />
    </Card>
  );
}

/* ----------------- Metrics ----------------- */
function MetricsTab({ a }: { a: Account }) {
  const c = useCollection(a, "metrics");
  return (
    <Card>
      <div className="-m-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-cloud text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Metric</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Current</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Health</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {a.metrics.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <EditableText value={m.name} onChange={(v) => c.update(m.id, { name: v })} />
                </td>
                <td className="px-3 py-2">
                  <EditableText
                    value={m.category}
                    onChange={(v) => c.update(m.id, { category: v })}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={m.type}
                    onChange={(v) => c.update(m.id, { type: v as Metric["type"] })}
                    options={["KPI", "SLA", "Operational", "Business"]}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNumber
                    value={m.currentValue}
                    onChange={(v) => c.update(m.id, { currentValue: v })}
                    min={0}
                    max={1_000_000_000}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNumber
                    value={m.targetValue}
                    onChange={(v) => c.update(m.id, { targetValue: v })}
                    min={0}
                    max={1_000_000_000}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableText value={m.unit} onChange={(v) => c.update(m.id, { unit: v })} />
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={m.health}
                    onChange={(v) => c.update(m.id, { health: v as Metric["health"] })}
                    options={["Healthy", "Warning", "Critical"]}
                  />
                </td>
                <td className="px-3 py-2">
                  <RemoveBtn onClick={() => c.remove(m.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddRow
        onClick={() =>
          c.add({
            id: `m${Date.now()}`,
            name: "New metric",
            category: "Operational",
            type: "KPI",
            currentValue: 0,
            targetValue: 100,
            unit: "%",
            health: "Healthy",
            trend: "flat",
          })
        }
        label="Add metric"
      />
    </Card>
  );
}

/* ----------------- Stakeholders ----------------- */
function StakeholdersTab({ a }: { a: Account }) {
  const c = useCollection(a, "stakeholders");
  const pill = (v: string) =>
    v === "critical"
      ? "iw-pill iw-pill-critical"
      : v === "warn"
        ? "iw-pill iw-pill-warn"
        : "iw-pill iw-pill-ok";
  return (
    <Card>
      <div className="-m-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-cloud text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Seniority</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {a.stakeholders.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <EditableText value={s.name} onChange={(v) => c.update(s.id, { name: v })} />
                </td>
                <td className="px-3 py-2">
                  <EditableText value={s.role} onChange={(v) => c.update(s.id, { role: v })} />
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={s.seniority}
                    onChange={(v) => c.update(s.id, { seniority: v as Stakeholder["seniority"] })}
                    options={["C-Suite", "VP", "Director", "Manager", "Individual"]}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableText value={s.email} onChange={(v) => c.update(s.id, { email: v })} />
                </td>
                <td className="px-3 py-2">
                  <EditableSelect
                    value={s.status}
                    onChange={(v) => c.update(s.id, { status: v as Stakeholder["status"] })}
                    options={["ok", "warn", "critical"]}
                    pillClass={pill}
                  />
                </td>
                <td className="px-3 py-2">
                  <RemoveBtn onClick={() => c.remove(s.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddRow
        onClick={() =>
          c.add({
            id: `s${Date.now()}`,
            name: "New contact",
            role: "Role · Type",
            seniority: "Manager",
            status: "ok",
            email: "",
          })
        }
        label="Add stakeholder"
      />
    </Card>
  );
}

/* ----------------- Business Context ----------------- */
function ContextTab({ a }: { a: Account }) {
  const upd = (patch: Partial<Account>) => accountsStore.update(a.id, patch);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Business model">
        <KV label="Model">
          <EditableText value={a.businessModel} onChange={(v) => upd({ businessModel: v })} />
        </KV>
        <KV label="Digital maturity">
          <EditableSelect
            value={a.digitalMaturity}
            onChange={(v) => upd({ digitalMaturity: v as Account["digitalMaturity"] })}
            options={MATURITY_OPTIONS}
          />
        </KV>
        <KV label="Cloud strategy">
          <EditableText value={a.cloudStrategy} onChange={(v) => upd({ cloudStrategy: v })} />
        </KV>
      </Card>
      <Card title="Key challenges">
        <StringList
          items={a.challenges}
          onChange={(next) => upd({ challenges: next })}
          placeholder="Add challenge"
        />
      </Card>
      <Card title="Strategic priorities (Customer)">
        <StringList
          items={a.priorities}
          onChange={(next) => upd({ priorities: next })}
          placeholder="Add priority"
        />
      </Card>
    </div>
  );
}

export default AccountDetail;
