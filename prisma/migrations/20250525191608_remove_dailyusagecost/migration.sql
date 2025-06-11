/*
  Warnings:

  - You are about to drop the `DailyUsageCost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MonthlyAggregate` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `DailyMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `DailyMetric` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DailyUsageCost" DROP CONSTRAINT "DailyUsageCost_userId_fkey";

-- AlterTable
ALTER TABLE "DailyMetric" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "DailyUsageCost";

-- DropTable
DROP TABLE "MonthlyAggregate";

-- AddForeignKey
ALTER TABLE "DailyMetric" ADD CONSTRAINT "DailyMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
