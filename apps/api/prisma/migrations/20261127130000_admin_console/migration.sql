ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "lastLoginMode" TEXT;

CREATE TABLE "app_releases" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "minSupported" TEXT,
    "downloadUrl" TEXT,
    "sizeMb" DOUBLE PRECISION,
    "notes" TEXT,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "app_releases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_releases_platform_version_key" ON "app_releases"("platform", "version");
CREATE INDEX "app_releases_platform_isPublished_createdAt_idx" ON "app_releases"("platform", "isPublished", "createdAt" DESC);
