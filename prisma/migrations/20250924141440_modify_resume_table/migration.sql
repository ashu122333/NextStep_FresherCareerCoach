/*
  Warnings:

  - A unique constraint covering the columns `[userId,title]` on the table `Resume` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Resume_userId_key";

-- AlterTable
ALTER TABLE "public"."Resume" ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'unknown';

-- CreateIndex
CREATE INDEX "Resume_userId_idx" ON "public"."Resume"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Resume_userId_title_key" ON "public"."Resume"("userId", "title");
