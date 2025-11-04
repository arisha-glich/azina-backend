-- AlterTable
ALTER TABLE "public"."clinic" ADD COLUMN     "user_id" TEXT;

-- AddForeignKey
ALTER TABLE "public"."clinic" ADD CONSTRAINT "clinic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
