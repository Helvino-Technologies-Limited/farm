-- CreateEnum
CREATE TYPE "CropCycleStatus" AS ENUM ('PLANNED', 'GROWING', 'HARVESTING', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "CropExpenseCategory" AS ENUM ('LABOUR', 'SEEDS', 'FERTILIZER', 'CHEMICALS', 'IRRIGATION', 'EQUIPMENT', 'TRANSPORT', 'OTHER');

-- CreateTable
CREATE TABLE "plots" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "sizeAcres" DECIMAL(8,3),
    "location" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_cycles" (
    "id" TEXT NOT NULL,
    "cycleNumber" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "productId" TEXT,
    "cropName" TEXT NOT NULL,
    "season" TEXT,
    "plantedDate" TIMESTAMP(3) NOT NULL,
    "expectedHarvestDate" TIMESTAMP(3),
    "closedDate" TIMESTAMP(3),
    "status" "CropCycleStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_expenses" (
    "id" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "category" "CropExpenseCategory" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "quantity" DECIMAL(12,3),
    "quantityUnit" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "PaymentMethod",
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvests" (
    "id" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "amountReceived" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "buyer" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harvests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plots_code_key" ON "plots"("code");

-- CreateIndex
CREATE UNIQUE INDEX "crop_cycles_cycleNumber_key" ON "crop_cycles"("cycleNumber");

-- CreateIndex
CREATE INDEX "crop_cycles_plotId_idx" ON "crop_cycles"("plotId");

-- CreateIndex
CREATE INDEX "crop_cycles_status_idx" ON "crop_cycles"("status");

-- CreateIndex
CREATE INDEX "crop_expenses_cropCycleId_idx" ON "crop_expenses"("cropCycleId");

-- CreateIndex
CREATE INDEX "harvests_cropCycleId_idx" ON "harvests"("cropCycleId");

-- AddForeignKey
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_expenses" ADD CONSTRAINT "crop_expenses_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_expenses" ADD CONSTRAINT "crop_expenses_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
