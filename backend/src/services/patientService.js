const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const generatePatientId = async () => {
  const count = await prisma.patient.count();
  return `PAT-${String(count + 1).padStart(5, '0')}`;
};

const getAllPatients = async ({ page = 1, limit = 10, search } = {}) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { patientId: { contains: search, mode: 'insensitive' } },
          { contactNumber: { contains: search } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        doctors: {
          include: {
            doctor: { select: { id: true, doctorId: true, name: true, specialization: true } },
          },
        },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    patients,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  };
};

const getPatientById = async (id) => {
  const patient = await prisma.patient.findUnique({
    where: { id: Number(id) },
    include: {
      doctors: {
        include: {
          doctor: { select: { id: true, doctorId: true, name: true, specialization: true, departmentId: true } },
        },
      },
    },
  });
  if (!patient) {
    const err = new Error('Patient not found');
    err.status = 404;
    throw err;
  }
  return patient;
};

const createPatient = async ({ name, age, gender, contactNumber, address, medicalHistory }) => {
  if (!name || !age || !gender || !contactNumber || !address) {
    const err = new Error('name, age, gender, contactNumber, and address are required');
    err.status = 400;
    throw err;
  }

  const patientId = await generatePatientId();
  const patient = await prisma.patient.create({
    data: { patientId, name, age: Number(age), gender, contactNumber, address, medicalHistory },
  });
  return patient;
};

const updatePatient = async (id, data) => {
  await getPatientById(id);

  const allowed = ['name', 'age', 'gender', 'contactNumber', 'address', 'medicalHistory'];
  const updateData = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = key === 'age' ? Number(data[key]) : data[key];
  }

  const patient = await prisma.patient.update({
    where: { id: Number(id) },
    data: updateData,
  });
  return patient;
};

const deletePatient = async (id) => {
  await getPatientById(id);
  await prisma.patient.delete({ where: { id: Number(id) } });
  return { message: 'Patient deleted successfully' };
};

module.exports = { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient };
