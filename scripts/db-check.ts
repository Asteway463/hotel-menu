import { PrismaClient } from '@burger/database';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.restaurant.count();
  console.log('restaurants:', count);
  const admin = await prisma.adminUser.findFirst();
  console.log('admin:', admin?.email ?? null);
}

main()
  .catch((e) => {
    console.error('ERR', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
