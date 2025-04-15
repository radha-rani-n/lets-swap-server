/*
  Warnings:

  - A unique constraint covering the columns `[postId]` on the table `Post` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `postId` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Post_userName_key` ON `Post`;

-- AlterTable
ALTER TABLE `Post` ADD COLUMN `postId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Post_postId_key` ON `Post`(`postId`);
