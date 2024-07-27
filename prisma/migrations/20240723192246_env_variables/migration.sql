-- CreateTable
CREATE TABLE "ViteEnvVariables" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "apiKey" TEXT NOT NULL,
    "projectToken" TEXT NOT NULL,

    CONSTRAINT "ViteEnvVariables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ViteEnvVariables_projectId_key" ON "ViteEnvVariables"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ViteEnvVariables_projectId_apiKey_projectToken_key" ON "ViteEnvVariables"("projectId", "apiKey", "projectToken");

-- AddForeignKey
ALTER TABLE "ViteEnvVariables" ADD CONSTRAINT "ViteEnvVariables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
