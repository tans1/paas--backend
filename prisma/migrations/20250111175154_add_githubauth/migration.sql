/*
  Warnings:

  - A unique constraint covering the columns `[github_username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `github_username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "github_username" VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE "GithubAuth" (
    "id" SERIAL NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "access_token" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubAuth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GithubAuth_githubUsername_key" ON "GithubAuth"("githubUsername");

-- CreateIndex
CREATE UNIQUE INDEX "User_github_username_key" ON "User"("github_username");

-- AddForeignKey
ALTER TABLE "GithubAuth" ADD CONSTRAINT "GithubAuth_githubUsername_fkey" FOREIGN KEY ("githubUsername") REFERENCES "User"("github_username") ON DELETE RESTRICT ON UPDATE CASCADE;
