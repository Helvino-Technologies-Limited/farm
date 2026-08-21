import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/login", "/portal/login", "/portal/register", "/dashboard", "/customers", "/products", "/pricing", "/poultry", "/quotations", "/bookings", "/sales", "/invoices", "/payments", "/credit", "/inventory", "/expenses", "/cash", "/reports", "/users", "/audit-logs", "/settings", "/portal/bookings", "/portal/invoices", "/portal", "/api"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
