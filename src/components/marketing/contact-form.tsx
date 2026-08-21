"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactAction, type ContactFormState } from "@/app/(marketing)/contact/actions";

const initialState: ContactFormState = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, initialState);

  useEffect(() => {
    if (state.success) toast.success("Message sent — we'll get back to you soon.");
    if (state.error) toast.error(state.error);
  }, [state]);

  if (state.success) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-lg font-semibold">Thank you — your message has been received.</p>
        <p className="mt-2 text-sm text-muted-foreground">We&apos;ll get back to you as soon as possible.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input id="contact-phone" name="phone" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input id="contact-email" name="email" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-subject">Subject</Label>
          <Input id="contact-subject" name="subject" placeholder="Product availability, booking, etc." />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea id="contact-message" name="message" rows={5} required />
      </div>
      <Button type="submit" disabled={pending} className="bg-avepo-green text-white hover:bg-avepo-green-light">
        {pending ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
