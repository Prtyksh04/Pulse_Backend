/*
  Warnings:

  - You are about to drop the column `projectId` on the `ViteEnvVariables` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectName,apiKey,projectToken]` on the table `ViteEnvVariables` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectName` to the `ViteEnvVariables` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ViteEnvVariables" DROP CONSTRAINT "ViteEnvVariables_projectId_fkey";

-- DropIndex
DROP INDEX "ViteEnvVariables_projectId_apiKey_projectToken_key";

-- DropIndex
DROP INDEX "ViteEnvVariables_projectId_key";

-- AlterTable
ALTER TABLE "ViteEnvVariables" DROP COLUMN "projectId",
ADD COLUMN     "projectName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ViteEnvVariables_projectName_apiKey_projectToken_key" ON "ViteEnvVariables"("projectName", "apiKey", "projectToken");

-- AddForeignKey
ALTER TABLE "ViteEnvVariables" ADD CONSTRAINT "ViteEnvVariables_projectName_fkey" FOREIGN KEY ("projectName") REFERENCES "Project"("projectName") ON DELETE RESTRICT ON UPDATE CASCADE;
