/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `ClientUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClientUser_email_key" ON "ClientUser"("email");
