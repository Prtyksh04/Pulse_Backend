/*
  Warnings:

  - You are about to drop the column `username` on the `pulseUser` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "pulseUser_username_key";

-- AlterTable
ALTER TABLE "pulseUser" DROP COLUMN "username",
ALTER COLUMN "signupType" DROP NOT NULL;
