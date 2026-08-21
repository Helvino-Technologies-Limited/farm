import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding Avepo Smart Farm master data...");

  const settings = await db.systemSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      farmName: "Avepo Smart Farm",
      currency: "KES",
      location: "Kenya",
      creditSaleRequiresApproval: true,
      defaultDiscountLimit: 10,
    },
    update: {},
  });
  console.log("System settings:", settings.farmName);

  const units = [
    { name: "Piece", abbreviation: "pc" },
    { name: "Kilogram", abbreviation: "kg" },
    { name: "Litre", abbreviation: "L" },
    { name: "Bag", abbreviation: "bag" },
    { name: "Tray", abbreviation: "tray" },
    { name: "Bird", abbreviation: "bird" },
    { name: "Bunch", abbreviation: "bunch" },
    { name: "Crate", abbreviation: "crate" },
    { name: "Metre", abbreviation: "m" },
    { name: "Session", abbreviation: "session" },
  ];
  for (const u of units) {
    await db.unit.upsert({ where: { name: u.name }, create: u, update: {} });
  }
  console.log(`Units: ${units.length}`);

  const categories = [
    { name: "Seedlings", code: "SDL", salesCentre: "SEEDLINGS" as const },
    { name: "Field Vegetables", code: "VEG", salesCentre: "FIELD_VEGETABLES" as const },
    { name: "Crops", code: "CRP", salesCentre: "CROPS" as const },
    { name: "Fruits", code: "FRT", salesCentre: "FRUITS" as const },
    { name: "Poultry", code: "PLT", salesCentre: "POULTRY" as const },
    { name: "Dairy", code: "DRY", salesCentre: "DAIRY" as const },
    { name: "Feeds", code: "FED", salesCentre: "FEEDS" as const },
    { name: "Animals", code: "ANM", salesCentre: "ANIMAL_PRODUCTION" as const },
    { name: "Drip Installation", code: "DRP", salesCentre: "DRIP_INSTALLATION" as const },
    { name: "Water", code: "WTR", salesCentre: "WATER" as const },
    { name: "Training & Advisory", code: "TRN", salesCentre: "TRAINING_ADVISORY" as const },
  ];
  for (const c of categories) {
    await db.productCategory.upsert({ where: { name: c.name }, create: c, update: {} });
  }
  console.log(`Product categories: ${categories.length}`);

  const expenseCategories = [
    "Feed", "Seeds", "Fertilizer", "Veterinary", "Labour", "Salaries", "Fuel",
    "Transport", "Electricity", "Water", "Repairs", "Maintenance", "Packaging",
    "Marketing", "Administration", "Other",
  ];
  for (const name of expenseCategories) {
    await db.expenseCategory.upsert({ where: { name }, create: { name }, update: {} });
  }
  console.log(`Expense categories: ${expenseCategories.length}`);

  const users = [
    { email: "admin@avepo.co.ke", name: "System Administrator", password: "Avepo@2026", role: "ADMIN" as const },
    { email: "manager@avepo.co.ke", name: "Farm Manager", password: "Manager@2026", role: "MANAGER" as const },
  ];

  let admin = null;
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = await db.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, passwordHash, role: u.role },
      update: {},
    });
    if (u.role === "ADMIN") admin = user;
    console.log(`User: ${u.email} (${u.role})`);
  }

  if (admin) {
    await db.customer.upsert({
      where: { customerNumber: "AVP-CUS-000000" },
      create: {
        customerNumber: "AVP-CUS-000000",
        name: "Walk-in / Cash Customer",
        phone: "N/A",
        customerType: "RETAIL",
        createdById: admin.id,
      },
      update: {},
    });
    console.log("Default walk-in customer created.");
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
