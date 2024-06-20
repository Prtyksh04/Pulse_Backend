-- CreateTable
CREATE TABLE "ClientUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "username" TEXT,
    "googleId" TEXT,
    "githubId" TEXT,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "ClientUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClientUser" ADD CONSTRAINT "ClientUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
