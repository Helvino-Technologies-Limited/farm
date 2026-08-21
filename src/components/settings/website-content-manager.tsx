"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeleteRecordButton } from "@/components/admin/delete-record-button";
import {
  createWebsiteFeatureAction,
  createWebsiteServiceAction,
  createWebsiteFaqAction,
  createWebsiteTestimonialAction,
} from "@/app/(dashboard)/settings/actions";

export function WebsiteFeaturesManager({ features }: { features: { id: string; title: string; description: string | null }[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!title) { toast.error("Title is required."); return; }
    setSubmitting(true);
    try {
      await createWebsiteFeatureAction({ title, description: description || undefined });
      toast.success("Added to Why Choose Us.");
      setTitle(""); setDescription("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-end">
        <div className="space-y-1 sm:col-span-1"><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reliable Supply" /></div>
        <div className="space-y-1 sm:col-span-1"><Label className="text-xs">Description (optional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <Button onClick={submit} disabled={submitting} variant="outline">Add</Button>
      </div>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <div><span className="font-medium">{f.title}</span>{f.description && <span className="text-muted-foreground"> — {f.description}</span>}</div>
            <DeleteRecordButton module="website-features" id={f.id} label={f.title} size="icon" className="h-7 w-7" />
          </li>
        ))}
        {features.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
      </ul>
    </div>
  );
}

export function WebsiteServicesManager({ services }: { services: { id: string; title: string; description: string }[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!title || !description) { toast.error("Title and description are required."); return; }
    setSubmitting(true);
    try {
      await createWebsiteServiceAction({ title, description });
      toast.success("Service added.");
      setTitle(""); setDescription("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Drip Irrigation Installation" />
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Farm assessment, materials, setup and support." rows={2} />
        <Button onClick={submit} disabled={submitting} variant="outline">Add Service</Button>
      </div>
      <ul className="space-y-2">
        {services.map((s) => (
          <li key={s.id} className="flex items-start justify-between rounded-md border px-3 py-2 text-sm">
            <div><p className="font-medium">{s.title}</p><p className="text-muted-foreground">{s.description}</p></div>
            <DeleteRecordButton module="website-services" id={s.id} label={s.title} size="icon" className="h-7 w-7 shrink-0" />
          </li>
        ))}
        {services.length === 0 && <p className="text-sm text-muted-foreground">No services yet.</p>}
      </ul>
    </div>
  );
}

export function WebsiteFaqManager({ faqs }: { faqs: { id: string; question: string; answer: string }[] }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!question || !answer) { toast.error("Question and answer are required."); return; }
    setSubmitting(true);
    try {
      await createWebsiteFaqAction({ question, answer });
      toast.success("FAQ added.");
      setQuestion(""); setAnswer("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Can I make a partial payment?" />
        <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Yes, where the product/booking terms allow it." rows={2} />
        <Button onClick={submit} disabled={submitting} variant="outline">Add FAQ</Button>
      </div>
      <ul className="space-y-2">
        {faqs.map((f) => (
          <li key={f.id} className="flex items-start justify-between rounded-md border px-3 py-2 text-sm">
            <div><p className="font-medium">{f.question}</p><p className="text-muted-foreground">{f.answer}</p></div>
            <DeleteRecordButton module="website-faqs" id={f.id} label={f.question} size="icon" className="h-7 w-7 shrink-0" />
          </li>
        ))}
        {faqs.length === 0 && <p className="text-sm text-muted-foreground">No FAQs yet.</p>}
      </ul>
    </div>
  );
}

export function WebsiteTestimonialsManager({
  testimonials,
}: {
  testimonials: { id: string; customerName: string; role: string | null; quote: string; rating: number | null }[];
}) {
  const [customerName, setCustomerName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState("5");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!customerName || !quote) { toast.error("Customer name and quote are required."); return; }
    setSubmitting(true);
    try {
      await createWebsiteTestimonialAction({ customerName, role: role || undefined, quote, rating: Number(rating) });
      toast.success("Testimonial added.");
      setCustomerName(""); setRole(""); setQuote("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
        <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Location or role (optional)" />
      </div>
      <Textarea value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Their feedback" rows={2} />
      <div className="flex items-center gap-2">
        <Label className="text-xs">Rating</Label>
        <Input type="number" min={1} max={5} className="w-20" value={rating} onChange={(e) => setRating(e.target.value)} />
        <Button onClick={submit} disabled={submitting} variant="outline">Add Testimonial</Button>
      </div>
      <ul className="space-y-2">
        {testimonials.map((t) => (
          <li key={t.id} className="flex items-start justify-between rounded-md border px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{t.customerName} {t.role && <span className="text-muted-foreground font-normal">· {t.role}</span>}</p>
              <p className="text-muted-foreground">&quot;{t.quote}&quot;{t.rating && ` — ${t.rating}/5`}</p>
            </div>
            <DeleteRecordButton module="website-testimonials" id={t.id} label={t.customerName} size="icon" className="h-7 w-7 shrink-0" />
          </li>
        ))}
        {testimonials.length === 0 && <p className="text-sm text-muted-foreground">No testimonials yet.</p>}
      </ul>
    </div>
  );
}
