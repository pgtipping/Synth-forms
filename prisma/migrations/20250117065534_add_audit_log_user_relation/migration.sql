/*
  Warnings:

  - Added the required column `userId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "migrationNotes" JSONB,
ADD COLUMN     "versionHistory" JSONB;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
