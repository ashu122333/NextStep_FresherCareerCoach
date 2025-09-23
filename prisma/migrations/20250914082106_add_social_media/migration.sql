/*
  Warnings:

  - A unique constraint covering the columns `[linkedin]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[github]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "github" TEXT,
ADD COLUMN     "linkedin" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_linkedin_key" ON "public"."User"("linkedin");

-- CreateIndex
CREATE UNIQUE INDEX "User_github_key" ON "public"."User"("github");
