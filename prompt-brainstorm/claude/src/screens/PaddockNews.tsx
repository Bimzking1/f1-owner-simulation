import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockPaddockNews } from "@/lib/mockData";

export function PaddockNews() {
  return (
    <div className="min-h-screen">
      <NavBar season={2025} round={8} totalRounds={24} cash={42.8} />
      <Page>
        <Eyebrow>Paddock News</Eyebrow>
        <SectionTitle>What's happening this week</SectionTitle>

        <div className="mt-6 space-y-3">
          {mockPaddockNews.map((n, i) => (
            <Card key={i} className="flex items-start gap-3">
              <Badge tone="telemetry">{n.tag}</Badge>
              <p className="text-sm text-ink-soft flex-1">{n.text}</p>
            </Card>
          ))}
        </div>
      </Page>
    </div>
  );
}
