const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

const MAX_PAGE_SIZE = 100;

const parsePositiveInt = (value, defaultValue) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
};

const validateAge = (age) => {
  const numericAge = Number(age);
  if (!Number.isFinite(numericAge) || numericAge < 0 || !Number.isInteger(numericAge)) {
    const err = new Error('age must be a non-negative integer');
    err.status = 400;
    throw err;
  }
  return numericAge;
};

const getAllPatients = async ({ page = 1, limit = 10, search } = {}) => {
  const safePage = parsePositiveInt(page, 1);
  const safeLimit = Math.min(parsePositiveInt(limit, 10), MAX_PAGE_SIZE);
  const skip = (safePage - 1) * safeLimit;

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
      take: safeLimit,
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
    pagination: { total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) },
  };
};

const getPatientById = async (id) => {
  const numericId = parseInt(id, 10);
  if (!Number.isFinite(numericId) || numericId < 1) {
    const err = new Error('Invalid patient id');
    err.status = 400;
    throw err;
  }

  const patient = await prisma.patient.findUnique({
    where: { id: numericId },
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
  if (!name || age == null || !gender || !contactNumber || !address) {
    const err = new Error('name, age, gender, contactNumber, and address are required');
    err.status = 400;
    throw err;
  }

  const numericAge = validateAge(age);

  const patient = await prisma.$transaction(async (tx) => {
    const created = await tx.patient.create({
      data: {
        patientId: `PAT-PENDING-${randomUUID()}`,
        name,
        age: numericAge,
        gender,
        contactNumber,
        address,
        medicalHistory,
      },
    });
    const patientId = `PAT-${String(created.id).padStart(5, '0')}`;
    return tx.patient.update({ where: { id: created.id }, data: { patientId } });
  });

  return patient;
};

const updatePatient = async (id, data) => {
  const existing = await getPatientById(id);

  const allowed = ['name', 'age', 'gender', 'contactNumber', 'address', 'medicalHistory'];
  const updateData = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      if (key === 'age') {
        updateData[key] = validateAge(data[key]);
      } else {
        updateData[key] = data[key];
      }
    }
  }

  const patient = await prisma.patient.update({
    where: { id: existing.id },
    data: updateData,
  });
  return patient;
};

const deletePatient = async (id) => {
  const existing = await getPatientById(id);
  await prisma.patient.delete({ where: { id: existing.id } });
  return { message: 'Patient deleted successfully' };
};

module.exports = { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient };
