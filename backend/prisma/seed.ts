import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dtms.local';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 8) {
    console.error(
      '\n❌ Seed aborted: ADMIN_PASSWORD must be set in .env and be at least 8 characters.',
    );
    console.error('   Edit backend/.env and set a strong ADMIN_PASSWORD.');
    process.exit(1);
  }

  const unsafeDefaults = ['Admin@12345', 'admin123', 'password', 'Password123'];
  if (process.env.NODE_ENV === 'production' && unsafeDefaults.includes(adminPassword)) {
    console.error(
      '\n❌ Seed aborted: Do not use a default/weak password in production.',
    );
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`ℹ️  Admin user ${adminEmail} already exists. Skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`✅ Admin user created: ${adminEmail}`);
  console.log(`   Role: ADMIN`);
  console.log(`   Status: ACTIVE`);
  console.log(`\n   ⚠️  Change this password before production deployment.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
