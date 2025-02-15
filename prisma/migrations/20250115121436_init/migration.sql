/*
  Warnings:

  - You are about to drop the column `layout` on the `Customization` table. All the data in the column will be lost.
  - You are about to drop the column `styling` on the `Customization` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `Template` table. All the data in the column will be lost.
  - The `organization` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `templateVersion` to the `FormResponse` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'SUBMITTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Customization" DROP COLUMN "layout",
DROP COLUMN "styling",
ADD COLUMN     "fieldCustomizations" JSONB,
ADD COLUMN     "lastUsed" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "typography" JSONB;

-- AlterTable
ALTER TABLE "FormResponse" ADD COLUMN     "status" "ResponseStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "templateVersion" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "isPublished",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "customizableAreas" JSONB,
ADD COLUMN     "formDefinition" JSONB,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "parentVersionId" TEXT,
ADD COLUMN     "previewImage" TEXT,
ADD COLUMN     "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "usage" JSONB,
DROP COLUMN "organization",
ADD COLUMN     "organization" JSONB;
