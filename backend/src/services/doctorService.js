const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

const generateDoctorId = () => {
  const raw = randomUUID().replace(/-/g, '');
  const suffix = raw.slice(0, 12).toUpperCase();
  return `DOC-${suffix}`;
};

const parsePositiveInt = (value, defaultValue, max = Infinity) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultValue;
  return Math.min(parsed, max);
};

const validateId = (id, label = 'id') => {
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || !Number.isInteger(numericId) || numericId < 1) {
    const err = new Error(`Invalid ${label}`);
    err.status = 400;
    throw err;
  }
  return numericId;
};

const getAllDoctors = async ({ page = 1, limit = 10, search, departmentId, specialization } = {}) => {
  const parsedPage = parsePositiveInt(page, 1);
  const parsedLimit = parsePositiveInt(limit, 10, 100);
  const skip = (parsedPage - 1) * parsedLimit;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { specialization: { contains: search, mode: 'insensitive' } },
      { doctorId: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (departmentId) where.departmentId = Number(departmentId);
  if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip,
      take: parsedLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
        patients: {
          include: {
            patient: { select: { id: true, patientId: true, name: true } },
          },
        },
      },
    }),
    prisma.doctor.count({ where }),
  ]);

  return {
    doctors,
    pagination: { total, page: parsedPage, limit: parsedLimit, pages: Math.ceil(total / parsedLimit) },
  };
};

const getDoctorById = async (id) => {
  const numericId = validateId(id, 'doctor id');
  const doctor = await prisma.doctor.findUnique({
    where: { id: numericId },
    include: {
      department: { select: { id: true, name: true } },
      patients: {
        include: {
          patient: { select: { id: true, patientId: true, name: true, age: true, gender: true } },
        },
      },
    },
  });
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.status = 404;
    throw err;
  }
  return doctor;
};

const createDoctor = async ({ name, specialization, contactNumber, availabilitySchedule, departmentId }) => {
  if (!name || !specialization || !contactNumber) {
    const err = new Error('name, specialization, and contactNumber are required');
    err.status = 400;
    throw err;
  }

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: Number(departmentId) } });
    if (!dept) {
      const err = new Error('Department not found');
      err.status = 404;
      throw err;
    }
  }

  const doctorId = generateDoctorId();
  const doctor = await prisma.doctor.create({
    data: {
      doctorId,
      name,
      specialization,
      contactNumber,
      availabilitySchedule: availabilitySchedule || null,
      departmentId: departmentId ? Number(departmentId) : null,
    },
    include: { department: { select: { id: true, name: true } } },
  });
  return doctor;
};

const updateDoctor = async (id, data) => {
  await getDoctorById(id);

  if (data.departmentId !== undefined && data.departmentId !== null) {
    const deptId = Number(data.departmentId);
    if (!Number.isFinite(deptId) || !Number.isInteger(deptId) || deptId < 1) {
      const err = new Error('Invalid departmentId');
      err.status = 400;
      throw err;
    }
    const dept = await prisma.department.findUnique({ where: { id: deptId } });
    if (!dept) {
      const err = new Error('Department not found');
      err.status = 404;
      throw err;
    }
  }

  const allowed = ['name', 'specialization', 'contactNumber', 'availabilitySchedule', 'departmentId'];
  const updateData = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      if (key === 'departmentId') {
        updateData[key] = data[key] === null ? null : Number(data[key]);
      } else {
        updateData[key] = data[key];
      }
    }
  }

  const doctor = await prisma.doctor.update({
    where: { id: Number(id) },
    data: updateData,
    include: { department: { select: { id: true, name: true } } },
  });
  return doctor;
};

const deleteDoctor = async (id) => {
  await getDoctorById(id);
  try {
    await prisma.doctor.delete({ where: { id: Number(id) } });
  } catch (e) {
    if (e.code === 'P2003') {
      const err = new Error('Cannot delete doctor with existing visit records');
      err.status = 409;
      throw err;
    }
    throw e;
  }
  return { message: 'Doctor removed successfully' };
};

const assignPatient = async (doctorId, patientId) => {
  const numericDoctorId = validateId(doctorId, 'doctor id');
  const numericPatientId = validateId(patientId, 'patient id');

  const doctor = await prisma.doctor.findUnique({ where: { id: numericDoctorId } });
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.status = 404;
    throw err;
  }

  const patient = await prisma.patient.findUnique({ where: { id: numericPatientId } });
  if (!patient) {
    const err = new Error('Patient not found');
    err.status = 404;
    throw err;
  }

  const existing = await prisma.patientDoctor.findUnique({
    where: { patientId_doctorId: { patientId: numericPatientId, doctorId: numericDoctorId } },
  });
  if (existing) {
    const err = new Error('Patient is already assigned to this doctor');
    err.status = 409;
    throw err;
  }

  const assignment = await prisma.patientDoctor.create({
    data: { doctorId: numericDoctorId, patientId: numericPatientId },
    include: {
      patient: { select: { id: true, patientId: true, name: true } },
      doctor: { select: { id: true, doctorId: true, name: true } },
    },
  });
  return assignment;
};

const unassignPatient = async (doctorId, patientId) => {
  const numericDoctorId = validateId(doctorId, 'doctor id');
  const numericPatientId = validateId(patientId, 'patient id');

  const assignment = await prisma.patientDoctor.findUnique({
    where: { patientId_doctorId: { patientId: numericPatientId, doctorId: numericDoctorId } },
  });
  if (!assignment) {
    const err = new Error('Assignment not found');
    err.status = 404;
    throw err;
  }

  await prisma.patientDoctor.delete({
    where: { patientId_doctorId: { patientId: numericPatientId, doctorId: numericDoctorId } },
  });
  return { message: 'Patient unassigned successfully' };
};

const getDoctorPatients = async (doctorId) => {
  const numericDoctorId = validateId(doctorId, 'doctor id');
  const doctor = await prisma.doctor.findUnique({ where: { id: numericDoctorId } });
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.status = 404;
    throw err;
  }

  const assignments = await prisma.patientDoctor.findMany({
    where: { doctorId: numericDoctorId },
    include: {
      patient: {
        select: { id: true, patientId: true, name: true },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });
  return assignments.map((a) => ({ ...a.patient, assignedAt: a.assignedAt }));
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  assignPatient,
  unassignPatient,
  getDoctorPatients,
};
