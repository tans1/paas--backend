/*
  Warnings:

  - You are about to drop the column `github_username` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "GithubAuth" DROP CONSTRAINT "GithubAuth_githubUsername_fkey";

-- DropIndex
DROP INDEX "User_github_username_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "github_username";
