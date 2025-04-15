-- CreateTable
CREATE TABLE `Post` (
    `userName` VARCHAR(191) NOT NULL,
    `plantImageUrl` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `locationLatitude` INTEGER NOT NULL,
    `locationLongitude` INTEGER NOT NULL,

    UNIQUE INDEX `Post_userName_key`(`userName`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chats` (
    `userName` VARCHAR(191) NOT NULL,
    `chatId` INTEGER NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `timeStamp` INTEGER NOT NULL,

    UNIQUE INDEX `Chats_chatId_key`(`chatId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
