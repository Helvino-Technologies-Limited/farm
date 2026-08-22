import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  effectiveDate,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective date: {effectiveDate}</p>
      {intro && <div className="mt-6 space-y-4 text-muted-foreground">{intro}</div>}
      <div className="mt-10 space-y-10">{children}</div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-avepo-green [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
