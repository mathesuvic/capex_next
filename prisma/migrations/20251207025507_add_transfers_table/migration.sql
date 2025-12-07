/*
  Warnings:

  - You are about to drop the `monthlyvalue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subplan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `monthlyvalue` DROP FOREIGN KEY `MonthlyValue_subplanId_fkey`;

-- DropTable
DROP TABLE `monthlyvalue`;

-- DropTable
DROP TABLE `subplan`;

-- CreateTable
CREATE TABLE `capex_web` (
    `plano` VARCHAR(10) NULL,
    `capex` VARCHAR(50) NOT NULL,
    `jan_ano` DECIMAL(65, 30) NULL,
    `fev_ano` DECIMAL(65, 30) NULL,
    `mar_ano` DECIMAL(65, 30) NULL,
    `abr_ano` DECIMAL(65, 30) NULL,
    `mai_ano` DECIMAL(65, 30) NULL,
    `jun_ano` DECIMAL(65, 30) NULL,
    `jul_ano` DECIMAL(65, 30) NULL,
    `ago_ano` DECIMAL(65, 30) NULL,
    `set_ano` DECIMAL(65, 30) NULL,
    `out_ano` DECIMAL(65, 30) NULL,
    `nov_ano` DECIMAL(65, 30) NULL,
    `dez_ano` DECIMAL(65, 30) NULL,

    PRIMARY KEY (`capex`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transfers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(65, 30) NOT NULL,
    `fromCapex` VARCHAR(50) NOT NULL,
    `toCapex` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_fromCapex_fkey` FOREIGN KEY (`fromCapex`) REFERENCES `capex_web`(`capex`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_toCapex_fkey` FOREIGN KEY (`toCapex`) REFERENCES `capex_web`(`capex`) ON DELETE RESTRICT ON UPDATE CASCADE;
