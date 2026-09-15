/*
  Warnings:

  - A unique constraint covering the columns `[provider_reference]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[oauth_provider,oauth_subject]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `net_amount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform_fee_amount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform_fee_percent` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "disbursed_at" TIMESTAMP(3),
ADD COLUMN     "disbursement_reference" TEXT,
ADD COLUMN     "disbursement_status" "PaymentStatus",
ADD COLUMN     "net_amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "platform_fee_amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "platform_fee_percent" DECIMAL(5,2) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "oauth_provider" TEXT,
ADD COLUMN     "oauth_subject" TEXT,
ADD COLUMN     "payout_bank_account_name" TEXT,
ADD COLUMN     "payout_bank_account_number" TEXT,
ADD COLUMN     "payout_bank_name" TEXT,
ADD COLUMN     "payout_method" TEXT,
ADD COLUMN     "payout_momo_number" TEXT,
ALTER COLUMN "phone_number" DROP NOT NULL,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "platform_payout_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "payout_method" TEXT,
    "payout_momo_number" TEXT,
    "payout_bank_name" TEXT,
    "payout_bank_account_number" TEXT,
    "payout_bank_account_name" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_payout_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_reference_key" ON "payments"("provider_reference");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_oauth_provider_oauth_subject_key" ON "users"("oauth_provider", "oauth_subject");
