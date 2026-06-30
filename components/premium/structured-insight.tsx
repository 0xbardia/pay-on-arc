import { AlertTriangle, CheckCircle2, Lightbulb, Target, TrendingUp } from "lucide-react";
import { InsightCard } from "@/components/premium/insight-card";

function cleanLine(line: string) {
  return line.replace(/^[-*#\d.:\s]+/, "").replace(/\*\*/g, "").trim();
}

function sectionText(summary: string, keywords: string[]) {
  const lines = summary.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const start = lines.findIndex((line) => keywords.some((keyword) => line.toLowerCase().includes(keyword)));

  if (start === -1) {
    return null;
  }

  const collected: string[] = [];

  for (const line of lines.slice(start + 1)) {
    const lower = line.toLowerCase();
    const looksLikeHeading =
      ["revenue", "risk", "paid", "best", "performing", "conversion", "recommend", "next action", "summary"].some((keyword) => lower.includes(keyword)) &&
      line.length < 80;

    if (looksLikeHeading && collected.length > 0) {
      break;
    }

    collected.push(cleanLine(line));
  }

  return collected.filter(Boolean).slice(0, 3);
}

export function StructuredInsight({ summary }: { summary: string }) {
  const revenue = sectionText(summary, ["revenue"]) ?? [];
  const bestLink = sectionText(summary, ["best", "performing"]) ?? [];
  const conversion = sectionText(summary, ["conversion", "pattern"]) ?? [];
  const recommendations = sectionText(summary, ["recommend", "next action"]) ?? [];
  const fallback = summary
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean)
    .slice(0, 6);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <InsightCard icon={TrendingUp} title="Revenue Summary" tone="emerald">
        {(revenue.length ? revenue : fallback.slice(0, 2)).map((item) => (
          <p key={item}>{item}</p>
        ))}
      </InsightCard>
      <InsightCard icon={Target} title="Best Performing Link">
        {(bestLink.length ? bestLink : ["Payment link performance appears after successful payments."]).map((item) => (
          <p key={item}>{item}</p>
        ))}
      </InsightCard>
      <InsightCard icon={AlertTriangle} title="Conversion Patterns" tone="amber">
        {(conversion.length ? conversion : ["Compare active links, paid links, and pending attempts to identify follow-up work."]).map((item) => (
          <p key={item}>{item}</p>
        ))}
      </InsightCard>
      <InsightCard icon={Lightbulb} title="Recommendations">
        {(recommendations.length ? recommendations : fallback.slice(2, 5)).map((item) => (
          <p key={item}>{item}</p>
        ))}
      </InsightCard>
      <InsightCard icon={CheckCircle2} title="Operational Notes">
        {["Paid links are locked after payment. Failed or pending transactions deserve the next review pass."].map((item) => (
          <p key={item}>{item}</p>
        ))}
      </InsightCard>
    </div>
  );
}
