/*
  Warnings:

  - The values [PUBLISHED] on the enum `TemplateStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `currentStep` on the `FormConversion` table. All the data in the column will be lost.
  - You are about to drop the `system_status` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `action` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'REGISTER', 'TEMPLATE_CREATE', 'TEMPLATE_UPDATE', 'TEMPLATE_DELETE', 'TEMPLATE_PREVIEW', 'TEMPLATE_EXPORT', 'TEMPLATE_PROCESSED', 'TEMPLATE_PROCESSING_ERROR', 'FORM_SUBMIT', 'FORM_SAVE_DRAFT', 'FORM_VALIDATE', 'USER_UPDATE', 'SETTINGS_CHANGE', 'SYSTEM_ERROR', 'FILE_WATCHER_ERROR');

-- CreateEnum
CREATE TYPE "SystemStatusType" AS ENUM ('FILE_WATCHER', 'TEMPLATE_PROCESSOR', 'FORM_CONVERTER');

-- CreateEnum
CREATE TYPE "SystemStatusState" AS ENUM ('STARTING', 'RUNNING', 'STOPPED', 'ERROR');

-- AlterEnum
BEGIN;
CREATE TYPE "TemplateStatus_new" AS ENUM ('DRAFT', 'READY', 'PROCESSING', 'ARCHIVED', 'ERROR');
ALTER TABLE "templates" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "templates" ALTER COLUMN "status" TYPE "TemplateStatus_new" USING ("status"::text::"TemplateStatus_new");
ALTER TYPE "TemplateStatus" RENAME TO "TemplateStatus_old";
ALTER TYPE "TemplateStatus_new" RENAME TO "TemplateStatus";
DROP TYPE "TemplateStatus_old";
ALTER TABLE "templates" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "action",
ADD COLUMN     "action" "AuditAction" NOT NULL;

-- AlterTable
ALTER TABLE "FormConversion" DROP COLUMN "currentStep",
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "status" DROP DEFAULT;

-- DropTable
DROP TABLE "system_status";

-- CreateTable
CREATE TABLE "SystemStatus" (
    "id" TEXT NOT NULL,
    "type" "SystemStatusType" NOT NULL,
    "status" "SystemStatusState" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
