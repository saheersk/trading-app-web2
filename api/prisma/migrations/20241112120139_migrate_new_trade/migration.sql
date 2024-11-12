/*
  Warnings:

  - Added the required column `side` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Side" AS ENUM ('BUY', 'SELL');

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "side" "Side" NOT NULL;
