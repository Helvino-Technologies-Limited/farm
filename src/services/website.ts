import "server-only";
import { db } from "@/lib/db";
import { logAudit } from "./audit";
import { notifyStaff } from "./notifications";
import type { SessionUser } from "@/lib/auth";

export async function createWebsiteFeature(
  data: { title: string; description?: string; icon?: string },
  actingUser: SessionUser
) {
  const count = await db.websiteFeature.count();
  const feature = await db.websiteFeature.create({ data: { ...data, sortOrder: count } });
  await logAudit(db, { user: actingUser, action: "CREATE", module: "website-features", recordId: feature.id, newValue: data });
  return feature;
}

export async function createWebsiteService(
  data: { title: string; description: string; icon?: string },
  actingUser: SessionUser
) {
  const count = await db.websiteServiceEntry.count();
  const service = await db.websiteServiceEntry.create({ data: { ...data, sortOrder: count } });
  await logAudit(db, { user: actingUser, action: "CREATE", module: "website-services", recordId: service.id, newValue: data });
  return service;
}

export async function createWebsiteFaq(
  data: { question: string; answer: string },
  actingUser: SessionUser
) {
  const count = await db.websiteFaq.count();
  const faq = await db.websiteFaq.create({ data: { ...data, sortOrder: count } });
  await logAudit(db, { user: actingUser, action: "CREATE", module: "website-faqs", recordId: faq.id, newValue: data });
  return faq;
}

export async function createWebsiteTestimonial(
  data: { customerName: string; role?: string; quote: string; rating?: number },
  actingUser: SessionUser
) {
  const count = await db.websiteTestimonial.count();
  const testimonial = await db.websiteTestimonial.create({ data: { ...data, sortOrder: count } });
  await logAudit(db, { user: actingUser, action: "CREATE", module: "website-testimonials", recordId: testimonial.id, newValue: data });
  return testimonial;
}

export async function createGalleryImage(
  data: { imageUrl: string; caption?: string; category?: string; featured?: boolean },
  actingUser: SessionUser
) {
  const count = await db.galleryImage.count();
  const image = await db.galleryImage.create({
    data: { ...data, sortOrder: count, uploadedById: actingUser.id },
  });
  await logAudit(db, { user: actingUser, action: "CREATE", module: "gallery-images", recordId: image.id, newValue: { caption: data.caption, category: data.category } });
  return image;
}

export async function submitContactMessage(data: { name: string; phone?: string; email?: string; subject?: string; message: string }) {
  const contactMessage = await db.contactMessage.create({ data });
  await notifyStaff(db, {
    title: "New contact enquiry",
    message: `${data.name}: ${data.subject || data.message.slice(0, 80)}`,
    type: "SYSTEM",
    module: "contact",
    recordId: contactMessage.id,
  });
  return contactMessage;
}
