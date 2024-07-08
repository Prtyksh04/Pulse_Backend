/*
  Warnings:

  - A unique constraint covering the columns `[clientApiKey]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userApiKey]` on the table `pulseUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "clientApiKey" TEXT;

-- AlterTable
ALTER TABLE "pulseUser" ADD COLUMN     "userApiKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_clientApiKey_key" ON "Project"("clientApiKey");

-- CreateIndex
CREATE UNIQUE INDEX "pulseUser_userApiKey_key" ON "pulseUser"("userApiKey");
