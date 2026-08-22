import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ContactForm } from "@/components/marketing/contact-form";
import { MapPin, Phone, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us — Avepo Smart Farm",
  description: "Get in touch with Avepo Smart Farm — call, WhatsApp or send us an enquiry.",
};

export default async function ContactPage() {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 } });

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">Contact</p>
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Get in touch</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Have a question about a product, service or an existing booking? Send us a message and we&apos;ll respond as soon as we can.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <ContactForm />
        <div className="space-y-4">
          {settings?.location && (
            <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
              <MapPin className="mt-0.5 h-5 w-5 text-avepo-green" />
              <div><p className="font-medium">Location</p><p className="text-base text-muted-foreground">{settings.location}</p>{settings.address && <p className="text-base text-muted-foreground">{settings.address}</p>}</div>
            </div>
          )}
          {settings?.phone && (
            <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
              <Phone className="mt-0.5 h-5 w-5 text-avepo-green" />
              <div><p className="font-medium">Phone</p><p className="text-base text-muted-foreground">{settings.phone}</p></div>
            </div>
          )}
          {settings?.email && (
            <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
              <Mail className="mt-0.5 h-5 w-5 text-avepo-green" />
              <div><p className="font-medium">Email</p><p className="text-base text-muted-foreground">{settings.email}</p></div>
            </div>
          )}
          {settings?.location && (
            <div className="overflow-hidden rounded-lg border">
              <iframe
                title="Farm location"
                src={`https://www.google.com/maps?q=${encodeURIComponent(settings.location)}&output=embed`}
                className="h-64 w-full"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
