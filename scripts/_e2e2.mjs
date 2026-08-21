import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

const stamp = Date.now();
const testSku = `TEST-${stamp}`;
const testEmail = `test-portal-${stamp}@example.com`;

async function shot(name) {
  await page.screenshot({ path: `/tmp/claude-1000/-home-kevob-farm/04a11281-2be4-4828-84bf-a7409534a488/scratchpad/${name}.png`, fullPage: true });
}

try {
  console.log("=== STAFF: create + list + photo-upload a test product ===");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("admin@avepo.co.ke");
  await page.getByLabel("Password").fill("Avepo@2026");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("http://localhost:3000/products", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /add product/i }).click();
  await page.getByLabel("SKU").fill(testSku);
  await page.getByLabel("Name").fill("__TEST__ Portal Kienyeji");
  await page.getByText("Select category").click();
  await page.getByRole("option", { name: "Poultry" }).click();
  await page.getByText("Select unit").click();
  await page.getByRole("option", { name: /Bird/i }).click();
  await page.getByLabel("Selling Price").fill("600");
  await page.getByLabel(/Poultry Product/i).check();
  await page.getByRole("button", { name: /create product/i }).click();
  await page.waitForTimeout(1500);
  await shot("11-product-created");

  const productRow = page.locator("tr", { hasText: "__TEST__ Portal Kienyeji" });
  await productRow.locator('input[type="file"]').setInputFiles(
    "/tmp/claude-1000/-home-kevob-farm/04a11281-2be4-4828-84bf-a7409534a488/scratchpad/test-photo.png"
  );
  await page.waitForTimeout(1500);
  console.log("Photo uploaded.");
  await shot("12-photo-uploaded");

  console.log("=== Create a poultry batch for this product ===");
  await page.goto("http://localhost:3000/poultry", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /new batch/i }).click();
  await page.getByLabel("Breed").fill("__TEST__Kienyeji");
  await page.getByLabel("Hatch Date").fill("2026-08-01");
  await page.getByLabel("Initial Quantity").fill("50");
  await page.getByText("Select poultry product").click();
  await page.getByRole("option", { name: "__TEST__ Portal Kienyeji" }).first().click();
  await page.getByRole("button", { name: /create batch/i }).click();
  await page.waitForTimeout(1500);
  await shot("13-batch-created");

  await page.getByRole("button", { name: /add age price rule/i }).click();
  await page.getByLabel("Stage Label").fill("__TEST__ Any Age");
  await page.getByLabel("Min Age (days)").fill("0");
  await page.getByLabel("Price (KES)").fill("600");
  await page.getByRole("button", { name: /create rule/i }).click();
  await page.waitForTimeout(1500);
  await shot("14-age-rule-created");

  console.log("=== Sign out of staff, view public catalog ===");
  await page.getByTitle("Sign out").click();
  await page.waitForURL("**/login");

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  const catalogHasProduct = await page.getByText("__TEST__ Portal Kienyeji").isVisible();
  console.log("Product visible on public catalog:", catalogHasProduct);
  await shot("15-catalog");

  console.log("=== CUSTOMER: register, book, pay ===");
  await page.getByRole("link", { name: "__TEST__ Portal Kienyeji" }).first().click().catch(() => {});
  // click the Book Now button on the product card instead if the name isn't a link
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  const card = page.locator("div", { hasText: "__TEST__ Portal Kienyeji" }).last();
  await card.getByRole("button", { name: /book now/i }).click();
  await page.waitForURL("**/portal/login**");
  console.log("Redirected to login with next param:", page.url());

  await page.getByRole("link", { name: /create an account/i }).click();
  await page.waitForURL("**/portal/register**");
  await page.getByLabel("Full Name").fill("Test Portal Customer");
  await page.getByLabel("Email").fill(testEmail);
  await page.getByLabel("Phone").fill("0711000000");
  await page.getByLabel("Password").fill("TestPass123");
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL("**/portal/book/**", { timeout: 25000 });
  console.log("Registered + logged in, redirected straight back to booking page:", page.url());
  await shot("17-book-page");

  // A batch is pre-selected by default; just confirm the label resolved correctly (not a raw id).
  const batchSelectText = await page.locator("text=/AVP-PLT-/").first().innerText().catch(() => "");
  console.log("Batch select shows friendly label:", batchSelectText);
  await page.locator('input[type="number"]').first().fill("5");
  await page.getByRole("button", { name: /^book now$/i }).click();
  await page.waitForURL("**/portal/invoices/**", { timeout: 35000 });
  console.log("Booking placed, redirected to invoice:", page.url());
  await shot("18-invoice-after-booking");

  console.log("=== Submit a payment ===");
  await page.waitForLoadState("networkidle");
  const paymentCard = page.locator("div", { hasText: "Make a Payment" }).last();
  await paymentCard.getByLabel("Amount", { exact: true }).fill("1000");
  await paymentCard.getByLabel(/M-Pesa Code|Reference/i).fill("TEST123XYZ");
  await paymentCard.getByRole("button", { name: /submit payment/i }).click();
  await page.waitForTimeout(3000);
  await shot("19-after-payment");

  const balanceText = await page.locator("text=Balance").first().innerText().catch(() => "");
  console.log("Balance area text snippet found:", !!balanceText);

  console.log("=== Download PDF (no crash check) ===");
  await page.getByRole("button", { name: /download pdf/i }).click();
  await page.waitForTimeout(1000);

  console.log("\nConsole/page errors captured:", errors.length);
  for (const e of errors.slice(0, 20)) console.log("  -", e);

  console.log("\nE2E RUN COMPLETE");
} finally {
  await browser.close();

  console.log("\n=== CLEANUP ===");
  const product = await db.product.findFirst({ where: { sku: testSku } });
  const customer = await db.customer.findFirst({ where: { email: testEmail } });
  const batch = product ? await db.poultryBatch.findFirst({ where: { productId: product.id } }) : null;

  if (customer) {
    await db.paymentAllocation.deleteMany({ where: { invoice: { customerId: customer.id } } });
    await db.payment.deleteMany({ where: { customerId: customer.id } });
    await db.invoiceItem.deleteMany({ where: { invoice: { customerId: customer.id } } });
    await db.invoice.deleteMany({ where: { customerId: customer.id } });
    await db.bookingItem.deleteMany({ where: { booking: { customerId: customer.id } } });
    await db.booking.deleteMany({ where: { customerId: customer.id } });
    await db.customerSession.deleteMany({ where: { customerId: customer.id } });
    await db.customer.delete({ where: { id: customer.id } });
  }
  if (batch) {
    await db.poultryAgePriceRule.deleteMany({ where: { batchId: batch.id } });
    await db.poultryAgePriceRule.deleteMany({ where: { breed: "__TEST__Kienyeji" } });
    await db.poultryMortality.deleteMany({ where: { batchId: batch.id } });
    if (product) await db.inventoryTransaction.deleteMany({ where: { productId: product.id } });
    await db.poultryBatch.delete({ where: { id: batch.id } });
  }
  if (product) await db.product.delete({ where: { id: product.id } });
  console.log("Cleanup complete.");
  await db.$disconnect();
}
