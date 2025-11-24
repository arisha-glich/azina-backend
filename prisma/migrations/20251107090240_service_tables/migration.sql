/*
  Warnings:

  - You are about to drop the column `duration_minutes` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."service" DROP COLUMN "duration_minutes",
DROP COLUMN "is_active",
DROP COLUMN "price",
ADD COLUMN     "conditions_count" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "clinic_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."service_condition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "offer_as_product" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "service_id" TEXT NOT NULL,

    CONSTRAINT "service_condition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."service_condition" ADD CONSTRAINT "service_condition_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
