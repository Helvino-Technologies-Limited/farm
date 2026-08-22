import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "FAQ — Avepo Smart Farm",
  description: "Frequently asked questions about booking, payment and delivery at Avepo Smart Farm.",
  path: "/faq",
});

const DEFAULT_FAQS = [
  { question: "Do I need an account to browse products?", answer: "No — anyone can browse products, services and prices without an account." },
  { question: "Do I need an account to book?", answer: "Yes, an account is required to book so we can track your orders, invoices and payments." },
  { question: "Can I make a partial payment?", answer: "Yes, where the product or booking terms allow it. The remaining balance is tracked on your invoice." },
  { question: "Can I book chickens in advance?", answer: "Yes — select the age or stage you want and the applicable price is calculated automatically." },
  { question: "How is chicken pricing determined?", answer: "Based on the applicable age/stage pricing at the time of booking." },
];

export default async function FaqPage() {
  const faqsFromDb = await db.websiteFaq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const faqs = faqsFromDb.length > 0 ? faqsFromDb : DEFAULT_FAQS;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">FAQ</p>
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Frequently Asked Questions</h1>
      <div className="mt-10 space-y-4">
        {faqs.map((f, i) => (
          <details key={f.question} className="group rounded-lg border bg-card p-5" open={i === 0}>
            <summary className="cursor-pointer list-none text-lg font-medium">{f.question}</summary>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{f.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
