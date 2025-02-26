/*
  Warnings:

  - You are about to drop the column `repoId` on the `Deployment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[repo_id]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repo_id` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Deployment" DROP CONSTRAINT "Deployment_repoId_fkey";

-- AlterTable
ALTER TABLE "Deployment" DROP COLUMN "repoId",
ADD COLUMN     "projectId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "repo_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_repo_id_key" ON "Project"("repo_id");

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
