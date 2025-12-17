-- AlterTable
ALTER TABLE `solicitacao_recursos` ADD COLUMN `status_solicitacao` ENUM('pendente', 'aprovado', 'rejeitado') NOT NULL DEFAULT 'pendente';
