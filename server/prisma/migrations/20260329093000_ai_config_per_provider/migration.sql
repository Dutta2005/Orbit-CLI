-- Allow one AI config per provider per user instead of a single config per user.
DROP INDEX IF EXISTS "aiConfig_userId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "aiConfig_userId_provider_key"
ON "aiConfig"("userId", "provider");

CREATE INDEX IF NOT EXISTS "aiConfig_userId_idx"
ON "aiConfig"("userId");
