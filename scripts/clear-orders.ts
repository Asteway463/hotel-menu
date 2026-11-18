import { PrismaClient } from '@burger/database';

const prisma = new PrismaClient();

async function main() {
  await prisma.order.deleteMany({});
  console.log('orders cleared');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
