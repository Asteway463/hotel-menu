// Seeds the default local admin user + restaurant for the Burger House.
import { PrismaClient } from '@burger/database';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('BurgerHouse2026!', 12);

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'burgerhouse' },
    update: {},
    create: {
      slug: 'burgerhouse',
      nameEn: 'Burger House',
      nameAm: 'ቡራጅለስ ሆውስ',
      taglineEn: 'Flame-grilled burgers & craft shakes',
      taglineAm: 'በቅንጥር የተደረገ ቸኳህን እና የብራንድ ሻክስ',
      storyEn: 'Small-batch flame-grilled burgers, craft shakes and hand-cut fries. Since 2026.',
      storyAm: 'በቡጢ የተደረጉ ቸኳህኖች፣ የብራንድ ሻክስ እና በእጅ የተቀረጹ ፍራዮች።',
      wifiSsid: 'BurgerHouse',
      wifiPassword: 'burgerhouse',
    },
  });

  const admin = await prisma.adminUser.findFirst({
    where: { email: 'admin@burgerhouse.local' },
  });

  if (admin) {
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash, restaurantId: restaurant.id },
    });
    console.log('Admin updated.');
  } else {
    await prisma.adminUser.create({
      data: {
        restaurantId: restaurant.id,
        email: 'admin@burgerhouse.local',
        passwordHash,
        role: 'OWNER',
      },
    });
    console.log('Admin created.');
  }

  console.log('Seeded restaurant:', restaurant.id, restaurant.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
