import { AlertTriangle, CheckCircle2, Lightbulb, TrendingUp } from "lucide-react";
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
      ["revenue", "risk", "paid", "recommend", "next action", "summary"].some((keyword) => lower.includes(keyword)) &&
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
  const risk = sectionText(summary, ["risk", "pending"]) ?? [];
  const paid = sectionText(summary, ["paid"]) ?? [];
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
      <InsightCard icon={AlertTriangle} title="Risk Review" tone="amber">
        {(risk.length ? risk : ["Review pending transactions and active unpaid links."]).map((item) => (
          <p key={item}>{item}</p>
        ))}
      </InsightCard>
      <InsightCard icon={CheckCircle2} title="Paid Link Summary">
        {(paid.length ? paid : ["Completed links are locked after payment to prevent duplicate attempts."]).map((item) => (
          <p key={item}>{item}</p>
        ))}
      </InsightCard>
      <InsightCard icon={Lightbulb} title="Recommendations">
        {(recommendations.length ? recommendations : fallback.slice(2, 5)).map((item) => (
          <p key={item}>{item}</p>
        ))}
      </InsightCard>
    </div>
  );
}
