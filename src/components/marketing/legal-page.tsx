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
      <p className="text-base font-semibold uppercase tracking-wider text-avepo-green">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{title}</h1>
      <p className="mt-3 text-base text-muted-foreground">Effective date: {effectiveDate}</p>
      {intro && <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">{intro}</div>}
      <div className="mt-12 space-y-12">{children}</div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground [&_a]:text-avepo-green [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_li+li]:mt-2 [&_strong]:font-semibold [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
