-- CreateTable
CREATE TABLE "aiConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "apiKey" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aiConfig_userId_key" ON "aiConfig"("userId");

-- AddForeignKey
ALTER TABLE "aiConfig" ADD CONSTRAINT "aiConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
