/*
  Warnings:

  - You are about to drop the `GithubAuth` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "access_token" VARCHAR(255),
ADD COLUMN     "githubUsername" VARCHAR(255);

-- DropTable
DROP TABLE "GithubAuth";
