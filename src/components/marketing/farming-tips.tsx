import { Bird, Sprout, Milk, Droplets } from "lucide-react";

const TIPS = [
  {
    icon: Bird,
    title: "Brooding temperature matters most",
    body: "Keep day-old chicks at 32–35°C for the first week, reducing by about 3°C each week after. Watch their behaviour — huddling means too cold, panting and spreading out means too hot.",
  },
  {
    icon: Sprout,
    title: "Harden seedlings before transplanting",
    body: "Reduce watering and expose seedlings to more sunlight for 5–7 days before transplanting. It reduces transplant shock and improves survival rate in the field.",
  },
  {
    icon: Milk,
    title: "Consistent milking times boost yield",
    body: "Milking at the same times every day (e.g. 6am and 6pm) keeps a dairy animal's hormonal cycle stable, which supports steady, higher milk production over time.",
  },
  {
    icon: Droplets,
    title: "Drip irrigation saves water and labour",
    body: "A well-designed drip system can cut water use by up to 60% compared to furrow irrigation, while delivering nutrients straight to the root zone for healthier crops.",
  },
];

export function FarmingTips() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 max-w-2xl">
        <h2 className="text-3xl font-semibold">Farming Tips</h2>
        <p className="mt-2 text-muted-foreground">Practical advice from the Avepo team to help your farm do better.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIPS.map((tip) => (
          <div key={tip.title} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-avepo-yellow-light/50 text-avepo-green">
              <tip.icon className="h-5 w-5" />
            </div>
            <h3 className="font-medium">{tip.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{tip.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
