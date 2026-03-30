require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Seed script is disabled in production. Set NODE_ENV to development to run seeds.');
    return;
  }

  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD environment variable is required to run seeds.');
  }

  // Seed admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const receptionistUsername = process.env.SEED_RECEPTIONIST_USERNAME || 'receptionist';
  const receptionistPassword = process.env.SEED_RECEPTIONIST_PASSWORD;
  if (!receptionistPassword) {
    throw new Error('SEED_RECEPTIONIST_PASSWORD environment variable is required to run seeds.');
  }

  // Seed receptionist user
  const receptionistHashedPassword = await bcrypt.hash(receptionistPassword, 10);
  await prisma.user.upsert({
    where: { username: receptionistUsername },
    update: {},
    create: {
      username: receptionistUsername,
      password: receptionistHashedPassword,
      fullName: 'Front Desk',
      role: 'RECEPTIONIST',
      isActive: true,
    },
  });

  // Seed departments
  const departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'];
  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} Department` },
    });
  }

  // Seed hospital settings
  const settings = [
    { key: 'hospital_name', value: 'City General Hospital' },
    { key: 'hospital_contact', value: '+1 (555) 000-0000' },
    { key: 'hospital_address', value: '123 Medical Center Drive' },
    { key: 'hospital_email', value: 'info@citygeneralhospital.com' },
  ];
  for (const setting of settings) {
    await prisma.hospitalSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
