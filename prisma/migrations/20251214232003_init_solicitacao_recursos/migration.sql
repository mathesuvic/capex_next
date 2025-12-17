-- AlterTable
ALTER TABLE `capex_web` ADD COLUMN `meta` DECIMAL(65, 30) NULL;

-- CreateTable
CREATE TABLE `solicitacao_recursos` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `plano_investimento` VARCHAR(191) NOT NULL,
    `valor_aporte` DECIMAL(18, 2) NOT NULL,
    `desc_fisico` VARCHAR(191) NOT NULL,
    `justificativa` VARCHAR(191) NOT NULL,
    `email_solicitante` VARCHAR(191) NOT NULL,
    `jan` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `fev` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `mar` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `abr` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `mai` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `jun` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `jul` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `ago` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `set` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `out` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `nov` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `dez` DECIMAL(18, 2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
