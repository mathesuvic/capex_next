import prisma from '@/lib/prisma';
import { hash } from 'bcrypt';

async function main() {
  const passwordHash = await hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@neoenergia.com' },
    update: {},
    create: { email: 'admin@neoenergia.com', name: 'Admin', role: 'ADMIN', passwordHash },
  });
}
main().finally(() => prisma.$disconnect());
