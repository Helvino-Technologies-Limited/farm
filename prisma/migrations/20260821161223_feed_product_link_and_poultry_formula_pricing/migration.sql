/*
  Warnings:

  - You are about to drop the column `feedType` on the `poultry_feed_records` table. All the data in the column will be lost.
  - Added the required column `productId` to the `poultry_feed_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "poultry_feed_records" DROP COLUMN "feedType",
ADD COLUMN     "productId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "poultryBasePrice" DECIMAL(10,2) NOT NULL DEFAULT 120,
ADD COLUMN     "poultryWeeklyIncrement" DECIMAL(10,2) NOT NULL DEFAULT 30;

-- CreateIndex
CREATE INDEX "poultry_feed_records_productId_idx" ON "poultry_feed_records"("productId");

-- AddForeignKey
ALTER TABLE "poultry_feed_records" ADD CONSTRAINT "poultry_feed_records_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
