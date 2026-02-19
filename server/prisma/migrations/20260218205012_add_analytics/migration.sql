-- CreateTable
CREATE TABLE "commandLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commandLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apiCallLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration" INTEGER,
    "tokensUsed" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apiCallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commandLog_userId_idx" ON "commandLog"("userId");

-- CreateIndex
CREATE INDEX "commandLog_command_idx" ON "commandLog"("command");

-- CreateIndex
CREATE INDEX "commandLog_createdAt_idx" ON "commandLog"("createdAt");

-- CreateIndex
CREATE INDEX "apiCallLog_userId_idx" ON "apiCallLog"("userId");

-- CreateIndex
CREATE INDEX "apiCallLog_provider_idx" ON "apiCallLog"("provider");

-- CreateIndex
CREATE INDEX "apiCallLog_createdAt_idx" ON "apiCallLog"("createdAt");
