import { PrismaClient } from '@prisma/client';

// Declara uma variável global para armazenar o cliente Prisma
declare global {
  var prisma: PrismaClient | undefined;
}

// Usa a instância global se existir, senão cria uma nova.
// 'globalThis.prisma' previne que o hot-reload crie múltiplas instâncias do PrismaClient.
export const db = globalThis.prisma || new PrismaClient();

// Se não estiver em produção, atribui a instância ao objeto global.
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}
