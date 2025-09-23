/*
  Warnings:

  - You are about to drop the `Milestone` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Questionnaire` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Roadmap` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Milestone" DROP CONSTRAINT "Milestone_roadmapId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Questionnaire" DROP CONSTRAINT "Questionnaire_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Roadmap" DROP CONSTRAINT "Roadmap_questionnaireId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_milestoneId_fkey";

-- DropTable
DROP TABLE "public"."Milestone";

-- DropTable
DROP TABLE "public"."Questionnaire";

-- DropTable
DROP TABLE "public"."Roadmap";

-- DropTable
DROP TABLE "public"."Task";
