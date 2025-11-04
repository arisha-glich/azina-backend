-- AlterTable
ALTER TABLE "public"."approval_request" ADD COLUMN     "clinic_id" TEXT,
ADD COLUMN     "renewal_date" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "public"."approval_request" ADD CONSTRAINT "approval_request_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
