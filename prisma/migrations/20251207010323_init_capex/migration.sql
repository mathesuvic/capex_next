-- CreateTable
CREATE TABLE `Subplan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlyValue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subplanId` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `value` DECIMAL(14, 2) NOT NULL,

    UNIQUE INDEX `MonthlyValue_subplanId_month_type_key`(`subplanId`, `month`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MonthlyValue` ADD CONSTRAINT `MonthlyValue_subplanId_fkey` FOREIGN KEY (`subplanId`) REFERENCES `Subplan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
