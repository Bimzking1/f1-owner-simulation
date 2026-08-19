import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const inherited = [
  { label: "Starting cash", value: "$62.0M" },
  { label: "Existing driver contracts", value: "1 held contract — buyout required to replace" },
  { label: "Engine supplier deal", value: "Customer engine, 2-season term" },
  { label: "Factory infrastructure", value: "Mid-tier wind tunnel access" },
  { label: "Staff carried over", value: "Race Engineer (78), 2 Mechanics (71 avg)" },
  { label: "Reputation", value: "Neutral — no championship history this decade" },
];

export function ConstructorConsequences() {
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Constructor Consequences</Eyebrow>
        <SectionTitle>What you inherit</SectionTitle>
        <p className="mt-2 text-sm text-ink-soft max-w-lg">
          Arden Racing comes with existing commitments. Review before you
          confirm — some of these can be changed later, at a cost.
        </p>

        <Card className="mt-6 divide-y divide-hairline">
          {inherited.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <span className="text-sm text-ink-soft">{row.label}</span>
              <span className="text-sm font-medium text-ink text-right">{row.value}</span>
            </div>
          ))}
        </Card>

        <div className="mt-4 flex items-center gap-2">
          <Badge tone="caution">Locked for season 1</Badge>
          <span className="text-xs text-ink-faint">Engine deal cannot be renegotiated until round 12.</span>
        </div>

        <div className="mt-8 flex justify-end">
          <Button>Confirm Constructor</Button>
        </div>
      </Page>
    </div>
  );
}
