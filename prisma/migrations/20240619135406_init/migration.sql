/*
  Warnings:

  - A unique constraint covering the columns `[userId,projectName]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Project_userId_projectName_key" ON "Project"("userId", "projectName");
