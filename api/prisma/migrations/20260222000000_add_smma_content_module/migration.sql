-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'READY', 'POSTED');

-- CreateEnum
CREATE TYPE "ContentChannel" AS ENUM ('TIKTOK', 'REELS');

-- CreateTable
CREATE TABLE "smmq_agencies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agency_name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "target_audience" TEXT NOT NULL,
    "content_goals" TEXT NOT NULL,
    "tone_of_voice" TEXT NOT NULL,
    "competitors" TEXT,
    "unique_value" TEXT,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smmq_agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" "ContentChannel" NOT NULL,
    "hook" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "on_screen_text" TEXT,
    "beats" TEXT,
    "hashtags" TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_metrics" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "smmq_agencies_user_id_key" ON "smmq_agencies"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_metrics_content_item_id_key" ON "content_metrics"("content_item_id");

-- CreateIndex
CREATE INDEX "content_items_agency_id_status_idx" ON "content_items"("agency_id", "status");

-- CreateIndex
CREATE INDEX "calendar_events_scheduled_at_idx" ON "calendar_events"("scheduled_at");

-- AddForeignKey
ALTER TABLE "smmq_agencies" ADD CONSTRAINT "smmq_agencies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "smmq_agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "content_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_metrics" ADD CONSTRAINT "content_metrics_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
