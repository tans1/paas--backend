/*
  Warnings:

  - You are about to drop the column `created_at` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_id` on the `Payment` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.

*/
-- DropIndex
DROP INDEX "Payment_transaction_id_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "created_at",
DROP COLUMN "method",
DROP COLUMN "transaction_id",
ADD COLUMN     "recentPaidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "status" SET DATA TYPE TEXT;
