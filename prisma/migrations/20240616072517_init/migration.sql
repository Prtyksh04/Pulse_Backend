-- CreateEnum
CREATE TYPE "SignupType" AS ENUM ('EMAIL_PASSWORD', 'EMAIL_USERNAME_PASSWORD', 'GOOGLE_AUTH', 'GITHUB_AUTH');

-- CreateTable
CREATE TABLE "pulseUser" (
    "apiKey" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "signupType" "SignupType" NOT NULL,

    CONSTRAINT "pulseUser_pkey" PRIMARY KEY ("apiKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "pulseUser_apiKey_key" ON "pulseUser"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "pulseUser_username_key" ON "pulseUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "pulseUser_email_key" ON "pulseUser"("email");
