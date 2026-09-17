import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminCount = await prisma.person.count();
  if (adminCount === 0) {
    const pinHash = await bcrypt.hash('1234', 10);
    await prisma.person.create({
      data: { name: 'Administrator', role: 'admin', title: 'Administrator', pinHash },
    });
    console.log('Seeded default Administrator account (PIN 1234).');
  } else {
    console.log('People already exist — skipping seed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
