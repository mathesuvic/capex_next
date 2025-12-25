/*
  Warnings:

  - You are about to alter the column `jan_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `fev_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `mar_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `abr_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `mai_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `jun_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `jul_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `ago_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `set_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `out_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `nov_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `dez_ano` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `meta` on the `capex_web` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to drop the column `token` on the `passwordresettoken` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `transfers` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - A unique constraint covering the columns `[tokenHash]` on the table `passwordresettoken` will be added. If there are existing duplicate values, this will fail.
  - Made the column `ordem` on table `capex_web` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `expiresAt` to the `passwordresettoken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHash` to the `passwordresettoken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `PasswordResetToken_token_key` ON `passwordresettoken`;

-- AlterTable
ALTER TABLE `capex_web` MODIFY `jan_ano` DECIMAL(18, 2) NULL,
    MODIFY `fev_ano` DECIMAL(18, 2) NULL,
    MODIFY `mar_ano` DECIMAL(18, 2) NULL,
    MODIFY `abr_ano` DECIMAL(18, 2) NULL,
    MODIFY `mai_ano` DECIMAL(18, 2) NULL,
    MODIFY `jun_ano` DECIMAL(18, 2) NULL,
    MODIFY `jul_ano` DECIMAL(18, 2) NULL,
    MODIFY `ago_ano` DECIMAL(18, 2) NULL,
    MODIFY `set_ano` DECIMAL(18, 2) NULL,
    MODIFY `out_ano` DECIMAL(18, 2) NULL,
    MODIFY `nov_ano` DECIMAL(18, 2) NULL,
    MODIFY `dez_ano` DECIMAL(18, 2) NULL,
    MODIFY `ordem` INTEGER NOT NULL DEFAULT 0,
    MODIFY `meta` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `passwordresettoken` DROP COLUMN `token`,
    ADD COLUMN `expiresAt` DATETIME(3) NOT NULL,
    ADD COLUMN `tokenHash` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `solicitacao_recursos` ADD COLUMN `decidedAt` DATETIME(0) NULL,
    ADD COLUMN `decidedByEmail` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `transfers` MODIFY `amount` DECIMAL(18, 2) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `PasswordResetToken_tokenHash_key` ON `passwordresettoken`(`tokenHash`);

-- CreateIndex
CREATE INDEX `PasswordResetToken_expiresAt_idx` ON `passwordresettoken`(`expiresAt`);

-- CreateIndex
CREATE INDEX `solicitacao_recursos_status_solicitacao_idx` ON `solicitacao_recursos`(`status_solicitacao`);

-- RenameIndex
ALTER TABLE `permissionrequest` RENAME INDEX `PermissionRequest_decidedByUserId_fkey` TO `PermissionRequest_decidedByUserId_idx`;

-- RenameIndex
ALTER TABLE `transfers` RENAME INDEX `transfers_fromCapex_fkey` TO `transfers_fromCapex_idx`;

-- RenameIndex
ALTER TABLE `transfers` RENAME INDEX `transfers_toCapex_fkey` TO `transfers_toCapex_idx`;
