import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  cards?: Array<{
    title: string;
    description: string;
  }>;
};

export function PageShell({ eyebrow, title, description, cards = [] }: PageShellProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-20 rounded-md border border-dashed border-slate-700 bg-slate-950/50" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
