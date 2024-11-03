-- CreateEnum
CREATE TYPE "Interval" AS ENUM ('ONE_MINUTE', 'ONE_HOUR', 'ONE_WEEK');

-- CreateTable
CREATE TABLE "Klines" (
    "id" SERIAL NOT NULL,
    "market" TEXT NOT NULL,
    "interval" "Interval" NOT NULL,
    "bucket" TIMESTAMP(3) NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "quoteVolume" DOUBLE PRECISION NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "trades" INTEGER NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Klines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Klines_market_interval_bucket_idx" ON "Klines"("market", "interval", "bucket");
