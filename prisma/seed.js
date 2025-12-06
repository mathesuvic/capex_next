// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // limpa tudo
  await prisma.monthlyValue.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.subplan.deleteMany();
  await prisma.plan.deleteMany();

  // um plano e três subplanos
  const plan = await prisma.plan.create({
    data: { label: 'Investimentos', color: '#2F80ED', order: 1 },
  });

  const labels = ['Sistemas', 'Obras', 'Equipamentos'];
  const subplans = [];
  for (let i = 0; i < labels.length; i++) {
    subplans.push(
      await prisma.subplan.create({
        data: { label: labels[i], meta: 0, order: i + 1, planId: plan.id },
      })
    );
  }

  // meses 1..10 = realizado (imutáveis), 11..12 = previsto (editáveis)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  for (const sp of subplans) {
    const data = months.map((m) => ({
      subplanId: sp.id,
      month: m,
      value: m <= 10 ? 100 : 0, // exemplo
      type: m <= 10 ? 'realizado' : 'previsto',
    }));
    await prisma.monthlyValue.createMany({ data, skipDuplicates: true });
  }
}

main()
  .then(async () => {
    console.log('Seed OK');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
