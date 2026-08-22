import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Cookie Policy",
  description: "How Avepo Smart Farm uses cookies and similar technologies, and how you can control them.",
  path: "/cookies",
});

export default async function CookiesPage() {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 } });
  const farmName = settings?.farmName ?? "Avepo Smart Farm";
  const email = settings?.email ?? "support@avepo.co.ke";

  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      effectiveDate={CURRENT_TERMS_VERSION}
      intro={
        <p>
          This Cookie Policy explains what cookies are, which ones {farmName} uses, and how you can control them.
          It should be read together with our <a href="/privacy">Privacy Policy</a>.
        </p>
      }
    >
      <LegalSection title="1. What are cookies">
        <p>
          Cookies are small text files placed on your device when you visit a website. Similar technologies
          include local storage, used to remember information in your browser between visits. We use both terms
          (&quot;cookies&quot;) throughout this policy for simplicity.
        </p>
      </LegalSection>

      <LegalSection title="2. The categories of cookies we use">
        <ul>
          <li>
            <strong>Strictly necessary (always on).</strong> These are required for our website and customer
            portal to function — for example, keeping you signed in, remembering items in an active booking, and
            protecting against fraud and abuse. Because these are essential, they cannot be switched off, and do
            not require consent under applicable law.
          </li>
          <li>
            <strong>Preference.</strong> Used to remember your cookie-consent choice itself, so we don&apos;t ask
            you again on every visit.
          </li>
          <li>
            <strong>Analytics and marketing (optional).</strong> We do not currently run analytics or marketing
            cookies on this website. If we introduce them in future — for example to understand how our website is
            used, or to measure the effectiveness of advertising — they will only be set if you opt in via our
            cookie banner, and this policy will be updated to describe them before they are used.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Your choices">
        <p>
          When you first visit our website, you can choose to accept all cookies or continue with strictly
          necessary cookies only. You can change your choice at any time using the &quot;Cookie Settings&quot;
          link in the website footer. You can also control or delete cookies through your browser settings —
          note that blocking strictly necessary cookies may prevent parts of our website (such as signing in or
          completing a booking) from working correctly.
        </p>
      </LegalSection>

      <LegalSection title="4. Third-party cookies">
        <p>
          We do not currently embed third-party advertising, social media or analytics scripts on this website.
          If that changes, this policy will be updated to name each provider and the purpose of their cookies
          before they are activated.
        </p>
      </LegalSection>

      <LegalSection title="5. Changes to this policy">
        <p>
          We may update this Cookie Policy from time to time; the &quot;Effective date&quot; above shows when it
          was last revised.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact us">
        <p>
          Questions about our use of cookies can be sent to <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
