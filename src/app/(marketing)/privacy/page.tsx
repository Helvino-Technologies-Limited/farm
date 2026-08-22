import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Avepo Smart Farm collects, uses, protects and lets you control your personal data.",
};

export default async function PrivacyPage() {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 } });
  const farmName = settings?.farmName ?? "Avepo Smart Farm";
  const email = settings?.email ?? "support@avepo.co.ke";
  const phone = settings?.phone;
  const location = settings?.location ?? "Kenya";

  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      effectiveDate={CURRENT_TERMS_VERSION}
      intro={
        <p>
          {farmName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy and is committed to
          protecting your personal data. This Privacy Policy explains what data we collect, why, how we protect it,
          and the rights you have over it, in line with the Kenya Data Protection Act, 2019, and international
          data protection standards including the EU General Data Protection Regulation (GDPR) principles. It
          applies to our website, customer portal, and any offline interactions (e.g. in-person or phone orders)
          where your data is recorded in our systems.
        </p>
      }
    >
      <LegalSection title="1. Who is responsible for your data">
        <p>
          {farmName}, based in {location}, is the &quot;data controller&quot; responsible for your personal data
          for the purposes described here. You can contact us about any privacy matter at{" "}
          <a href={`mailto:${email}`}>{email}</a>
          {phone ? (
            <>
              {" "}
              or <a href={`tel:${phone}`}>{phone}</a>
            </>
          ) : null}
          .
        </p>
      </LegalSection>

      <LegalSection title="2. What personal data we collect">
        <ul>
          <li><strong>Identity and contact data:</strong> name, email address, phone number, delivery/collection location and address.</li>
          <li><strong>Account data:</strong> your password (stored as a one-way cryptographic hash, never in plain text), customer number, and account status.</li>
          <li><strong>Transaction data:</strong> orders, bookings, quotations, invoices, payments and payment method/reference (e.g. M-Pesa code), and credit account history where applicable.</li>
          <li><strong>Communications data:</strong> messages you send us (e.g. via our contact form), and service/support notifications we send you.</li>
          <li><strong>Technical data:</strong> IP address, device/browser information, and session identifiers, collected automatically to keep your account secure and our website working correctly — see our <a href="/cookies">Cookie Policy</a>.</li>
        </ul>
        <p>We do not knowingly collect special categories of data (such as health or biometric data) through our website.</p>
      </LegalSection>

      <LegalSection title="3. How and why we use your data">
        <p>We use your personal data only where we have a lawful basis to do so:</p>
        <ul>
          <li><strong>To perform our contract with you</strong> — creating and managing your account, processing orders, bookings and payments, arranging delivery/collection, issuing invoices and receipts, and providing customer support.</li>
          <li><strong>With your consent</strong> — which you give when you register for an account, and which you may withdraw at any time (see Section 6). Withdrawing consent does not affect processing already carried out, or processing we need to do to fulfil an existing order or legal obligation.</li>
          <li><strong>To comply with legal obligations</strong> — such as tax, accounting and record-keeping requirements.</li>
          <li><strong>For our legitimate interests</strong> — such as keeping our systems secure, preventing fraud, improving our services, and maintaining business records — carried out in a way that does not override your rights and interests.</li>
        </ul>
        <p>We do not sell your personal data. We do not send marketing communications unless you have separately opted in.</p>
      </LegalSection>

      <LegalSection title="4. Who we share your data with">
        <ul>
          <li><strong>Our staff</strong>, on a need-to-know basis, to process your orders, bookings, payments and support requests.</li>
          <li><strong>Service providers</strong> who process data on our behalf under contract — for example our hosting, database and file-storage providers, and payment channels (e.g. M-Pesa, banks) you choose to use — solely to provide those services to us.</li>
          <li><strong>Authorities</strong>, where required by law, regulation, or a valid legal process.</li>
        </ul>
        <p>We do not share your personal data with third parties for their own marketing purposes.</p>
      </LegalSection>

      <LegalSection title="5. How long we keep your data">
        <p>
          We keep your account and transaction data for as long as your account is active, and afterwards for as
          long as necessary to meet our legal, tax and accounting obligations, resolve disputes, and enforce our
          agreements — after which it is deleted or anonymised.
        </p>
      </LegalSection>

      <LegalSection title="6. Your rights">
        <p>Subject to applicable law, you have the right to:</p>
        <ul>
          <li><strong>Access</strong> the personal data we hold about you;</li>
          <li><strong>Correct</strong> inaccurate or incomplete data;</li>
          <li><strong>Request erasure</strong> of your data, where we are not required to keep it (e.g. for tax records);</li>
          <li><strong>Restrict or object to</strong> certain processing of your data;</li>
          <li><strong>Data portability</strong> — receive a copy of the data you provided to us in a structured, commonly used format;</li>
          <li><strong>Withdraw consent</strong> at any time, where we rely on consent to process your data; and</li>
          <li><strong>Lodge a complaint</strong> with the Office of the Data Protection Commissioner (Kenya), or your local data protection authority.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <a href={`mailto:${email}`}>{email}</a>. We may need to
          verify your identity before acting on your request, and will respond within the timeframe required by
          applicable law.
        </p>
      </LegalSection>

      <LegalSection title="7. Keeping your data secure">
        <p>
          We use appropriate technical and organisational measures to protect your data, including encrypted
          connections (HTTPS), password hashing, access controls limiting staff access by role, and audit logging
          of sensitive actions. No system is completely secure, but we work to keep your data protected and to
          respond promptly to any incident.
        </p>
      </LegalSection>

      <LegalSection title="8. International transfers">
        <p>
          Some of our service providers (such as cloud hosting and file storage) may process data outside Kenya.
          Where this happens, we take steps to ensure your data continues to receive an appropriate level of
          protection, consistent with the Kenya Data Protection Act, 2019 and comparable international standards.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          Our services are not directed at children, and we do not knowingly collect personal data from anyone
          under 18 without the involvement of a parent or guardian.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time; the &quot;Effective date&quot; above shows when it
          was last revised. Where changes are material, we will take reasonable steps to notify registered
          customers.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact us">
        <p>
          For any question about this Privacy Policy or how we handle your data, contact us at{" "}
          <a href={`mailto:${email}`}>{email}</a>
          {phone ? (
            <>
              {" "}
              or <a href={`tel:${phone}`}>{phone}</a>
            </>
          ) : null}
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
