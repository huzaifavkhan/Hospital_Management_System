require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Seed receptionist user
  const receptionistPassword = await bcrypt.hash('recept123', 10);
  await prisma.user.upsert({
    where: { username: 'receptionist' },
    update: {},
    create: {
      username: 'receptionist',
      password: receptionistPassword,
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
