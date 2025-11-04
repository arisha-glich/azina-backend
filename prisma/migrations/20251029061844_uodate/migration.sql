/*
  Warnings:

  - The `clinicLogo` column on the `clinic` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `companyRegistrationCertificate` column on the `clinic` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `proofOfBusinessAddress` column on the `clinic` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `registrationCertificate` column on the `clinic` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `otherDocuments` column on the `clinic` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `Logo` column on the `clinic` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `signature` column on the `clinic` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `areas_of_expertise` column on the `doctor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `resume` column on the `doctor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `idemnityInsaurance` column on the `doctor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `other_documents` column on the `doctor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `signature` column on the `doctor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `Logo` column on the `doctor` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."clinic" DROP COLUMN "clinicLogo",
ADD COLUMN     "clinicLogo" JSONB,
DROP COLUMN "companyRegistrationCertificate",
ADD COLUMN     "companyRegistrationCertificate" JSONB,
DROP COLUMN "proofOfBusinessAddress",
ADD COLUMN     "proofOfBusinessAddress" JSONB,
DROP COLUMN "registrationCertificate",
ADD COLUMN     "registrationCertificate" JSONB,
DROP COLUMN "otherDocuments",
ADD COLUMN     "otherDocuments" JSONB,
DROP COLUMN "Logo",
ADD COLUMN     "Logo" JSONB,
DROP COLUMN "signature",
ADD COLUMN     "signature" JSONB;

-- AlterTable
ALTER TABLE "public"."doctor" DROP COLUMN "areas_of_expertise",
ADD COLUMN     "areas_of_expertise" JSONB,
DROP COLUMN "resume",
ADD COLUMN     "resume" JSONB,
DROP COLUMN "idemnityInsaurance",
ADD COLUMN     "idemnityInsaurance" JSONB,
DROP COLUMN "other_documents",
ADD COLUMN     "other_documents" JSONB,
DROP COLUMN "signature",
ADD COLUMN     "signature" JSONB,
DROP COLUMN "Logo",
ADD COLUMN     "Logo" JSONB;

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "onboarding_stage" TEXT;
