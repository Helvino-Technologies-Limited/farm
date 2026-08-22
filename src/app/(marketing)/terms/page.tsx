import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms and conditions that govern use of the Avepo Smart Farm website, customer portal and bookings.",
  path: "/terms",
});

export default async function TermsPage() {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 } });
  const farmName = settings?.farmName ?? "Avepo Smart Farm";
  const email = settings?.email ?? "support@avepo.co.ke";
  const phone = settings?.phone;
  const location = settings?.location ?? "Kenya";

  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      effectiveDate={CURRENT_TERMS_VERSION}
      intro={
        <p>
          These Terms of Service (&quot;Terms&quot;) are a binding agreement between you (&quot;you&quot;, &quot;customer&quot;) and{" "}
          {farmName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), based in {location}, governing your use of our
          website, customer portal, and any products or services you order or book from us. By creating an account,
          placing an order, making a booking, or otherwise using our website, you confirm that you accept these
          Terms and our{" "}
          <a href="/privacy">Privacy Policy</a>. If you do not agree, please do not use our website or services.
        </p>
      }
    >
      <LegalSection title="1. Who we are">
        <p>
          {farmName} operates an integrated farm — supplying poultry, seedlings, crops, vegetables, fruits, dairy
          and animal feeds — and provides agricultural services including drip irrigation installation, water
          services, and farmer training and advisory. You can reach us at{" "}
          <a href={`mailto:${email}`}>{email}</a>
          {phone ? (
            <>
              {" "}
              or by phone at <a href={`tel:${phone}`}>{phone}</a>
            </>
          ) : null}
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility and your account">
        <ul>
          <li>You must be at least 18 years old, or registering with the involvement of a parent or guardian, to create a customer account or place an order.</li>
          <li>The information you give us when registering or booking (name, email, phone, delivery/collection details) must be accurate and kept up to date.</li>
          <li>You are responsible for keeping your account password confidential and for all activity under your account. Tell us immediately if you suspect unauthorised access.</li>
          <li>We may suspend or close accounts used fraudulently, abusively, or in breach of these Terms.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Products, services and availability">
        <ul>
          <li>Product descriptions, photos, availability and pricing on our website are provided in good faith but may change without notice, including due to seasonal availability, stock levels, or supplier conditions.</li>
          <li>Poultry pricing may vary by age/growth stage as displayed at the time of booking; the price shown when you confirm a booking is the price that applies to that booking.</li>
          <li>Services such as drip irrigation installation, water services, and training/advisory are scoped individually — the description, price and any site-visit requirements shown at the time of booking form part of your order.</li>
          <li>We reserve the right to limit order quantities and to decline or cancel an order or booking, including after acceptance, if a product or service becomes unavailable, if we suspect fraud, or if an error in pricing or description is identified — we will notify you and refund any amount already paid for the cancelled portion.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Bookings, orders and payment">
        <ul>
          <li>A booking or order is a request to purchase and is confirmed once we accept it (shown as a status change in your customer portal and/or a confirmation notification).</li>
          <li>Prices are shown in Kenya Shillings (KES) unless stated otherwise and include any taxes we are required to charge, unless stated otherwise.</li>
          <li>We accept payment by M-Pesa, bank transfer, cash, card and cheque, as made available to you at checkout or by our staff. Approved customers may also be extended a credit facility with an agreed credit limit, repayable on the terms communicated to you at the time it is granted.</li>
          <li>For bookings that accept partial payment, the outstanding balance and due date will be shown on your invoice in the customer portal. Goods or services may be withheld until payment is received in full, where stated at the time of booking.</li>
          <li>You are responsible for entering correct M-Pesa or bank transaction references when submitting proof of payment; we are not liable for delays caused by incorrect references.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Delivery, collection and site services">
        <ul>
          <li>Where you choose delivery, we will deliver to the address you provide within the timeframe communicated to you; delivery times are estimates and not guaranteed.</li>
          <li>Where you choose collection, your order will be held for a reasonable period at the location communicated to you.</li>
          <li>For on-site services (e.g. drip irrigation installation), you must provide safe and reasonable access to the site at the agreed time. Delays caused by site access, weather, or circumstances outside our control may require rescheduling.</li>
          <li>Risk in physical goods passes to you on delivery or collection. Please inspect goods (particularly livestock and perishables) at the point of handover and raise any concern immediately.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Cancellations and refunds">
        <ul>
          <li>You may request to cancel a booking or order before it is confirmed or fulfilled by contacting us; confirmed bookings may be subject to the cancellation terms communicated to you at the time of booking, particularly for perishable goods, livestock, and services already scheduled or performed.</li>
          <li>Where a cancellation is accepted, or where we cancel under Section 3, any amount already paid for the cancelled portion will be refunded to you using a reasonable method (e.g. M-Pesa reversal, bank transfer, or credit note) within a reasonable time.</li>
          <li>Nothing in this section affects your rights under applicable consumer protection law.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Your personal data">
        <p>
          Our collection and use of your personal data — including the consent you give when registering — is
          described in our <a href="/privacy">Privacy Policy</a>, and our use of cookies and similar technologies is
          described in our <a href="/cookies">Cookie Policy</a>. Both form part of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="8. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>use our website or portal for any unlawful purpose, or in a way that could damage, disable or impair it;</li>
          <li>attempt to gain unauthorised access to any account, system or data that is not yours;</li>
          <li>submit false, misleading or fraudulent information, including false payment references; or</li>
          <li>copy, scrape, resell or redistribute content from our website without our written permission.</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Intellectual property">
        <p>
          All content on our website — including text, photos, logos and the {farmName} name and branding — is
          owned by or licensed to us and is protected by intellectual property law. You may view and print pages
          for your personal, non-commercial use, but may not otherwise copy, reproduce or exploit our content
          without our written consent.
        </p>
      </LegalSection>

      <LegalSection title="10. Disclaimers and limitation of liability">
        <ul>
          <li>We take reasonable care in describing our products and services, but agricultural products (including livestock) are natural products and outcomes such as growth rates, yields and survival can vary and are not guaranteed.</li>
          <li>To the fullest extent permitted by law, we are not liable for indirect or consequential loss arising from your use of our website or services.</li>
          <li>Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited, including liability for death or personal injury caused by negligence, or for fraud.</li>
        </ul>
      </LegalSection>

      <LegalSection title="11. Changes to these Terms">
        <p>
          We may update these Terms from time to time, for example to reflect changes in our services or the law.
          The &quot;Effective date&quot; above shows when these Terms were last updated. Where changes are material,
          we will take reasonable steps to notify registered customers. Continued use of our website or services
          after an update means you accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law and disputes">
        <p>
          These Terms are governed by the laws of the Republic of Kenya. We will always try to resolve any concern
          informally first — please contact us using the details below. Subject to your non-waivable consumer
          rights, the courts of Kenya have exclusive jurisdiction over any dispute arising from these Terms.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact us">
        <p>
          Questions about these Terms can be sent to <a href={`mailto:${email}`}>{email}</a>
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
