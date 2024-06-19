/*
  Warnings:

  - You are about to drop the column `signupType` on the `pulseUser` table. All the data in the column will be lost.
  - Made the column `email` on table `pulseUser` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "signupType" "SignupType";

-- AlterTable
ALTER TABLE "pulseUser" DROP COLUMN "signupType",
ALTER COLUMN "email" SET NOT NULL;
